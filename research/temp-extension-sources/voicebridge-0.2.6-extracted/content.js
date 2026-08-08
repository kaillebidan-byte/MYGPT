(() => {
  "use strict";

  const STABLE_MS = 3000;
  const POST_GENERATION_SETTLE_MS = 6000;
  const MIN_TEXT_CHARS = 2;
  const ARM_TTL_MS = 30 * 60 * 1000;

  const stateByTurn = new Map();
  const sentHashes = new Set();

  let currentUrl = location.href;
  let currentPath = location.pathname;
  let scanTimer = null;
  let initialized = false;
  let generationWasActive = false;
  let generationEndedAt = 0;
  let awaitingNewAnswer = false;
  let armedAt = 0;
  let armedReason = "";
  let completionNoticeSent = false;
  let hiddenDeferredHash = "";
  let monitorPort = null;
  let reconnectTimer = null;
  let lastExternalScanAt = 0;

  function debug(event, details = {}) {
    chrome.runtime.sendMessage({
      type: "voicebridge:debug",
      event,
      url: location.href,
      details: {
        conversationId: conversationId(),
        ...details
      }
    }, () => {
      void chrome.runtime.lastError;
    });
  }

  function connectMonitor() {
    if (monitorPort) {
      return;
    }

    try {
      monitorPort = chrome.runtime.connect({
        name: "voicebridge-monitor"
      });
    } catch (error) {
      debug("monitor_connect_error", {
        error: error.message
      });
      scheduleReconnect();
      return;
    }

    debug("monitor_connected_content", {
      visibility: document.visibilityState
    });

    monitorPort.onMessage.addListener((message) => {
      if (message?.type !== "voicebridge:scan-now") {
        return;
      }

      lastExternalScanAt = Date.now();
      scan("background-ping");

      try {
        monitorPort.postMessage({
          type: "voicebridge:monitor-state",
          at: lastExternalScanAt,
          generating: generationIsActive(),
          awaitingNewAnswer,
          visibility: document.visibilityState
        });
      } catch (_) {
        // 切断処理側で再接続する。
      }
    });

    monitorPort.onDisconnect.addListener(() => {
      const error = chrome.runtime.lastError?.message || "";
      monitorPort = null;

      debug("monitor_disconnected_content", {
        error,
        visibility: document.visibilityState
      });

      scheduleReconnect();
    });
  }

  function scheduleReconnect() {
    if (reconnectTimer !== null) {
      return;
    }

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectMonitor();
    }, 1000);
  }

  function hashText(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  function normalizeText(text) {
    return String(text || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function extractReadableText(node) {
    const clone = node.cloneNode(true);

    clone.querySelectorAll(
      [
        "button",
        "svg",
        "textarea",
        "input",
        "select",
        "[role='button']",
        "[aria-hidden='true']",
        "[data-testid*='copy']",
        "[data-testid*='feedback']"
      ].join(",")
    ).forEach((element) => element.remove());

    clone.querySelectorAll("pre").forEach((pre) => {
      pre.textContent = "\nコードブロック\n";
    });

    clone.querySelectorAll("a").forEach((anchor) => {
      const label = normalizeText(anchor.textContent);
      if (/^[\d\s,.-]+$/.test(label)) {
        anchor.remove();
      }
    });

    return normalizeText(clone.innerText || clone.textContent || "");
  }

  function roleNodes(role) {
    const nodes = Array.from(
      document.querySelectorAll(`[data-message-author-role='${role}']`)
    );

    return nodes.filter((node) => {
      const nestedParent = node.parentElement?.closest(
        `[data-message-author-role='${role}']`
      );
      return !nestedParent;
    });
  }

  function assistantNodes() {
    return roleNodes("assistant");
  }

  function findTurnKey(node, index) {
    const explicitId =
      node.getAttribute("data-message-id") ||
      node.closest("[data-message-id]")?.getAttribute("data-message-id");

    if (explicitId) {
      return explicitId;
    }

    const turn = node.closest("[data-testid^='conversation-turn-']");
    const testId = turn?.getAttribute("data-testid");

    if (testId) {
      return testId;
    }

    return `${location.pathname}::assistant-${index}`;
  }

  function generationIsActive() {
    const selectors = [
      "button[data-testid='stop-button']",
      "button[aria-label*='Stop generating']",
      "button[aria-label*='生成を停止']",
      "button[aria-label*='Stop']"
    ];

    return selectors.some((selector) => document.querySelector(selector));
  }

  function conversationId() {
    const match = location.pathname.match(/\/c\/([^/?#]+)/);
    return match ? match[1] : location.pathname;
  }

  function isComposerTarget(target) {
    if (!(target instanceof Element)) {
      return false;
    }

    return Boolean(
      target.closest("#prompt-textarea") ||
      target.closest("[data-testid='prompt-textarea']") ||
      target.closest("form textarea") ||
      target.closest("form [contenteditable='true']")
    );
  }

  function isSendButton(target) {
    if (!(target instanceof Element)) {
      return false;
    }

    const button = target.closest("button");
    if (!button) {
      return false;
    }

    const testId = button.getAttribute("data-testid") || "";
    const aria = button.getAttribute("aria-label") || "";

    return (
      testId === "send-button" ||
      testId.includes("send") ||
      /^(send|送信)$/i.test(aria.trim()) ||
      /send message|メッセージを送信/i.test(aria)
    );
  }

  function arm(reason) {
    awaitingNewAnswer = true;
    armedAt = Date.now();
    armedReason = reason;
    generationEndedAt = 0;
    completionNoticeSent = false;
    hiddenDeferredHash = "";

    debug("armed", {
      reason,
      expiresAt: new Date(armedAt + ARM_TTL_MS).toISOString()
    });
  }

  function disarm(reason) {
    if (!awaitingNewAnswer) {
      return;
    }

    debug("disarmed", {
      reason,
      previousReason: armedReason
    });

    awaitingNewAnswer = false;
    armedAt = 0;
    armedReason = "";
    generationEndedAt = 0;
    completionNoticeSent = false;
    hiddenDeferredHash = "";
  }

  function armIsValid() {
    if (!awaitingNewAnswer) {
      return false;
    }

    if (Date.now() - armedAt <= ARM_TTL_MS) {
      return true;
    }

    disarm("timeout");
    return false;
  }

  function scheduleScan(delay = 250) {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, delay);
  }

  function markCurrentAssistantsAsExisting(reason) {
    const now = Date.now();
    const nodes = assistantNodes();

    nodes.forEach((node, index) => {
      const text = extractReadableText(node);
      if (!text) {
        return;
      }

      const key = findTurnKey(node, index);
      const hash = hashText(text);

      stateByTurn.set(key, {
        text,
        hash,
        lastChangedAt: now,
        sentHash: hash
      });
      sentHashes.add(`${conversationId()}::${key}::${hash}`);
    });

    debug("baseline", {
      reason,
      assistantCount: nodes.length,
      awaitingNewAnswer,
      armedReason
    });
  }

  function resetForConversation(reason, preserveArm = false) {
    const keepArmed = preserveArm && armIsValid();

    stateByTurn.clear();
    sentHashes.clear();
    generationWasActive = false;

    if (!keepArmed) {
      awaitingNewAnswer = false;
      armedAt = 0;
      armedReason = "";
      generationEndedAt = 0;
      completionNoticeSent = false;
      hiddenDeferredHash = "";
    }

    markCurrentAssistantsAsExisting(reason);
    initialized = true;
  }

  function sendCompletionNotice(turnKey) {
    const noticeTurnId = `${turnKey}:completion-notice`;

    debug("completion_notice_attempt", {
      turnKey,
      visibility: document.visibilityState
    });

    chrome.runtime.sendMessage(
      {
        type: "voicebridge:notify",
        text: "ChatGPTの回答が完了した",
        conversationId: conversationId(),
        turnId: noticeTurnId
      },
      (response) => {
        if (chrome.runtime.lastError) {
          debug("completion_notice_error", {
            turnKey,
            error: chrome.runtime.lastError.message
          });
          return;
        }

        if (!response?.ok && !response?.skipped) {
          debug("completion_notice_rejected", {
            turnKey,
            error: response?.error || "unknown error"
          });
          return;
        }

        debug(
          response?.duplicate
            ? "completion_notice_duplicate"
            : "completion_notice_accepted",
          { turnKey }
        );
      }
    );
  }

  function sendFinal(text, turnKey, hash) {
    const dedupeKey = `${conversationId()}::${turnKey}::${hash}`;

    if (sentHashes.has(dedupeKey)) {
      debug("content_duplicate_skip", {
        turnKey,
        hash,
        textLength: text.length
      });
      return;
    }

    sentHashes.add(dedupeKey);

    debug("send_attempt", {
      turnKey,
      hash,
      textLength: text.length,
      armedReason
    });

    chrome.runtime.sendMessage(
      {
        type: "voicebridge:speak",
        text,
        conversationId: conversationId(),
        turnId: `${turnKey}:${hash}`
      },
      (response) => {
        if (chrome.runtime.lastError) {
          debug("send_callback_error", {
            turnKey,
            hash,
            error: chrome.runtime.lastError.message
          });
          sentHashes.delete(dedupeKey);
          return;
        }

        if (!response?.ok && !response?.skipped) {
          debug("send_rejected", {
            turnKey,
            hash,
            error: response?.error || "unknown error"
          });
          sentHashes.delete(dedupeKey);
          return;
        }

        debug(response?.duplicate ? "send_duplicate_ack" : "send_accepted", {
          turnKey,
          hash
        });
      }
    );
  }

  function scan(scanSource = "local") {
    const now = Date.now();

    if (location.pathname !== currentPath) {
      const previousUrl = currentUrl;
      const previousPath = currentPath;
      const preserveArm = armIsValid();

      currentUrl = location.href;
      currentPath = location.pathname;
      initialized = false;

      debug("conversation_route_change", {
        from: previousUrl,
        to: currentUrl,
        previousPath,
        currentPath,
        preserveArm
      });

      resetForConversation("conversation-route-change", preserveArm);
      scheduleScan(300);
      return;
    }

    if (location.href !== currentUrl) {
      const previousUrl = currentUrl;
      currentUrl = location.href;

      debug("same_conversation_url_change", {
        from: previousUrl,
        to: currentUrl,
        awaitingNewAnswer,
        armedReason
      });
    }

    if (!initialized) {
      resetForConversation("initial", false);
      return;
    }

    const generating = generationIsActive();

    if (generating && !generationWasActive) {
      arm("generation-start");
      generationEndedAt = 0;
      debug("generation_start", {});
    } else if (!generating && generationWasActive) {
      generationEndedAt = now;
      debug("generation_end", {
        settleUntil: new Date(now + POST_GENERATION_SETTLE_MS).toISOString()
      });
    }
    generationWasActive = generating;

    const armed = armIsValid();
    const nodes = assistantNodes();
    let nextDelay = null;

    nodes.forEach((node, index) => {
      const text = extractReadableText(node);
      if (text.length < MIN_TEXT_CHARS) {
        return;
      }

      const key = findTurnKey(node, index);
      const hash = hashText(text);
      const previous = stateByTurn.get(key);

      if (!previous) {
        stateByTurn.set(key, {
          text,
          hash,
          lastChangedAt: now,
          sentHash: armed ? null : hash
        });

        if (armed) {
          debug("answer_candidate_new", {
            turnKey: key,
            hash,
            textLength: text.length,
            index,
            assistantCount: nodes.length
          });
          nextDelay = STABLE_MS;
        } else {
          sentHashes.add(`${conversationId()}::${key}::${hash}`);
          debug("existing_answer_ignored", {
            turnKey: key,
            hash,
            textLength: text.length,
            index,
            assistantCount: nodes.length
          });
        }
        return;
      }

      if (previous.hash !== hash) {
        previous.text = text;
        previous.hash = hash;
        previous.lastChangedAt = now;
        previous.sentHash = armed ? null : hash;

        if (armed) {
          debug("answer_candidate_changed", {
            turnKey: key,
            hash,
            textLength: text.length,
            index,
            assistantCount: nodes.length
          });
          nextDelay = STABLE_MS;
        } else {
          sentHashes.add(`${conversationId()}::${key}::${hash}`);
          debug("existing_answer_change_ignored", {
            turnKey: key,
            hash,
            textLength: text.length,
            index,
            assistantCount: nodes.length
          });
        }
        return;
      }

      const stableFor = now - previous.lastChangedAt;
      const isLastAssistant = index === nodes.length - 1;

      const sinceGenerationEnd = generationEndedAt
        ? now - generationEndedAt
        : 0;
      const generationSettled = (
        generationEndedAt > 0 &&
        sinceGenerationEnd >= POST_GENERATION_SETTLE_MS
      );
      const textSettled = stableFor >= STABLE_MS;

      if (
        armed &&
        isLastAssistant &&
        !generating &&
        previous.sentHash !== hash &&
        generationSettled &&
        textSettled
      ) {
        const hidden = document.visibilityState === "hidden";

        debug("final_ready", {
          turnKey: key,
          hash,
          textLength: text.length,
          stableFor,
          sinceGenerationEnd,
          scanSource,
          externalScanAge: lastExternalScanAt
            ? now - lastExternalScanAt
            : null,
          visibility: document.visibilityState,
          hiddenDeferred: hidden
        });

        if (hidden) {
          hiddenDeferredHash = hash;

          debug("hidden_final_deferred", {
            turnKey: key,
            hash,
            textLength: text.length,
            reason: "hidden-dom-may-be-stale"
          });

          if (!completionNoticeSent) {
            completionNoticeSent = true;
            sendCompletionNotice(key);
          }

          // 非表示タブではChatGPT本体のDOMが短い断片のまま止まる事例がある。
          // ここでは全文として送らず、再表示後のDOM更新を待つ。
          return;
        }

        debug("visible_final_send", {
          turnKey: key,
          hash,
          textLength: text.length,
          deferredHash: hiddenDeferredHash || null
        });

        previous.sentHash = hash;
        sendFinal(text, key, hash);
        disarm("answer-sent");
        return;
      }

      if (
        armed &&
        isLastAssistant &&
        !generating &&
        previous.sentHash !== hash
      ) {
        const textRemaining = Math.max(0, STABLE_MS - stableFor);
        const generationRemaining = generationEndedAt
          ? Math.max(0, POST_GENERATION_SETTLE_MS - sinceGenerationEnd)
          : POST_GENERATION_SETTLE_MS;
        const remaining = Math.max(
          100,
          Math.max(textRemaining, generationRemaining)
        );

        debug("final_wait", {
          turnKey: key,
          hash,
          textLength: text.length,
          stableFor,
          sinceGenerationEnd,
          textRemaining,
          generationRemaining,
          scanSource,
          externalScanAge: lastExternalScanAt
            ? now - lastExternalScanAt
            : null,
          visibility: document.visibilityState
        });

        nextDelay = nextDelay === null
          ? remaining
          : Math.min(nextDelay, remaining);
      }
    });

    if (nextDelay !== null) {
      scheduleScan(nextDelay);
    }
  }

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (
      form instanceof HTMLFormElement &&
      form.querySelector(
        "#prompt-textarea, [data-testid='prompt-textarea'], textarea, [contenteditable='true']"
      )
    ) {
      arm("composer-submit");
      scheduleScan(50);
    }
  }, true);

  document.addEventListener("click", (event) => {
    if (isSendButton(event.target)) {
      arm("send-button");
      scheduleScan(50);
    }
  }, true);

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.isComposing &&
      isComposerTarget(event.target)
    ) {
      arm("composer-enter");
      scheduleScan(50);
    }
  }, true);

  document.addEventListener("visibilitychange", () => {
    debug("visibility_change", {
      visibility: document.visibilityState,
      awaitingNewAnswer,
      generating: generationIsActive(),
      completionNoticeSent,
      hiddenDeferredHash: hiddenDeferredHash || null,
      externalScanAge: lastExternalScanAt
        ? Date.now() - lastExternalScanAt
        : null
    });

    if (document.visibilityState === "visible" && awaitingNewAnswer) {
      // 戻った直後にChatGPTが最終本文をDOMへ反映するため、
      // 即時確認と少し遅らせた再確認の両方を行う。
      scheduleScan(50);
      setTimeout(() => scheduleScan(250), 600);
      setTimeout(() => scheduleScan(250), 1800);
    }
  });

  const observer = new MutationObserver(() => scheduleScan(250));
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true
  });

  setInterval(() => {
    if (
      location.pathname !== currentPath ||
      location.href !== currentUrl
    ) {
      scheduleScan(50);
    }
    armIsValid();
  }, 750);

  resetForConversation("initial-load", false);
  connectMonitor();
  scheduleScan(500);
})();

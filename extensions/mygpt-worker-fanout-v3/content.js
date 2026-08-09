(() => {
  "use strict";

  if (globalThis.__mygptV4ContentLoaded) return;
  globalThis.__mygptV4ContentLoaded = true;

  const MSG = Object.freeze({
    GET_IDENTITY: "MYGPT_V4_GET_IDENTITY",
    CAPTURE: "MYGPT_V4_CAPTURE",
    OBSERVED: "MYGPT_V4_OBSERVED"
  });
  const PAGE_OBS_EVENT = "MYGPT_V3_PAGE_OBSERVED";
  const MONITOR_PORT = "mygpt-worker-monitor";

  const STOP_SELECTORS = [
    'button[data-testid="stop-button"]',
    'button[data-testid="composer-stop-button"]',
    'form button[aria-label*="stop" i]:not([aria-label*="dictat" i]):not([aria-label*="voice" i]):not([aria-label*="read" i])',
    'form button[aria-label*="生成を停止"]'
  ];
  const FINISHED_ACTIONS_SELECTOR = [
    'button[data-testid="copy-turn-action-button"]',
    'button[data-testid="good-response-turn-action-button"]',
    'button[data-testid="bad-response-turn-action-button"]',
    'button[aria-label="Share"]',
    'button[aria-label="共有"]'
  ].join(", ");

  let monitorPort = null;
  let reconnectTimer = null;
  let scanTimer = null;
  let observer = null;
  let runtimeBridgeDead = false;
  let currentHref = location.href;
  let lastGeneration = false;

  function currentWorkerIdentity() {
    try {
      return MYGPTWorkerRoute.normalizeCustomGptIdentity(location.href);
    } catch (_) {
      return { ok: false, reason: "WORKER_ROUTE_UNAVAILABLE", href: location.href };
    }
  }

  function isWorkerContext() {
    return currentWorkerIdentity()?.ok === true;
  }

  function isContextInvalidatedError(error) {
    return /extension context invalidated|context invalidated/i.test(String(error?.message || error || ""));
  }

  function stopRuntimeBridge() {
    if (runtimeBridgeDead) return;
    runtimeBridgeDead = true;
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (scanTimer !== null) {
      clearTimeout(scanTimer);
      scanTimer = null;
    }
    if (observer) {
      try { observer.disconnect(); } catch (_) {}
    }
    if (monitorPort) {
      const port = monitorPort;
      monitorPort = null;
      try { port.disconnect(); } catch (_) {}
    }
    try { window.removeEventListener(PAGE_OBS_EVENT, onPageObserved); } catch (_) {}
    try { window.removeEventListener("popstate", onPopState); } catch (_) {}
    try { window.removeEventListener("hashchange", onHashChange); } catch (_) {}
  }

  function runtimeBridgeAlive() {
    if (runtimeBridgeDead) return false;
    try {
      return Boolean(chrome?.runtime?.id);
    } catch (error) {
      if (isContextInvalidatedError(error)) stopRuntimeBridge();
      return false;
    }
  }

  function safeRuntimeSendMessage(payload) {
    if (!runtimeBridgeAlive()) return;
    try {
      const pending = chrome.runtime.sendMessage(payload);
      if (pending && typeof pending.catch === "function") {
        pending.catch((error) => {
          if (isContextInvalidatedError(error)) stopRuntimeBridge();
        });
      }
    } catch (error) {
      if (isContextInvalidatedError(error)) stopRuntimeBridge();
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function hashText(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  function isVisible(node) {
    if (!(node instanceof HTMLElement)) return false;
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function firstVisible(selectors, root = document) {
    for (const selector of selectors) {
      let nodes = [];
      try { nodes = root.querySelectorAll(selector); } catch (_) { continue; }
      for (const node of nodes) if (isVisible(node)) return node;
    }
    return null;
  }

  function generationIsActive() { return Boolean(firstVisible(STOP_SELECTORS)); }

  function conversationIdFromUrl() {
    const match = location.pathname.match(/\/c\/([^/?#]+)/);
    return match ? match[1] : null;
  }

  function roleNodes(role) {
    const selectors = role === "assistant"
      ? ['[data-message-author-role="assistant"]', '[data-turn="assistant"]']
      : ['[data-message-author-role="user"]', '[data-turn="user"]'];
    const found = [];
    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((node) => { if (!found.includes(node)) found.push(node); });
    }
    return found.filter((node) => !node.parentElement?.closest(selectors.join(",")));
  }

  function turnContainer(node) {
    return node?.closest?.(
      'article[data-testid^="conversation-turn"], div[data-testid^="conversation-turn"], section[data-testid^="conversation-turn"], article[data-message-author-role], div[data-message-author-role], section[data-message-author-role], article[data-turn], div[data-turn], section[data-turn]'
    ) || node;
  }

  function findTurnKey(node, index, role) {
    const explicit = node?.getAttribute?.("data-message-id") || node?.closest?.("[data-message-id]")?.getAttribute?.("data-message-id");
    if (explicit) return explicit;
    const turn = node?.closest?.('[data-testid^="conversation-turn-"]');
    const testId = turn?.getAttribute?.("data-testid");
    if (testId) return testId;
    return `${location.pathname}::${role}-${index}`;
  }

  function extractFingerprintText(node) {
    if (!node) return "";
    const clone = node.cloneNode(true);
    clone.querySelectorAll([
      "button", "svg", "textarea", "input", "select", "[role='button']",
      "[aria-hidden='true']", "[data-testid*='copy']", "[data-testid*='feedback']"
    ].join(",")).forEach((element) => element.remove());
    return normalizeText(clone.innerText || clone.textContent || "");
  }

  function finishedActionsVisible(node) {
    const root = turnContainer(node);
    return Boolean(root && Array.from(root.querySelectorAll(FINISHED_ACTIONS_SELECTOR)).some(isVisible));
  }

  function strongThinkingActive(node) {
    const root = turnContainer(node);
    if (!root) return false;
    const selectors = [
      '[aria-busy="true"]', '[role="progressbar"]', '[data-state="loading"]',
      '[data-state="pending"]', '[data-state="streaming"]', 'span.loading-shimmer',
      '[data-testid*="thinking"]', '[data-testid*="reasoning"]'
    ];
    for (const selector of selectors) {
      for (const candidate of root.querySelectorAll(selector)) {
        if (!isVisible(candidate)) continue;
        if (candidate.matches('[data-testid*="thinking"], [data-testid*="reasoning"]')) {
          const active = candidate.getAttribute("aria-busy") === "true" ||
            ["loading", "pending", "streaming"].includes(candidate.getAttribute("data-state")) ||
            candidate.classList.contains("loading-shimmer");
          if (!active) continue;
        }
        return true;
      }
    }
    return false;
  }

  function composerCleared() {
    const root = document.querySelector("#prompt-textarea");
    if (!root) return true;
    const text = root.tagName === "TEXTAREA" || root.tagName === "INPUT"
      ? root.value
      : root.innerText || root.textContent || "";
    return !normalizeText(text);
  }

  function latestRoleSnapshot(role) {
    const nodes = roleNodes(role);
    const node = nodes[nodes.length - 1] || null;
    if (!node) {
      return { count: 0, key: null, hash: null, text: "", textLength: 0, imageCount: 0, barVisible: false, strongThinkingActive: false };
    }
    const text = extractFingerprintText(node);
    const root = turnContainer(node);
    return {
      count: nodes.length,
      key: findTurnKey(node, nodes.length - 1, role),
      hash: hashText(text),
      text,
      textLength: text.length,
      imageCount: root?.querySelectorAll?.("img")?.length || 0,
      barVisible: role === "assistant" ? finishedActionsVisible(node) : false,
      strongThinkingActive: role === "assistant" ? strongThinkingActive(node) : false
    };
  }

  function capture() {
    const user = latestRoleSnapshot("user");
    const assistant = latestRoleSnapshot("assistant");
    return {
      identity: MYGPTWorkerRoute.normalizeCustomGptIdentity(location.href),
      url: location.href,
      conversationId: conversationIdFromUrl(),
      generationActive: generationIsActive(),
      composerCleared: composerCleared(),
      userCount: user.count,
      latestUserKey: user.key,
      latestUserHash: user.hash,
      latestUserText: user.text,
      assistantCount: assistant.count,
      latestAssistantKey: assistant.key,
      latestAssistantHash: assistant.hash,
      latestAssistantTextLength: assistant.textLength,
      latestAssistantImageCount: assistant.imageCount,
      latestAssistantActionBarVisible: assistant.barVisible,
      latestAssistantStrongThinkingActive: assistant.strongThinkingActive,
      visibility: document.visibilityState,
      observedAt: Date.now()
    };
  }

  function buildIdentity() {
    return {
      identity: MYGPTWorkerRoute.normalizeCustomGptIdentity(location.href),
      generationActive: generationIsActive(),
      title: document.title || "",
      href: location.href,
      observedAt: Date.now()
    };
  }

  try {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message || typeof message.type !== "string") return false;
      if (message.type === MSG.GET_IDENTITY) { sendResponse(buildIdentity()); return false; }
      if (message.type === MSG.CAPTURE) { sendResponse({ ok: true, snapshot: capture() }); return false; }
      return false;
    });
  } catch (error) {
    if (isContextInvalidatedError(error)) stopRuntimeBridge();
  }

  function reportObserved(reason, pageEvent = null) {
    if (!isWorkerContext()) return;
    safeRuntimeSendMessage({
      type: MSG.OBSERVED,
      reason,
      report: { ...capture(), pageEvent }
    });
  }

  function onPageObserved(event) {
    if (runtimeBridgeDead) return;
    reportObserved("page-observer", event?.detail || null);
  }

  function onPopState() {
    if (!runtimeBridgeDead) reportObserved("popstate");
  }

  function onHashChange() {
    if (!runtimeBridgeDead) reportObserved("hashchange");
  }

  window.addEventListener(PAGE_OBS_EVENT, onPageObserved);

  function postMonitorState(source) {
    if (runtimeBridgeDead || !monitorPort || !isWorkerContext()) return;
    try { monitorPort.postMessage({ type: "mygpt-worker-monitor-state", source, snapshot: capture() }); }
    catch (_) {}
  }

  function disconnectMonitor() {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (!monitorPort) return;
    const port = monitorPort;
    monitorPort = null;
    try { port.disconnect(); } catch (_) {}
  }

  function connectMonitor() {
    if (runtimeBridgeDead || !isWorkerContext() || monitorPort || !runtimeBridgeAlive()) return;
    try {
      monitorPort = chrome.runtime.connect({ name: MONITOR_PORT });
    } catch (error) {
      if (isContextInvalidatedError(error)) {
        stopRuntimeBridge();
        return;
      }
      scheduleReconnect();
      return;
    }
    monitorPort.onMessage.addListener((message) => {
      if (runtimeBridgeDead || message?.type !== "mygpt-worker-scan-now") return;
      postMonitorState("background-ping");
    });
    monitorPort.onDisconnect.addListener(() => {
      monitorPort = null;
      if (runtimeBridgeDead) return;
      try {
        const lastError = chrome.runtime.lastError;
        if (lastError && isContextInvalidatedError(lastError)) {
          stopRuntimeBridge();
          return;
        }
      } catch (error) {
        if (isContextInvalidatedError(error)) {
          stopRuntimeBridge();
          return;
        }
      }
      if (isWorkerContext()) scheduleReconnect();
    });
    postMonitorState("connect");
  }

  function scheduleReconnect() {
    if (runtimeBridgeDead || !isWorkerContext() || reconnectTimer !== null) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (!runtimeBridgeDead && isWorkerContext()) connectMonitor();
    }, 1000);
  }

  function scheduleLocalScan(delay = 250) {
    if (runtimeBridgeDead) return;
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      if (runtimeBridgeDead) return;
      const hrefChanged = location.href !== currentHref;
      const generation = generationIsActive();
      const generationChanged = generation !== lastGeneration;
      if (hrefChanged) {
        currentHref = location.href;
        if (!runtimeBridgeDead && isWorkerContext()) connectMonitor();
        else disconnectMonitor();
      }
      if (hrefChanged || generationChanged) {
        lastGeneration = generation;
        reportObserved(hrefChanged ? "route" : "generation");
      }
      postMonitorState("mutation");
    }, delay);
  }

  lastGeneration = generationIsActive();
  observer = new MutationObserver(() => scheduleLocalScan(180));
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  addEventListener("popstate", onPopState);
  addEventListener("hashchange", onHashChange);
  if (isWorkerContext()) connectMonitor();
})();

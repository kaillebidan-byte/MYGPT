(() => {
  "use strict";

  if (globalThis.__chatgptTranslationLoopTestV050Loaded) return;
  globalThis.__chatgptTranslationLoopTestV050Loaded = true;

  // Completion gate adapted from Oracle's browser terminal classifier.
  // DOM fallback and lifecycle rescan hooks are adapted from the user's VoiceBridge reference.

  const DEFAULT_SETTINGS = {
    continuePrompt: "作業の続きを",
    maxCompletedTurns: 3,
    sendDelayMs: 1200,
    terminalMinStableMs: 1500,
    barConfirmCycles: 3,
    fallbackEnabled: false,
    fallbackStableMs: 3000,
    fallbackPostGenerationMs: 6000,
    responseTimeoutMinutes: 90,
    debugEnabled: true,
    rotationEnabled: true,
    continueAfterRotation: true,
    projectUrl: "",
    resumePrompt: "現状把握して作業の続きを",
    rotationTimeoutSeconds: 120,
    phaseCompletionMarker: "規定フェイズ完了"
  };

  const INPUT_SELECTORS = [
    "#prompt-textarea",
    'textarea[data-id="prompt-textarea"]',
    'textarea[data-testid="prompt-textarea"]',
    'textarea[name="prompt-textarea"]',
    'textarea[placeholder*="Send a message"]',
    'textarea[placeholder*="Message"]',
    ".ProseMirror",
    '[contenteditable="true"][role="textbox"]',
    '[contenteditable="true"][data-virtualkeyboard="true"]'
  ];

  const SEND_BUTTON_SELECTORS = [
    '#composer-submit-button',
    'button[data-testid="send-button"]',
    'button[data-testid*="composer-send"]',
    'form button[type="submit"]',
    'button[type="submit"][data-testid*="send"]',
    'button[aria-label*="Send"]',
    'button[aria-label*="送信"]'
  ];

  const GLOBAL_SEND_BUTTON_SELECTORS = [
    '#composer-submit-button',
    'button[data-testid="send-button"]',
    'button[data-testid*="composer-send"]',
    'button[type="submit"][data-testid*="send"]'
  ];

  const STOP_BUTTON_SELECTORS = [
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

  const turnStates = new Map();
  const rotationSubmissionTasks = new Map();
  const completedRotationSubmissions = new Map();
  let settings = { ...DEFAULT_SETTINGS };
  let enabled = false;
  let currentPath = location.pathname;
  let currentUrl = location.href;
  let initialized = false;
  let scanTimer = null;
  let generationWasActive = false;
  let generationEndedAt = 0;
  let armed = false;
  let armedAt = 0;
  let armedReason = "";
  let sending = false;
  let contentRunToken = null;
  let lastExternalScanAt = 0;
  let lastTerminalSampleSignature = "";
  let lastTerminalSampleLogAt = 0;
  let lastCandidateChangeLogAt = 0;

  const loopCore = globalThis.TranslationLoopCore;
  const terminalGate = globalThis.TranslationLoopTerminalGate;
  if (!loopCore) throw new Error("loop coreを読み込めない");
  if (!terminalGate) throw new Error("terminal gateを読み込めない");

  const promptRunner = globalThis.TranslationLoopPromptStacker?.createRunner({
    document,
    window,
    adapter: {
      editor: INPUT_SELECTORS,
      send: SEND_BUTTON_SELECTORS,
      globalSend: GLOBAL_SEND_BUTTON_SELECTORS
    },
    acceptNode: isVisible
  });
  if (!promptRunner) throw new Error("Prompt Stacker runnerを読み込めない");

  function debug(event, details = {}) {
    chrome.runtime.sendMessage({
      type: "translation-loop-v051:debug",
      event,
      url: location.href,
      details: {
        conversationId: conversationId(),
        ...details
      }
    }, () => void chrome.runtime.lastError);
  }

  function reportError(error, details = {}) {
    const failedRunToken = contentRunToken;
    enabled = false;
    armed = false;
    sending = false;
    contentRunToken = null;
    promptRunner.stop();
    chrome.runtime.sendMessage({
      type: "translation-loop-v051:content-error",
      runToken: failedRunToken,
      error: error instanceof Error ? error.message : String(error),
      details
    }, () => void chrome.runtime.lastError);
  }

  function scheduleScan(delay = 200) {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => scan("local"), delay);
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
      try {
        const nodes = root.querySelectorAll(selector);
        for (const node of nodes) {
          if (isVisible(node)) return node;
        }
      } catch (_) {
        // Selector drift must not crash the loop.
      }
    }
    return null;
  }

  function generationIsActive() {
    return Boolean(firstVisible(STOP_BUTTON_SELECTORS));
  }

  function conversationId() {
    const match = location.pathname.match(/\/c\/([^/?#]+)/);
    return match ? match[1] : location.pathname;
  }

  function projectRouteSegment(url = location.href) {
    try {
      const parsed = new URL(url, location.origin);
      const match = parsed.pathname.match(/^\/g\/(g-p-[^/]+)/);
      return match ? match[1] : null;
    } catch (_) {
      return null;
    }
  }

  function projectIdentity(url = location.href) {
    const segment = projectRouteSegment(url);
    if (!segment) return null;
    const stable = segment.match(/^(g-p-[0-9a-f]{32})(?:-|$)/i);
    return stable ? stable[1].toLowerCase() : segment;
  }

  function normalizeProjectLandingUrl(url) {
    try {
      const parsed = new URL(url, location.origin);
      const segment = projectRouteSegment(parsed.href);
      if (!segment) return null;
      parsed.hash = "";
      parsed.search = "";
      parsed.pathname = `/g/${segment}/project`;
      return parsed.href;
    } catch (_) {
      return null;
    }
  }

  function detectCanonicalProjectUrl() {
    const stableId = projectIdentity(location.href);
    if (!stableId) return null;

    const candidates = [];
    const add = (value) => {
      const normalized = normalizeProjectLandingUrl(value);
      if (!normalized || projectIdentity(normalized) !== stableId) return;
      if (!candidates.includes(normalized)) candidates.push(normalized);
    };

    if (/\/project\/?$/.test(location.pathname)) add(location.href);
    add(document.querySelector('link[rel="canonical"]')?.href || "");
    for (const anchor of document.querySelectorAll('a[href*="/g/g-p-"]')) {
      add(anchor.href || anchor.getAttribute("href") || "");
    }

    const named = candidates.find((candidate) => projectRouteSegment(candidate) !== stableId);
    return named || candidates[0] || null;
  }

  function currentConversationIdOrNull() {
    const match = location.pathname.match(/\/c\/([^/?#]+)/);
    return match ? match[1] : null;
  }

  function roleNodes(role) {
    const selectors = role === "assistant"
      ? ['[data-message-author-role="assistant"]', '[data-turn="assistant"]']
      : ['[data-message-author-role="user"]', '[data-turn="user"]'];
    const found = [];
    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((node) => {
        if (!found.includes(node)) found.push(node);
      });
    }
    return found.filter((node) => {
      const parent = node.parentElement?.closest(selectors.join(","));
      return !parent;
    });
  }

  function assistantNodes() {
    return roleNodes("assistant");
  }

  function userNodes() {
    return roleNodes("user");
  }

  function turnContainer(node) {
    return node.closest(
      'article[data-testid^="conversation-turn"], div[data-testid^="conversation-turn"], section[data-testid^="conversation-turn"], article[data-message-author-role], div[data-message-author-role], section[data-message-author-role], article[data-turn], div[data-turn], section[data-turn]'
    ) || node;
  }

  function findTurnKey(node, index) {
    const explicit = node.getAttribute("data-message-id") || node.closest("[data-message-id]")?.getAttribute("data-message-id");
    if (explicit) return explicit;
    const turn = node.closest('[data-testid^="conversation-turn-"]');
    const testId = turn?.getAttribute("data-testid");
    if (testId) return testId;
    return `${location.pathname}::assistant-${index}`;
  }

  function extractFingerprintText(node) {
    const clone = node.cloneNode(true);
    clone.querySelectorAll([
      "button", "svg", "textarea", "input", "select", "[role='button']",
      "[aria-hidden='true']", "[data-testid*='copy']", "[data-testid*='feedback']"
    ].join(",")).forEach((element) => element.remove());
    return normalizeText(clone.innerText || clone.textContent || "");
  }

  function finishedActionsVisible(node) {
    const root = turnContainer(node);
    return Array.from(root.querySelectorAll(FINISHED_ACTIONS_SELECTOR)).some(isVisible);
  }

  function strongThinkingActive(node) {
    const root = turnContainer(node);
    const selectors = [
      '[aria-busy="true"]',
      '[role="progressbar"]',
      '[data-state="loading"]',
      '[data-state="pending"]',
      '[data-state="streaming"]',
      'span.loading-shimmer',
      '[data-testid*="thinking"]',
      '[data-testid*="reasoning"]'
    ];
    for (const selector of selectors) {
      for (const candidate of root.querySelectorAll(selector)) {
        if (!isVisible(candidate)) continue;
        if (candidate.matches('[data-testid*="thinking"], [data-testid*="reasoning"]')) {
          // A completed reasoning summary may remain in the turn. Treat these generic
          // selectors as strong only while the node exposes an active state. Shimmer,
          // aria-busy, progress and pending states are checked independently above.
          const hasActiveSignal = candidate.getAttribute("aria-busy") === "true" ||
            candidate.getAttribute("data-state") === "loading" ||
            candidate.getAttribute("data-state") === "pending" ||
            candidate.classList.contains("loading-shimmer");
          if (!hasActiveSignal) continue;
        }
        return true;
      }
    }
    return false;
  }

  function createGateState(now) {
    return terminalGate.createGateState(now);
  }

  function classifyTerminal(previous, sample) {
    return terminalGate.classifyTerminal(previous, sample, {
      barConfirmCycles: settings.barConfirmCycles,
      terminalMinStableMs: settings.terminalMinStableMs,
      fallbackEnabled: settings.fallbackEnabled,
      fallbackStableMs: settings.fallbackStableMs,
      fallbackPostGenerationMs: settings.fallbackPostGenerationMs,
      generationEndedAt
    });
  }

  function baseline(reason) {
    const now = Date.now();
    turnStates.clear();
    lastTerminalSampleSignature = "";
    lastTerminalSampleLogAt = 0;
    lastCandidateChangeLogAt = 0;
    assistantNodes().forEach((node, index) => {
      const text = extractFingerprintText(node);
      if (!text) return;
      const key = findTurnKey(node, index);
      const hash = hashText(text);
      turnStates.set(key, {
        hash,
        processedHash: hash,
        inFlightHash: null,
        gate: createGateState(now)
      });
    });
    initialized = true;
    debug("baseline", { reason, assistantCount: assistantNodes().length });
  }

  function arm(reason, includeCurrentGenerating = false) {
    armed = true;
    armedAt = Date.now();
    armedReason = reason;
    generationEndedAt = 0;
    if (includeCurrentGenerating) {
      const nodes = assistantNodes();
      const node = nodes[nodes.length - 1];
      if (node) {
        const key = findTurnKey(node, nodes.length - 1);
        const text = extractFingerprintText(node);
        const hash = hashText(text);
        turnStates.set(key, {
          hash,
          processedHash: null,
          inFlightHash: null,
          gate: createGateState(Date.now())
        });
      }
    }
    debug("armed", { reason, includeCurrentGenerating });
  }

  function disarm(reason) {
    armed = false;
    armedAt = 0;
    armedReason = "";
    generationEndedAt = 0;
    debug("disarmed", { reason });
  }

  function timeoutExceeded(now) {
    if (!enabled || !armed || !armedAt) return false;
    return now - armedAt > settings.responseTimeoutMinutes * 60 * 1000;
  }

  async function onAssistantComplete({ fingerprint, conversation, textLength, proof, phaseCompletionMatched }) {
    if (sending) return { accepted: false, retry: true, reason: "content-busy" };
    const operationToken = contentRunToken;
    if (!enabled || !operationToken) return { accepted: false, retry: false, reason: "content-disabled" };
    sending = true;
    const response = await chrome.runtime.sendMessage({
      type: "translation-loop-v051:assistant-complete",
      fingerprint,
      conversationId: conversation,
      textLength,
      proof,
      phaseCompletionMatched: phaseCompletionMatched === true,
      runToken: operationToken
    }).catch((error) => ({ ok: false, error: error.message }));

    if (contentRunToken !== operationToken || !enabled) {
      sending = false;
      return { accepted: false, retry: false, reason: "stale-content-run" };
    }
    if (!response?.ok) {
      sending = false;
      reportError(response?.error || "完了通知が拒否された");
      return { accepted: false, retry: false, reason: "completion-rejected" };
    }
    if (response.action === "retry") {
      sending = false;
      return { accepted: false, retry: true, reason: response.reason || "background-not-ready" };
    }
    if (response.action === "stop") {
      enabled = false;
      sending = false;
      contentRunToken = null;
      promptRunner.stop();
      disarm(response.reason || "stopped");
      return { accepted: true, retry: false, reason: response.reason || "stopped" };
    }
    if (response.action === "rotate") {
      enabled = false;
      sending = false;
      disarm("rotating");
      return { accepted: true, retry: false, reason: "rotating" };
    }
    if (response.action !== "send") {
      sending = false;
      return {
        accepted: response.accepted === true,
        retry: response.retry === true,
        reason: response.reason || "ignored"
      };
    }

    await delay(Number(response.delayMs || 0));
    if (contentRunToken !== operationToken || !enabled) {
      sending = false;
      return { accepted: true, retry: false, reason: "stopped-before-submit" };
    }

    const result = await submitPrompt(response.prompt);
    const submissionResponse = await chrome.runtime.sendMessage({
      type: "translation-loop-v051:submission-result",
      nonce: response.nonce,
      runToken: operationToken,
      ok: result.ok,
      error: result.error || null
    }).catch(() => null);

    if (contentRunToken !== operationToken || !enabled) {
      sending = false;
      return { accepted: true, retry: false, reason: "stale-after-submit" };
    }
    if (!result.ok) {
      sending = false;
      enabled = false;
      contentRunToken = null;
      promptRunner.stop();
      disarm("submission-failed");
      return { accepted: true, retry: false, reason: result.error || "submission-failed" };
    }
    if (submissionResponse?.ok === false) {
      sending = false;
      enabled = false;
      contentRunToken = null;
      promptRunner.stop();
      disarm("submission-result-rejected");
      return { accepted: true, retry: false, reason: submissionResponse.error || "submission-result-rejected" };
    }

    sending = false;
    arm("auto-submit", false);
    scheduleScan(100);
    return { accepted: true, retry: false, reason: "submitted" };
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
  }

  function findComposer() {
    return promptRunner.getEditor();
  }

  function composerText(composer) {
    return promptRunner.editorText(composer);
  }

  function latestUserSnapshot() {
    const users = userNodes();
    const latestUser = users[users.length - 1] || null;
    const latestUserText = normalizeText(latestUser?.innerText || latestUser?.textContent || "");
    return {
      userCount: users.length,
      latestUserKey: latestUser ? findTurnKey(latestUser, users.length - 1) : null,
      latestUserHash: latestUser ? hashText(latestUserText) : null,
      latestUserText
    };
  }

  function submissionSnapshot() {
    const composer = findComposer();
    return {
      ...latestUserSnapshot(),
      generationActive: generationIsActive(),
      composerCleared: Boolean(composer && !composerText(composer)),
      conversationId: currentConversationIdOrNull(),
      url: location.href
    };
  }

  function normalSubmissionEvidence(prompt, before) {
    return loopCore.evaluateSubmissionEvidence(prompt, before, submissionSnapshot(), { rotation: false });
  }

  function rotationSubmissionEvidence(prompt, before) {
    return loopCore.evaluateSubmissionEvidence(prompt, before, submissionSnapshot(), { rotation: true });
  }

  async function submitPrompt(prompt) {
    try {
      const before = submissionSnapshot();
      const result = await promptRunner.submit(prompt, {
        allowEnterFallback: false,
        draftError: "入力欄に下書きがあるため停止した",
        verifyTimeout: 10000,
        verifyError: "送信後のユーザーメッセージまたは生成開始を確認できない",
        verify: () => {
          const evidence = normalSubmissionEvidence(prompt, before);
          return evidence.committed ? evidence : null;
        },
        finalEvidence: () => normalSubmissionEvidence(prompt, before)
      });
      if (result.ok) {
        debug("submission_dom_verified", {
          beforeUsers: before.userCount,
          afterUsers: userNodes().length,
          activation: result.activation,
          button: result.button,
          evidence: result.evidence
        });
      }
      return result;
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async function submitRotationPromptOnce(prompt, nonce, expectedProjectUrl) {
    try {
      const expectedProject = projectIdentity(expectedProjectUrl);
      const currentProject = projectIdentity(location.href);
      if (!expectedProject || expectedProject !== currentProject) {
        return { ok: false, error: "プロジェクト所属を確認できない" };
      }
      if (currentConversationIdOrNull()) {
        return { ok: false, error: "新規チャット画面ではなく既存会話を表示している" };
      }

      const before = submissionSnapshot();
      debug("rotation_submit_attempt", {
        nonce,
        expectedProject,
        currentProject,
        promptLength: normalizeText(prompt).length,
        runner: "prompt-stacker"
      });

      const result = await promptRunner.submit(prompt, {
        allowEnterFallback: false,
        editorTimeout: 15000,
        draftError: "新規チャット入力欄に下書きがあるため停止した",
        verifyTimeout: 15000,
        verifyError: "新規チャット送信後のURL変化・ユーザーターン・生成開始を確認できない",
        verify: () => {
          const evidence = rotationSubmissionEvidence(prompt, before);
          return evidence.committed ? evidence : null;
        },
        finalEvidence: () => rotationSubmissionEvidence(prompt, before)
      });

      if (!result.ok) {
        debug("rotation_submit_unverified", {
          nonce,
          activation: result.activation || null,
          button: result.button || null,
          evidence: result.evidence || null
        });
        return result;
      }

      debug("rotation_submit_evidence", {
        nonce,
        activation: result.activation,
        button: result.button,
        evidence: result.evidence
      });
      return {
        ...result,
        clicked: result.activation === "native-click",
        projectIdentity: currentProject
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function submitRotationPrompt(prompt, nonce, expectedProjectUrl) {
    const key = String(nonce || "");
    if (!key) {
      return Promise.resolve({ ok: false, error: "ローテーションnonceが空" });
    }
    if (completedRotationSubmissions.has(key)) {
      const prior = completedRotationSubmissions.get(key);
      debug("rotation_submit_duplicate_suppressed", { nonce: key, state: "completed" });
      return Promise.resolve({ ...prior, duplicate: true, clicked: false });
    }
    if (rotationSubmissionTasks.has(key)) {
      debug("rotation_submit_duplicate_suppressed", { nonce: key, state: "in-flight" });
      return rotationSubmissionTasks.get(key).then((result) => ({
        ...result,
        duplicate: true,
        clicked: false
      }));
    }

    const task = submitRotationPromptOnce(prompt, key, expectedProjectUrl)
      .then((result) => {
        if (result?.ok) {
          completedRotationSubmissions.set(key, result);
          while (completedRotationSubmissions.size > 20) {
            completedRotationSubmissions.delete(completedRotationSubmissions.keys().next().value);
          }
        }
        return result;
      })
      .finally(() => {
        rotationSubmissionTasks.delete(key);
      });
    rotationSubmissionTasks.set(key, task);
    return task;
  }

  function scan(scanSource = "local") {
    const now = Date.now();

    if (location.pathname !== currentPath) {
      const from = currentPath;
      const to = location.pathname;
      currentPath = to;
      currentUrl = location.href;
      baseline("route-change");
      if (enabled) {
        chrome.runtime.sendMessage({
          type: "translation-loop-v051:route-changed",
          runToken: contentRunToken,
          from,
          to
        }, () => void chrome.runtime.lastError);
        enabled = false;
        armed = false;
      }
      return;
    }
    if (location.href !== currentUrl) currentUrl = location.href;
    if (!initialized) baseline("initial");
    if (!enabled || !armed || sending) return;

    if (timeoutExceeded(now)) {
      reportError("回答待ちが設定時間を超えた", { armedReason });
      return;
    }

    const generating = generationIsActive();
    if (generating && !generationWasActive) {
      generationEndedAt = 0;
      debug("generation_start", {});
    } else if (!generating && generationWasActive) {
      generationEndedAt = now;
      debug("generation_end", {});
    }
    generationWasActive = generating;

    const nodes = assistantNodes();
    const node = nodes[nodes.length - 1];
    if (!node) return;
    const index = nodes.length - 1;
    const text = extractFingerprintText(node);
    if (!text) return;
    const key = findTurnKey(node, index);
    const hash = hashText(text);
    let record = turnStates.get(key);

    if (!record) {
      record = { hash, processedHash: null, inFlightHash: null, gate: createGateState(now) };
      turnStates.set(key, record);
      debug("answer_candidate_new", { key, hash, textLength: text.length });
      scheduleScan(250);
      return;
    }
    if (record.hash !== hash) {
      record.hash = hash;
      record.inFlightHash = null;
      record.gate = createGateState(now);
      if (now - lastCandidateChangeLogAt >= 30000) {
        lastCandidateChangeLogAt = now;
        debug("answer_candidate_changed", { key, hash, textLength: text.length });
      }
      scheduleScan(250);
      return;
    }
    if (record.processedHash === hash) return;

    const sample = {
      now,
      contentKey: `${key}:${hash}`,
      textLength: text.length,
      stopVisible: generating,
      barVisible: finishedActionsVisible(node),
      strongThinkingActive: strongThinkingActive(node)
    };
    const classified = classifyTerminal(record.gate, sample);
    record.gate = classified.state;

    const sampleSignature = [
      key,
      hash,
      sample.stopVisible,
      sample.barVisible,
      sample.strongThinkingActive,
      record.gate.barStableCycles,
      classified.proof || ""
    ].join(":");
    if (classified.terminal || sampleSignature !== lastTerminalSampleSignature || now - lastTerminalSampleLogAt >= 30000) {
      lastTerminalSampleSignature = sampleSignature;
      lastTerminalSampleLogAt = now;
      debug("terminal_sample", {
        key,
        hash,
        textLength: text.length,
        stopVisible: sample.stopVisible,
        barVisible: sample.barVisible,
        strongThinkingActive: sample.strongThinkingActive,
        stableMs: classified.stableMs,
        barStableCycles: record.gate.barStableCycles,
        proof: classified.proof,
        scanSource,
        visibility: document.visibilityState,
        externalScanAge: lastExternalScanAt ? now - lastExternalScanAt : null
      });
    }

    if (!classified.terminal) {
      scheduleScan(500);
      return;
    }
    if (record.inFlightHash === hash) return;
    record.inFlightHash = hash;
    const fingerprint = `${conversationId()}::${key}::${hash}`;
    const phaseCompletionMatched = loopCore.endsWithCompletionMarker(text, settings.phaseCompletionMarker);
    debug("assistant_terminal", {
      key,
      hash,
      fingerprint,
      proof: classified.proof,
      textLength: text.length,
      phaseCompletionMatched
    });
    onAssistantComplete({
      fingerprint,
      conversation: conversationId(),
      textLength: text.length,
      proof: classified.proof,
      phaseCompletionMatched
    }).then((outcome) => {
      if (outcome?.accepted) record.processedHash = hash;
      record.inFlightHash = null;
      if (outcome?.retry && enabled) scheduleScan(350);
    }).catch((error) => {
      record.inFlightHash = null;
      if (enabled) reportError(error);
    });
  }

  function isComposerTarget(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest(INPUT_SELECTORS.join(",")));
  }

  function isSendButton(target) {
    if (!(target instanceof Element)) return false;
    const button = target.closest("button");
    if (!button) return false;
    return SEND_BUTTON_SELECTORS.some((selector) => {
      try { return button.matches(selector); } catch (_) { return false; }
    });
  }

  document.addEventListener("submit", (event) => {
    if (!enabled) return;
    const form = event.target;
    if (form instanceof HTMLFormElement && form.querySelector(INPUT_SELECTORS.join(","))) {
      arm("composer-submit", false);
      scheduleScan(50);
    }
  }, true);

  document.addEventListener("click", (event) => {
    if (!enabled || sending) return;
    if (isSendButton(event.target)) {
      arm("send-button", false);
      scheduleScan(50);
    }
  }, true);

  document.addEventListener("keydown", (event) => {
    if (!enabled || sending) return;
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing && isComposerTarget(event.target)) {
      arm("composer-enter", false);
      scheduleScan(50);
    }
  }, true);

  function scheduleLifecycleRescan(reason) {
    if (!enabled || !armed) return;
    debug("lifecycle_rescan", { reason, visibility: document.visibilityState });
    scheduleScan(50);
    setTimeout(() => scheduleScan(100), 600);
    setTimeout(() => scheduleScan(100), 1800);
  }

  document.addEventListener("visibilitychange", () => {
    scheduleLifecycleRescan(`visibility-${document.visibilityState}`);
  });
  document.addEventListener("resume", () => scheduleLifecycleRescan("resume"));
  window.addEventListener("pageshow", () => scheduleLifecycleRescan("pageshow"));

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "translation-loop-v051:scan-now") {
      lastExternalScanAt = Date.now();
      scan(message.source || "background-alarm");
      sendResponse({
        ok: true,
        active: enabled && armed,
        armed,
        sending,
        runToken: contentRunToken,
        visibility: document.visibilityState
      });
      return false;
    }
    if (message?.type === "translation-loop-v051:probe") {
      sendResponse({ ok: true, conversationId: currentConversationIdOrNull() });
      return false;
    }
    if (message?.type === "translation-loop-v051:detect-project-url") {
      const projectUrl = detectCanonicalProjectUrl();
      if (!projectUrl) {
        sendResponse({ ok: false, error: "画面内から正式なプロジェクトURLを確認できない" });
        return false;
      }
      sendResponse({ ok: true, projectUrl });
      return false;
    }
    if (message?.type === "translation-loop-v051:start") {
      const nextRunToken = String(message.runToken || "");
      if (!nextRunToken) {
        sendResponse({ ok: false, error: "run tokenが空" });
        return false;
      }
      settings = { ...DEFAULT_SETTINGS, ...(message.settings || {}) };
      contentRunToken = nextRunToken;
      enabled = true;
      sending = false;
      promptRunner.start();
      const restartAfterRotation = message.waitForSubmittedResponse === true;
      currentPath = location.pathname;
      currentUrl = location.href;
      baseline(restartAfterRotation ? "rotation-resume" : "manual-start");
      const generating = generationIsActive();
      generationWasActive = generating;
      if (restartAfterRotation) {
        arm("rotation-resume-current-or-next-generation", true);
        scheduleScan(50);
        sendResponse({
          ok: true,
          mode: generating ? "waiting-current-generation" : "waiting-next-generation",
          conversationId: currentConversationIdOrNull()
        });
      } else if (generating) {
        arm("manual-start-current-generation", true);
        scheduleScan(50);
        sendResponse({
          ok: true,
          mode: "waiting-current-generation",
          conversationId: currentConversationIdOrNull()
        });
      } else {
        disarm("manual-start-idle");
        sendResponse({
          ok: true,
          mode: "idle-ready",
          conversationId: currentConversationIdOrNull()
        });
      }
      return false;
    }
    if (message?.type === "translation-loop-v051:submit") {
      (async () => {
        const operationToken = String(message.runToken || "");
        if (!enabled || !operationToken || operationToken !== contentRunToken) {
          sendResponse({ ok: false, error: "自動ループが無効または古い送信要求" });
          return;
        }
        sending = true;
        await delay(Number(message.delayMs || 0));
        if (!enabled || contentRunToken !== operationToken) {
          sending = false;
          sendResponse({ ok: false, error: "送信処理は停止された" });
          return;
        }
        const result = await submitPrompt(message.prompt);
        if (!enabled || contentRunToken !== operationToken) {
          sending = false;
          sendResponse({ ok: false, error: "送信処理は停止された" });
          return;
        }
        sending = false;
        if (!result.ok) {
          sendResponse(result);
          return;
        }
        arm(message.reason || "external-submit", false);
        scheduleScan(100);
        sendResponse({
          ok: true,
          conversationId: currentConversationIdOrNull(),
          nonce: message.nonce || null,
          evidence: result.evidence || null
        });
      })().catch((error) => {
        sending = false;
        sendResponse({ ok: false, error: error.message });
      });
      return true;
    }
    if (message?.type === "translation-loop-v051:rotation-submit") {
      (async () => {
        const operationToken = String(message.runToken || "");
        if (!operationToken) {
          sendResponse({ ok: false, error: "run tokenが空" });
          return;
        }
        contentRunToken = operationToken;
        promptRunner.start();
        const result = await submitRotationPrompt(
          message.prompt,
          message.nonce,
          message.expectedProjectUrl
        );
        if (contentRunToken !== operationToken) {
          sendResponse({ ok: false, error: "ローテーション送信は停止された" });
          return;
        }
        sendResponse(result);
      })().catch((error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }
    if (message?.type === "translation-loop-v051:stop") {
      enabled = false;
      sending = false;
      contentRunToken = null;
      promptRunner.stop();
      disarm(message.reason || "stop");
      sendResponse({ ok: true });
      return false;
    }
    return false;
  });

  const observer = new MutationObserver(() => scheduleScan(200));
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["data-testid", "data-state", "aria-busy", "aria-disabled"]
  });

  setInterval(() => {
    if (location.pathname !== currentPath || location.href !== currentUrl) scheduleScan(50);
  }, 750);

  baseline("initial-load");
  scheduleScan(500);
})();

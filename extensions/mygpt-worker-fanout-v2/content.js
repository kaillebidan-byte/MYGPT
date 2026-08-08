(function initMygptFanoutV2Content() {
  "use strict";

  if (globalThis.__mygptFanoutV2Loaded) return;
  globalThis.__mygptFanoutV2Loaded = true;

  const MSG = Object.freeze({
    GET_IDENTITY: "MYGPT_V2_GET_IDENTITY",
    PREPARE: "MYGPT_V2_PREPARE",
    OBSERVED: "MYGPT_V2_OBSERVED"
  });

  const INPUT_SELECTORS = Object.freeze([
    "#prompt-textarea",
    'textarea[data-id="prompt-textarea"]',
    'textarea[data-testid="prompt-textarea"]',
    'textarea[name="prompt-textarea"]',
    'textarea[placeholder*="Send a message"]',
    'textarea[placeholder*="Message"]',
    ".ProseMirror",
    '[contenteditable="true"][role="textbox"]',
    '[contenteditable="true"][data-virtualkeyboard="true"]'
  ]);

  const STOP_BUTTON_SELECTORS = Object.freeze([
    'button[data-testid="stop-button"]',
    'button[data-testid="composer-stop-button"]',
    'form button[aria-label*="stop" i]:not([aria-label*="dictat" i]):not([aria-label*="voice" i]):not([aria-label*="read" i])',
    'form button[aria-label*="生成を停止"]'
  ]);

  function isVisible(node) {
    if (!(node instanceof HTMLElement)) return false;
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function firstVisible(selectors) {
    for (const selector of selectors) {
      let nodes = [];
      try {
        nodes = document.querySelectorAll(selector);
      } catch (_) {
        continue;
      }
      for (const node of nodes) {
        if (isVisible(node)) return node;
      }
    }
    return null;
  }

  function generationIsActive() {
    return Boolean(firstVisible(STOP_BUTTON_SELECTORS));
  }

  function buildIdentityReport() {
    return {
      identity: MYGPTWorkerRoute.normalizeCustomGptIdentity(location.href),
      title: document.title || "",
      generationActive: generationIsActive(),
      href: location.href,
      observedAt: Date.now()
    };
  }

  const promptRunner = globalThis.MYGPTPromptStackerInsert?.createRunner({
    document,
    window,
    adapter: { editor: INPUT_SELECTORS },
    acceptNode: isVisible
  });

  if (!promptRunner) {
    throw new Error("Translation Loop prompt runner unavailable");
  }

  async function preflightComposer() {
    promptRunner.start();
    const editor = await promptRunner.waitForStableEditor({
      timeout: 10000,
      interval: 100,
      stableMs: 400
    });
    if (!editor) {
      promptRunner.stop();
      return { ok: false, reason: "COMPOSER_NOT_FOUND" };
    }
    const draft = promptRunner.editorText(editor);
    if (draft) {
      promptRunner.stop();
      return { ok: false, reason: "COMPOSER_NOT_EMPTY", observedChars: draft.length };
    }
    promptRunner.stop();
    return { ok: true };
  }

  async function prepare(message) {
    const identity = MYGPTWorkerRoute.normalizeCustomGptIdentity(location.href);
    if (!identity.ok) {
      return { ok: false, reason: identity.reason, identity, submitted: false };
    }
    if (
      !message ||
      typeof message.expectedWorkerKey !== "string" ||
      identity.workerKey !== message.expectedWorkerKey
    ) {
      return { ok: false, reason: "WORKER_IDENTITY_MISMATCH", identity, submitted: false };
    }
    if (typeof message.runToken !== "string" || !message.runToken) {
      return { ok: false, reason: "RUN_TOKEN_MISSING", identity, submitted: false };
    }

    const preflight = await preflightComposer();
    if (!preflight.ok) {
      return { ...preflight, identity, runToken: message.runToken, submitted: false };
    }

    const attachment = await MYGPTFileAdapter.attachFile(message.file, {
      document,
      verifyTimeout: 10000,
      verifyInterval: 150
    });
    if (!attachment.ok) {
      return {
        ok: false,
        reason: attachment.reason || "FILE_ATTACHMENT_FAILED",
        detail: attachment,
        identity,
        runToken: message.runToken,
        submitted: false
      };
    }

    promptRunner.start();
    let inserted;
    try {
      inserted = await promptRunner.insertOnly(message.packet, {
        editorTimeout: 10000,
        editorInterval: 100,
        editorStableMs: 500,
        reflectTimeout: 4000,
        reflectInterval: 100
      });
    } finally {
      promptRunner.stop();
    }
    if (!inserted || inserted.ok !== true) {
      return {
        ...(inserted || {}),
        ok: false,
        reason: inserted?.reason || "PACKET_INSERT_FAILED",
        attachment,
        identity,
        runToken: message.runToken,
        submitted: false
      };
    }

    return {
      ok: true,
      identity,
      runToken: message.runToken,
      attachment,
      composerKind: inserted.composerKind,
      insertionMethod: inserted.method,
      exactMatch: inserted.exactMatch === true,
      packetChars: inserted.observedChars,
      editorRemounted: inserted.editorRemounted === true,
      submitted: false,
      generationActive: generationIsActive(),
      observedAt: Date.now()
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message.type !== "string") return false;

    if (message.type === MSG.GET_IDENTITY) {
      sendResponse(buildIdentityReport());
      return false;
    }

    if (message.type === MSG.PREPARE) {
      prepare(message).then(sendResponse).catch((error) => {
        sendResponse({
          ok: false,
          reason: "PREPARE_EXCEPTION",
          detail: error instanceof Error ? error.message : String(error),
          submitted: false
        });
      });
      return true;
    }

    return false;
  });

  let lastHref = location.href;
  let lastGeneration = generationIsActive();
  const reportObservedState = (reason) => {
    chrome.runtime.sendMessage({
      type: MSG.OBSERVED,
      reason,
      report: buildIdentityReport()
    }).catch(() => {});
  };

  const observer = new MutationObserver(() => {
    const hrefChanged = location.href !== lastHref;
    const generation = generationIsActive();
    const generationChanged = generation !== lastGeneration;
    if (!hrefChanged && !generationChanged) return;
    lastHref = location.href;
    lastGeneration = generation;
    reportObservedState(hrefChanged ? "route" : "generation");
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  addEventListener("popstate", () => reportObservedState("popstate"));
  addEventListener("hashchange", () => reportObservedState("hashchange"));
})();

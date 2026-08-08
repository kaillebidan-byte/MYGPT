(() => {
  "use strict";

  if (globalThis.__mygptV3ContentLoaded) return;
  globalThis.__mygptV3ContentLoaded = true;

  const MSG = Object.freeze({
    GET_IDENTITY: "MYGPT_V3_GET_IDENTITY",
    PREPARE_SLOT: "MYGPT_V3_PREPARE_SLOT",
    OBSERVED: "MYGPT_V3_OBSERVED"
  });

  const PAGE_OBS_EVENT = "MYGPT_V3_PAGE_OBSERVED";

  const STOP_SELECTORS = [
    'button[data-testid="stop-button"]',
    'button[data-testid="composer-stop-button"]',
    'button[aria-label*="Stop generating"]',
    'button[aria-label*="生成を停止"]'
  ];

  function generationIsActive() {
    return STOP_SELECTORS.some((selector) => document.querySelector(selector));
  }

  function buildReport() {
    return {
      identity: MYGPTWorkerRoute.normalizeCustomGptIdentity(location.href),
      generationActive: generationIsActive(),
      title: document.title || "",
      href: location.href,
      observedAt: Date.now()
    };
  }

  async function prepareSlot(message) {
    const identity = MYGPTWorkerRoute.normalizeCustomGptIdentity(location.href);
    if (!identity.ok) return { ok: false, reason: identity.reason, identity, submitted: false };
    if (identity.workerKey !== message?.expectedWorkerKey) {
      return { ok: false, reason: "WORKER_IDENTITY_MISMATCH", identity, submitted: false };
    }
    if (typeof message?.runToken !== "string" || !message.runToken) {
      return { ok: false, reason: "RUN_TOKEN_MISSING", identity, submitted: false };
    }
    if (generationIsActive()) {
      return { ok: false, reason: "GENERATION_ALREADY_ACTIVE", identity, submitted: false };
    }

    const composerReady = await MYGPTChatGPTAdapter.waitForComposer(document, 15000);
    if (!composerReady) {
      return { ok: false, reason: "COMPOSER_NOT_FOUND", identity, submitted: false };
    }

    const existingDraft = MYGPTChatGPTAdapter.composerDraftText(document);
    if (existingDraft) {
      return {
        ok: false,
        reason: "COMPOSER_NOT_EMPTY",
        observedChars: existingDraft.length,
        identity,
        submitted: false
      };
    }

    const attachment = await MYGPTChatGPTAdapter.attachFile(message.file, {
      document,
      composerTimeout: 15000,
      uploadTimeout: 90000,
      uploadInterval: 2000
    });
    if (!attachment.ok) {
      return { ...attachment, identity, runToken: message.runToken, submitted: false };
    }

    // Attachment can remount the composer. Reacquire it before paste.
    const afterUploadComposer = await MYGPTChatGPTAdapter.waitForComposer(document, 15000);
    if (!afterUploadComposer) {
      return {
        ok: false,
        reason: "COMPOSER_MISSING_AFTER_UPLOAD",
        attachment,
        identity,
        runToken: message.runToken,
        submitted: false
      };
    }

    const pasted = await MYGPTChatGPTAdapter.pastePrompt(message.packet, {
      document,
      window,
      editorTimeout: 15000,
      reflectTimeout: 5000
    });
    if (!pasted.ok) {
      return {
        ...pasted,
        attachment,
        identity,
        runToken: message.runToken,
        submitted: false
      };
    }

    return {
      ok: true,
      slotId: message.slotId || null,
      identity,
      runToken: message.runToken,
      attachment,
      composerKind: pasted.composerKind,
      insertionMethod: pasted.method,
      pasteEvidence: pasted.evidence,
      packetChars: pasted.observedChars,
      submitted: false,
      generationActive: generationIsActive(),
      observedAt: Date.now()
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message.type !== "string") return false;
    if (message.type === MSG.GET_IDENTITY) {
      sendResponse(buildReport());
      return false;
    }
    if (message.type === MSG.PREPARE_SLOT) {
      prepareSlot(message).then(sendResponse).catch((error) => {
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

  function reportObserved(reason) {
    chrome.runtime.sendMessage({
      type: MSG.OBSERVED,
      reason,
      report: buildReport()
    }).catch(() => {});
  }

  window.addEventListener(PAGE_OBS_EVENT, (event) => {
    chrome.runtime.sendMessage({
      type: MSG.OBSERVED,
      reason: "page-observer",
      report: {
        ...buildReport(),
        pageEvent: event?.detail || null
      }
    }).catch(() => {});
  });

  let lastHref = location.href;
  let lastGeneration = generationIsActive();
  const observer = new MutationObserver(() => {
    const hrefChanged = location.href !== lastHref;
    const generating = generationIsActive();
    const generationChanged = generating !== lastGeneration;
    if (!hrefChanged && !generationChanged) return;
    lastHref = location.href;
    lastGeneration = generating;
    reportObserved(hrefChanged ? "route" : "generation");
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  addEventListener("popstate", () => reportObserved("popstate"));
  addEventListener("hashchange", () => reportObserved("hashchange"));
})();

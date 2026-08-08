(function initMygptWorkerFanoutContent() {
  "use strict";

  const MSG = Object.freeze({
    ROUTE_REPORT: "MYGPT_GATE0_ROUTE_REPORT",
    GET_IDENTITY: "MYGPT_GATE0_GET_IDENTITY",
    FORCE_REPORT: "MYGPT_GATE0_FORCE_REPORT",
    INSERT_PACKET: "MYGPT_GATE1_INSERT_PACKET"
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

  let lastReportedHref = null;
  let reportScheduled = false;

  function isVisible(node) {
    if (!(node instanceof HTMLElement)) return false;
    const style = getComputedStyle(node);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      Number(style.opacity) === 0
    ) {
      return false;
    }
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  const promptRunner = globalThis.MYGPTPromptStackerInsert?.createRunner({
    document,
    window,
    adapter: {
      editor: INPUT_SELECTORS
    },
    acceptNode: isVisible
  });

  if (!promptRunner) {
    throw new Error("Translation Loop insert-only runner unavailable");
  }

  function buildReport() {
    return {
      identity: MYGPTWorkerRoute.normalizeCustomGptIdentity(location.href),
      pageTitle: document.title || "",
      observedAt: Date.now()
    };
  }

  function reportRoute(reason) {
    const href = location.href;
    if (href === lastReportedHref && reason !== "forced") {
      return;
    }
    lastReportedHref = href;

    chrome.runtime.sendMessage({
      type: MSG.ROUTE_REPORT,
      reason,
      report: buildReport()
    }).catch(() => {
      // The extension may be reloaded while this tab is still alive.
    });
  }

  function scheduleRouteCheck(reason) {
    if (reportScheduled) {
      return;
    }
    reportScheduled = true;
    queueMicrotask(() => {
      reportScheduled = false;
      if (location.href !== lastReportedHref) {
        reportRoute(reason);
      }
    });
  }

  async function insertGate1Packet(message) {
    const identity = MYGPTWorkerRoute.normalizeCustomGptIdentity(location.href);
    if (!identity.ok) {
      return { ok: false, reason: identity.reason, identity, submitted: false };
    }

    if (
      typeof message.expectedWorkerKey !== "string" ||
      identity.workerKey !== message.expectedWorkerKey
    ) {
      return {
        ok: false,
        reason: "WORKER_IDENTITY_MISMATCH",
        identity,
        expectedWorkerKey: message.expectedWorkerKey || null,
        submitted: false
      };
    }

    if (typeof message.runToken !== "string" || !message.runToken) {
      return { ok: false, reason: "RUN_TOKEN_MISSING", identity, submitted: false };
    }

    promptRunner.start();
    try {
      const result = await promptRunner.insertOnly(message.packet, {
        editorTimeout: 10000,
        editorInterval: 150,
        reflectTimeout: 3000,
        reflectInterval: 100
      });
      return {
        ...result,
        identity,
        runToken: message.runToken,
        submitted: false,
        observedAt: Date.now()
      };
    } catch (error) {
      return {
        ok: false,
        reason: "PACKET_INSERT_EXCEPTION",
        detail: error instanceof Error ? error.message : String(error),
        identity,
        runToken: message.runToken,
        submitted: false,
        observedAt: Date.now()
      };
    } finally {
      promptRunner.stop();
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message.type !== "string") {
      return false;
    }

    if (message.type === MSG.GET_IDENTITY) {
      sendResponse(buildReport());
      return false;
    }

    if (message.type === MSG.FORCE_REPORT) {
      reportRoute("forced");
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === MSG.INSERT_PACKET) {
      insertGate1Packet(message).then(sendResponse).catch((error) => {
        sendResponse({
          ok: false,
          reason: "PACKET_INSERT_EXCEPTION",
          detail: error instanceof Error ? error.message : String(error),
          submitted: false
        });
      });
      return true;
    }

    return false;
  });

  const observer = new MutationObserver(() => scheduleRouteCheck("mutation"));
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  addEventListener("popstate", () => scheduleRouteCheck("popstate"));
  addEventListener("hashchange", () => scheduleRouteCheck("hashchange"));
  addEventListener("pageshow", () => scheduleRouteCheck("pageshow"));

  reportRoute("content-load");
})();

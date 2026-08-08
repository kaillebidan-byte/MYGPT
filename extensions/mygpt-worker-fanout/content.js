(function initMygptWorkerFanoutContent() {
  "use strict";

  const MSG = Object.freeze({
    ROUTE_REPORT: "MYGPT_GATE0_ROUTE_REPORT",
    GET_IDENTITY: "MYGPT_GATE0_GET_IDENTITY",
    FORCE_REPORT: "MYGPT_GATE0_FORCE_REPORT",
    INSERT_PACKET: "MYGPT_GATE1_INSERT_PACKET"
  });

  let lastReportedHref = null;
  let reportScheduled = false;

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

  function insertGate1Packet(message) {
    const identity = MYGPTWorkerRoute.normalizeCustomGptIdentity(location.href);
    if (!identity.ok) {
      return { ok: false, reason: identity.reason, identity };
    }

    if (
      typeof message.expectedWorkerKey !== "string" ||
      identity.workerKey !== message.expectedWorkerKey
    ) {
      return {
        ok: false,
        reason: "WORKER_IDENTITY_MISMATCH",
        identity,
        expectedWorkerKey: message.expectedWorkerKey || null
      };
    }

    if (typeof message.runToken !== "string" || !message.runToken) {
      return { ok: false, reason: "RUN_TOKEN_MISSING", identity };
    }

    const composer = MYGPTComposer.findComposer(document);
    if (!composer) {
      return { ok: false, reason: "COMPOSER_NOT_FOUND", identity };
    }

    const result = MYGPTComposer.insertPacket(composer, message.packet);
    return {
      ...result,
      identity,
      runToken: message.runToken,
      submitted: false,
      observedAt: Date.now()
    };
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
      try {
        sendResponse(insertGate1Packet(message));
      } catch (error) {
        sendResponse({
          ok: false,
          reason: "PACKET_INSERT_EXCEPTION",
          detail: error instanceof Error ? error.message : String(error),
          submitted: false
        });
      }
      return false;
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

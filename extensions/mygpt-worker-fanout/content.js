(function initMygptWorkerFanoutContent() {
  "use strict";

  const MSG = Object.freeze({
    ROUTE_REPORT: "MYGPT_GATE0_ROUTE_REPORT",
    GET_IDENTITY: "MYGPT_GATE0_GET_IDENTITY",
    FORCE_REPORT: "MYGPT_GATE0_FORCE_REPORT"
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

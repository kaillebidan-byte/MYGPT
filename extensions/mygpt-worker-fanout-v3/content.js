(() => {
  "use strict";

  if (globalThis.__mygptV3ContentLoaded) return;
  globalThis.__mygptV3ContentLoaded = true;

  const MSG = Object.freeze({
    GET_IDENTITY: "MYGPT_V3_GET_IDENTITY",
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

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message.type !== "string") return false;
    if (message.type === MSG.GET_IDENTITY) {
      sendResponse(buildReport());
      return false;
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

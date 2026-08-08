(function initMygptWorkerRoute(root) {
  "use strict";

  const ALLOWED_HOSTS = new Set(["chatgpt.com", "chat.openai.com"]);
  const CUSTOM_GPT_PREFIX = "g-";
  const PROJECT_PREFIX = "g-p-";

  function invalid(reason, href) {
    return {
      ok: false,
      reason,
      href: typeof href === "string" ? href : String(href || "")
    };
  }

  function normalizeCustomGptIdentity(href) {
    let url;
    try {
      url = new URL(href);
    } catch (_error) {
      return invalid("INVALID_URL", href);
    }

    if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
      return invalid("UNSUPPORTED_ORIGIN", href);
    }

    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length < 2 || segments[0] !== "g") {
      return invalid("NOT_CUSTOM_GPT_ROUTE", href);
    }

    const workerSegment = segments[1];
    if (!workerSegment.startsWith(CUSTOM_GPT_PREFIX)) {
      return invalid("NOT_CUSTOM_GPT_ROUTE", href);
    }
    if (workerSegment.startsWith(PROJECT_PREFIX)) {
      return invalid("PROJECT_ROUTE_REJECTED", href);
    }

    const workerPath = `/g/${workerSegment}`;
    const workerUrl = `${url.origin}${workerPath}`;

    return {
      ok: true,
      workerKey: workerSegment,
      workerSegment,
      workerPath,
      workerUrl,
      origin: url.origin,
      observedPath: url.pathname,
      observedUrl: `${url.origin}${url.pathname}`
    };
  }

  function sameWorkerIdentity(left, right) {
    return Boolean(
      left &&
        right &&
        left.ok === true &&
        right.ok === true &&
        left.workerKey === right.workerKey
    );
  }

  const api = Object.freeze({
    normalizeCustomGptIdentity,
    sameWorkerIdentity
  });

  root.MYGPTWorkerRoute = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : self);

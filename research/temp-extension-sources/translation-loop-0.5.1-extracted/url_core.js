"use strict";

(function installUrlCore(globalScope) {
  function parseChatGptUrl(url) {
    try {
      const parsed = new URL(url || "");
      if (parsed.hostname !== "chatgpt.com" && parsed.hostname !== "chat.openai.com") return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function isChatGptUrl(url) {
    return Boolean(parseChatGptUrl(url));
  }

  function projectRouteSegmentFromUrl(url) {
    const parsed = parseChatGptUrl(url);
    if (!parsed) return null;
    const match = parsed.pathname.match(/^\/g\/(g-p-[^/]+)/);
    return match ? match[1] : null;
  }

  function projectIdentityFromUrl(url) {
    const segment = projectRouteSegmentFromUrl(url);
    if (!segment) return null;
    const stable = segment.match(/^(g-p-[0-9a-f]{32})(?:-|$)/i);
    return stable ? stable[1].toLowerCase() : segment;
  }

  function conversationIdFromUrl(url) {
    const parsed = parseChatGptUrl(url);
    if (!parsed) return null;
    const match = parsed.pathname.match(/\/c\/([^/?#]+)/);
    return match ? match[1] : null;
  }

  function normalizeProjectUrl(url) {
    const parsed = parseChatGptUrl(url);
    if (!parsed) throw new Error("ChatGPTのプロジェクトURLではない");
    const routeSegment = projectRouteSegmentFromUrl(parsed.href);
    if (!routeSegment) throw new Error("URLからプロジェクト識別子を確認できない");
    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = `/g/${routeSegment}/project`;
    return parsed.href;
  }

  function hasProjectSlug(url) {
    const routeSegment = projectRouteSegmentFromUrl(url);
    const stableId = projectIdentityFromUrl(url);
    return Boolean(routeSegment && stableId && routeSegment !== stableId);
  }

  function validateProjectMembership(currentUrl, projectUrl) {
    const currentId = projectIdentityFromUrl(currentUrl);
    const expectedId = projectIdentityFromUrl(projectUrl);
    return Boolean(currentId && expectedId && currentId === expectedId);
  }

  const api = {
    parseChatGptUrl,
    isChatGptUrl,
    projectRouteSegmentFromUrl,
    projectIdentityFromUrl,
    conversationIdFromUrl,
    normalizeProjectUrl,
    hasProjectSlug,
    validateProjectMembership
  };
  globalScope.TranslationLoopUrlCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

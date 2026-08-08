"use strict";

(function installLoopCore(globalScope) {
  function normalizeText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function evaluateSubmissionEvidence(prompt, before = {}, after = {}, options = {}) {
    const normalizedPrompt = normalizeText(prompt);
    const latestUserText = normalizeText(after.latestUserText);
    const latestUserMatched = Boolean(normalizedPrompt && latestUserText.includes(normalizedPrompt));
    const userCountIncreased = Number(after.userCount || 0) > Number(before.userCount || 0);
    const latestUserChanged = Boolean(
      latestUserMatched &&
      after.latestUserKey &&
      (
        String(after.latestUserKey) !== String(before.latestUserKey || "") ||
        String(after.latestUserHash || "") !== String(before.latestUserHash || "")
      )
    );
    const generationStarted = before.generationActive !== true && after.generationActive === true;
    const conversationCreated = !before.conversationId && Boolean(after.conversationId);
    const urlChangedToConversation = Boolean(
      options.rotation === true &&
      after.conversationId &&
      String(after.url || "") !== String(before.url || "")
    );

    const evidence = {
      userCountIncreased,
      latestUserChanged,
      latestUserMatched,
      generationStarted,
      conversationCreated,
      urlChangedToConversation,
      composerCleared: after.composerCleared === true,
      userCount: Number(after.userCount || 0),
      latestUserKey: after.latestUserKey || null,
      conversationId: after.conversationId || null,
      currentUrl: after.url || ""
    };

    evidence.committed = Boolean(
      userCountIncreased ||
      latestUserChanged ||
      generationStarted ||
      (options.rotation === true && (conversationCreated || urlChangedToConversation))
    );
    return evidence;
  }

  function endsWithCompletionMarker(text, marker) {
    const normalizedMarker = normalizeText(marker);
    if (!normalizedMarker) return false;
    return normalizeText(text).endsWith(normalizedMarker);
  }

  function evaluateChatLimit(chatGeneration, maxChatCycles) {
    const generation = Number.isFinite(Number(chatGeneration))
      ? Math.max(0, Math.floor(Number(chatGeneration)))
      : 0;
    const limit = Number.isFinite(Number(maxChatCycles))
      ? Math.max(1, Math.floor(Number(maxChatCycles)))
      : 1;
    const currentChatNumber = generation + 1;
    return {
      currentChatNumber,
      maxChatCycles: limit,
      reached: currentChatNumber >= limit
    };
  }

  const api = {
    normalizeText,
    evaluateSubmissionEvidence,
    endsWithCompletionMarker,
    evaluateChatLimit
  };
  globalScope.TranslationLoopCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

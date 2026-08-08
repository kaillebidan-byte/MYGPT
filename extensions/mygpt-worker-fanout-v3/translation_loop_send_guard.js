"use strict";

/*
 * MAIN-world send-control readiness guard adapted directly from the
 * Translation Loop 0.5.1 Prompt Stacker runner, itself adapted from
 * thegreatLUCY/prompt-stacker content.js commit
 * 5a01391c124ecc1d8f4cc8c4538883cec6bde1c3.
 *
 * Only selector scoping + enabled-state detection are retained here.
 * No click, Enter, submit, or requestSubmit path exists in this module.
 * See LICENSE-PROMPT-STACKER.
 */
(function installTranslationLoopSendGuard(globalScope) {
  const SEND_SELECTORS = Object.freeze([
    '#composer-submit-button',
    'button[data-testid="send-button"]',
    'button[data-testid*="composer-send"]',
    'button[aria-label*="Send" i]',
    'button[aria-label*="送信" i]',
    'button[type="submit"]'
  ]);

  const GLOBAL_SEND_SELECTORS = Object.freeze([
    '#composer-submit-button',
    'button[data-testid="send-button"]',
    'button[data-testid*="composer-send"]',
    'button[type="submit"][data-testid*="send"]'
  ]);

  function enabledCandidate(selectors, root, acceptNode = () => true) {
    if (!root?.querySelectorAll) return null;
    for (const selector of selectors) {
      let nodes = [];
      try {
        nodes = root.querySelectorAll(selector);
      } catch (_) {
        continue;
      }
      for (const candidate of nodes) {
        if (!acceptNode(candidate)) continue;
        const disabled = candidate.disabled ||
          candidate.getAttribute?.("aria-disabled") === "true" ||
          candidate.getAttribute?.("data-disabled") === "true";
        if (!disabled) return candidate;
      }
    }
    return null;
  }

  function getEnabledSendButton(editor = null, doc = document) {
    const roots = [];
    const addRoot = (node) => {
      if (node && node !== doc?.body && node !== doc?.documentElement && !roots.includes(node)) {
        roots.push(node);
      }
    };

    addRoot(editor?.closest?.("form"));
    addRoot(editor?.closest?.('[data-testid*="composer"]'));
    addRoot(editor?.closest?.('[class*="composer"]'));
    let parent = editor?.parentElement || null;
    for (let depth = 0; parent && depth < 2; depth += 1) {
      addRoot(parent);
      parent = parent.parentElement;
    }

    for (const root of roots) {
      const candidate = enabledCandidate(SEND_SELECTORS, root);
      if (candidate) return candidate;
    }

    return enabledCandidate(GLOBAL_SEND_SELECTORS, doc);
  }

  const api = Object.freeze({
    SEND_SELECTORS,
    GLOBAL_SEND_SELECTORS,
    enabledCandidate,
    getEnabledSendButton
  });

  globalScope.MYGPTTranslationLoopSendGuard = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

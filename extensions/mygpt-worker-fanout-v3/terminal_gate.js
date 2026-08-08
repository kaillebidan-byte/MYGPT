"use strict";

(function installTerminalGate(globalScope) {
  function createGateState(now) {
    return {
      lastKey: "",
      lastChangeAt: now,
      barStableCycles: 0,
      seen: false,
      fallbackStableSince: now
    };
  }

  function classifyTerminal(previous, sample, config = {}) {
    const changed = !previous.seen || sample.contentKey !== previous.lastKey;
    const lastChangeAt = changed ? sample.now : previous.lastChangeAt;
    const barStableCycles = sample.barVisible && !sample.stopVisible && !sample.strongThinkingActive && !changed
      ? previous.barStableCycles + 1
      : 0;
    const state = {
      ...previous,
      lastKey: sample.contentKey,
      lastChangeAt,
      barStableCycles,
      seen: true
    };
    const stableMs = sample.now - lastChangeAt;
    const oracleTerminal = sample.textLength > 0 &&
      !sample.stopVisible &&
      sample.barVisible &&
      !sample.strongThinkingActive &&
      barStableCycles >= Number(config.barConfirmCycles || 3) &&
      stableMs >= Number(config.terminalMinStableMs || 1500);

    let fallbackTerminal = false;
    if (config.fallbackEnabled && !sample.stopVisible && !sample.strongThinkingActive && sample.textLength > 0) {
      const generationEndedAt = Number(config.generationEndedAt || 0);
      const postGenerationMs = generationEndedAt ? sample.now - generationEndedAt : 0;
      fallbackTerminal = generationEndedAt > 0 &&
        postGenerationMs >= Number(config.fallbackPostGenerationMs || 6000) &&
        stableMs >= Number(config.fallbackStableMs || 3000);
    }

    return {
      state,
      terminal: oracleTerminal || fallbackTerminal,
      proof: oracleTerminal ? "oracle-action-bar" : fallbackTerminal ? "voicebridge-fallback" : null,
      stableMs
    };
  }

  const api = { createGateState, classifyTerminal };
  globalScope.TranslationLoopTerminalGate = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

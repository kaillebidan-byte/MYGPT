"use strict";

(() => {
  const strategies = Object.freeze({
    "fresh-chat": Object.freeze({
      id: "fresh-chat",
      label: "Fresh Chat (proven)",
      supported: true,
      runMessage: "MYGPT_V4_RUN_THREE",
      description: "Open a fresh isolated Custom GPT conversation for each F2/F3/F4 worker."
    }),
    "branch-thinking": Object.freeze({
      id: "branch-thinking",
      label: "Branch → Thinking (future)",
      supported: false,
      runMessage: null,
      description: "Reserved for Instant preparation → branch → Thinking generation. Not implemented yet."
    })
  });

  function get(id) {
    return strategies[id] || null;
  }

  function current() {
    return strategies["fresh-chat"];
  }

  function list() {
    return Object.values(strategies);
  }

  globalThis.MYGPTSessionStrategyRegistry = Object.freeze({ get, current, list });
})();

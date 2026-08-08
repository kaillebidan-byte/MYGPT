"use strict";

(function installRuntimeGuard(globalScope) {
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createRuntimeGuard(options) {
    const readRuntime = options.readRuntime;
    const saveRuntime = options.saveRuntime;
    const tokenFactory = options.tokenFactory || (() => crypto.randomUUID());
    let mutationChain = Promise.resolve();

    function enqueue(task) {
      const execution = mutationChain.then(task, task);
      mutationChain = execution.catch(() => {});
      return execution;
    }

    function mutate(mutator) {
      return enqueue(async () => {
        const current = await readRuntime();
        const decision = await mutator(clone(current));
        if (!decision || !decision.next) {
          return {
            committed: false,
            runtime: current,
            value: decision?.value,
            reason: decision?.reason || "no-change"
          };
        }
        const runtime = await saveRuntime(decision.next);
        return { committed: true, runtime, value: decision.value, reason: decision.reason || null };
      });
    }

    function mutateIfToken(token, mutator) {
      return mutate(async (current) => {
        if (!token || current.runToken !== token) {
          return { value: null, reason: "stale-run-token" };
        }
        return mutator(current);
      });
    }

    function isCurrent(token) {
      return enqueue(async () => {
        const runtime = await readRuntime();
        return Boolean(token && runtime.runToken === token && runtime.enabled);
      });
    }

    return {
      newToken: tokenFactory,
      mutate,
      mutateIfToken,
      isCurrent,
      enqueue
    };
  }

  const api = { createRuntimeGuard };
  globalScope.TranslationLoopRuntimeGuard = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

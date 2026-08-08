"use strict";

const assert = require("node:assert/strict");
const { createRuntimeGuard } = require("./runtime_guard.js");

(async () => {
  let runtime = { enabled: false, phase: "IDLE", runToken: null, value: 0 };
  let tokenCounter = 0;
  const guard = createRuntimeGuard({
    readRuntime: async () => ({ ...runtime }),
    saveRuntime: async (next) => {
      await new Promise((resolve) => setTimeout(resolve, 2));
      runtime = { ...next };
      return { ...runtime };
    },
    tokenFactory: () => `run-${++tokenCounter}`
  });

  const token = guard.newToken();
  const claimed = await guard.mutate(async (current) => ({
    next: { ...current, enabled: true, phase: "STARTING", runToken: token }
  }));
  assert.equal(claimed.committed, true);
  assert.equal(runtime.runToken, token);

  const paused = await guard.mutate(async (current) => ({
    next: { ...current, enabled: false, phase: "PAUSED", runToken: null }
  }));
  assert.equal(paused.committed, true);

  const stale = await guard.mutateIfToken(token, async (current) => ({
    next: { ...current, enabled: true, phase: "WAITING_RESPONSE", value: 99 }
  }));
  assert.equal(stale.committed, false, "an operation from before Pause must not write state");
  assert.equal(runtime.phase, "PAUSED");
  assert.equal(runtime.value, 0);

  runtime = { enabled: false, phase: "IDLE", runToken: null, value: 0 };
  const startAttempt = async (tokenValue) => guard.mutate(async (current) => {
    if (current.enabled || current.phase === "STARTING") {
      return { value: { accepted: false }, reason: "already-running" };
    }
    return {
      next: { ...current, enabled: true, phase: "STARTING", runToken: tokenValue },
      value: { accepted: true }
    };
  });
  const [first, second] = await Promise.all([startAttempt("a"), startAttempt("b")]);
  assert.equal([first, second].filter((result) => result.committed).length, 1, "double Start must claim one run only");
  assert.equal(runtime.phase, "STARTING");

  console.log("runtime guard tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

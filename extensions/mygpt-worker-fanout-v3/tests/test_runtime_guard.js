"use strict";

const assert = require("node:assert/strict");
const { createRuntimeGuard } = require("../runtime_guard.js");

(async () => {
  let runtime = { enabled: false, runToken: null, phase: "IDLE" };
  const guard = createRuntimeGuard({
    readRuntime: async () => runtime,
    saveRuntime: async (next) => {
      runtime = JSON.parse(JSON.stringify(next));
      return runtime;
    },
    tokenFactory: () => "token-1"
  });

  const start = await guard.mutate((current) => ({
    next: { ...current, enabled: true, runToken: guard.newToken(), phase: "RUNNING" }
  }));
  assert.equal(start.committed, true);
  assert.equal(runtime.runToken, "token-1");

  const stale = await guard.mutateIfToken("old-token", (current) => ({
    next: { ...current, phase: "WRONG" }
  }));
  assert.equal(stale.committed, false);
  assert.equal(runtime.phase, "RUNNING");

  const current = await guard.mutateIfToken("token-1", (state) => ({
    next: { ...state, phase: "READY", enabled: false, runToken: null }
  }));
  assert.equal(current.committed, true);
  assert.equal(runtime.phase, "READY");
  assert.equal(runtime.enabled, false);

  console.log("Translation Loop runtime_guard reuse tests: PASS");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

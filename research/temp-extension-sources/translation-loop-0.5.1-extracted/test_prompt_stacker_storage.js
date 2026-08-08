"use strict";

const assert = require("node:assert/strict");
const { createStore } = require("./prompt_stacker_storage.js");

function makeArea(initial = {}, failSet = false) {
  const data = structuredClone(initial);
  return {
    data,
    async get(query) {
      if (typeof query === "string") return { [query]: data[query] };
      if (Array.isArray(query)) {
        return Object.fromEntries(query.map((key) => [key, data[key]]));
      }
      const result = { ...query };
      for (const key of Object.keys(query || {})) {
        if (Object.prototype.hasOwnProperty.call(data, key)) result[key] = structuredClone(data[key]);
      }
      return result;
    },
    async set(values) {
      if (failSet) throw new Error("quota");
      Object.assign(data, structuredClone(values));
    }
  };
}

(async () => {
  const local = makeArea({
    settings: { continuePrompt: "local", maxCompletedTurns: 3 },
    runtime: { enabled: true },
    logs: [{ event: "existing" }]
  });
  const sync = makeArea({ settings: { continuePrompt: "sync" } });
  const chrome = { storage: { local, sync } };
  const store = createStore({
    chrome,
    settingsKey: "settings",
    runtimeKey: "runtime",
    logsKey: "logs",
    defaultSettings: { continuePrompt: "default", maxCompletedTurns: 10 },
    defaultRuntime: { enabled: false, phase: "IDLE" }
  });

  const state = await store.readState();
  assert.equal(state.settings.continuePrompt, "local", "legacy local settings must beat stale unversioned sync");
  assert.equal(state.settings.maxCompletedTurns, 3, "local-only fields must be preserved");
  assert.equal(state.runtime.enabled, true);
  assert.equal(state.runtime.phase, "IDLE");

  await store.saveSettings({ continuePrompt: "saved", maxCompletedTurns: 7 });
  assert.equal(local.data.settings.continuePrompt, "saved");
  assert.equal(sync.data.settings.continuePrompt, "saved");

  await store.saveRuntime({ enabled: false, phase: "PAUSED" });
  assert.equal(local.data.runtime.phase, "PAUSED");
  assert.equal(sync.data.runtime, undefined, "runtime must not roam across browsers");

  assert.equal((await store.readLogs()).length, 1);
  await store.clearLogs();
  assert.deepEqual(await store.readLogs(), []);

  const newerLocal = makeArea({
    settings: { continuePrompt: "new-local", __promptStackerUpdatedAt: 200 }
  });
  const staleSync = makeArea({
    settings: { continuePrompt: "stale-sync", __promptStackerUpdatedAt: 100 }
  });
  const revisionStore = createStore({
    chrome: { storage: { local: newerLocal, sync: staleSync } },
    settingsKey: "settings",
    runtimeKey: "runtime",
    logsKey: "logs",
    defaultSettings: { continuePrompt: "default" },
    defaultRuntime: {}
  });
  assert.equal((await revisionStore.readSettings()).continuePrompt, "new-local", "stale sync must not replace a newer local save");


  const noLocal = makeArea();
  const syncedOnly = makeArea({ settings: { continuePrompt: "restored-sync" } });
  const freshStore = createStore({
    chrome: { storage: { local: noLocal, sync: syncedOnly } },
    settingsKey: "settings",
    runtimeKey: "runtime",
    logsKey: "logs",
    defaultSettings: { continuePrompt: "default" },
    defaultRuntime: {}
  });
  assert.equal((await freshStore.readSettings()).continuePrompt, "restored-sync",
    "sync should restore settings when no local record exists");

  const localFallback = makeArea();
  const failingSync = makeArea({}, true);
  const fallbackStore = createStore({
    chrome: { storage: { local: localFallback, sync: failingSync } },
    settingsKey: "settings",
    runtimeKey: "runtime",
    logsKey: "logs",
    defaultSettings: {},
    defaultRuntime: {}
  });
  await fallbackStore.saveSettings({ continuePrompt: "kept locally" });
  assert.equal(localFallback.data.settings.continuePrompt, "kept locally");

  console.log("prompt stacker storage tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

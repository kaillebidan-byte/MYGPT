"use strict";

/*
 * Storage layout adapted from Prompt Stacker
 * (thegreatLUCY/prompt-stacker, content.js, commit
 * 5a01391c124ecc1d8f4cc8c4538883cec6bde1c3).
 *
 * Settings are mirrored locally and synced when available. Runtime and logs stay
 * local because they are bound to one browser tab/session.
 */

(function installPromptStackerStorage(globalScope) {
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createStore(options) {
    const chromeApi = options.chrome;
    const settingsKey = options.settingsKey;
    const runtimeKey = options.runtimeKey;
    const logsKey = options.logsKey;
    const defaultSettings = clone(options.defaultSettings || {});
    const defaultRuntime = clone(options.defaultRuntime || {});
    const revisionKey = "__promptStackerUpdatedAt";
    let settingsCache = null;

    function syncArea() {
      return chromeApi.storage?.sync || chromeApi.storage.local;
    }

    function cleanSettings(record) {
      const value = { ...(record || {}) };
      delete value[revisionKey];
      return value;
    }

    async function readSettings() {
      if (settingsCache) return clone(settingsCache);
      const localData = await chromeApi.storage.local.get(settingsKey);
      const localExists = Object.prototype.hasOwnProperty.call(localData || {}, settingsKey);
      const localRecord = localExists ? (localData[settingsKey] || {}) : {};
      let syncRecord = null;
      try {
        const synced = await syncArea().get(settingsKey);
        syncRecord = synced?.[settingsKey] || null;
      } catch (_) {
        // Local mirror remains authoritative if sync is unavailable.
      }

      const localRevision = Number(localRecord?.[revisionKey] || 0);
      const syncRevision = Number(syncRecord?.[revisionKey] || 0);
      let merged;
      if (syncRecord && (!localExists || syncRevision > localRevision)) {
        // A real revision wins. On first install with no local record, restore
        // sync. During legacy migration where both records have no revision,
        // local is authoritative so stale sync cannot replace the active setup.
        merged = { ...defaultSettings, ...cleanSettings(localRecord), ...cleanSettings(syncRecord) };
      } else {
        merged = { ...defaultSettings, ...cleanSettings(syncRecord), ...cleanSettings(localRecord) };
      }
      settingsCache = merged;
      return clone(merged);
    }

    async function saveSettings(settings) {
      const value = clone(settings);
      const record = { ...value, [revisionKey]: Date.now() };
      settingsCache = value;
      await chromeApi.storage.local.set({ [settingsKey]: record });
      if (syncArea() !== chromeApi.storage.local) {
        try {
          await syncArea().set({ [settingsKey]: record });
        } catch (_) {
          // Prompt Stacker's fallback policy: local copy already succeeded.
        }
      }
      return clone(value);
    }

    async function readRuntime() {
      const data = await chromeApi.storage.local.get({ [runtimeKey]: clone(defaultRuntime) });
      return { ...defaultRuntime, ...(data[runtimeKey] || {}) };
    }

    async function saveRuntime(runtime) {
      const value = { ...defaultRuntime, ...clone(runtime) };
      await chromeApi.storage.local.set({ [runtimeKey]: value });
      return value;
    }

    async function readState() {
      const [settings, runtime] = await Promise.all([readSettings(), readRuntime()]);
      return { settings, runtime };
    }

    async function readLogs() {
      const data = await chromeApi.storage.local.get({ [logsKey]: [] });
      return Array.isArray(data[logsKey]) ? data[logsKey] : [];
    }

    async function saveLogs(logs) {
      const value = Array.isArray(logs) ? clone(logs) : [];
      await chromeApi.storage.local.set({ [logsKey]: value });
      return value;
    }

    async function clearLogs() {
      await chromeApi.storage.local.set({ [logsKey]: [] });
    }

    return {
      readSettings,
      saveSettings,
      readRuntime,
      saveRuntime,
      readState,
      readLogs,
      saveLogs,
      clearLogs
    };
  }

  const api = { createStore };
  globalScope.TranslationLoopPromptStackerStorage = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

"use strict";

(() => {
  const STATE_KEY = "mygptV4Runtime";
  const META_KEY = "mygptV4OutputDirectoryMeta";
  const SLOT_IDS = Object.freeze(["F2", "F3", "F4"]);
  const TERMINAL = new Set(["COMPLETE", "ERROR"]);
  let transferBusy = false;
  let transferQueued = false;

  function runKey(state) {
    return [state?.startedAt || 0, state?.fileName || "", state?.sourceTabId || 0].join(":");
  }

  function selectedDirectoryMetaValid(meta) {
    return Boolean(meta && meta.mode === "directory" && meta.revision);
  }

  async function readMeta() {
    const stored = await chrome.storage.local.get(META_KEY);
    return stored[META_KEY] || null;
  }

  async function readState() {
    const stored = await chrome.storage.session.get(STATE_KEY);
    return stored[STATE_KEY] || null;
  }

  async function patchState(expectedKey, mutate) {
    const current = await readState();
    if (!current || runKey(current) !== expectedKey) return null;
    const next = mutate(current);
    if (!next) return current;
    next.updatedAt = Date.now();
    await chrome.storage.session.set({ [STATE_KEY]: next });
    return next;
  }

  function computeOutputPhase(state) {
    const statuses = SLOT_IDS.map((slotId) => {
      const slot = state?.slots?.find((item) => item.slotId === slotId);
      return slot?.outputTransfer?.status || "IDLE";
    });
    if (statuses.every((status) => status === "COMPLETE")) return "COMPLETE";
    if (statuses.every((status) => TERMINAL.has(status))) {
      const errors = statuses.filter((status) => status === "ERROR").length;
      return errors === statuses.length ? "ERROR" : "PARTIAL_ERROR";
    }
    if (statuses.some((status) => ["RESOLVING", "WRITING", "VERIFYING"].includes(status))) return "TRANSFERRING";
    if (statuses.some((status) => status === "PENDING")) return "PENDING";
    return "IDLE";
  }

  function sourceRecoveryComplete(state) {
    return Boolean(
      state?.phase === "COMPLETE" &&
      state?.recoveryPhase === "COMPLETE" &&
      SLOT_IDS.every((slotId) => {
        const slot = state?.slots?.find((item) => item.slotId === slotId);
        return slot?.phase === "COMPLETE" && slot?.imageRecovery?.status === "COMPLETE";
      })
    );
  }

  async function initializeOutputState(state, meta) {
    const expectedKey = runKey(state);
    return patchState(expectedKey, (current) => {
      const revisionChanged = current.outputDirectoryRevision !== meta.revision;
      const slots = current.slots.map((slot) => {
        if (!SLOT_IDS.includes(slot.slotId)) return slot;
        if (!revisionChanged && slot.outputTransfer?.status) return slot;
        return {
          ...slot,
          outputTransfer: {
            status: "PENDING",
            targetDirectoryName: meta.name || null,
            targetFilename: null,
            sourceDownloadId: slot.imageRecovery?.downloadId ?? null,
            bytesWritten: null,
            temporaryDownloadRemoved: false,
            temporaryCleanupError: null,
            error: null,
            updatedAt: Date.now()
          }
        };
      });
      const draft = {
        ...current,
        slots,
        outputDirectoryRevision: meta.revision,
        outputDirectoryName: meta.name || null,
        outputError: null
      };
      return { ...draft, outputPhase: computeOutputPhase(draft) };
    });
  }

  async function patchSlot(expectedKey, slotId, patch) {
    return patchState(expectedKey, (current) => {
      const slots = current.slots.map((slot) => slot.slotId === slotId ? {
        ...slot,
        outputTransfer: {
          ...(slot.outputTransfer || {}),
          ...patch,
          updatedAt: Date.now()
        }
      } : slot);
      const draft = { ...current, slots };
      return { ...draft, outputPhase: computeOutputPhase(draft) };
    });
  }

  async function fetchImageDataUrl(tabId, sourceUrl) {
    const execution = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (input) => {
        try {
          const response = await fetch(input.sourceUrl, { credentials: "include", cache: "force-cache" });
          if (!response.ok && response.status !== 0) {
            return { ok: false, reason: "OUTPUT_SOURCE_FETCH_HTTP", status: response.status };
          }
          const blob = await response.blob();
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(reader.error || new Error("OUTPUT_SOURCE_FILE_READER_FAILED"));
            reader.readAsDataURL(blob);
          });
          if (!/^data:[^,]*;base64,/i.test(dataUrl)) {
            return { ok: false, reason: "OUTPUT_SOURCE_DATA_URL_INVALID" };
          }
          return { ok: true, dataUrl, size: blob.size, mime: blob.type || null };
        } catch (error) {
          return { ok: false, reason: "OUTPUT_SOURCE_FETCH_FAILED", detail: error instanceof Error ? error.message : String(error) };
        }
      },
      args: [{ sourceUrl }]
    });
    return execution?.[0]?.result || { ok: false, reason: "OUTPUT_SOURCE_CAPTURE_NO_RESULT" };
  }

  function bytesFromDataUrl(dataUrl) {
    const comma = String(dataUrl || "").indexOf(",");
    if (comma < 0) throw new Error("OUTPUT_DATA_URL_INVALID");
    const binary = atob(dataUrl.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index) & 0xff;
    return bytes;
  }

  function baseFilename(value, fallback) {
    const clean = String(value || "").replace(/\\/g, "/").split("/").filter(Boolean).pop();
    return clean || fallback;
  }

  function numberedFilename(filename, counter) {
    if (!counter) return filename;
    const match = filename.match(/^(.*?)(\.[^.]+)?$/);
    return `${match?.[1] || filename} (${counter})${match?.[2] || ""}`;
  }

  async function createUniqueFile(directoryHandle, filename) {
    for (let counter = 0; counter < 1000; counter += 1) {
      const candidate = numberedFilename(filename, counter);
      try {
        await directoryHandle.getFileHandle(candidate);
      } catch (error) {
        if (error?.name !== "NotFoundError") throw error;
        const handle = await directoryHandle.getFileHandle(candidate, { create: true });
        return { handle, filename: candidate };
      }
    }
    throw new Error("OUTPUT_FILENAME_EXHAUSTED");
  }

  async function writeAndVerify(directoryHandle, filename, bytes) {
    const target = await createUniqueFile(directoryHandle, filename);
    const writable = await target.handle.createWritable();
    try {
      await writable.write(bytes);
      await writable.close();
    } catch (error) {
      try { await writable.abort?.(); } catch (_) {}
      throw error;
    }
    const file = await target.handle.getFile();
    if (file.size !== bytes.byteLength) {
      throw new Error(`OUTPUT_SIZE_MISMATCH:${file.size}:${bytes.byteLength}`);
    }
    return { filename: target.filename, size: file.size, type: file.type || null };
  }

  async function transferSlot(state, meta, directoryHandle, slotId) {
    const expectedKey = runKey(state);
    const current = await readState();
    if (!current || runKey(current) !== expectedKey) return;
    const slot = current.slots.find((item) => item.slotId === slotId);
    if (!slot || !Number.isInteger(slot.tabId)) return;
    if (slot.outputTransfer?.status === "COMPLETE" || slot.outputTransfer?.status === "ERROR") return;

    const recovery = slot.imageRecovery || {};
    if (recovery.status !== "COMPLETE" || !recovery.sourceUrl) {
      await patchSlot(expectedKey, slotId, {
        status: "ERROR",
        error: { code: "OUTPUT_SOURCE_NOT_READY", detail: { recoveryStatus: recovery.status || null } }
      });
      return;
    }

    await patchSlot(expectedKey, slotId, { status: "RESOLVING", error: null });
    const payload = await fetchImageDataUrl(slot.tabId, recovery.sourceUrl);
    if (!payload?.ok) {
      await patchSlot(expectedKey, slotId, {
        status: "ERROR",
        error: { code: payload?.reason || "OUTPUT_SOURCE_CAPTURE_FAILED", detail: payload || null }
      });
      return;
    }

    let bytes;
    try { bytes = bytesFromDataUrl(payload.dataUrl); }
    catch (error) {
      await patchSlot(expectedKey, slotId, {
        status: "ERROR",
        error: { code: "OUTPUT_DECODE_FAILED", detail: error instanceof Error ? error.message : String(error) }
      });
      return;
    }

    const fallbackName = `${slotId}.png`;
    const requestedName = baseFilename(recovery.filename || recovery.actualFilename, fallbackName);
    await patchSlot(expectedKey, slotId, {
      status: "WRITING",
      targetDirectoryName: meta.name || directoryHandle.name || null,
      targetFilename: requestedName,
      sourceDownloadId: recovery.downloadId ?? null
    });

    let written;
    try { written = await writeAndVerify(directoryHandle, requestedName, bytes); }
    catch (error) {
      await patchSlot(expectedKey, slotId, {
        status: "ERROR",
        error: { code: "OUTPUT_WRITE_FAILED", detail: error instanceof Error ? error.message : String(error) }
      });
      return;
    }

    await patchSlot(expectedKey, slotId, {
      status: "VERIFYING",
      targetFilename: written.filename,
      bytesWritten: written.size,
      mime: payload.mime || written.type || recovery.mime || null
    });

    let temporaryDownloadRemoved = false;
    let temporaryCleanupError = null;
    if (Number.isInteger(recovery.downloadId)) {
      try {
        await chrome.downloads.removeFile(recovery.downloadId);
        temporaryDownloadRemoved = true;
      } catch (error) {
        temporaryCleanupError = error instanceof Error ? error.message : String(error);
      }
    }

    await patchSlot(expectedKey, slotId, {
      status: "COMPLETE",
      targetDirectoryName: meta.name || directoryHandle.name || null,
      targetFilename: written.filename,
      bytesWritten: written.size,
      temporaryDownloadRemoved,
      temporaryCleanupError,
      error: null,
      completedAt: Date.now()
    });
  }

  async function runRelocation() {
    if (transferBusy) {
      transferQueued = true;
      return;
    }
    transferBusy = true;
    try {
      let state = await readState();
      if (!sourceRecoveryComplete(state)) return;

      const meta = await readMeta();
      if (!selectedDirectoryMetaValid(meta)) {
        if (!state.outputPhase) {
          await patchState(runKey(state), (current) => ({
            ...current,
            outputPhase: "DEFAULT_DOWNLOADS",
            outputError: null
          }));
        }
        return;
      }
      if (["COMPLETE", "DEFAULT_DOWNLOADS"].includes(state.outputPhase) &&
          state.outputDirectoryRevision !== meta.revision) return;

      const store = globalThis.MYGPTOutputDirectoryStore;
      if (!store) return;
      const directoryHandle = await store.getDirectoryHandle().catch(() => null);
      if (!directoryHandle) {
        await patchState(runKey(state), (current) => ({
          ...current,
          outputDirectoryRevision: meta.revision,
          outputDirectoryName: meta.name || null,
          outputPhase: "ERROR",
          outputError: { code: "OUTPUT_DIRECTORY_HANDLE_MISSING" }
        }));
        return;
      }

      const permission = await store.queryWritePermission(directoryHandle);
      if (permission !== "granted") {
        await patchState(runKey(state), (current) => ({
          ...current,
          outputDirectoryRevision: meta.revision,
          outputDirectoryName: meta.name || directoryHandle.name || null,
          outputPhase: "PERMISSION_REQUIRED",
          outputError: { code: "OUTPUT_DIRECTORY_PERMISSION_REQUIRED", detail: { permission } }
        }));
        return;
      }

      state = await initializeOutputState(state, meta) || state;
      const expectedKey = runKey(state);
      for (const slotId of SLOT_IDS) {
        const latest = await readState();
        if (!latest || runKey(latest) !== expectedKey || !sourceRecoveryComplete(latest)) return;
        await transferSlot(latest, meta, directoryHandle, slotId);
      }
      await patchState(expectedKey, (current) => ({
        ...current,
        outputPhase: computeOutputPhase(current),
        outputError: null
      }));
    } finally {
      transferBusy = false;
      if (transferQueued) {
        transferQueued = false;
        queueMicrotask(() => runRelocation().catch(() => {}));
      }
    }
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "session" && changes?.[STATE_KEY]?.newValue) {
      const next = changes[STATE_KEY].newValue;
      const terminalOutput = ["COMPLETE", "DEFAULT_DOWNLOADS", "ERROR", "PARTIAL_ERROR", "PERMISSION_REQUIRED"].includes(next.outputPhase);
      if (sourceRecoveryComplete(next) && !terminalOutput) {
        queueMicrotask(() => runRelocation().catch(() => {}));
      }
      return;
    }
    if (areaName === "local" && changes?.[META_KEY]) {
      queueMicrotask(() => runRelocation().catch(() => {}));
    }
  });

  queueMicrotask(() => runRelocation().catch(() => {}));
})();

"use strict";

(() => {
  const DB_NAME = "mygpt-worker-fanout";
  const DB_VERSION = 1;
  const STORE_NAME = "settings";
  const DIRECTORY_KEY = "output-directory";

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("OUTPUT_DIRECTORY_DB_OPEN_FAILED"));
    });
  }

  async function withStore(mode, task) {
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        let value;
        try { value = task(store); }
        catch (error) { reject(error); return; }
        tx.oncomplete = () => resolve(value);
        tx.onerror = () => reject(tx.error || new Error("OUTPUT_DIRECTORY_DB_TX_FAILED"));
        tx.onabort = () => reject(tx.error || new Error("OUTPUT_DIRECTORY_DB_TX_ABORTED"));
      });
    } finally {
      db.close();
    }
  }

  async function setDirectoryHandle(handle) {
    if (!handle || handle.kind !== "directory") throw new Error("OUTPUT_DIRECTORY_HANDLE_INVALID");
    const record = { handle, name: handle.name || "", selectedAt: Date.now() };
    await withStore("readwrite", (store) => store.put(record, DIRECTORY_KEY));
    return record;
  }

  async function getDirectoryRecord() {
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const request = tx.objectStore(STORE_NAME).get(DIRECTORY_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error("OUTPUT_DIRECTORY_DB_READ_FAILED"));
      });
    } finally {
      db.close();
    }
  }

  async function getDirectoryHandle() {
    const record = await getDirectoryRecord();
    return record?.handle?.kind === "directory" ? record.handle : null;
  }

  async function clearDirectoryHandle() {
    await withStore("readwrite", (store) => store.delete(DIRECTORY_KEY));
  }

  async function queryWritePermission(handle) {
    if (!handle || handle.kind !== "directory") return "missing";
    if (typeof handle.queryPermission !== "function") return "unsupported";
    try { return await handle.queryPermission({ mode: "readwrite" }); }
    catch (_) { return "error"; }
  }

  async function requestWritePermission(handle) {
    if (!handle || handle.kind !== "directory") return "missing";
    if (typeof handle.requestPermission !== "function") return "unsupported";
    try { return await handle.requestPermission({ mode: "readwrite" }); }
    catch (_) { return "error"; }
  }

  globalThis.MYGPTOutputDirectoryStore = Object.freeze({
    DB_NAME,
    STORE_NAME,
    DIRECTORY_KEY,
    setDirectoryHandle,
    getDirectoryRecord,
    getDirectoryHandle,
    clearDirectoryHandle,
    queryWritePermission,
    requestWritePermission
  });
})();

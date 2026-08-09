"use strict";

const STATE_KEY = "mygptV4Runtime";
const PAYLOAD_KEY = "mygptV4Payload";
const LEGACY_PAYLOAD_KEY = "mygptV3Payload";
const OUTPUT_META_KEY = "mygptV4OutputDirectoryMeta";
const SLOT_IDS = ["F2", "F3", "F4"];
const MSG = Object.freeze({
  RUN_THREE: "MYGPT_V4_RUN_THREE",
  RESET: "MYGPT_V4_RESET",
  GET_STATE: "MYGPT_V4_GET_STATE",
  FOCUS_SLOT: "MYGPT_V4_FOCUS_SLOT"
});

const $ = (id) => document.getElementById(id);
const canonical = $("canonical");
const run = $("run");
const reset = $("reset");
const selectOutputDir = $("selectOutputDir");
const clearOutputDir = $("clearOutputDir");
const outputDirInfo = $("outputDirInfo");
const fileInfo = $("fileInfo");
const phase = $("phase");
const worker = $("worker");
const stateFile = $("stateFile");
const slotsEl = $("slots");
const errorEl = $("error");
const packetEls = Object.fromEntries(SLOT_IDS.map((id) => [id, $(id)]));
let selectedFileSpec = null;
let lastRenderedAt = 0;
let lastState = null;
let outputDirectorySelected = false;
let outputDirectoryHandle = null;
let outputDirectoryPermission = "missing";

function allPacketsReady() { return SLOT_IDS.every((slotId) => packetEls[slotId].value.trim()); }
function recoveryBusy(state) { return ["PENDING", "RECOVERING"].includes(state?.recoveryPhase); }
function outputTransferBusy(state) { return ["PENDING", "TRANSFERRING"].includes(state?.outputPhase); }
function outputNeedsAction(state) { return ["PERMISSION_REQUIRED", "ERROR", "PARTIAL_ERROR"].includes(state?.outputPhase); }
function outputPermissionNeedsGesture(state = lastState) {
  return outputDirectorySelected && Boolean(outputDirectoryHandle) &&
    (state?.outputPhase === "PERMISSION_REQUIRED" || outputDirectoryPermission !== "granted");
}
function updateOutputDirectoryButton(state = lastState) {
  if (!outputDirectorySelected) {
    selectOutputDir.textContent = "保存先フォルダを選択";
    return;
  }
  selectOutputDir.textContent = outputPermissionNeedsGesture(state)
    ? "保存先を再許可して保存"
    : "保存先フォルダを変更";
}
function updateRunEnabled(state = lastState) {
  run.disabled = Boolean(state?.enabled) || recoveryBusy(state) ||
    (outputDirectorySelected && (outputTransferBusy(state) || outputNeedsAction(state))) ||
    !selectedFileSpec || !allPacketsReady();
  const transferActive = outputDirectorySelected && outputTransferBusy(state);
  selectOutputDir.disabled = transferActive;
  clearOutputDir.disabled = transferActive;
  updateOutputDirectoryButton(state);
}

function render(state) {
  const updatedAt = Number.isFinite(state?.updatedAt) ? state.updatedAt : 0;
  if (updatedAt && updatedAt < lastRenderedAt) return;
  if (updatedAt) lastRenderedAt = updatedAt;
  lastState = state || null;
  const stage = state?.sequenceStage && state.sequenceStage !== "IDLE" ? ` / ${state.sequenceStage}` : "";
  const recovery = state?.recoveryPhase && state.recoveryPhase !== "IDLE" ? ` | Recovery: ${state.recoveryPhase}` : "";
  const output = state?.outputPhase && state.outputPhase !== "IDLE" ? ` | Output: ${state.outputPhase}` : "";
  phase.textContent = `${state?.phase || "UNKNOWN"}${stage}${recovery}${output}`;
  worker.textContent = state?.workerIdentity?.workerPath || "-";
  stateFile.textContent = state?.fileName || "-";
  const errors = [];
  if (state?.error) errors.push(`${state.error.code}: ${JSON.stringify(state.error.detail || {})}`);
  if (state?.outputError) errors.push(`output ${state.outputError.code}: ${JSON.stringify(state.outputError.detail || {})}`);
  errorEl.textContent = errors.join("\n");
  slotsEl.textContent = "";
  for (const slotId of SLOT_IDS) {
    const slot = state?.slots?.find((item) => item.slotId === slotId) || { slotId, phase: "IDLE" };
    const row = document.createElement("div");
    row.className = "slot";
    const text = document.createElement("div");
    text.className = "mono";
    const imageRecovery = slot.imageRecovery || null;
    const imageStatus = imageRecovery?.status || "-";
    const imageName = imageRecovery?.actualFilename || imageRecovery?.filename || null;
    const outputTransfer = slot.outputTransfer || null;
    const outputStatus = outputTransfer?.status || "-";
    const outputName = outputTransfer?.targetFilename || null;
    text.textContent = `${slotId}: ${slot.phase} | Tab ${slot.tabId ?? "-"} | attach=${slot.attachmentEvidence || "-"}${slot.attachmentUiEvidence ? `/${slot.attachmentUiEvidence}` : ""} | send=${slot.activation || "-"}/${slot.submitEvidence || "-"} | done=${slot.completionEvidence || "-"} | image=${imageStatus}${imageName ? `/${imageName}` : ""} | output=${outputStatus}${outputName ? `/${outputName}` : ""}`;
    row.appendChild(text);
    if (Number.isInteger(slot.tabId)) {
      const button = document.createElement("button");
      button.textContent = `${slotId}へ移動`;
      button.addEventListener("click", async () => {
        const response = await chrome.runtime.sendMessage({ type: MSG.FOCUS_SLOT, slotId });
        if (!response?.ok) errorEl.textContent = response?.error || "FOCUS_FAILED";
      });
      row.appendChild(button);
    }
    if (slot.error) {
      const detail = document.createElement("div");
      detail.className = "error mono";
      detail.textContent = `${slot.error.code}: ${JSON.stringify(slot.error.detail || {})}`;
      row.appendChild(detail);
    }
    if (imageRecovery?.error) {
      const recoveryDetail = document.createElement("div");
      recoveryDetail.className = "error mono";
      recoveryDetail.textContent = `image ${imageRecovery.error.code}: ${JSON.stringify(imageRecovery.error.detail || {})}`;
      row.appendChild(recoveryDetail);
    }
    if (outputTransfer?.error) {
      const outputDetail = document.createElement("div");
      outputDetail.className = "error mono";
      outputDetail.textContent = `output ${outputTransfer.error.code}: ${JSON.stringify(outputTransfer.error.detail || {})}`;
      row.appendChild(outputDetail);
    }
    slotsEl.appendChild(row);
  }
  updateRunEnabled(state);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("FILE_READ_FAILED"));
    reader.readAsDataURL(file);
  });
}

async function persistPayload() {
  if (!selectedFileSpec) return;
  const packets = Object.fromEntries(SLOT_IDS.map((slotId) => [slotId, packetEls[slotId].value]));
  await chrome.storage.local.set({ [PAYLOAD_KEY]: { file: selectedFileSpec, packets } });
}

async function loadPayload() {
  const stored = await chrome.storage.local.get([PAYLOAD_KEY, LEGACY_PAYLOAD_KEY]);
  const payload = stored[PAYLOAD_KEY];
  if (payload?.packets) {
    for (const slotId of SLOT_IDS) if (typeof payload.packets[slotId] === "string") packetEls[slotId].value = payload.packets[slotId];
  }
  const file = payload?.file?.dataUrl ? payload.file : stored[LEGACY_PAYLOAD_KEY]?.file;
  if (file?.dataUrl) {
    selectedFileSpec = file;
    fileInfo.textContent = `${file.name} (${file.size} bytes) — storageから復元`;
  }
}

async function publishOutputDirectoryMeta(handle) {
  const meta = {
    mode: "directory",
    name: handle?.name || "",
    revision: crypto.randomUUID(),
    selectedAt: Date.now()
  };
  await chrome.storage.local.set({ [OUTPUT_META_KEY]: meta });
  return meta;
}

async function refreshOutputDirectoryInfo() {
  const store = globalThis.MYGPTOutputDirectoryStore;
  const stored = await chrome.storage.local.get(OUTPUT_META_KEY);
  const meta = stored[OUTPUT_META_KEY] || null;
  const record = store ? await store.getDirectoryRecord().catch(() => null) : null;
  const handle = record?.handle?.kind === "directory" ? record.handle : null;
  outputDirectoryHandle = handle;
  outputDirectorySelected = Boolean(meta?.mode === "directory" && handle);
  if (!outputDirectorySelected) {
    outputDirectoryPermission = "missing";
    outputDirInfo.textContent = "既定: Downloads/MYGPT-Worker-Fanout/";
    updateRunEnabled();
    return;
  }
  outputDirectoryPermission = await store.queryWritePermission(handle);
  const permissionText = outputDirectoryPermission === "granted" ? "書込可" :
    outputDirectoryPermission === "prompt" ? "再許可が必要" : outputDirectoryPermission;
  outputDirInfo.textContent = `選択: ${handle.name || meta.name || "folder"} — ${permissionText}`;
  updateRunEnabled();
}

async function reauthorizeCurrentOutputDirectory(store) {
  const handle = outputDirectoryHandle;
  if (!handle || handle.kind !== "directory") throw new Error("OUTPUT_DIRECTORY_HANDLE_MISSING");
  let permission = await store.queryWritePermission(handle);
  if (permission !== "granted") permission = await store.requestWritePermission(handle);
  if (permission !== "granted") throw new Error(`OUTPUT_DIRECTORY_PERMISSION_${String(permission).toUpperCase()}`);
  outputDirectoryPermission = permission;
  await store.setDirectoryHandle(handle);
  await publishOutputDirectoryMeta(handle);
}

selectOutputDir.addEventListener("click", async () => {
  errorEl.textContent = "";
  try {
    if (typeof window.showDirectoryPicker !== "function") throw new Error("DIRECTORY_PICKER_UNSUPPORTED");
    const store = globalThis.MYGPTOutputDirectoryStore;
    if (!store) throw new Error("OUTPUT_DIRECTORY_STORE_UNAVAILABLE");

    if (outputPermissionNeedsGesture(lastState)) {
      await reauthorizeCurrentOutputDirectory(store);
      await refreshOutputDirectoryInfo();
      return;
    }

    const options = { mode: "readwrite", id: "mygpt-worker-output" };
    if (outputDirectoryHandle) options.startIn = outputDirectoryHandle;
    const handle = await window.showDirectoryPicker(options);
    let permission = await store.queryWritePermission(handle);
    if (permission !== "granted") permission = await store.requestWritePermission(handle);
    if (permission !== "granted") throw new Error(`OUTPUT_DIRECTORY_PERMISSION_${String(permission).toUpperCase()}`);
    await store.setDirectoryHandle(handle);
    outputDirectoryHandle = handle;
    outputDirectoryPermission = permission;
    outputDirectorySelected = true;
    await publishOutputDirectoryMeta(handle);
    await refreshOutputDirectoryInfo();
  } catch (error) {
    if (error?.name === "AbortError") return;
    errorEl.textContent = error instanceof Error ? error.message : String(error);
  }
});

clearOutputDir.addEventListener("click", async () => {
  errorEl.textContent = "";
  try {
    const store = globalThis.MYGPTOutputDirectoryStore;
    if (store) await store.clearDirectoryHandle();
    await chrome.storage.local.remove(OUTPUT_META_KEY);
    outputDirectorySelected = false;
    outputDirectoryHandle = null;
    outputDirectoryPermission = "missing";
    outputDirInfo.textContent = "既定: Downloads/MYGPT-Worker-Fanout/";
    updateRunEnabled();
  } catch (error) {
    errorEl.textContent = error instanceof Error ? error.message : String(error);
  }
});

canonical.addEventListener("change", async () => {
  errorEl.textContent = "";
  const file = canonical.files?.[0] || null;
  if (!file) { selectedFileSpec = null; fileInfo.textContent = "未選択"; updateRunEnabled(); return; }
  try {
    selectedFileSpec = { name: file.name, type: file.type || "application/octet-stream", size: file.size, dataUrl: await fileToDataUrl(file) };
    fileInfo.textContent = `${file.name} (${file.size} bytes)`;
    await persistPayload();
    updateRunEnabled();
  } catch (error) {
    selectedFileSpec = null;
    fileInfo.textContent = "読込失敗";
    errorEl.textContent = error instanceof Error ? error.message : String(error);
  }
});

for (const slotId of SLOT_IDS) {
  packetEls[slotId].addEventListener("input", () => {
    updateRunEnabled();
    if (selectedFileSpec) persistPayload().catch(() => {});
  });
}

async function activeTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const id = tabs?.[0]?.id;
  if (!Number.isInteger(id)) throw new Error("ACTIVE_TAB_NOT_FOUND");
  return id;
}

run.addEventListener("click", async () => {
  run.disabled = true;
  errorEl.textContent = "";
  try {
    if (!selectedFileSpec) throw new Error("CANONICAL_NOT_SELECTED");
    if (!allPacketsReady()) throw new Error("PACKET_EMPTY");
    await persistPayload();
    const response = await chrome.runtime.sendMessage({ type: MSG.RUN_THREE, sourceTabId: await activeTabId() });
    if (response?.state) render(response.state);
    if (!response?.ok) throw new Error(response?.error || "RUN_FAILED");
  } catch (error) {
    errorEl.textContent = error instanceof Error ? error.message : String(error);
    await refresh().catch(() => {});
  }
});

reset.addEventListener("click", async () => {
  errorEl.textContent = "";
  const response = await chrome.runtime.sendMessage({ type: MSG.RESET });
  if (response?.state) render(response.state);
});

async function refresh() {
  const response = await chrome.runtime.sendMessage({ type: MSG.GET_STATE });
  if (response?.state) render(response.state);
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "session") {
    const change = changes?.[STATE_KEY];
    if (change?.newValue) render(change.newValue);
    return;
  }
  if (areaName === "local" && changes?.[OUTPUT_META_KEY]) {
    refreshOutputDirectoryInfo().catch(() => {});
  }
});

(async () => {
  await loadPayload();
  await refreshOutputDirectoryInfo();
  await refresh();
  updateRunEnabled();
})().catch((error) => { errorEl.textContent = error instanceof Error ? error.message : String(error); });

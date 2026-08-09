"use strict";

const STATE_KEY = "mygptV4Runtime";
const PAYLOAD_KEY = "mygptV4Payload";
const LEGACY_PAYLOAD_KEY = "mygptV3Payload";
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
const fileInfo = $("fileInfo");
const phase = $("phase");
const worker = $("worker");
const stateFile = $("stateFile");
const slotsEl = $("slots");
const errorEl = $("error");
const packetEls = Object.fromEntries(SLOT_IDS.map((id) => [id, $(id)]));
let selectedFileSpec = null;
let lastRenderedAt = 0;

function allPacketsReady() { return SLOT_IDS.every((slotId) => packetEls[slotId].value.trim()); }
function updateRunEnabled(state = null) { run.disabled = Boolean(state?.enabled) || !selectedFileSpec || !allPacketsReady(); }

function render(state) {
  const updatedAt = Number.isFinite(state?.updatedAt) ? state.updatedAt : 0;
  if (updatedAt && updatedAt < lastRenderedAt) return;
  if (updatedAt) lastRenderedAt = updatedAt;
  const stage = state?.sequenceStage && state.sequenceStage !== "IDLE" ? ` / ${state.sequenceStage}` : "";
  phase.textContent = `${state?.phase || "UNKNOWN"}${stage}`;
  worker.textContent = state?.workerIdentity?.workerPath || "-";
  stateFile.textContent = state?.fileName || "-";
  errorEl.textContent = state?.error ? `${state.error.code}: ${JSON.stringify(state.error.detail || {})}` : "";
  slotsEl.textContent = "";
  for (const slotId of SLOT_IDS) {
    const slot = state?.slots?.find((item) => item.slotId === slotId) || { slotId, phase: "IDLE" };
    const row = document.createElement("div");
    row.className = "slot";
    const text = document.createElement("div");
    text.className = "mono";
    text.textContent = `${slotId}: ${slot.phase} | Tab ${slot.tabId ?? "-"} | attach=${slot.attachmentEvidence || "-"}${slot.attachmentUiEvidence ? `/${slot.attachmentUiEvidence}` : ""} | send=${slot.activation || "-"}/${slot.submitEvidence || "-"} | done=${slot.completionEvidence || "-"}`;
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
  if (areaName !== "session") return;
  const change = changes?.[STATE_KEY];
  if (change?.newValue) render(change.newValue);
});

(async () => {
  await loadPayload();
  await refresh();
  updateRunEnabled();
})().catch((error) => { errorEl.textContent = error instanceof Error ? error.message : String(error); });

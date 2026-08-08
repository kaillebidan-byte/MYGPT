"use strict";

const STATE_KEY = "mygptV2Runtime";
const PAYLOAD_KEY = "mygptV2Payload";
const MSG = Object.freeze({
  START_ONE: "MYGPT_V2_START_ONE",
  RESET: "MYGPT_V2_RESET",
  GET_STATE: "MYGPT_V2_GET_STATE",
  FOCUS_WORKER: "MYGPT_V2_FOCUS_WORKER"
});

const $ = (id) => document.getElementById(id);
const canonical = $("canonical");
const packet = $("packet");
const prepare = $("prepare");
const focus = $("focus");
const reset = $("reset");
const fileInfo = $("fileInfo");
const phase = $("phase");
const worker = $("worker");
const tabId = $("tabId");
const stateFile = $("stateFile");
const attachment = $("attachment");
const composer = $("composer");
const insert = $("insert");
const errorEl = $("error");

let selectedFileSpec = null;
let lastRenderedAt = 0;

function render(state) {
  const updatedAt = Number.isFinite(state?.updatedAt) ? state.updatedAt : 0;
  if (updatedAt && updatedAt < lastRenderedAt) return;
  if (updatedAt) lastRenderedAt = updatedAt;

  phase.textContent = state?.phase || "UNKNOWN";
  worker.textContent = state?.workerIdentity?.workerPath || "-";
  tabId.textContent = Number.isInteger(state?.workerTabId) ? String(state.workerTabId) : "-";
  stateFile.textContent = state?.fileName || "-";
  attachment.textContent = state?.attachmentEvidence || "-";
  composer.textContent = state?.composerKind || "-";
  insert.textContent = state?.insertionMethod || "-";
  errorEl.textContent = state?.error
    ? `${state.error.code}${state.error.detail ? `: ${JSON.stringify(state.error.detail)}` : ""}`
    : "";

  const active = Boolean(state?.enabled);
  prepare.disabled = active || !selectedFileSpec || !packet.value.trim();
  focus.disabled = !(state?.phase === "READY" && Number.isInteger(state?.workerTabId));
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
  if (!selectedFileSpec) {
    await chrome.storage.local.remove(PAYLOAD_KEY);
    return;
  }
  await chrome.storage.local.set({
    [PAYLOAD_KEY]: {
      packet: packet.value,
      file: selectedFileSpec
    }
  });
}

canonical.addEventListener("change", async () => {
  errorEl.textContent = "";
  const file = canonical.files?.[0] || null;
  if (!file) {
    selectedFileSpec = null;
    fileInfo.textContent = "未選択";
    await chrome.storage.local.remove(PAYLOAD_KEY);
    prepare.disabled = true;
    return;
  }

  try {
    const dataUrl = await fileToDataUrl(file);
    selectedFileSpec = {
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      dataUrl
    };
    fileInfo.textContent = `${file.name} (${file.size} bytes)`;
    await persistPayload();
    await refresh();
  } catch (error) {
    selectedFileSpec = null;
    fileInfo.textContent = "読込失敗";
    errorEl.textContent = error instanceof Error ? error.message : String(error);
  }
});

packet.addEventListener("input", () => {
  prepare.disabled = !selectedFileSpec || !packet.value.trim();
});

async function activeTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const id = tabs?.[0]?.id;
  if (!Number.isInteger(id)) throw new Error("ACTIVE_TAB_NOT_FOUND");
  return id;
}

prepare.addEventListener("click", async () => {
  prepare.disabled = true;
  errorEl.textContent = "";
  try {
    if (!selectedFileSpec) throw new Error("CANONICAL_NOT_SELECTED");
    if (!packet.value.trim()) throw new Error("PACKET_EMPTY");
    await persistPayload();
    const sourceTabId = await activeTabId();
    const response = await chrome.runtime.sendMessage({
      type: MSG.START_ONE,
      sourceTabId
    });
    if (!response?.ok) {
      throw new Error(response?.error || "PREPARE_START_FAILED");
    }
    render(response.state);
  } catch (error) {
    errorEl.textContent = error instanceof Error ? error.message : String(error);
    await refresh().catch(() => {});
  }
});

focus.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({ type: MSG.FOCUS_WORKER });
  if (!response?.ok) {
    errorEl.textContent = response?.error || "FOCUS_FAILED";
  }
});

reset.addEventListener("click", async () => {
  errorEl.textContent = "";
  const response = await chrome.runtime.sendMessage({ type: MSG.RESET });
  selectedFileSpec = null;
  canonical.value = "";
  fileInfo.textContent = "未選択";
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

refresh().catch((error) => {
  errorEl.textContent = error instanceof Error ? error.message : String(error);
});

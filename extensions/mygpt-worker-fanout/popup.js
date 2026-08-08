"use strict";

const MSG = Object.freeze({
  START: "MYGPT_GATE0_START",
  RESET: "MYGPT_GATE0_RESET",
  GET_STATE: "MYGPT_GATE0_GET_STATE",
  GET_IDENTITY: "MYGPT_GATE0_GET_IDENTITY",
  GATE1_INSERT: "MYGPT_GATE1_INSERT",
  GATE1_RESET: "MYGPT_GATE1_RESET"
});

const statusEl = document.getElementById("status");
const expectedEl = document.getElementById("expected");
const observedEl = document.getElementById("observed");
const tabIdEl = document.getElementById("tabId");
const errorEl = document.getElementById("error");
const startButton = document.getElementById("start");
const resetButton = document.getElementById("reset");
const packetEl = document.getElementById("packet");
const gate1StatusEl = document.getElementById("gate1Status");
const composerKindEl = document.getElementById("composerKind");
const insertionMethodEl = document.getElementById("insertionMethod");
const packetCharsEl = document.getElementById("packetChars");
const gate1ErrorEl = document.getElementById("gate1Error");
const gate1InsertButton = document.getElementById("gate1Insert");
const gate1ResetButton = document.getElementById("gate1Reset");

let lastRenderedAt = 0;

function formatError(error) {
  if (!error) {
    return "";
  }
  return `${error.code}${error.detail ? `: ${JSON.stringify(error.detail)}` : ""}`;
}

function renderState(state) {
  const incomingUpdatedAt = Number.isFinite(state && state.updatedAt)
    ? state.updatedAt
    : 0;
  if (incomingUpdatedAt && incomingUpdatedAt < lastRenderedAt) {
    return;
  }
  if (incomingUpdatedAt) {
    lastRenderedAt = incomingUpdatedAt;
  }

  const gate1 = state && state.gate1 ? state.gate1 : { status: "IDLE" };

  statusEl.textContent = state && state.status ? state.status : "UNKNOWN";
  expectedEl.textContent =
    state && state.expectedIdentity && state.expectedIdentity.workerPath
      ? state.expectedIdentity.workerPath
      : "-";
  observedEl.textContent =
    state &&
    state.destinationReport &&
    state.destinationReport.identity &&
    state.destinationReport.identity.workerPath
      ? state.destinationReport.identity.workerPath
      : "-";
  tabIdEl.textContent = Number.isInteger(state && state.openedTabId)
    ? String(state.openedTabId)
    : "-";
  errorEl.textContent = formatError(state && state.error);

  gate1StatusEl.textContent = gate1.status || "IDLE";
  composerKindEl.textContent = gate1.composerKind || "-";
  insertionMethodEl.textContent = gate1.insertionMethod || "-";
  packetCharsEl.textContent = Number.isInteger(gate1.packetChars)
    ? String(gate1.packetChars)
    : "-";
  gate1ErrorEl.textContent = formatError(gate1.error);

  startButton.disabled = Boolean(state && state.status !== "IDLE");
  gate1InsertButton.disabled = !(
    state &&
    state.status === "PASS" &&
    gate1.status === "IDLE"
  );
  gate1ResetButton.disabled = !(state && state.status === "PASS" && gate1.status !== "IDLE");
}

async function refreshState() {
  const response = await chrome.runtime.sendMessage({ type: MSG.GET_STATE });
  if (!response || !response.ok) {
    throw new Error(response && response.error ? response.error : "STATE_READ_FAILED");
  }
  renderState(response.state);
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs.length || !Number.isInteger(tabs[0].id)) {
    throw new Error("ACTIVE_TAB_NOT_FOUND");
  }
  return tabs[0];
}

startButton.addEventListener("click", async () => {
  startButton.disabled = true;
  errorEl.textContent = "";
  try {
    const activeTab = await getActiveTab();
    const sourceReport = await chrome.tabs.sendMessage(activeTab.id, {
      type: MSG.GET_IDENTITY
    });

    if (!sourceReport || !sourceReport.identity || !sourceReport.identity.ok) {
      throw new Error(
        sourceReport && sourceReport.identity && sourceReport.identity.reason
          ? sourceReport.identity.reason
          : "SOURCE_IDENTITY_UNAVAILABLE"
      );
    }

    const response = await chrome.runtime.sendMessage({
      type: MSG.START,
      sourceTabId: activeTab.id,
      sourceUrl: sourceReport.identity.observedUrl
    });

    if (!response || !response.ok) {
      throw new Error(response && response.error ? response.error : "GATE0_START_FAILED");
    }

    renderState(response.state);
  } catch (error) {
    errorEl.textContent = error instanceof Error ? error.message : String(error);
    await refreshState().catch(() => {});
  }
});

resetButton.addEventListener("click", async () => {
  errorEl.textContent = "";
  gate1ErrorEl.textContent = "";
  try {
    const response = await chrome.runtime.sendMessage({ type: MSG.RESET });
    if (!response || !response.ok) {
      throw new Error(response && response.error ? response.error : "RESET_FAILED");
    }
    renderState(response.state);
  } catch (error) {
    errorEl.textContent = error instanceof Error ? error.message : String(error);
  }
});

gate1InsertButton.addEventListener("click", async () => {
  gate1InsertButton.disabled = true;
  gate1ErrorEl.textContent = "";
  try {
    const response = await chrome.runtime.sendMessage({
      type: MSG.GATE1_INSERT,
      packet: packetEl.value
    });
    if (!response || !response.ok) {
      throw new Error(response && response.error ? response.error : "GATE1_INSERT_FAILED");
    }
    renderState(response.state);
  } catch (error) {
    gate1ErrorEl.textContent = error instanceof Error ? error.message : String(error);
    await refreshState().catch(() => {});
  }
});

gate1ResetButton.addEventListener("click", async () => {
  gate1ErrorEl.textContent = "";
  try {
    const response = await chrome.runtime.sendMessage({ type: MSG.GATE1_RESET });
    if (!response || !response.ok) {
      throw new Error(response && response.error ? response.error : "GATE1_RESET_FAILED");
    }
    renderState(response.state);
  } catch (error) {
    gate1ErrorEl.textContent = error instanceof Error ? error.message : String(error);
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "session") {
    return;
  }
  const change = changes && changes.gate0State;
  if (!change || !change.newValue) {
    return;
  }
  renderState(change.newValue);
});

refreshState().catch((error) => {
  errorEl.textContent = error instanceof Error ? error.message : String(error);
});

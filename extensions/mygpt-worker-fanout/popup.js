"use strict";

const MSG = Object.freeze({
  START: "MYGPT_GATE0_START",
  RESET: "MYGPT_GATE0_RESET",
  GET_STATE: "MYGPT_GATE0_GET_STATE",
  GET_IDENTITY: "MYGPT_GATE0_GET_IDENTITY"
});

const statusEl = document.getElementById("status");
const expectedEl = document.getElementById("expected");
const observedEl = document.getElementById("observed");
const tabIdEl = document.getElementById("tabId");
const errorEl = document.getElementById("error");
const startButton = document.getElementById("start");
const resetButton = document.getElementById("reset");

function renderState(state) {
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
  errorEl.textContent =
    state && state.error
      ? `${state.error.code}${state.error.detail ? `: ${JSON.stringify(state.error.detail)}` : ""}`
      : "";
  startButton.disabled = Boolean(state && state.status !== "IDLE");
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

refreshState().catch((error) => {
  errorEl.textContent = error instanceof Error ? error.message : String(error);
});

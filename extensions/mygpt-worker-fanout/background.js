importScripts("route_adapter.js");

"use strict";

const STATE_KEY = "gate0State";
const MSG = Object.freeze({
  START: "MYGPT_GATE0_START",
  RESET: "MYGPT_GATE0_RESET",
  GET_STATE: "MYGPT_GATE0_GET_STATE",
  ROUTE_REPORT: "MYGPT_GATE0_ROUTE_REPORT",
  GET_IDENTITY: "MYGPT_GATE0_GET_IDENTITY"
});

const ACTIVE_STATUSES = new Set(["OPENING", "AWAITING_DESTINATION"]);
const TERMINAL_STATUSES = new Set(["PASS", "FAIL"]);

function emptyState() {
  return {
    gate: 0,
    status: "IDLE",
    runToken: null,
    sourceTabId: null,
    openedTabId: null,
    expectedIdentity: null,
    destinationReport: null,
    error: null,
    startedAt: null,
    updatedAt: Date.now()
  };
}

async function getState() {
  const stored = await chrome.storage.session.get(STATE_KEY);
  return stored[STATE_KEY] || emptyState();
}

async function setState(nextState) {
  const value = {
    ...nextState,
    updatedAt: Date.now()
  };
  await chrome.storage.session.set({ [STATE_KEY]: value });
  return value;
}

async function transitionFailure(state, code, detail) {
  return setState({
    ...state,
    status: "FAIL",
    error: {
      code,
      detail: detail || null
    }
  });
}

async function handleRouteReport(message, sender) {
  const tabId = sender && sender.tab && sender.tab.id;
  if (!Number.isInteger(tabId)) {
    return { ok: false, ignored: "NO_TAB_ID" };
  }

  const state = await getState();
  if (!Number.isInteger(state.openedTabId) || tabId !== state.openedTabId) {
    return { ok: true, ignored: "UNOWNED_TAB" };
  }
  if (TERMINAL_STATUSES.has(state.status)) {
    return { ok: true, ignored: "TERMINAL_STATE", state };
  }

  const report = message && message.report;
  const destinationIdentity = report && report.identity;
  if (!destinationIdentity || destinationIdentity.ok !== true) {
    const failed = await transitionFailure(
      state,
      destinationIdentity && destinationIdentity.reason
        ? destinationIdentity.reason
        : "DESTINATION_IDENTITY_INVALID",
      report || null
    );
    return { ok: false, state: failed };
  }

  const nextBase = {
    ...state,
    destinationReport: {
      identity: destinationIdentity,
      pageTitle: typeof report.pageTitle === "string" ? report.pageTitle : "",
      observedAt: report.observedAt || Date.now()
    }
  };

  if (!MYGPTWorkerRoute.sameWorkerIdentity(state.expectedIdentity, destinationIdentity)) {
    const failed = await transitionFailure(
      nextBase,
      "WORKER_IDENTITY_MISMATCH",
      {
        expected: state.expectedIdentity && state.expectedIdentity.workerKey,
        actual: destinationIdentity.workerKey
      }
    );
    return { ok: false, state: failed };
  }

  const passed = await setState({
    ...nextBase,
    status: "PASS",
    error: null
  });
  return { ok: true, state: passed };
}

async function probeDestinationTab(tabId) {
  const state = await getState();
  if (state.openedTabId !== tabId || !ACTIVE_STATUSES.has(state.status)) {
    return { ok: true, ignored: "NOT_ACTIVE_DESTINATION", state };
  }

  let report;
  try {
    report = await chrome.tabs.sendMessage(tabId, { type: MSG.GET_IDENTITY });
  } catch (_error) {
    // A content script may not be ready yet. If the tab is still loading,
    // onUpdated("complete") performs the single lifecycle-bound probe.
    return { ok: false, ignored: "CONTENT_NOT_READY" };
  }

  return handleRouteReport({ report }, { tab: { id: tabId } });
}

async function armDestinationProbe(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab && tab.status === "complete") {
      await probeDestinationTab(tabId);
    }
  } catch (_error) {
    // Tab removal is handled by onRemoved. No retry loop is used here.
  }
}

async function startGate0(message) {
  const current = await getState();
  if (current.status !== "IDLE") {
    return {
      ok: false,
      error: ACTIVE_STATUSES.has(current.status)
        ? "GATE0_ALREADY_ACTIVE"
        : "GATE0_RESET_REQUIRED",
      state: current
    };
  }

  const sourceIdentity = MYGPTWorkerRoute.normalizeCustomGptIdentity(
    message && message.sourceUrl
  );
  if (!sourceIdentity.ok) {
    return {
      ok: false,
      error: sourceIdentity.reason,
      state: current
    };
  }

  const runToken = crypto.randomUUID();
  let state = await setState({
    ...emptyState(),
    status: "OPENING",
    runToken,
    sourceTabId: Number.isInteger(message.sourceTabId) ? message.sourceTabId : null,
    expectedIdentity: sourceIdentity,
    startedAt: Date.now()
  });

  let openedTab;
  try {
    openedTab = await chrome.tabs.create({
      url: sourceIdentity.workerUrl,
      active: true
    });
  } catch (error) {
    state = await transitionFailure(
      state,
      "TAB_CREATE_FAILED",
      error instanceof Error ? error.message : String(error)
    );
    return { ok: false, error: "TAB_CREATE_FAILED", state };
  }

  if (!openedTab || !Number.isInteger(openedTab.id)) {
    state = await transitionFailure(state, "TAB_ID_MISSING", null);
    return { ok: false, error: "TAB_ID_MISSING", state };
  }

  state = await setState({
    ...state,
    status: "AWAITING_DESTINATION",
    openedTabId: openedTab.id
  });

  // Close the race where document_idle / tabs.onUpdated("complete") can occur
  // before openedTabId has finished persisting. If the tab is already complete,
  // query the content script directly now; otherwise the complete event below
  // performs that one lifecycle-bound query.
  armDestinationProbe(openedTab.id);

  return {
    ok: true,
    runToken,
    openedTabId: openedTab.id,
    state
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return false;
  }

  let task;
  if (message.type === MSG.START) {
    task = startGate0(message);
  } else if (message.type === MSG.RESET) {
    task = setState(emptyState()).then((state) => ({ ok: true, state }));
  } else if (message.type === MSG.GET_STATE) {
    task = getState().then((state) => ({ ok: true, state }));
  } else if (message.type === MSG.ROUTE_REPORT) {
    task = handleRouteReport(message, sender);
  } else {
    return false;
  }

  task.then(sendResponse).catch((error) => {
    sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  });
  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== "complete") {
    return;
  }

  getState().then((state) => {
    if (state.openedTabId !== tabId || !ACTIVE_STATUSES.has(state.status)) {
      return;
    }
    return probeDestinationTab(tabId);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  getState().then((state) => {
    if (state.openedTabId !== tabId || state.status === "IDLE") {
      return;
    }
    if (TERMINAL_STATUSES.has(state.status)) {
      return;
    }
    return transitionFailure(state, "OWNED_TAB_CLOSED", { tabId });
  });
});

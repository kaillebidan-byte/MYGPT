importScripts("route_adapter.js");

"use strict";

const STATE_KEY = "gate0State";
const MSG = Object.freeze({
  START: "MYGPT_GATE0_START",
  RESET: "MYGPT_GATE0_RESET",
  GET_STATE: "MYGPT_GATE0_GET_STATE",
  ROUTE_REPORT: "MYGPT_GATE0_ROUTE_REPORT",
  GET_IDENTITY: "MYGPT_GATE0_GET_IDENTITY",
  GATE1_INSERT: "MYGPT_GATE1_INSERT",
  GATE1_RESET: "MYGPT_GATE1_RESET",
  INSERT_PACKET: "MYGPT_GATE1_INSERT_PACKET"
});

const ACTIVE_STATUSES = new Set(["OPENING", "AWAITING_DESTINATION"]);
const TERMINAL_STATUSES = new Set(["PASS", "FAIL"]);
const GATE1_ACTIVE_STATUSES = new Set(["INSERTING"]);
const GATE1_TERMINAL_STATUSES = new Set(["PASS", "FAIL"]);
const MAX_PACKET_CHARS = 12000;

function emptyGate1State() {
  return {
    status: "IDLE",
    operationToken: null,
    packetChars: null,
    composerKind: null,
    insertionMethod: null,
    observedAt: null,
    error: null
  };
}

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
    gate1: emptyGate1State(),
    startedAt: null,
    updatedAt: Date.now()
  };
}

function normalizeState(state) {
  if (!state || typeof state !== "object") {
    return emptyState();
  }
  return {
    ...emptyState(),
    ...state,
    gate1: {
      ...emptyGate1State(),
      ...(state.gate1 || {})
    }
  };
}

async function getState() {
  const stored = await chrome.storage.session.get(STATE_KEY);
  return normalizeState(stored[STATE_KEY]);
}

async function setState(nextState) {
  const value = {
    ...normalizeState(nextState),
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

async function transitionGate1Failure(state, operationToken, code, detail) {
  const current = await getState();
  if (
    current.runToken !== state.runToken ||
    current.openedTabId !== state.openedTabId ||
    current.gate1.operationToken !== operationToken ||
    current.gate1.status !== "INSERTING"
  ) {
    return current;
  }

  return setState({
    ...current,
    gate1: {
      ...current.gate1,
      status: "FAIL",
      error: {
        code,
        detail: detail || null
      }
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
    error: null,
    gate1: emptyGate1State()
  });
  return { ok: true, state: passed };
}

async function queryIdentity(tabId) {
  try {
    const report = await chrome.tabs.sendMessage(tabId, { type: MSG.GET_IDENTITY });
    return report && report.identity ? report.identity : null;
  } catch (_error) {
    return null;
  }
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

  armDestinationProbe(openedTab.id);

  return {
    ok: true,
    runToken,
    openedTabId: openedTab.id,
    state
  };
}

async function startGate1(message) {
  const state = await getState();
  if (state.status !== "PASS") {
    return { ok: false, error: "GATE0_PASS_REQUIRED", state };
  }
  if (!Number.isInteger(state.openedTabId) || !state.expectedIdentity) {
    return { ok: false, error: "OWNED_DESTINATION_MISSING", state };
  }

  if (state.gate1.status !== "IDLE") {
    return {
      ok: false,
      error: GATE1_ACTIVE_STATUSES.has(state.gate1.status)
        ? "GATE1_ALREADY_ACTIVE"
        : "GATE1_RESET_REQUIRED",
      state
    };
  }

  const packet = typeof message.packet === "string" ? message.packet.replace(/\r\n?/g, "\n") : "";
  if (!packet.trim()) {
    return { ok: false, error: "PACKET_EMPTY", state };
  }
  if (packet.length > MAX_PACKET_CHARS) {
    return { ok: false, error: "PACKET_TOO_LARGE", state };
  }

  const operationToken = crypto.randomUUID();
  const inserting = await setState({
    ...state,
    gate1: {
      ...emptyGate1State(),
      status: "INSERTING",
      operationToken,
      packetChars: packet.length
    }
  });

  const preflightIdentity = await queryIdentity(inserting.openedTabId);
  if (!MYGPTWorkerRoute.sameWorkerIdentity(inserting.expectedIdentity, preflightIdentity)) {
    const failed = await transitionGate1Failure(
      inserting,
      operationToken,
      preflightIdentity ? "WORKER_IDENTITY_MISMATCH" : "DESTINATION_IDENTITY_UNAVAILABLE",
      preflightIdentity || null
    );
    return { ok: false, error: failed.gate1.error.code, state: failed };
  }

  let result;
  try {
    result = await chrome.tabs.sendMessage(inserting.openedTabId, {
      type: MSG.INSERT_PACKET,
      packet,
      runToken: inserting.runToken,
      expectedWorkerKey: inserting.expectedIdentity.workerKey
    });
  } catch (error) {
    const failed = await transitionGate1Failure(
      inserting,
      operationToken,
      "CONTENT_MESSAGE_FAILED",
      error instanceof Error ? error.message : String(error)
    );
    return { ok: false, error: failed.gate1.error.code, state: failed };
  }

  if (!result || result.ok !== true) {
    const failed = await transitionGate1Failure(
      inserting,
      operationToken,
      result && result.reason ? result.reason : "PACKET_INSERT_FAILED",
      result || null
    );
    return { ok: false, error: failed.gate1.error.code, state: failed };
  }

  if (
    result.runToken !== inserting.runToken ||
    result.submitted !== false ||
    result.exactMatch !== true ||
    !MYGPTWorkerRoute.sameWorkerIdentity(inserting.expectedIdentity, result.identity)
  ) {
    const failed = await transitionGate1Failure(
      inserting,
      operationToken,
      "PACKET_INSERT_EVIDENCE_INVALID",
      {
        exactMatch: result.exactMatch,
        submitted: result.submitted,
        runTokenMatches: result.runToken === inserting.runToken,
        workerMatches: MYGPTWorkerRoute.sameWorkerIdentity(inserting.expectedIdentity, result.identity)
      }
    );
    return { ok: false, error: failed.gate1.error.code, state: failed };
  }

  const current = await getState();
  if (
    current.runToken !== inserting.runToken ||
    current.openedTabId !== inserting.openedTabId ||
    current.gate1.operationToken !== operationToken ||
    current.gate1.status !== "INSERTING"
  ) {
    return { ok: false, error: "STALE_GATE1_RESULT", state: current };
  }

  const passed = await setState({
    ...current,
    gate1: {
      ...current.gate1,
      status: "PASS",
      composerKind: result.composerKind || null,
      insertionMethod: result.method || null,
      observedAt: result.observedAt || Date.now(),
      error: null
    }
  });

  return { ok: true, state: passed };
}

async function resetGate1() {
  const state = await getState();
  if (state.status !== "PASS") {
    return { ok: false, error: "GATE0_PASS_REQUIRED", state };
  }
  const next = await setState({
    ...state,
    gate1: emptyGate1State()
  });
  return { ok: true, state: next };
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
  } else if (message.type === MSG.GATE1_INSERT) {
    task = startGate1(message);
  } else if (message.type === MSG.GATE1_RESET) {
    task = resetGate1();
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
  getState().then(async (state) => {
    if (state.openedTabId !== tabId || state.status === "IDLE") {
      return;
    }
    if (state.status === "PASS") {
      if (!GATE1_TERMINAL_STATUSES.has(state.gate1.status)) {
        const operationToken = state.gate1.operationToken;
        if (state.gate1.status === "INSERTING" && operationToken) {
          await transitionGate1Failure(state, operationToken, "OWNED_TAB_CLOSED", { tabId });
        }
      }
      return;
    }
    if (state.status === "FAIL") {
      return;
    }
    return transitionFailure(state, "OWNED_TAB_CLOSED", { tabId });
  });
});

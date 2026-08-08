importScripts("route_adapter.js", "runtime_guard.js");

"use strict";

const STATE_KEY = "mygptV3Runtime";
const PAYLOAD_KEY = "mygptV3Payload";
const SLOT_IDS = Object.freeze(["F2", "F3", "F4"]);

const MSG = Object.freeze({
  PREPARE_THREE: "MYGPT_V3_PREPARE_THREE",
  RESET: "MYGPT_V3_RESET",
  GET_STATE: "MYGPT_V3_GET_STATE",
  GET_IDENTITY: "MYGPT_V3_GET_IDENTITY",
  PREPARE_SLOT: "MYGPT_V3_PREPARE_SLOT",
  OBSERVED: "MYGPT_V3_OBSERVED",
  FOCUS_SLOT: "MYGPT_V3_FOCUS_SLOT"
});

const ISOLATED_FILES = ["route_adapter.js", "chatgpt_adapter.js", "content.js"];

function emptySlot(slotId) {
  return {
    slotId,
    phase: "IDLE",
    tabId: null,
    packetChars: null,
    attachmentEvidence: null,
    composerKind: null,
    insertionMethod: null,
    generationActive: false,
    error: null,
    updatedAt: Date.now()
  };
}

function emptyRuntime() {
  return {
    enabled: false,
    runToken: null,
    phase: "IDLE",
    sourceTabId: null,
    workerIdentity: null,
    fileName: null,
    fileSize: null,
    slots: SLOT_IDS.map(emptySlot),
    error: null,
    startedAt: null,
    updatedAt: Date.now()
  };
}

function normalizeRuntime(value) {
  const base = emptyRuntime();
  const incomingSlots = Array.isArray(value?.slots) ? value.slots : [];
  const byId = new Map(incomingSlots.map((slot) => [slot.slotId, slot]));
  return {
    ...base,
    ...(value || {}),
    slots: SLOT_IDS.map((slotId) => ({ ...emptySlot(slotId), ...(byId.get(slotId) || {}) }))
  };
}

async function readRuntime() {
  const stored = await chrome.storage.session.get(STATE_KEY);
  return normalizeRuntime(stored[STATE_KEY]);
}

async function saveRuntime(runtime) {
  const value = normalizeRuntime({ ...runtime, updatedAt: Date.now() });
  await chrome.storage.session.set({ [STATE_KEY]: value });
  return value;
}

const guard = TranslationLoopRuntimeGuard.createRuntimeGuard({
  readRuntime,
  saveRuntime,
  tokenFactory: () => crypto.randomUUID()
});

function updateSlot(slots, slotId, patch) {
  return slots.map((slot) => slot.slotId === slotId
    ? { ...slot, ...patch, updatedAt: Date.now() }
    : slot);
}

async function ensureContent(tabId) {
  try {
    const report = await chrome.tabs.sendMessage(tabId, { type: MSG.GET_IDENTITY });
    if (report) return report;
  } catch (_) {}

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["page_observer.js"],
      world: "MAIN"
    });
  } catch (_) {
    // The MAIN-world observer is optional for READY-only v0.3.0.
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ISOLATED_FILES
  });

  return chrome.tabs.sendMessage(tabId, { type: MSG.GET_IDENTITY });
}

async function waitForIdentity(tabId, timeoutMs = 20000) {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const report = await ensureContent(tabId);
      if (report?.identity) return report;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(lastError || "CONTENT_IDENTITY_TIMEOUT");
}

async function getPayload() {
  const stored = await chrome.storage.local.get(PAYLOAD_KEY);
  return stored[PAYLOAD_KEY] || null;
}

function payloadValid(payload) {
  if (!payload?.file || typeof payload.file.dataUrl !== "string") return false;
  if (!payload.packets || typeof payload.packets !== "object") return false;
  return SLOT_IDS.every((slotId) => typeof payload.packets[slotId] === "string" && payload.packets[slotId].trim());
}

async function mutateSlot(token, slotId, patch) {
  return guard.mutateIfToken(token, (current) => ({
    next: { ...current, slots: updateSlot(current.slots, slotId, patch) }
  }));
}

async function prepareOneSlot(token, sourceIdentity, payload, slotId) {
  if (!(await guard.isCurrent(token))) return { ok: false, slotId, error: "STALE_RUN" };

  let tab;
  try {
    tab = await chrome.tabs.create({ url: sourceIdentity.workerUrl, active: false });
  } catch (error) {
    await mutateSlot(token, slotId, {
      phase: "ERROR",
      error: { code: "TAB_CREATE_FAILED", detail: error instanceof Error ? error.message : String(error) }
    });
    return { ok: false, slotId, error: "TAB_CREATE_FAILED" };
  }

  if (!Number.isInteger(tab?.id)) {
    await mutateSlot(token, slotId, { phase: "ERROR", error: { code: "TAB_ID_MISSING" } });
    return { ok: false, slotId, error: "TAB_ID_MISSING" };
  }

  const tabId = tab.id;
  await mutateSlot(token, slotId, { phase: "VERIFYING", tabId });

  let report;
  try {
    report = await waitForIdentity(tabId);
  } catch (error) {
    await mutateSlot(token, slotId, {
      phase: "ERROR",
      error: { code: "DESTINATION_CONTENT_UNAVAILABLE", detail: error instanceof Error ? error.message : String(error) }
    });
    return { ok: false, slotId, tabId, error: "DESTINATION_CONTENT_UNAVAILABLE" };
  }

  if (!MYGPTWorkerRoute.sameWorkerIdentity(sourceIdentity, report.identity)) {
    await mutateSlot(token, slotId, {
      phase: "ERROR",
      error: {
        code: "WORKER_IDENTITY_MISMATCH",
        detail: { expected: sourceIdentity.workerKey, actual: report.identity?.workerKey || null }
      }
    });
    return { ok: false, slotId, tabId, error: "WORKER_IDENTITY_MISMATCH" };
  }

  await mutateSlot(token, slotId, { phase: "PREPARING", generationActive: report.generationActive === true });

  let result;
  try {
    result = await chrome.tabs.sendMessage(tabId, {
      type: MSG.PREPARE_SLOT,
      slotId,
      runToken: token,
      expectedWorkerKey: sourceIdentity.workerKey,
      packet: payload.packets[slotId],
      file: payload.file
    });
  } catch (error) {
    await mutateSlot(token, slotId, {
      phase: "ERROR",
      error: { code: "PREPARE_MESSAGE_FAILED", detail: error instanceof Error ? error.message : String(error) }
    });
    return { ok: false, slotId, tabId, error: "PREPARE_MESSAGE_FAILED" };
  }

  const evidenceValid = Boolean(
    result?.ok === true &&
    result.runToken === token &&
    result.submitted === false &&
    result.attachment?.evidence === "autogpt-upload-ready" &&
    result.insertionMethod === "autogpt-synthetic-paste" &&
    MYGPTWorkerRoute.sameWorkerIdentity(sourceIdentity, result.identity) &&
    result.generationActive !== true
  );

  if (!evidenceValid) {
    await mutateSlot(token, slotId, {
      phase: "ERROR",
      error: { code: result?.reason || "PREPARE_EVIDENCE_INVALID", detail: result || null }
    });
    return { ok: false, slotId, tabId, error: result?.reason || "PREPARE_EVIDENCE_INVALID" };
  }

  await mutateSlot(token, slotId, {
    phase: "READY",
    tabId,
    packetChars: result.packetChars,
    attachmentEvidence: result.attachment.evidence,
    composerKind: result.composerKind,
    insertionMethod: result.insertionMethod,
    generationActive: false,
    error: null
  });

  return { ok: true, slotId, tabId };
}

async function startThree(message) {
  const sourceTabId = Number.isInteger(message?.sourceTabId) ? message.sourceTabId : null;
  if (!sourceTabId) return { ok: false, error: "SOURCE_TAB_MISSING" };

  const current = await readRuntime();
  if (current.enabled) return { ok: false, error: "RUN_ALREADY_ACTIVE", state: current };

  const payload = await getPayload();
  if (!payloadValid(payload)) return { ok: false, error: "PAYLOAD_NOT_READY", state: current };

  let sourceReport;
  try {
    sourceReport = await ensureContent(sourceTabId);
  } catch (error) {
    return { ok: false, error: "SOURCE_CONTENT_UNAVAILABLE", detail: error instanceof Error ? error.message : String(error) };
  }
  const sourceIdentity = sourceReport?.identity;
  if (!sourceIdentity?.ok) return { ok: false, error: sourceIdentity?.reason || "SOURCE_IDENTITY_INVALID" };

  const start = await guard.mutate((runtime) => {
    if (runtime.enabled) return { reason: "already-active" };
    const token = guard.newToken();
    return {
      next: {
        ...emptyRuntime(),
        enabled: true,
        runToken: token,
        phase: "PREPARING",
        sourceTabId,
        workerIdentity: sourceIdentity,
        fileName: payload.file.name || null,
        fileSize: Number.isFinite(payload.file.size) ? payload.file.size : null,
        slots: SLOT_IDS.map((slotId) => ({
          ...emptySlot(slotId),
          phase: "QUEUED",
          packetChars: payload.packets[slotId].length
        })),
        startedAt: Date.now()
      },
      value: token
    };
  });

  if (!start.committed || !start.value) return { ok: false, error: "RUN_START_REJECTED", state: start.runtime };
  const token = start.value;

  const results = [];
  // Deliberately sequential for the first live build: same mechanics, less Vivaldi background-tab contention.
  for (const slotId of SLOT_IDS) {
    if (!(await guard.isCurrent(token))) break;
    results.push(await prepareOneSlot(token, sourceIdentity, payload, slotId));
  }

  const final = await guard.mutateIfToken(token, (runtime) => {
    const readyCount = runtime.slots.filter((slot) => slot.phase === "READY").length;
    const errorCount = runtime.slots.filter((slot) => slot.phase === "ERROR").length;
    return {
      next: {
        ...runtime,
        enabled: false,
        runToken: null,
        phase: readyCount === SLOT_IDS.length ? "READY" : readyCount > 0 ? "PARTIAL_ERROR" : "ERROR",
        error: errorCount ? { code: "ONE_OR_MORE_SLOTS_FAILED", detail: { readyCount, errorCount } } : null
      }
    };
  });

  return { ok: final.committed, state: final.runtime, results };
}

async function resetRuntime() {
  const current = await readRuntime();
  const ids = current.slots.map((slot) => slot.tabId).filter(Number.isInteger);
  for (const tabId of ids) {
    try { await chrome.tabs.remove(tabId); } catch (_) {}
  }
  const state = await saveRuntime(emptyRuntime());
  return { ok: true, state };
}

async function focusSlot(slotId) {
  const state = await readRuntime();
  const slot = state.slots.find((item) => item.slotId === slotId);
  if (!Number.isInteger(slot?.tabId)) return { ok: false, error: "SLOT_TAB_MISSING", state };
  try {
    await chrome.tabs.update(slot.tabId, { active: true });
    return { ok: true, state };
  } catch (error) {
    return { ok: false, error: "SLOT_FOCUS_FAILED", detail: error instanceof Error ? error.message : String(error), state };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") return false;
  let task;
  if (message.type === MSG.PREPARE_THREE) task = startThree(message);
  else if (message.type === MSG.RESET) task = resetRuntime();
  else if (message.type === MSG.GET_STATE) task = readRuntime().then((state) => ({ ok: true, state }));
  else if (message.type === MSG.FOCUS_SLOT) task = focusSlot(message.slotId);
  else if (message.type === MSG.OBSERVED) task = Promise.resolve({ ok: true });
  else return false;

  task.then(sendResponse).catch((error) => {
    sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) });
  });
  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  readRuntime().then((state) => {
    if (!state.enabled || !state.runToken) return;
    const slot = state.slots.find((item) => item.tabId === tabId);
    if (!slot) return;
    return mutateSlot(state.runToken, slot.slotId, {
      phase: "ERROR",
      error: { code: "WORKER_TAB_CLOSED", detail: { tabId } }
    });
  }).catch(() => {});
});

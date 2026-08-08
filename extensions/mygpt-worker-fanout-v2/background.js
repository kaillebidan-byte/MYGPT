importScripts("route_adapter.js", "runtime_guard.js");

"use strict";

const STATE_KEY = "mygptV2Runtime";
const PAYLOAD_KEY = "mygptV2Payload";

const MSG = Object.freeze({
  START_ONE: "MYGPT_V2_START_ONE",
  RESET: "MYGPT_V2_RESET",
  GET_STATE: "MYGPT_V2_GET_STATE",
  GET_IDENTITY: "MYGPT_V2_GET_IDENTITY",
  PREPARE: "MYGPT_V2_PREPARE",
  OBSERVED: "MYGPT_V2_OBSERVED",
  FOCUS_WORKER: "MYGPT_V2_FOCUS_WORKER"
});

const CONTENT_FILES = [
  "route_adapter.js",
  "prompt_stacker_insert_runner.js",
  "file_adapter.js",
  "content.js"
];

function emptyRuntime() {
  return {
    enabled: false,
    runToken: null,
    phase: "IDLE",
    sourceTabId: null,
    workerTabId: null,
    workerIdentity: null,
    packetChars: null,
    fileName: null,
    fileSize: null,
    attachmentEvidence: null,
    composerKind: null,
    insertionMethod: null,
    generationActive: false,
    error: null,
    startedAt: null,
    updatedAt: Date.now()
  };
}

async function readRuntime() {
  const stored = await chrome.storage.session.get(STATE_KEY);
  return {
    ...emptyRuntime(),
    ...(stored[STATE_KEY] || {})
  };
}

async function saveRuntime(runtime) {
  const value = {
    ...emptyRuntime(),
    ...runtime,
    updatedAt: Date.now()
  };
  await chrome.storage.session.set({ [STATE_KEY]: value });
  return value;
}

const guard = TranslationLoopRuntimeGuard.createRuntimeGuard({
  readRuntime,
  saveRuntime,
  tokenFactory: () => crypto.randomUUID()
});

async function transitionError(token, code, detail = null) {
  return guard.mutateIfToken(token, (current) => ({
    next: {
      ...current,
      enabled: false,
      runToken: null,
      phase: "ERROR",
      error: { code, detail }
    }
  }));
}

async function ensureContent(tabId) {
  try {
    const report = await chrome.tabs.sendMessage(tabId, { type: MSG.GET_IDENTITY });
    if (report) return report;
  } catch (_) {
    // Already-open tabs after an extension reload need explicit injection.
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: CONTENT_FILES
  });

  return chrome.tabs.sendMessage(tabId, { type: MSG.GET_IDENTITY });
}

async function waitForIdentity(tabId, timeoutMs = 15000) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const report = await ensureContent(tabId);
      if (report && report.identity) return report;
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

async function clearPayload() {
  await chrome.storage.local.remove(PAYLOAD_KEY);
}

async function startOne(message) {
  const sourceTabId = Number.isInteger(message?.sourceTabId) ? message.sourceTabId : null;
  if (!sourceTabId) return { ok: false, error: "SOURCE_TAB_MISSING" };

  const existing = await readRuntime();
  if (existing.enabled || !["IDLE", "READY", "ERROR"].includes(existing.phase)) {
    return { ok: false, error: "RUN_ALREADY_ACTIVE", state: existing };
  }

  const payload = await getPayload();
  if (
    !payload ||
    typeof payload.packet !== "string" ||
    !payload.packet.trim() ||
    !payload.file ||
    typeof payload.file.dataUrl !== "string"
  ) {
    return { ok: false, error: "PAYLOAD_NOT_READY", state: existing };
  }

  let sourceReport;
  try {
    sourceReport = await ensureContent(sourceTabId);
  } catch (error) {
    return {
      ok: false,
      error: "SOURCE_CONTENT_UNAVAILABLE",
      detail: error instanceof Error ? error.message : String(error)
    };
  }

  const sourceIdentity = sourceReport?.identity;
  if (!sourceIdentity?.ok) {
    return {
      ok: false,
      error: sourceIdentity?.reason || "SOURCE_IDENTITY_INVALID"
    };
  }

  const startMutation = await guard.mutate((current) => {
    if (current.enabled) {
      return { reason: "already-active" };
    }
    const token = guard.newToken();
    return {
      next: {
        ...emptyRuntime(),
        enabled: true,
        runToken: token,
        phase: "OPENING",
        sourceTabId,
        workerIdentity: sourceIdentity,
        packetChars: payload.packet.length,
        fileName: payload.file.name || null,
        fileSize: Number.isFinite(payload.file.size) ? payload.file.size : null,
        startedAt: Date.now()
      },
      value: token
    };
  });

  if (!startMutation.committed || !startMutation.value) {
    return { ok: false, error: "RUN_START_REJECTED", state: startMutation.runtime };
  }

  const token = startMutation.value;

  let workerTab;
  try {
    workerTab = await chrome.tabs.create({
      url: sourceIdentity.workerUrl,
      active: false
    });
  } catch (error) {
    await transitionError(token, "TAB_CREATE_FAILED", error instanceof Error ? error.message : String(error));
    return { ok: false, error: "TAB_CREATE_FAILED" };
  }

  if (!workerTab || !Number.isInteger(workerTab.id)) {
    await transitionError(token, "TAB_ID_MISSING");
    return { ok: false, error: "TAB_ID_MISSING" };
  }

  const workerTabId = workerTab.id;
  await guard.mutateIfToken(token, (current) => ({
    next: { ...current, phase: "VERIFYING", workerTabId }
  }));

  let destinationReport;
  try {
    destinationReport = await waitForIdentity(workerTabId);
  } catch (error) {
    await transitionError(
      token,
      "DESTINATION_CONTENT_UNAVAILABLE",
      error instanceof Error ? error.message : String(error)
    );
    return { ok: false, error: "DESTINATION_CONTENT_UNAVAILABLE" };
  }

  if (!MYGPTWorkerRoute.sameWorkerIdentity(sourceIdentity, destinationReport.identity)) {
    await transitionError(token, "WORKER_IDENTITY_MISMATCH", {
      expected: sourceIdentity.workerKey,
      actual: destinationReport.identity?.workerKey || null
    });
    return { ok: false, error: "WORKER_IDENTITY_MISMATCH" };
  }

  await guard.mutateIfToken(token, (current) => ({
    next: {
      ...current,
      phase: "PREPARING",
      generationActive: destinationReport.generationActive === true
    }
  }));

  let result;
  try {
    result = await chrome.tabs.sendMessage(workerTabId, {
      type: MSG.PREPARE,
      runToken: token,
      expectedWorkerKey: sourceIdentity.workerKey,
      packet: payload.packet,
      file: payload.file
    });
  } catch (error) {
    await transitionError(
      token,
      "PREPARE_MESSAGE_FAILED",
      error instanceof Error ? error.message : String(error)
    );
    return { ok: false, error: "PREPARE_MESSAGE_FAILED" };
  }

  if (!result?.ok) {
    await transitionError(token, result?.reason || "PREPARE_FAILED", result || null);
    return { ok: false, error: result?.reason || "PREPARE_FAILED" };
  }

  const evidenceValid =
    result.runToken === token &&
    result.submitted === false &&
    result.exactMatch === true &&
    MYGPTWorkerRoute.sameWorkerIdentity(sourceIdentity, result.identity) &&
    result.attachment?.ok === true;

  if (!evidenceValid) {
    await transitionError(token, "PREPARE_EVIDENCE_INVALID", {
      runTokenMatches: result.runToken === token,
      submitted: result.submitted,
      exactMatch: result.exactMatch,
      workerMatches: MYGPTWorkerRoute.sameWorkerIdentity(sourceIdentity, result.identity),
      attachmentOk: result.attachment?.ok === true
    });
    return { ok: false, error: "PREPARE_EVIDENCE_INVALID" };
  }

  const finalMutation = await guard.mutateIfToken(token, (current) => ({
    next: {
      ...current,
      enabled: false,
      runToken: null,
      phase: "READY",
      workerTabId,
      attachmentEvidence: result.attachment.evidence || null,
      composerKind: result.composerKind || null,
      insertionMethod: result.insertionMethod || null,
      generationActive: result.generationActive === true,
      error: null
    }
  }));

  return {
    ok: finalMutation.committed,
    state: finalMutation.runtime
  };
}

async function resetAll() {
  await clearPayload();
  const state = await saveRuntime(emptyRuntime());
  return { ok: true, state };
}

async function focusWorker() {
  const state = await readRuntime();
  if (!Number.isInteger(state.workerTabId)) {
    return { ok: false, error: "WORKER_TAB_MISSING", state };
  }
  try {
    await chrome.tabs.update(state.workerTabId, { active: true });
    return { ok: true, state };
  } catch (error) {
    return {
      ok: false,
      error: "WORKER_TAB_FOCUS_FAILED",
      detail: error instanceof Error ? error.message : String(error),
      state
    };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") return false;

  let task = null;
  if (message.type === MSG.START_ONE) {
    task = startOne(message);
  } else if (message.type === MSG.RESET) {
    task = resetAll();
  } else if (message.type === MSG.GET_STATE) {
    task = readRuntime().then((state) => ({ ok: true, state }));
  } else if (message.type === MSG.FOCUS_WORKER) {
    task = focusWorker();
  } else if (message.type === MSG.OBSERVED) {
    task = Promise.resolve({ ok: true });
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

chrome.tabs.onRemoved.addListener((tabId) => {
  readRuntime().then((state) => {
    if (!state.enabled || state.workerTabId !== tabId || !state.runToken) return;
    return transitionError(state.runToken, "WORKER_TAB_CLOSED", { tabId });
  });
});

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
  OBSERVED: "MYGPT_V3_OBSERVED",
  FOCUS_SLOT: "MYGPT_V3_FOCUS_SLOT"
});

const ISOLATED_FILES = ["route_adapter.js", "content.js"];
const MAIN_FILES = ["page_observer.js", "translation_loop_send_guard.js", "chatgpt_adapter.js"];

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

async function ensureMainRuntime(tabId) {
  let available = false;
  try {
    const probe = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: () => Boolean(globalThis.MYGPTTranslationLoopSendGuard && globalThis.MYGPTChatGPTAdapter)
    });
    available = probe?.[0]?.result === true;
  } catch (_) {}

  if (!available) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: MAIN_FILES,
      world: "MAIN"
    });
  }
}

async function ensureContent(tabId) {
  try {
    const report = await chrome.tabs.sendMessage(tabId, { type: MSG.GET_IDENTITY });
    if (report) {
      await ensureMainRuntime(tabId);
      return report;
    }
  } catch (_) {}

  await ensureMainRuntime(tabId);
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ISOLATED_FILES
  });

  return chrome.tabs.sendMessage(tabId, { type: MSG.GET_IDENTITY });
}

async function prepareInMainWorld(tabId, slotId, token, file, packet) {
  await ensureMainRuntime(tabId);
  const execution = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: async (args) => {
      const adapter = globalThis.MYGPTChatGPTAdapter;
      if (!adapter) {
        return { ok: false, reason: "MAIN_CHATGPT_ADAPTER_UNAVAILABLE", submitted: false };
      }

      const stopSelectors = [
        'button[data-testid="stop-button"]',
        'button[data-testid="composer-stop-button"]',
        'button[aria-label*="Stop generating"]',
        'button[aria-label*="生成を停止"]'
      ];
      const generationActive = () => stopSelectors.some((selector) => document.querySelector(selector));

      if (generationActive()) {
        return {
          ok: false,
          reason: "GENERATION_ALREADY_ACTIVE",
          runToken: args.runToken,
          slotId: args.slotId,
          submitted: false
        };
      }

      const composerReady = await adapter.waitForComposer(document, 15000);
      if (!composerReady) {
        return {
          ok: false,
          reason: "COMPOSER_NOT_FOUND",
          runToken: args.runToken,
          slotId: args.slotId,
          submitted: false
        };
      }

      const existingDraft = adapter.composerDraftText(document);
      if (existingDraft) {
        return {
          ok: false,
          reason: "COMPOSER_NOT_EMPTY",
          observedChars: existingDraft.length,
          runToken: args.runToken,
          slotId: args.slotId,
          submitted: false
        };
      }

      const attachment = await adapter.attachFile(args.file, {
        document,
        composerTimeout: 15000,
        uploadTimeout: 90000,
        uploadInterval: 2000
      });
      if (!attachment.ok) {
        return {
          ...attachment,
          runToken: args.runToken,
          slotId: args.slotId,
          submitted: false
        };
      }

      const afterUploadComposer = await adapter.waitForComposer(document, 15000);
      if (!afterUploadComposer) {
        return {
          ok: false,
          reason: "COMPOSER_MISSING_AFTER_UPLOAD",
          attachment,
          runToken: args.runToken,
          slotId: args.slotId,
          submitted: false
        };
      }

      const pasted = await adapter.pastePrompt(args.packet, {
        document,
        window,
        editorTimeout: 15000,
        reflectTimeout: 5000
      });
      if (!pasted.ok) {
        return {
          ...pasted,
          attachment,
          runToken: args.runToken,
          slotId: args.slotId,
          submitted: false
        };
      }

      const sendReady = await adapter.waitForSendReady(document, 10000);
      if (!sendReady) {
        return {
          ok: false,
          reason: "COMPOSER_SEND_NOT_READY",
          attachment,
          pasted,
          runToken: args.runToken,
          slotId: args.slotId,
          submitted: false
        };
      }

      return {
        ok: true,
        slotId: args.slotId,
        runToken: args.runToken,
        attachment,
        composerKind: pasted.composerKind,
        insertionMethod: pasted.method,
        pasteEvidence: pasted.evidence,
        sendReadyEvidence: sendReady.evidence,
        sendButton: sendReady,
        packetChars: pasted.observedChars,
        submitted: false,
        generationActive: generationActive(),
        executionWorld: "MAIN",
        observedAt: Date.now()
      };
    },
    args: [{ slotId, runToken: token, file, packet }]
  });

  return execution?.[0]?.result || {
    ok: false,
    reason: "MAIN_PREPARE_NO_RESULT",
    runToken: token,
    slotId,
    submitted: false
  };
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

async function openSlotTab(token, sourceIdentity, slotId) {
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
  await mutateSlot(token, slotId, { phase: "OPENING", tabId });
  return { ok: true, slotId, tabId };
}

async function verifySlotTab(token, sourceIdentity, opened) {
  if (!opened?.ok || !Number.isInteger(opened.tabId)) return opened;
  const { slotId, tabId } = opened;
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

  await mutateSlot(token, slotId, {
    phase: "STAGED",
    tabId,
    generationActive: report.generationActive === true
  });
  return { ok: true, slotId, tabId, report };
}

async function prepareStagedSlot(token, sourceIdentity, payload, staged) {
  if (!staged?.ok || !Number.isInteger(staged.tabId)) return staged;
  const { slotId, tabId } = staged;
  if (!(await guard.isCurrent(token))) return { ok: false, slotId, tabId, error: "STALE_RUN" };

  await mutateSlot(token, slotId, {
    phase: "PREPARING",
    generationActive: staged.report?.generationActive === true
  });

  let result;
  try {
    result = await prepareInMainWorld(
      tabId,
      slotId,
      token,
      payload.file,
      payload.packets[slotId]
    );
  } catch (error) {
    await mutateSlot(token, slotId, {
      phase: "ERROR",
      error: { code: "MAIN_PREPARE_EXECUTION_FAILED", detail: error instanceof Error ? error.message : String(error) }
    });
    return { ok: false, slotId, tabId, error: "MAIN_PREPARE_EXECUTION_FAILED" };
  }

  let postReport = null;
  try {
    postReport = await waitForIdentity(tabId, 5000);
  } catch (_) {}

  const evidenceValid = Boolean(
    result?.ok === true &&
    result.runToken === token &&
    result.submitted === false &&
    result.executionWorld === "MAIN" &&
    result.attachment?.evidence === "autogpt-upload+visible-attachment" &&
    result.insertionMethod === "autogpt-synthetic-paste" &&
    result.sendReadyEvidence === "translation-loop-send-ready" &&
    MYGPTWorkerRoute.sameWorkerIdentity(sourceIdentity, postReport?.identity) &&
    result.generationActive !== true &&
    postReport?.generationActive !== true
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

  const opened = [];
  for (const slotId of SLOT_IDS) {
    if (!(await guard.isCurrent(token))) break;
    opened.push(await openSlotTab(token, sourceIdentity, slotId));
  }

  const staged = [];
  for (const item of opened) {
    if (!(await guard.isCurrent(token))) break;
    staged.push(await verifySlotTab(token, sourceIdentity, item));
  }

  const results = [];
  for (const item of staged) {
    if (!(await guard.isCurrent(token))) break;
    results.push(await prepareStagedSlot(token, sourceIdentity, payload, item));
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

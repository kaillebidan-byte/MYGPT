importScripts("route_adapter.js", "runtime_guard.js", "loop_core.js", "terminal_gate.js");

"use strict";

const STATE_KEY = "mygptV4Runtime";
const PAYLOAD_KEY = "mygptV4Payload";
const LEGACY_PAYLOAD_KEY = "mygptV3Payload";
const SLOT_IDS = Object.freeze(["F2", "F3", "F4"]);
const MONITOR_PORT = "mygpt-worker-monitor";
const SCAN_ALARM = "mygpt-v4-scan-watchdog";
const SEQUENCE_ALARM = "mygpt-v4-sequence-step";
const SCAN_PERIOD_MINUTES = 0.5;
const SUBMIT_VERIFY_TIMEOUT_MS = 12000;
const OPEN_SETTLE_MS = 15000;
const ATTACH_SETTLE_MS = 15000;
const SLOT_COOLDOWN_MS = 5000;

const MSG = Object.freeze({
  RUN_THREE: "MYGPT_V4_RUN_THREE",
  RESET: "MYGPT_V4_RESET",
  GET_STATE: "MYGPT_V4_GET_STATE",
  GET_IDENTITY: "MYGPT_V4_GET_IDENTITY",
  CAPTURE: "MYGPT_V4_CAPTURE",
  OBSERVED: "MYGPT_V4_OBSERVED",
  FOCUS_SLOT: "MYGPT_V4_FOCUS_SLOT"
});

const ISOLATED_FILES = ["route_adapter.js", "content.js"];
const MAIN_FILES = ["page_observer.js", "prompt_stacker_runner.js", "chatgpt_adapter.js"];
const monitorPorts = new Map();
const pageEvidenceByNonce = new Map();
let scanPingTimer = null;
let logChain = Promise.resolve();

function emptySlot(slotId) {
  return {
    slotId,
    phase: "IDLE",
    tabId: null,
    packetChars: null,
    attachmentEvidence: null,
    attachmentUiEvidence: null,
    insertionMethod: null,
    submitNonce: null,
    activation: null,
    submitEvidence: null,
    conversationId: null,
    generationActive: false,
    generationStarted: false,
    generationEndedAt: 0,
    assistantBaselineCount: 0,
    monitorKey: "",
    monitorChangedAt: 0,
    terminalGateState: null,
    completionEvidence: null,
    lastMonitorAt: 0,
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
    activeSlotId: null,
    sequenceStage: "IDLE",
    nextActionAt: 0,
    slots: SLOT_IDS.map(emptySlot),
    error: null,
    startedAt: null,
    updatedAt: Date.now()
  };
}

function normalizeRuntime(value) {
  const base = emptyRuntime();
  const incoming = Array.isArray(value?.slots) ? value.slots : [];
  const byId = new Map(incoming.map((slot) => [slot.slotId, slot]));
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
  return slots.map((slot) => slot.slotId === slotId ? { ...slot, ...patch, updatedAt: Date.now() } : slot);
}

async function mutateSlot(token, slotId, patch) {
  return guard.mutateIfToken(token, (current) => ({
    next: { ...current, slots: updateSlot(current.slots, slotId, patch) }
  }));
}

function portKey(port) {
  return `${port.sender?.tab?.id ?? "unknown"}:${port.sender?.frameId ?? 0}`;
}

function startScanPings() {
  if (scanPingTimer !== null) return;
  scanPingTimer = setInterval(() => {
    if (monitorPorts.size === 0) {
      clearInterval(scanPingTimer);
      scanPingTimer = null;
      return;
    }
    const at = Date.now();
    for (const [key, port] of monitorPorts) {
      try { port.postMessage({ type: "mygpt-worker-scan-now", at }); }
      catch (_) { monitorPorts.delete(key); }
    }
  }, 1000);
}

async function appendLog(event, details = {}) {
  logChain = logChain.then(async () => {
    const data = await chrome.storage.local.get({ mygptV4Logs: [] });
    const logs = Array.isArray(data.mygptV4Logs) ? data.mygptV4Logs : [];
    logs.push({ at: new Date().toISOString(), event, details });
    if (logs.length > 300) logs.splice(0, logs.length - 300);
    await chrome.storage.local.set({ mygptV4Logs: logs });
  }).catch(() => {});
  return logChain;
}

async function ensureScanAlarm() {
  const existing = await chrome.alarms.get(SCAN_ALARM).catch(() => null);
  if (!existing) await chrome.alarms.create(SCAN_ALARM, { periodInMinutes: SCAN_PERIOD_MINUTES });
}

async function clearScanAlarm() {
  await chrome.alarms.clear(SCAN_ALARM).catch(() => {});
}

async function clearSequenceAlarm() {
  await chrome.alarms.clear(SEQUENCE_ALARM).catch(() => {});
}

async function scheduleSequenceAlarm(token, stage, delayMs) {
  const when = Date.now() + Math.max(0, Number(delayMs) || 0);
  const mutation = await guard.mutateIfToken(token, (runtime) => ({
    next: { ...runtime, sequenceStage: stage, nextActionAt: when }
  }));
  if (!mutation.committed) return false;
  await clearSequenceAlarm();
  chrome.alarms.create(SEQUENCE_ALARM, { when });
  return true;
}

async function ensureMainRuntime(tabId) {
  let available = false;
  try {
    const probe = await chrome.scripting.executeScript({
      target: { tabId }, world: "MAIN",
      func: () => Boolean(globalThis.MYGPTChatGPTAdapter && globalThis.TranslationLoopPromptStacker)
    });
    available = probe?.[0]?.result === true;
  } catch (_) {}
  if (!available) {
    await chrome.scripting.executeScript({ target: { tabId }, files: MAIN_FILES, world: "MAIN" });
  }
}

async function ensureContent(tabId) {
  try {
    const report = await chrome.tabs.sendMessage(tabId, { type: MSG.GET_IDENTITY });
    if (report) { await ensureMainRuntime(tabId); return report; }
  } catch (_) {}
  await ensureMainRuntime(tabId);
  await chrome.scripting.executeScript({ target: { tabId }, files: ISOLATED_FILES });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: MSG.GET_IDENTITY });
      if (response) return response;
    } catch (_) {}
  }
  throw new Error("CONTENT_SCRIPT_UNAVAILABLE");
}

async function captureTab(tabId) {
  await ensureContent(tabId);
  const response = await chrome.tabs.sendMessage(tabId, { type: MSG.CAPTURE });
  if (!response?.ok || !response.snapshot) throw new Error("CAPTURE_FAILED");
  return response.snapshot;
}

async function getPayload() {
  const stored = await chrome.storage.local.get([PAYLOAD_KEY, LEGACY_PAYLOAD_KEY]);
  if (stored[PAYLOAD_KEY]) return stored[PAYLOAD_KEY];
  const legacy = stored[LEGACY_PAYLOAD_KEY];
  if (legacy?.file?.dataUrl) return { file: legacy.file, packets: null };
  return null;
}

function payloadValid(payload) {
  if (!payload?.file || typeof payload.file.dataUrl !== "string") return false;
  if (!payload.packets || typeof payload.packets !== "object") return false;
  return SLOT_IDS.every((slotId) => typeof payload.packets[slotId] === "string" && payload.packets[slotId].trim());
}

async function waitForIdentity(tabId, timeoutMs = 20000) {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const report = await ensureContent(tabId);
      if (report?.identity) return report;
    } catch (error) { lastError = error instanceof Error ? error.message : String(error); }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(lastError || "CONTENT_IDENTITY_TIMEOUT");
}

async function openSlotTab(token, sourceIdentity, slotId) {
  if (!(await guard.isCurrent(token))) return { ok: false, slotId, error: "STALE_RUN" };
  let tab;
  try { tab = await chrome.tabs.create({ url: sourceIdentity.workerUrl, active: true }); }
  catch (error) {
    await mutateSlot(token, slotId, { phase: "ERROR", error: { code: "TAB_CREATE_FAILED", detail: String(error) } });
    return { ok: false, slotId, error: "TAB_CREATE_FAILED" };
  }
  if (!Number.isInteger(tab?.id)) return { ok: false, slotId, error: "TAB_ID_MISSING" };
  await mutateSlot(token, slotId, { phase: "OPENING", tabId: tab.id });
  return { ok: true, slotId, tabId: tab.id, windowId: tab.windowId };
}

async function verifySlotTab(token, sourceIdentity, opened) {
  if (!opened?.ok) return opened;
  const { slotId, tabId } = opened;
  await mutateSlot(token, slotId, { phase: "VERIFYING", tabId });
  let report;
  try { report = await waitForIdentity(tabId); }
  catch (error) {
    await mutateSlot(token, slotId, { phase: "ERROR", error: { code: "DESTINATION_CONTENT_UNAVAILABLE", detail: String(error) } });
    return { ok: false, slotId, tabId, error: "DESTINATION_CONTENT_UNAVAILABLE" };
  }
  if (!MYGPTWorkerRoute.sameWorkerIdentity(sourceIdentity, report.identity)) {
    await mutateSlot(token, slotId, { phase: "ERROR", error: { code: "WORKER_IDENTITY_MISMATCH", detail: { actual: report.identity?.workerKey || null } } });
    return { ok: false, slotId, tabId, error: "WORKER_IDENTITY_MISMATCH" };
  }
  const snapshot = await captureTab(tabId).catch(() => null);
  if (snapshot && !snapshot.composerCleared) {
    await mutateSlot(token, slotId, { phase: "ERROR", error: { code: "RESTORED_DRAFT_PRESENT" } });
    return { ok: false, slotId, tabId, error: "RESTORED_DRAFT_PRESENT" };
  }
  await mutateSlot(token, slotId, { phase: "STAGED", tabId, generationActive: report.generationActive === true });
  return { ok: true, slotId, tabId, report, snapshot };
}

async function activateTab(tabId) {
  await chrome.tabs.update(tabId, { active: true });
  await new Promise((resolve) => setTimeout(resolve, 250));
}

async function attachInMain(tabId, args) {
  await ensureMainRuntime(tabId);
  const execution = await chrome.scripting.executeScript({
    target: { tabId }, world: "MAIN",
    func: async (input) => {
      const adapter = globalThis.MYGPTChatGPTAdapter;
      if (!adapter) return { ok: false, reason: "MAIN_ADAPTER_UNAVAILABLE" };
      const stopSelectors = [
        'button[data-testid="stop-button"]', 'button[data-testid="composer-stop-button"]',
        'button[aria-label*="Stop generating"]', 'button[aria-label*="生成を停止"]'
      ];
      const generationActive = () => stopSelectors.some((selector) => document.querySelector(selector));
      if (generationActive()) return { ok: false, reason: "GENERATION_ALREADY_ACTIVE" };
      if (adapter.composerDraftText(document)) return { ok: false, reason: "COMPOSER_NOT_EMPTY" };
      const attachment = await adapter.attachFile(input.file, {
        document,
        composerTimeout: 15000,
        uploadTimeout: 90000,
        uploadInterval: 250,
        attachmentUiTimeout: 10000,
        maxAttachmentAttempts: 2,
        retryDelay: 750
      });
      if (!attachment.ok) return { ...attachment, submitted: false };
      return { ok: true, attachment, submitted: false, executionWorld: "MAIN" };
    },
    args: [args]
  });
  return execution?.[0]?.result || { ok: false, reason: "MAIN_ATTACH_NO_RESULT" };
}

async function pasteInMain(tabId, args) {
  await ensureMainRuntime(tabId);
  const execution = await chrome.scripting.executeScript({
    target: { tabId }, world: "MAIN",
    func: async (input) => {
      const adapter = globalThis.MYGPTChatGPTAdapter;
      if (!adapter) return { ok: false, reason: "MAIN_ADAPTER_UNAVAILABLE" };
      const pasted = await adapter.pastePrompt(input.packet, {
        document, window, editorTimeout: 15000, reflectTimeout: 5000
      });
      if (!pasted.ok) return { ...pasted, submitted: false };
      return { ok: true, pasted, submitted: false, executionWorld: "MAIN" };
    },
    args: [args]
  });
  return execution?.[0]?.result || { ok: false, reason: "MAIN_PASTE_NO_RESULT" };
}

async function activateSendInMain(tabId, args) {
  await ensureMainRuntime(tabId);
  const execution = await chrome.scripting.executeScript({
    target: { tabId }, world: "MAIN",
    func: async (input) => {
      const adapter = globalThis.MYGPTChatGPTAdapter;
      const stacker = globalThis.TranslationLoopPromptStacker;
      if (!adapter || !stacker) return { ok: false, reason: "MAIN_RUNTIME_UNAVAILABLE" };
      const runner = stacker.createRunner({ document, window });
      runner.start();
      const editor = adapter.getPromptRoot(document) || adapter.getPromptEditor(document);
      const button = await stacker.waitFor(() => runner.getSendButton(editor), { timeout: 10000, interval: 100 });
      if (!button) { runner.stop(); return { ok: false, reason: "SEND_BUTTON_NOT_READY" }; }

      window.dispatchEvent(new CustomEvent("MYGPT_V3_ARM_PAGE_OBSERVER", {
        detail: {
          nonce: input.nonce,
          promptPrefix: String(input.packet || "").split(/\r?\n/, 1)[0].slice(0, 96)
        }
      }));
      const activation = runner.clickSend(editor, { button, allowEnterFallback: false });
      runner.stop();
      if (!activation.ok) return { ok: false, reason: "SEND_ACTIVATION_FAILED", activation };
      return { ok: true, activation, nonce: input.nonce, submitted: true, executionWorld: "MAIN", observedAt: Date.now() };
    },
    args: [args]
  });
  return execution?.[0]?.result || { ok: false, reason: "MAIN_ACTIVATION_NO_RESULT" };
}

async function waitForSubmitEvidence(tabId, packet, nonce, before) {
  const startedAt = Date.now();
  let lastAfter = before;
  let lastDomEvidence = null;
  while (Date.now() - startedAt < SUBMIT_VERIFY_TIMEOUT_MS) {
    const network = pageEvidenceByNonce.get(nonce) || {};
    try {
      lastAfter = await captureTab(tabId);
      lastDomEvidence = TranslationLoopCore.evaluateSubmissionEvidence(packet, before, lastAfter, { rotation: true });
    } catch (_) {}
    if (network.commit || network.request || lastDomEvidence?.committed) {
      return {
        committed: true,
        proof: network.commit ? "autogpt-fetch-commit" : network.request ? "autogpt-fetch-request" : "translation-loop-dom",
        network,
        dom: lastDomEvidence,
        after: lastAfter
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 180));
  }
  return { committed: false, network: pageEvidenceByNonce.get(nonce) || {}, dom: lastDomEvidence, after: lastAfter };
}

async function failSequentialSlot(token, slotId, code, detail = null) {
  await mutateSlot(token, slotId, {
    phase: "ERROR",
    error: { code, detail }
  });
  await appendLog("slot_error", { slotId, code, detail });
  const runtime = await readRuntime();
  if (runtime.runToken !== token) return;
  if (runtime.activeSlotId === slotId) {
    await guard.mutateIfToken(token, (current) => ({
      next: { ...current, activeSlotId: null, phase: "PREPARING" }
    }));
  }
  await scheduleSequenceAlarm(token, "COOLDOWN", SLOT_COOLDOWN_MS);
}

async function beginNextSequentialSlot(token) {
  const runtime = await readRuntime();
  if (!runtime.enabled || runtime.runToken !== token || runtime.activeSlotId) return false;
  const next = runtime.slots.find((slot) => slot.phase === "QUEUED");
  if (!next) {
    await recomputeOverall(token);
    return false;
  }
  const opened = await openSlotTab(token, runtime.workerIdentity, next.slotId);
  if (!opened?.ok) {
    await failSequentialSlot(token, next.slotId, opened?.error || "TAB_CREATE_FAILED", opened || null);
    return false;
  }
  await guard.mutateIfToken(token, (current) => ({
    next: { ...current, activeSlotId: next.slotId, phase: "PREPARING" }
  }));
  await appendLog("slot_opened", { slotId: next.slotId, tabId: opened.tabId, openSettleMs: OPEN_SETTLE_MS });
  await scheduleSequenceAlarm(token, "OPEN_WAIT", OPEN_SETTLE_MS);
  return true;
}

async function handleOpenWait(token) {
  const runtime = await readRuntime();
  if (!runtime.enabled || runtime.runToken !== token || runtime.sequenceStage !== "OPEN_WAIT") return;
  const slot = runtime.slots.find((item) => item.slotId === runtime.activeSlotId);
  if (!slot || !Number.isInteger(slot.tabId)) return;

  const staged = await verifySlotTab(token, runtime.workerIdentity, {
    ok: true, slotId: slot.slotId, tabId: slot.tabId
  });
  if (!staged?.ok) {
    await failSequentialSlot(token, slot.slotId, staged?.error || "VERIFY_FAILED", staged || null);
    return;
  }

  const baseline = staged.snapshot || await captureTab(slot.tabId).catch(() => null);
  if (!baseline) {
    await failSequentialSlot(token, slot.slotId, "PREPARE_BASELINE_CAPTURE_FAILED");
    return;
  }

  const payload = await getPayload();
  if (!payloadValid(payload)) {
    await failSequentialSlot(token, slot.slotId, "PAYLOAD_NOT_READY");
    return;
  }

  let attached;
  try {
    attached = await attachInMain(slot.tabId, {
      slotId: slot.slotId,
      runToken: token,
      file: payload.file
    });
  } catch (error) {
    attached = { ok: false, reason: "MAIN_ATTACH_FAILED", detail: String(error) };
  }
  if (!attached?.ok) {
    await failSequentialSlot(token, slot.slotId, attached?.reason || "ATTACH_FAILED", attached || null);
    return;
  }

  await mutateSlot(token, slot.slotId, {
    phase: "ATTACHED",
    assistantBaselineCount: Number(baseline.assistantCount || 0),
    attachmentEvidence: attached.attachment?.evidence || null,
    attachmentUiEvidence: attached.attachment?.attachmentUiEvidence || null,
    error: null
  });
  await appendLog("slot_attached", {
    slotId: slot.slotId,
    tabId: slot.tabId,
    evidence: attached.attachment?.evidence || null,
    ui: attached.attachment?.attachmentUiEvidence || null,
    attachSettleMs: ATTACH_SETTLE_MS
  });
  await scheduleSequenceAlarm(token, "ATTACH_WAIT", ATTACH_SETTLE_MS);
}

async function handleAttachWait(token) {
  const runtime = await readRuntime();
  if (!runtime.enabled || runtime.runToken !== token || runtime.sequenceStage !== "ATTACH_WAIT") return;
  const slot = runtime.slots.find((item) => item.slotId === runtime.activeSlotId);
  if (!slot || !Number.isInteger(slot.tabId)) return;

  const payload = await getPayload();
  if (!payloadValid(payload)) {
    await failSequentialSlot(token, slot.slotId, "PAYLOAD_NOT_READY");
    return;
  }
  if (!(await guard.isCurrent(token))) return;

  let pasted;
  try {
    pasted = await pasteInMain(slot.tabId, {
      slotId: slot.slotId,
      runToken: token,
      packet: payload.packets[slot.slotId]
    });
  } catch (error) {
    pasted = { ok: false, reason: "MAIN_PASTE_FAILED", detail: String(error) };
  }
  if (!pasted?.ok) {
    await failSequentialSlot(token, slot.slotId, pasted?.reason || "PASTE_FAILED", pasted || null);
    return;
  }

  if (!(await guard.isCurrent(token))) return;
  const before = await captureTab(slot.tabId).catch(() => null);
  if (!before) {
    await failSequentialSlot(token, slot.slotId, "PRE_SUBMIT_CAPTURE_FAILED");
    return;
  }

  const nonce = crypto.randomUUID();
  await mutateSlot(token, slot.slotId, {
    phase: "SUBMITTING",
    submitNonce: nonce,
    insertionMethod: pasted.pasted?.method || null,
    terminalGateState: TranslationLoopTerminalGate.createGateState(Date.now())
  });

  let activation;
  try {
    activation = await activateSendInMain(slot.tabId, {
      packet: payload.packets[slot.slotId],
      nonce
    });
  } catch (error) {
    activation = { ok: false, reason: "MAIN_ACTIVATION_FAILED", detail: String(error) };
  }
  if (!activation?.ok || activation.submitted !== true || activation.activation?.activation !== "native-click") {
    await failSequentialSlot(token, slot.slotId, activation?.reason || "SUBMIT_FAILED", activation || null);
    return;
  }

  const evidence = await waitForSubmitEvidence(
    slot.tabId,
    payload.packets[slot.slotId],
    nonce,
    before
  );
  if (!evidence.committed) {
    await mutateSlot(token, slot.slotId, {
      activation: activation.activation?.activation || null
    });
    await failSequentialSlot(token, slot.slotId, "SUBMIT_EVIDENCE_TIMEOUT", evidence);
    return;
  }

  const after = evidence.after || {};
  const conversationId = evidence.network?.conversationId || after.conversationId || null;
  await mutateSlot(token, slot.slotId, {
    phase: after.generationActive ? "GENERATING" : "SUBMITTED",
    packetChars: pasted.pasted?.observedChars || payload.packets[slot.slotId].length,
    activation: activation.activation.activation,
    submitEvidence: evidence.proof,
    conversationId,
    generationActive: after.generationActive === true,
    generationStarted: true,
    lastMonitorAt: Date.now(),
    error: null
  });
  await guard.mutateIfToken(token, (current) => ({
    next: {
      ...current,
      phase: "MONITORING",
      sequenceStage: "WAIT_COMPLETE",
      nextActionAt: 0
    }
  }));
  await clearSequenceAlarm();
  await appendLog("slot_submitted", {
    slotId: slot.slotId,
    tabId: slot.tabId,
    nonce,
    proof: evidence.proof,
    conversationId
  });
}

async function scheduleAfterSequentialSlot(token, slotId) {
  const runtime = await readRuntime();
  if (!runtime.enabled || runtime.runToken !== token || runtime.activeSlotId !== slotId) return;
  await guard.mutateIfToken(token, (current) => ({
    next: { ...current, activeSlotId: null, phase: "PREPARING" }
  }));
  await scheduleSequenceAlarm(token, "COOLDOWN", SLOT_COOLDOWN_MS);
}

async function handleSequenceAlarm() {
  const runtime = await readRuntime();
  if (!runtime.enabled || !runtime.runToken) return;
  const token = runtime.runToken;
  if (runtime.sequenceStage === "OPEN_WAIT") {
    await handleOpenWait(token);
    return;
  }
  if (runtime.sequenceStage === "ATTACH_WAIT") {
    await handleAttachWait(token);
    return;
  }
  if (runtime.sequenceStage === "COOLDOWN") {
    await beginNextSequentialSlot(token);
  }
}

function monitorContentKey(snapshot) {
  return [snapshot.latestAssistantKey || "", snapshot.latestAssistantHash || "", snapshot.latestAssistantImageCount || 0].join(":");
}

async function processMonitorSnapshot(tabId, snapshot, source = "port") {
  const runtime = await readRuntime();
  if (!runtime.enabled || !runtime.runToken) return;
  const slot = runtime.slots.find((item) => item.tabId === tabId);
  if (!slot || ["IDLE", "QUEUED", "OPENING", "VERIFYING", "STAGED", "PREPARING", "ATTACHED", "SUBMITTING", "ERROR", "COMPLETE"].includes(slot.phase)) return;
  if (!MYGPTWorkerRoute.sameWorkerIdentity(runtime.workerIdentity, snapshot.identity)) return;

  const now = Date.now();
  const key = monitorContentKey(snapshot);
  const changed = key !== slot.monitorKey;
  const monitorChangedAt = changed ? now : (slot.monitorChangedAt || now);
  let generationEndedAt = slot.generationEndedAt || 0;
  if (slot.generationActive && !snapshot.generationActive) generationEndedAt = now;

  const gateState = slot.terminalGateState || TranslationLoopTerminalGate.createGateState(now);
  const classified = TranslationLoopTerminalGate.classifyTerminal(gateState, {
    contentKey: key,
    now,
    textLength: Number(snapshot.latestAssistantTextLength || 0),
    stopVisible: snapshot.generationActive === true,
    barVisible: snapshot.latestAssistantActionBarVisible === true,
    strongThinkingActive: snapshot.latestAssistantStrongThinkingActive === true
  }, {
    barConfirmCycles: 3,
    terminalMinStableMs: 1500,
    fallbackEnabled: true,
    fallbackStableMs: 3000,
    fallbackPostGenerationMs: 6000,
    generationEndedAt
  });

  const assistantAdvanced = Number(snapshot.assistantCount || 0) > Number(slot.assistantBaselineCount || 0);
  const stableMs = now - monitorChangedAt;
  const imageTerminal = Boolean(
    assistantAdvanced &&
    !snapshot.generationActive &&
    !snapshot.latestAssistantStrongThinkingActive &&
    Number(snapshot.latestAssistantImageCount || 0) > 0 &&
    stableMs >= 3000
  );
  const fallbackTurnTerminal = Boolean(
    assistantAdvanced &&
    !snapshot.generationActive &&
    !snapshot.latestAssistantStrongThinkingActive &&
    snapshot.latestAssistantActionBarVisible &&
    stableMs >= 5000
  );
  const complete = classified.terminal || imageTerminal || fallbackTurnTerminal;
  const proof = classified.proof || (imageTerminal ? "image-turn-stable" : fallbackTurnTerminal ? "voicebridge-turn-stable" : null);

  const mutation = await mutateSlot(runtime.runToken, slot.slotId, {
    phase: complete ? "COMPLETE" : snapshot.generationActive ? "GENERATING" : generationEndedAt ? "SETTLING" : "SUBMITTED",
    generationActive: snapshot.generationActive === true,
    generationStarted: slot.generationStarted || snapshot.generationActive === true,
    generationEndedAt,
    conversationId: snapshot.conversationId || slot.conversationId,
    monitorKey: key,
    monitorChangedAt,
    terminalGateState: classified.state,
    completionEvidence: complete ? proof : slot.completionEvidence,
    lastMonitorAt: now
  });
  if (!mutation.committed) return;
  if (complete) {
    await appendLog("slot_complete", { slotId: slot.slotId, tabId, proof, source });
    if (runtime.activeSlotId === slot.slotId && runtime.sequenceStage === "WAIT_COMPLETE") {
      await scheduleAfterSequentialSlot(runtime.runToken, slot.slotId);
    }
  }
  await recomputeOverall(runtime.runToken);
}

async function recomputeOverall(token) {
  const mutation = await guard.mutateIfToken(token, (runtime) => {
    const completeCount = runtime.slots.filter((slot) => slot.phase === "COMPLETE").length;
    const errorCount = runtime.slots.filter((slot) => slot.phase === "ERROR").length;
    const activeCount = runtime.slots.filter((slot) => ["OPENING", "VERIFYING", "STAGED", "PREPARING", "ATTACHED", "SUBMITTING", "SUBMITTED", "GENERATING", "SETTLING"].includes(slot.phase)).length;
    if (activeCount > 0) {
      return { next: { ...runtime, phase: errorCount ? "PARTIAL_MONITORING" : "MONITORING" } };
    }
    if (completeCount + errorCount === SLOT_IDS.length) {
      return {
        next: {
          ...runtime,
          enabled: false,
          runToken: null,
          phase: errorCount === 0 ? "COMPLETE" : completeCount > 0 ? "PARTIAL_COMPLETE" : "ERROR",
          error: errorCount ? { code: "ONE_OR_MORE_SLOTS_FAILED", detail: { completeCount, errorCount } } : null
        },
        value: { finished: true }
      };
    }
    return { next: runtime };
  });
  if (mutation.value?.finished) {
    await clearScanAlarm();
    await clearSequenceAlarm();
    const sourceTabId = mutation.runtime?.sourceTabId;
    if (Number.isInteger(sourceTabId)) {
      await chrome.tabs.update(sourceTabId, { active: true }).catch(() => {});
    }
  }
  return mutation.runtime;
}

async function startThree(message) {
  const sourceTabId = Number.isInteger(message?.sourceTabId) ? message.sourceTabId : null;
  if (!sourceTabId) return { ok: false, error: "SOURCE_TAB_MISSING" };
  const current = await readRuntime();
  if (current.enabled) return { ok: false, error: "RUN_ALREADY_ACTIVE", state: current };
  const payload = await getPayload();
  if (!payloadValid(payload)) return { ok: false, error: "PAYLOAD_NOT_READY", state: current };

  let sourceReport;
  try { sourceReport = await ensureContent(sourceTabId); }
  catch (error) { return { ok: false, error: "SOURCE_CONTENT_UNAVAILABLE", detail: String(error) }; }
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
        activeSlotId: null,
        sequenceStage: "STARTING",
        nextActionAt: 0,
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
  await ensureScanAlarm();
  await clearSequenceAlarm();
  await beginNextSequentialSlot(token);
  const state = await readRuntime();
  return { ok: true, state };
}

async function resetRuntime() {
  const current = await readRuntime();
  const ids = current.slots.map((slot) => slot.tabId).filter(Number.isInteger);
  for (const tabId of ids) { try { await chrome.tabs.remove(tabId); } catch (_) {} }
  pageEvidenceByNonce.clear();
  await clearScanAlarm();
  await clearSequenceAlarm();
  const state = await saveRuntime(emptyRuntime());
  return { ok: true, state };
}

async function focusSlot(slotId) {
  const state = await readRuntime();
  const slot = state.slots.find((item) => item.slotId === slotId);
  if (!Number.isInteger(slot?.tabId)) return { ok: false, error: "SLOT_TAB_MISSING", state };
  try { await activateTab(slot.tabId); return { ok: true, state }; }
  catch (error) { return { ok: false, error: "SLOT_FOCUS_FAILED", detail: String(error), state }; }
}

async function handleObserved(message, sender) {
  const tabId = sender?.tab?.id;
  const report = message?.report || {};
  const pageEvent = report.pageEvent || null;
  if (pageEvent?.nonce) {
    const previous = pageEvidenceByNonce.get(pageEvent.nonce) || {};
    if (pageEvent.kind === "conversation-request") previous.request = true;
    if (pageEvent.kind === "conversation-commit") {
      previous.commit = true;
      previous.conversationId = pageEvent.conversationId || previous.conversationId || null;
    }
    if (pageEvent.kind === "conversation-async") previous.async = true;
    if (pageEvent.kind === "websocket-conversation-update") previous.websocket = true;
    previous.lastAt = Date.now();
    pageEvidenceByNonce.set(pageEvent.nonce, previous);
  }
  if (Number.isInteger(tabId) && report.identity) await processMonitorSnapshot(tabId, report, message.reason || "observed");
  return { ok: true };
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== MONITOR_PORT) return;
  const key = portKey(port);
  monitorPorts.set(key, port);
  startScanPings();
  try { port.postMessage({ type: "mygpt-worker-scan-now", at: Date.now() }); } catch (_) {}
  port.onMessage.addListener((message) => {
    if (message?.type !== "mygpt-worker-monitor-state") return;
    const tabId = port.sender?.tab?.id;
    if (Number.isInteger(tabId) && message.snapshot) processMonitorSnapshot(tabId, message.snapshot, message.source || "port").catch(() => {});
  });
  port.onDisconnect.addListener(() => { monitorPorts.delete(key); });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SEQUENCE_ALARM) {
    handleSequenceAlarm().catch(() => {});
    return;
  }
  if (alarm.name !== SCAN_ALARM) return;
  readRuntime().then(async (runtime) => {
    if (!runtime.enabled || !runtime.runToken) return;
    for (const slot of runtime.slots) {
      if (!Number.isInteger(slot.tabId) || ["IDLE", "ERROR", "COMPLETE"].includes(slot.phase)) continue;
      try {
        const snapshot = await captureTab(slot.tabId);
        await processMonitorSnapshot(slot.tabId, snapshot, "watchdog");
      } catch (_) {}
    }
  }).catch(() => {});
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== "string") return false;
  let task;
  if (message.type === MSG.RUN_THREE) task = startThree(message);
  else if (message.type === MSG.RESET) task = resetRuntime();
  else if (message.type === MSG.GET_STATE) task = readRuntime().then((state) => ({ ok: true, state }));
  else if (message.type === MSG.FOCUS_SLOT) task = focusSlot(message.slotId);
  else if (message.type === MSG.OBSERVED) task = handleObserved(message, sender);
  else return false;
  task.then(sendResponse).catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  readRuntime().then(async (state) => {
    if (!state.enabled || !state.runToken) return;
    const slot = state.slots.find((item) => item.tabId === tabId);
    if (!slot || ["COMPLETE", "ERROR"].includes(slot.phase)) return;
    await mutateSlot(state.runToken, slot.slotId, { phase: "ERROR", error: { code: "WORKER_TAB_CLOSED", detail: { tabId } } });
    if (state.activeSlotId === slot.slotId) {
      await scheduleAfterSequentialSlot(state.runToken, slot.slotId);
    }
    await recomputeOverall(state.runToken);
  }).catch(() => {});
});

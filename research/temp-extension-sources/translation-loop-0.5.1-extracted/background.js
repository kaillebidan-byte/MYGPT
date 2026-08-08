"use strict";

importScripts("loop_core.js", "url_core.js", "rotation_verification.js", "prompt_stacker_storage.js", "runtime_guard.js");

const SETTINGS_KEY = "translationLoopSettings";
const RUNTIME_KEY = "translationLoopRuntime";
const LOGS_KEY = "translationLoopLogs";
const LOG_LIMIT = 300;
const SCAN_ALARM = "translation-loop-v051-scan-watchdog";
const SCAN_PERIOD_MINUTES = 0.5;
const ROTATION_ALARM = "translation-loop-v051-rotation-timeout";

const DEFAULT_SETTINGS = Object.freeze({
  continuePrompt: "作業の続きを",
  maxCompletedTurns: 3,
  maxChatCycles: 2,
  sendDelayMs: 1200,
  terminalMinStableMs: 1500,
  barConfirmCycles: 3,
  fallbackEnabled: false,
  fallbackStableMs: 3000,
  fallbackPostGenerationMs: 6000,
  responseTimeoutMinutes: 90,
  debugEnabled: true,
  rotationEnabled: true,
  continueAfterRotation: true,
  projectUrl: "",
  resumePrompt: "現状把握して作業の続きを",
  rotationTimeoutSeconds: 120,
  phaseCompletionMarker: "規定フェイズ完了"
});

const DEFAULT_RUNTIME = Object.freeze({
  enabled: false,
  phase: "IDLE",
  runToken: null,
  ownerTabId: null,
  completedTurns: 0,
  currentConversationId: null,
  previousConversationId: null,
  chatGeneration: 0,
  lastAssistantFingerprint: null,
  lastCompletionAt: 0,
  lastSubmitAt: 0,
  pendingSubmissionNonce: null,
  rotationNonce: null,
  rotationProjectUrl: null,
  rotationStartedAt: 0,
  lastVerifiedRotationNonce: null,
  lastVerifiedConversationId: null,
  lastVerifiedAt: 0,
  startedAt: 0,
  lastEventAt: 0,
  watchdogFailures: 0,
  lastError: null
});

let logWriteChain = Promise.resolve();
let rotationResumeChain = Promise.resolve();


const storage = TranslationLoopPromptStackerStorage.createStore({
  chrome,
  settingsKey: SETTINGS_KEY,
  runtimeKey: RUNTIME_KEY,
  logsKey: LOGS_KEY,
  defaultSettings: DEFAULT_SETTINGS,
  defaultRuntime: DEFAULT_RUNTIME
});

const runtimeGuard = TranslationLoopRuntimeGuard.createRuntimeGuard({
  readRuntime: () => storage.readRuntime(),
  saveRuntime,
  tokenFactory: () => crypto.randomUUID()
});

async function getState() {
  return storage.readState();
}

async function saveSettings(settings) {
  const sanitized = {
    continuePrompt: String(settings.continuePrompt || DEFAULT_SETTINGS.continuePrompt).trim(),
    maxCompletedTurns: clampInt(settings.maxCompletedTurns, 1, 20, 3),
    maxChatCycles: clampInt(settings.maxChatCycles, 1, 50, 2),
    sendDelayMs: clampInt(settings.sendDelayMs, 0, 30000, 1200),
    terminalMinStableMs: clampInt(settings.terminalMinStableMs, 500, 15000, 1500),
    barConfirmCycles: clampInt(settings.barConfirmCycles, 1, 10, 3),
    fallbackEnabled: Boolean(settings.fallbackEnabled),
    fallbackStableMs: clampInt(settings.fallbackStableMs, 1000, 30000, 3000),
    fallbackPostGenerationMs: clampInt(settings.fallbackPostGenerationMs, 2000, 60000, 6000),
    responseTimeoutMinutes: clampInt(settings.responseTimeoutMinutes, 5, 180, 90),
    debugEnabled: settings.debugEnabled !== false,
    rotationEnabled: settings.rotationEnabled !== false,
    continueAfterRotation: settings.continueAfterRotation !== false,
    projectUrl: String(settings.projectUrl || "").trim(),
    resumePrompt: String(settings.resumePrompt || DEFAULT_SETTINGS.resumePrompt).trim(),
    rotationTimeoutSeconds: clampInt(settings.rotationTimeoutSeconds, 30, 600, 120),
    phaseCompletionMarker: String(settings.phaseCompletionMarker || DEFAULT_SETTINGS.phaseCompletionMarker).trim()
  };
  if (!sanitized.continuePrompt) {
    sanitized.continuePrompt = DEFAULT_SETTINGS.continuePrompt;
  }
  if (!sanitized.resumePrompt) {
    sanitized.resumePrompt = DEFAULT_SETTINGS.resumePrompt;
  }
  if (!sanitized.phaseCompletionMarker) {
    sanitized.phaseCompletionMarker = DEFAULT_SETTINGS.phaseCompletionMarker;
  }
  if (sanitized.projectUrl) {
    sanitized.projectUrl = normalizeProjectUrl(sanitized.projectUrl);
  }
  return storage.saveSettings(sanitized);
}

async function saveRuntime(runtime) {
  const next = {
    ...DEFAULT_RUNTIME,
    ...runtime,
    lastEventAt: Date.now()
  };
  await storage.saveRuntime(next);
  await updateBadge(next);
  return next;
}

function clampInt(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

const { evaluateChatLimit } = TranslationLoopCore;

const {
  isChatGptUrl,
  projectIdentityFromUrl,
  projectRouteSegmentFromUrl,
  conversationIdFromUrl,
  normalizeProjectUrl,
  hasProjectSlug,
  validateProjectMembership
} = TranslationLoopUrlCore;

async function detectCanonicalProjectUrlInTab(tabId) {
  await ensureContentScript(tabId);
  const result = await sendToTab(tabId, {
    type: "translation-loop-v051:detect-project-url"
  }).catch(() => null);
  if (!result?.ok || !result.projectUrl) return null;
  return normalizeProjectUrl(result.projectUrl);
}

async function resolveProjectUrlForTab(tab, configuredProjectUrl = "") {
  if (!tab?.id || !tab.url || !projectIdentityFromUrl(tab.url)) {
    throw new Error("現在のタブからプロジェクトを確認できない");
  }

  const configured = configuredProjectUrl ? normalizeProjectUrl(configuredProjectUrl) : "";
  if (configured && !validateProjectMembership(tab.url, configured)) {
    throw new Error("現在のチャットと設定済みプロジェクトが一致しない");
  }
  if (configured && hasProjectSlug(configured)) return configured;

  if (hasProjectSlug(tab.url)) return normalizeProjectUrl(tab.url);

  const detected = await detectCanonicalProjectUrlInTab(tab.id);
  if (detected && validateProjectMembership(tab.url, detected) && hasProjectSlug(detected)) {
    return detected;
  }

  throw new Error("正式なプロジェクトURLを確認できない。プロジェクトページを一度開いて設定する必要がある");
}


async function updateBadge(runtime) {
  let text = "";
  let color = "#777777";
  if (runtime.enabled) {
    text = String(runtime.completedTurns || 0);
    color = "#2f6feb";
  } else if (runtime.phase === "ERROR") {
    text = "!";
    color = "#b42318";
  } else if (["TARGET_REACHED", "ROTATION_VERIFIED", "PHASE_COMPLETED", "RUN_COMPLETED"].includes(runtime.phase)) {
    text = "✓";
    color = "#397847";
  } else if (["ROTATING", "WAITING_PROJECT", "SENDING_RESUME", "AWAITING_NEW_CONVERSATION", "RESTARTING_AFTER_ROTATION"].includes(runtime.phase)) {
    text = "R";
    color = "#8a5a00";
  }
  await chrome.action.setBadgeBackgroundColor({ color }).catch(() => {});
  await chrome.action.setBadgeText({ text }).catch(() => {});
}

async function ensureScanAlarm() {
  const existing = await chrome.alarms.get(SCAN_ALARM).catch(() => null);
  if (existing) return;
  await chrome.alarms.create(SCAN_ALARM, { periodInMinutes: SCAN_PERIOD_MINUTES });
}

async function clearScanAlarm() {
  await chrome.alarms.clear(SCAN_ALARM).catch(() => {});
}

async function appendLog(event, sender = null) {
  logWriteChain = logWriteChain.then(async () => {
    const { settings } = await getState();
    if (!settings.debugEnabled) return;
    const logs = await storage.readLogs();
    logs.push({
      at: new Date().toISOString(),
      event: String(event?.event || "unknown"),
      tabId: sender?.tab?.id ?? event?.tabId ?? null,
      url: sender?.tab?.url || event?.url || "",
      details: event?.details && typeof event.details === "object" ? event.details : {}
    });
    if (logs.length > LOG_LIMIT) logs.splice(0, logs.length - LOG_LIMIT);
    await storage.saveLogs(logs);
  }).catch(() => {});
  return logWriteChain;
}

async function sendToTab(tabId, message) {
  if (!Number.isInteger(tabId)) throw new Error("対象タブがない");
  return chrome.tabs.sendMessage(tabId, message);
}

async function ensureContentScript(tabId) {
  try {
    const response = await sendToTab(tabId, { type: "translation-loop-v051:probe" });
    if (response?.ok) return true;
  } catch (_) {
    // Inject below. This covers tabs that were already open when the extension was installed or updated.
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["loop_core.js", "terminal_gate.js", "prompt_stacker_runner.js", "content.js"]
  });

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    try {
      const response = await sendToTab(tabId, { type: "translation-loop-v051:probe" });
      if (response?.ok) return true;
    } catch (_) {
      // Retry until the injected content script installs its listener.
    }
  }
  throw new Error("コンテンツスクリプトを起動できない");
}

async function enterError(message, details = {}, expectedRunToken = null) {
  const mutation = await runtimeGuard.mutate(async (runtime) => {
    if (expectedRunToken && runtime.runToken !== expectedRunToken) {
      return { value: { ignored: true }, reason: "stale-run-token" };
    }
    if (expectedRunToken && !runtime.enabled && ["PAUSED", "IDLE", "PHASE_COMPLETED", "TARGET_REACHED", "RUN_COMPLETED"].includes(runtime.phase)) {
      return { value: { ignored: true }, reason: `terminal-${runtime.phase}` };
    }
    return {
      next: {
        ...runtime,
        enabled: false,
        phase: "ERROR",
        runToken: null,
        pendingSubmissionNonce: null,
        watchdogFailures: 0,
        lastError: String(message || "不明なエラー")
      },
      value: { ignored: false, ownerTabId: runtime.ownerTabId }
    };
  });

  if (!mutation.committed) return mutation.runtime;
  await Promise.all([
    chrome.alarms.clear(ROTATION_ALARM).catch(() => {}),
    clearScanAlarm()
  ]);
  await appendLog({
    event: "runtime_error",
    tabId: mutation.value?.ownerTabId ?? mutation.runtime.ownerTabId,
    details: { message, ...details }
  });
  if (Number.isInteger(mutation.value?.ownerTabId)) {
    await sendToTab(mutation.value.ownerTabId, { type: "translation-loop-v051:stop", reason: "error" }).catch(() => {});
  }
  return mutation.runtime;
}

const rotationVerificationCoordinator = TranslationLoopRotationVerification.createRotationVerificationCoordinator({
  readRuntime: async () => (await getState()).runtime,
  saveRuntime: async (nextRuntime) => {
    const mutation = await runtimeGuard.mutateIfToken(nextRuntime.runToken, async (current) => {
      if (!["SENDING_RESUME", "AWAITING_NEW_CONVERSATION"].includes(current.phase)) {
        return { value: null, reason: `phase-${current.phase}` };
      }
      if (current.rotationNonce !== nextRuntime.lastVerifiedRotationNonce) {
        return { value: null, reason: "rotation-nonce-changed" };
      }
      return { next: { ...current, ...nextRuntime, runToken: current.runToken } };
    });
    return mutation.runtime;
  },
  clearAlarm: () => chrome.alarms.clear(ROTATION_ALARM).catch(() => {}),
  appendVerifiedLog: ({ tabId, details }) => appendLog({
    event: "rotation_verified",
    tabId,
    details
  }),
  fail: (message, details = {}) => enterError(message, details, details.runToken || null),
  conversationIdFromUrl,
  validateProjectMembership,
  now: () => Date.now()
});

async function resumeRotationAtProjectUnlocked(tabId, url) {
  const { settings, runtime } = await getState();
  const runToken = runtime.runToken;
  if (!runtime.enabled || !runToken || runtime.ownerTabId !== tabId || runtime.phase !== "ROTATING") return;
  if (!validateProjectMembership(url, runtime.rotationProjectUrl || settings.projectUrl)) {
    await enterError("プロジェクト外へ移動した", { url }, runToken);
    return;
  }
  if (conversationIdFromUrl(url)) return;

  const nonce = runtime.rotationNonce || crypto.randomUUID();
  const claimed = await runtimeGuard.mutateIfToken(runToken, async (current) => {
    if (current.ownerTabId !== tabId || current.phase !== "ROTATING") {
      return { value: null, reason: `phase-${current.phase}` };
    }
    return {
      next: {
        ...current,
        phase: "SENDING_RESUME",
        rotationNonce: nonce,
        pendingSubmissionNonce: nonce
      }
    };
  });
  if (!claimed.committed) return;
  await appendLog({ event: "project_composer_wait", tabId, details: { url, nonce } });

  try {
    await ensureContentScript(tabId);
    if (!(await runtimeGuard.isCurrent(runToken))) return;
    const result = await sendToTab(tabId, {
      type: "translation-loop-v051:rotation-submit",
      prompt: settings.resumePrompt,
      nonce,
      runToken,
      expectedProjectUrl: claimed.runtime.rotationProjectUrl || settings.projectUrl
    });
    if (!result?.ok) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      if (!(await runtimeGuard.isCurrent(runToken))) return;
      const tab = await chrome.tabs.get(tabId).catch(() => null);
      if (tab?.url && await verifyNewConversation(tabId, tab.url)) return;
      const latest = await getState();
      if (latest.runtime.phase === "ROTATION_VERIFIED" || latest.runtime.runToken !== runToken) return;
      await enterError(result?.error || "新規チャット開始文を送信できない", { nonce, url }, runToken);
      return;
    }

    const awaited = await runtimeGuard.mutateIfToken(runToken, async (current) => {
      if (current.phase === "ROTATION_VERIFIED") return { value: { verified: true }, reason: "already-verified" };
      if (current.ownerTabId !== tabId || current.phase !== "SENDING_RESUME" || current.rotationNonce !== nonce) {
        return { value: null, reason: `phase-${current.phase}` };
      }
      return {
        next: {
          ...current,
          phase: "AWAITING_NEW_CONVERSATION",
          pendingSubmissionNonce: null,
          lastSubmitAt: Date.now()
        }
      };
    });
    if (!awaited.committed) return;
    await appendLog({
      event: "rotation_submit_evidence_accepted",
      tabId,
      details: {
        nonce,
        projectUrl: awaited.runtime.rotationProjectUrl,
        activation: result.activation || null,
        button: result.button || null,
        evidence: result.evidence || null
      }
    });
    await appendLog({
      event: "rotation_submit_dispatched",
      tabId,
      details: { nonce, url, duplicate: Boolean(result.duplicate) }
    });
    const evidenceUrl = result?.evidence?.currentUrl;
    if (evidenceUrl && conversationIdFromUrl(evidenceUrl)) {
      await verifyNewConversation(tabId, evidenceUrl);
    }
  } catch (error) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    if (!(await runtimeGuard.isCurrent(runToken))) return;
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (tab?.url && await verifyNewConversation(tabId, tab.url)) return;
    const latest = await getState();
    if (latest.runtime.phase === "ROTATION_VERIFIED" || latest.runtime.runToken !== runToken) return;
    await enterError("プロジェクト画面の入力欄へ接続できない", {
      error: error.message,
      nonce,
      url
    }, runToken);
  }
}

function resumeRotationAtProject(tabId, url) {
  const execution = rotationResumeChain.then(
    () => resumeRotationAtProjectUnlocked(tabId, url),
    () => resumeRotationAtProjectUnlocked(tabId, url)
  );
  rotationResumeChain = execution.catch(() => {});
  return execution;
}

async function restartLoopAfterRotation(tabId, url, verifiedRuntime) {
  const { settings, runtime } = await getState();
  const newConversationId = conversationIdFromUrl(url);
  const runToken = runtime.runToken;
  if (!settings.continueAfterRotation) return verifiedRuntime;
  if (!runToken || !newConversationId || runtime.phase !== "ROTATION_VERIFIED") return runtime;
  if (runtime.currentConversationId !== newConversationId) {
    return enterError("再開対象の新規会話IDが一致しない", {
      expectedConversationId: runtime.currentConversationId,
      actualConversationId: newConversationId
    }, runToken);
  }

  const restartingMutation = await runtimeGuard.mutateIfToken(runToken, async (current) => {
    if (current.phase !== "ROTATION_VERIFIED" || current.currentConversationId !== newConversationId) {
      return { value: null, reason: `phase-${current.phase}` };
    }
    return {
      next: {
        ...current,
        enabled: true,
        phase: "RESTARTING_AFTER_ROTATION",
        completedTurns: 0,
        lastAssistantFingerprint: null,
        lastCompletionAt: 0,
        pendingSubmissionNonce: null,
        watchdogFailures: 0,
        lastError: null
      }
    };
  });
  if (!restartingMutation.committed) return restartingMutation.runtime;

  try {
    await ensureContentScript(tabId);
    if (!(await runtimeGuard.isCurrent(runToken))) return (await getState()).runtime;
    const startup = await sendToTab(tabId, {
      type: "translation-loop-v051:start",
      settings,
      runToken,
      waitForSubmittedResponse: true,
      reason: "rotation-resume"
    });
    if (!startup?.ok) {
      return enterError(startup?.error || "新規チャット側の監視を再開できない", {
        tabId,
        newConversationId
      }, runToken);
    }

    const resumed = await runtimeGuard.mutateIfToken(runToken, async (current) => {
      if (current.phase !== "RESTARTING_AFTER_ROTATION" || current.currentConversationId !== newConversationId) {
        return { value: null, reason: `phase-${current.phase}` };
      }
      return {
        next: {
          ...current,
          enabled: true,
          phase: "WAITING_RESPONSE",
          completedTurns: 0,
          currentConversationId: newConversationId,
          lastAssistantFingerprint: null,
          pendingSubmissionNonce: null,
          watchdogFailures: 0,
          lastError: null
        }
      };
    });
    if (!resumed.committed) return resumed.runtime;
    await ensureScanAlarm();
    await appendLog({
      event: "rotation_loop_resumed",
      tabId,
      details: {
        newConversationId,
        chatGeneration: resumed.runtime.chatGeneration,
        mode: startup.mode || "waiting-submitted-response"
      }
    });
    return resumed.runtime;
  } catch (error) {
    return enterError("新規チャット側の監視を再開できない", {
      error: error.message,
      tabId,
      newConversationId,
      phase: restartingMutation.runtime.phase
    }, runToken);
  }
}

async function verifyNewConversation(tabId, url) {
  const result = await rotationVerificationCoordinator.verify({ tabId, url });
  if (result?.verified && result?.alreadyVerified === false) {
    await restartLoopAfterRotation(tabId, url, result.runtime);
  }
  return Boolean(result?.verified);
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SCAN_ALARM) {
    getState().then(async ({ settings, runtime }) => {
      const runToken = runtime.runToken;
      if (!runtime.enabled || !runToken || runtime.phase !== "WAITING_RESPONSE" || !Number.isInteger(runtime.ownerTabId)) {
        await clearScanAlarm();
        return;
      }
      const tab = await chrome.tabs.get(runtime.ownerTabId).catch(() => null);
      if (!tab) {
        await enterError("実行中のChatGPTタブを確認できない", {}, runToken);
        return;
      }
      if (tab.discarded) {
        await enterError("実行中のChatGPTタブがブラウザにより破棄された", { tabId: runtime.ownerTabId }, runToken);
        return;
      }
      if (!isChatGptUrl(tab.url)) {
        await enterError("実行中のタブがChatGPT外へ移動した", { url: tab.url }, runToken);
        return;
      }
      if (settings.projectUrl && !validateProjectMembership(tab.url, settings.projectUrl)) {
        await enterError("実行中のタブが設定済みプロジェクト外へ移動した", { url: tab.url }, runToken);
        return;
      }
      const tabConversationId = conversationIdFromUrl(tab.url);
      if (runtime.currentConversationId && tabConversationId !== runtime.currentConversationId) {
        await enterError("実行中の会話IDが変化した", {
          expectedConversationId: runtime.currentConversationId,
          actualConversationId: tabConversationId,
          url: tab.url
        }, runToken);
        return;
      }

      const response = await sendToTab(runtime.ownerTabId, {
        type: "translation-loop-v051:scan-now",
        source: "background-alarm"
      }).catch((error) => ({ ok: false, error: error.message }));
      if (!response?.ok) {
        const failed = await runtimeGuard.mutateIfToken(runToken, async (current) => ({
          next: { ...current, watchdogFailures: (current.watchdogFailures || 0) + 1 }
        }));
        if (!failed.committed) return;
        await appendLog({
          event: "scan_watchdog_unavailable",
          tabId: runtime.ownerTabId,
          details: {
            error: response?.error || "no response",
            consecutiveFailures: failed.runtime.watchdogFailures
          }
        });
        if (failed.runtime.watchdogFailures >= 2) {
          await enterError("対象タブの監視へ連続して接続できない", {
            tabId: runtime.ownerTabId,
            consecutiveFailures: failed.runtime.watchdogFailures
          }, runToken);
        }
        return;
      }
      if (response.runToken !== runToken) {
        await enterError("対象タブの監視世代が一致しない", {
          tabId: runtime.ownerTabId,
          expectedRunToken: runToken,
          actualRunToken: response.runToken || null
        }, runToken);
        return;
      }
      if (response.active !== true) {
        await enterError("対象タブの監視状態が失われた", {
          tabId: runtime.ownerTabId,
          armed: response.armed,
          sending: response.sending,
          visibility: response.visibility
        }, runToken);
        return;
      }
      if (runtime.watchdogFailures) {
        await runtimeGuard.mutateIfToken(runToken, async (current) => ({
          next: { ...current, watchdogFailures: 0 }
        }));
      }
    }).catch(() => {});
    return;
  }
  if (alarm.name !== ROTATION_ALARM) return;
  getState().then(({ runtime }) => {
    if (runtime.enabled && runtime.runToken && ["ROTATING", "SENDING_RESUME", "AWAITING_NEW_CONVERSATION"].includes(runtime.phase)) {
      return enterError("新規チャット作成が制限時間内に完了しなかった", {
        phase: runtime.phase,
        projectUrl: runtime.rotationProjectUrl
      }, runtime.runToken);
    }
  }).catch(() => {});
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  getState().then(async ({ settings, runtime }) => {
    const runToken = runtime.runToken;
    if (!runtime.enabled || !runToken || runtime.ownerTabId !== tabId) return;
    if (changeInfo.discarded === true || tab.discarded === true) {
      await enterError("実行中のChatGPTタブがブラウザにより破棄された", { tabId, phase: runtime.phase }, runToken);
      return;
    }

    const url = changeInfo.url || tab.url || "";
    if (url && !isChatGptUrl(url)) {
      await enterError("実行中のタブがChatGPT外へ移動した", { url, phase: runtime.phase }, runToken);
      return;
    }

    const rotationPhase = ["ROTATING", "SENDING_RESUME", "AWAITING_NEW_CONVERSATION"].includes(runtime.phase);
    if (rotationPhase) {
      if (!url) return;
      if (!validateProjectMembership(url, runtime.rotationProjectUrl)) {
        await enterError("ローテーション中にプロジェクト外へ移動した", { url, phase: runtime.phase }, runToken);
        return;
      }
      if (await verifyNewConversation(tabId, url)) return;
      if (runtime.phase === "ROTATING" && changeInfo.status === "complete") {
        await resumeRotationAtProject(tabId, url);
      }
      return;
    }

    if (url && settings.projectUrl && !validateProjectMembership(url, settings.projectUrl)) {
      await enterError("実行中に設定済みプロジェクト外へ移動した", { url, phase: runtime.phase }, runToken);
      return;
    }
    if (url && ["STARTING", "SENDING", "WAITING_RESPONSE", "RESTARTING_AFTER_ROTATION"].includes(runtime.phase)) {
      const actualConversationId = conversationIdFromUrl(url);
      if (runtime.currentConversationId && actualConversationId !== runtime.currentConversationId) {
        await enterError("実行中に意図しない別チャットへ移動した", {
          expectedConversationId: runtime.currentConversationId,
          actualConversationId,
          url,
          phase: runtime.phase
        }, runToken);
      }
    }
  }).catch(() => {});
});

chrome.runtime.onInstalled.addListener(async () => {
  // Prompt Stacker-style migration: preserve the local 0.3.x settings, then
  // mirror them to sync storage. Runtime/logs remain local to this browser.
  const { settings, runtime } = await getState();
  await storage.saveSettings(settings);
  await storage.saveRuntime(runtime);
  await storage.saveLogs(await storage.readLogs());
  if (runtime.enabled) {
    await enterError("拡張機能更新後の自動復旧は未実装", {}, runtime.runToken || null);
    return;
  }
  await clearScanAlarm();
  await updateBadge(runtime);
});

chrome.runtime.onStartup.addListener(() => {
  getState().then(async ({ runtime }) => {
    if (runtime.enabled) {
      await enterError("ブラウザ再起動後の自動復旧は未実装", {}, runtime.runToken || null);
      return;
    }
    await clearScanAlarm();
  }).catch(() => {});
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const { runtime } = await getState();
  if (runtime.enabled && runtime.ownerTabId === tabId) {
    await enterError("実行中のChatGPTタブが閉じられた", {}, runtime.runToken || null);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") return false;

  if (message.type === "translation-loop-v051:debug") {
    appendLog(message, sender).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "translation-loop-v051:get-state") {
    Promise.all([getState(), storage.readLogs()]).then(([state, logs]) => {
      sendResponse({ ok: true, ...state, logs });
    });
    return true;
  }

  if (message.type === "translation-loop-v051:update-settings") {
    saveSettings(message.settings || {})
      .then((settings) => sendResponse({ ok: true, settings }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "translation-loop-v051:detect-project-url") {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url || !projectIdentityFromUrl(tab.url)) {
        sendResponse({ ok: false, error: "現在のタブからプロジェクトURLを確認できない" });
        return;
      }
      const { settings } = await getState();
      const projectUrl = await resolveProjectUrlForTab(tab, settings.projectUrl || "");
      sendResponse({ ok: true, projectUrl });
    })().catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "translation-loop-v051:start") {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !isChatGptUrl(tab.url)) {
        sendResponse({ ok: false, error: "ChatGPTのタブで開始する必要がある" });
        return;
      }

      let { settings } = await getState();
      if (settings.rotationEnabled) {
        const projectUrl = await resolveProjectUrlForTab(tab, settings.projectUrl || "");
        if (projectUrl !== settings.projectUrl) {
          settings = await saveSettings({ ...settings, projectUrl });
          await appendLog({ event: "project_url_detected", tabId: tab.id, details: { projectUrl } });
        }
      }

      const runToken = runtimeGuard.newToken();
      const claim = await runtimeGuard.mutate(async (runtime) => {
        const activePhases = [
          "STARTING", "SENDING", "WAITING_RESPONSE", "ROTATING", "SENDING_RESUME",
          "AWAITING_NEW_CONVERSATION", "RESTARTING_AFTER_ROTATION"
        ];
        if (runtime.enabled || activePhases.includes(runtime.phase)) {
          return {
            value: {
              accepted: false,
              error: runtime.ownerTabId === tab.id
                ? "このタブではすでに開始処理または実行中"
                : "別のChatGPTタブですでに実行中"
            },
            reason: "already-running"
          };
        }
        return {
          next: {
            ...DEFAULT_RUNTIME,
            enabled: true,
            phase: "STARTING",
            runToken,
            ownerTabId: tab.id,
            completedTurns: 0,
            startedAt: Date.now(),
            lastEventAt: Date.now()
          },
          value: { accepted: true }
        };
      });
      if (!claim.committed) {
        sendResponse({ ok: false, error: claim.value?.error || "開始処理を確定できない" });
        return;
      }

      await appendLog({
        event: "run_start_requested",
        tabId: tab.id,
        details: { maxCompletedTurns: settings.maxCompletedTurns, maxChatCycles: settings.maxChatCycles, runToken }
      });

      try {
        await ensureContentScript(tab.id);
      } catch (error) {
        await enterError("コンテンツスクリプトを起動できない", { error: error.message }, runToken);
        sendResponse({ ok: false, error: error.message });
        return;
      }
      if (!(await runtimeGuard.isCurrent(runToken))) {
        sendResponse({ ok: false, error: "開始処理は途中で停止された" });
        return;
      }

      let startup;
      try {
        startup = await sendToTab(tab.id, {
          type: "translation-loop-v051:start",
          settings,
          runToken
        });
      } catch (error) {
        await enterError("コンテンツスクリプトへ接続できない", { error: error.message }, runToken);
        sendResponse({ ok: false, error: error.message });
        return;
      }
      if (!startup?.ok) {
        await enterError(startup?.error || "開始準備に失敗した", {}, runToken);
        sendResponse({ ok: false, error: startup?.error || "開始準備に失敗した" });
        return;
      }

      if (startup.mode === "waiting-current-generation") {
        const waiting = await runtimeGuard.mutateIfToken(runToken, async (runtime) => {
          if (runtime.phase !== "STARTING") return { value: null, reason: `phase-${runtime.phase}` };
          return {
            next: {
              ...runtime,
              enabled: true,
              phase: "WAITING_RESPONSE",
              completedTurns: 0,
              currentConversationId: startup.conversationId || null,
              watchdogFailures: 0,
              lastError: null
            }
          };
        });
        if (!waiting.committed) {
          sendResponse({ ok: false, error: "開始処理は途中で停止された" });
          return;
        }
        await ensureScanAlarm();
        await appendLog({
          event: "run_started",
          tabId: tab.id,
          details: { mode: startup.mode, maxCompletedTurns: settings.maxCompletedTurns, maxChatCycles: settings.maxChatCycles }
        });
        sendResponse({ ok: true, runtime: waiting.runtime });
        return;
      }

      const nonce = crypto.randomUUID();
      const sendingClaim = await runtimeGuard.mutateIfToken(runToken, async (runtime) => {
        if (runtime.phase !== "STARTING") return { value: null, reason: `phase-${runtime.phase}` };
        return {
          next: {
            ...runtime,
            phase: "SENDING",
            currentConversationId: startup.conversationId || null,
            pendingSubmissionNonce: nonce
          }
        };
      });
      if (!sendingClaim.committed) {
        sendResponse({ ok: false, error: "開始処理は途中で停止された" });
        return;
      }
      await appendLog({
        event: "initial_submission_requested",
        tabId: tab.id,
        details: { nonce, maxCompletedTurns: settings.maxCompletedTurns, maxChatCycles: settings.maxChatCycles }
      });

      const result = await sendToTab(tab.id, {
        type: "translation-loop-v051:submit",
        prompt: settings.continuePrompt,
        nonce,
        runToken,
        delayMs: 0,
        reason: "initial-start"
      }).catch((error) => ({ ok: false, error: error.message }));

      if (!result?.ok) {
        if (await runtimeGuard.isCurrent(runToken)) {
          await enterError(result?.error || "開始時の固定文送信に失敗した", { nonce }, runToken);
        }
        sendResponse({ ok: false, error: result?.error || "開始時の固定文送信に失敗した" });
        return;
      }

      const waiting = await runtimeGuard.mutateIfToken(runToken, async (runtime) => {
        if (runtime.phase !== "SENDING" || runtime.pendingSubmissionNonce !== nonce) {
          return { value: null, reason: `phase-${runtime.phase}` };
        }
        return {
          next: {
            ...runtime,
            enabled: true,
            phase: "WAITING_RESPONSE",
            currentConversationId: result.conversationId || startup.conversationId || null,
            pendingSubmissionNonce: null,
            lastSubmitAt: Date.now(),
            watchdogFailures: 0,
            lastError: null
          }
        };
      });
      if (!waiting.committed) {
        sendResponse({ ok: false, error: "開始処理は途中で停止された" });
        return;
      }
      await ensureScanAlarm();
      await appendLog({
        event: "run_started",
        tabId: tab.id,
        details: { mode: "initial-submit", maxCompletedTurns: settings.maxCompletedTurns, maxChatCycles: settings.maxChatCycles }
      });
      sendResponse({ ok: true, runtime: waiting.runtime });
    })().catch(async (error) => {
      const { runtime } = await getState();
      await enterError(error.message, {}, runtime.runToken || null);
      sendResponse({ ok: false, error: error.message });
    });
    return true;
  }

  if (message.type === "translation-loop-v051:pause") {
    (async () => {
      const stopped = await runtimeGuard.mutate(async (runtime) => ({
        next: {
          ...runtime,
          enabled: false,
          phase: "PAUSED",
          runToken: null,
          pendingSubmissionNonce: null,
          watchdogFailures: 0,
          lastError: null
        },
        value: { ownerTabId: runtime.ownerTabId }
      }));
      await Promise.all([
        chrome.alarms.clear(ROTATION_ALARM).catch(() => {}),
        clearScanAlarm()
      ]);
      if (Number.isInteger(stopped.value?.ownerTabId)) {
        await sendToTab(stopped.value.ownerTabId, { type: "translation-loop-v051:stop", reason: "manual-pause" }).catch(() => {});
      }
      await appendLog({ event: "run_paused", tabId: stopped.value?.ownerTabId, details: {} });
      sendResponse({ ok: true, runtime: stopped.runtime });
    })().catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "translation-loop-v051:reset") {
    (async () => {
      const stopped = await runtimeGuard.mutate(async (runtime) => ({
        next: { ...DEFAULT_RUNTIME, runToken: null },
        value: { ownerTabId: runtime.ownerTabId }
      }));
      await Promise.all([
        chrome.alarms.clear(ROTATION_ALARM).catch(() => {}),
        clearScanAlarm()
      ]);
      if (Number.isInteger(stopped.value?.ownerTabId)) {
        await sendToTab(stopped.value.ownerTabId, { type: "translation-loop-v051:stop", reason: "reset" }).catch(() => {});
      }
      await storage.clearLogs();
      sendResponse({ ok: true, runtime: stopped.runtime });
    })().catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "translation-loop-v051:assistant-complete") {
    (async () => {
      const tabId = sender.tab?.id ?? null;
      const runToken = String(message.runToken || "");
      const fingerprint = String(message.fingerprint || "");
      if (!runToken) {
        sendResponse({ ok: true, action: "stop", accepted: false, reason: "missing-run-token" });
        return;
      }
      if (!fingerprint) {
        await enterError("完了回答の識別子が空だった", {}, runToken);
        sendResponse({ ok: false, action: "stop", error: "empty fingerprint" });
        return;
      }

      const { settings } = await getState();
      const sourceUrl = sender.tab?.url || "";
      const decision = await runtimeGuard.mutateIfToken(runToken, async (runtime) => {
        if (!runtime.enabled || runtime.ownerTabId !== tabId) {
          return { value: { action: "stop", accepted: false, reason: "not-owner-or-disabled" } };
        }
        if (runtime.lastAssistantFingerprint === fingerprint) {
          return { value: { action: "ignore", accepted: true, reason: "duplicate-completion" } };
        }
        if (["STARTING", "RESTARTING_AFTER_ROTATION"].includes(runtime.phase)) {
          return { value: { action: "retry", accepted: false, reason: `phase-${runtime.phase}` } };
        }
        if (runtime.phase !== "WAITING_RESPONSE") {
          return { value: { action: "retry", accepted: false, reason: `phase-${runtime.phase}` } };
        }

        const completedTurns = runtime.completedTurns + 1;
        const common = {
          ...runtime,
          currentConversationId: String(message.conversationId || runtime.currentConversationId || ""),
          lastAssistantFingerprint: fingerprint,
          lastCompletionAt: Date.now(),
          completedTurns,
          watchdogFailures: 0
        };

        if (message.phaseCompletionMatched === true) {
          return {
            next: {
              ...common,
              enabled: false,
              phase: "PHASE_COMPLETED",
              runToken: null,
              pendingSubmissionNonce: null,
              lastError: null
            },
            value: { action: "stop", accepted: true, reason: "phase-completion-marker", completedTurns }
          };
        }

        if (completedTurns >= settings.maxCompletedTurns) {
          const chatLimit = evaluateChatLimit(runtime.chatGeneration, settings.maxChatCycles);
          if (chatLimit.reached) {
            return {
              next: {
                ...common,
                enabled: false,
                phase: "RUN_COMPLETED",
                runToken: null,
                pendingSubmissionNonce: null,
                lastError: null
              },
              value: {
                action: "stop",
                accepted: true,
                reason: "chat-limit-reached",
                completedTurns,
                currentChatNumber: chatLimit.currentChatNumber,
                maxChatCycles: chatLimit.maxChatCycles
              }
            };
          }

          if (!settings.rotationEnabled) {
            return {
              next: {
                ...common,
                enabled: false,
                phase: "TARGET_REACHED",
                runToken: null,
                pendingSubmissionNonce: null,
                lastError: null
              },
              value: { action: "stop", accepted: true, reason: "target-reached", completedTurns }
            };
          }

          const projectUrl = normalizeProjectUrl(settings.projectUrl || sourceUrl);
          if (!validateProjectMembership(sourceUrl, projectUrl)) {
            throw new Error("現在のチャットと設定済みプロジェクトが一致しない");
          }
          const previousConversationId = common.currentConversationId || conversationIdFromUrl(sourceUrl);
          if (!previousConversationId) throw new Error("現在の会話IDを確認できない");
          const rotationNonce = crypto.randomUUID();
          return {
            next: {
              ...common,
              enabled: true,
              phase: "ROTATING",
              previousConversationId,
              rotationNonce,
              rotationProjectUrl: projectUrl,
              rotationStartedAt: Date.now(),
              pendingSubmissionNonce: null,
              lastError: null
            },
            value: {
              action: "rotate",
              accepted: true,
              reason: "target-reached",
              completedTurns,
              rotationNonce,
              projectUrl,
              previousConversationId
            }
          };
        }

        const nonce = crypto.randomUUID();
        return {
          next: {
            ...common,
            phase: "SENDING",
            pendingSubmissionNonce: nonce,
            lastError: null
          },
          value: {
            action: "send",
            accepted: true,
            prompt: settings.continuePrompt,
            nonce,
            delayMs: settings.sendDelayMs,
            completedTurns
          }
        };
      });

      if (!decision.committed) {
        const value = decision.value || {};
        sendResponse({
          ok: true,
          action: value.action || (decision.reason === "stale-run-token" ? "stop" : "retry"),
          accepted: value.accepted === true,
          reason: value.reason || decision.reason || "not-committed"
        });
        return;
      }

      const value = decision.value || {};
      await appendLog({
        event: value.reason === "phase-completion-marker"
          ? "phase_completion_marker_accepted"
          : value.reason === "chat-limit-reached"
            ? "run_chat_limit_reached"
            : "assistant_complete_accepted",
        tabId,
        details: {
          completedTurns: value.completedTurns,
          currentChatNumber: value.currentChatNumber || (decision.runtime.chatGeneration || 0) + 1,
          maxChatCycles: settings.maxChatCycles,
          fingerprint,
          proof: message.proof || "unknown",
          textLength: Number(message.textLength || 0),
          phaseCompletionMarker: value.reason === "phase-completion-marker" ? settings.phaseCompletionMarker : null
        }
      });

      if (value.action === "stop") {
        await Promise.all([
          chrome.alarms.clear(ROTATION_ALARM).catch(() => {}),
          clearScanAlarm()
        ]);
        sendResponse({ ok: true, action: "stop", accepted: true, reason: value.reason, runtime: decision.runtime });
        return;
      }

      if (value.action === "rotate") {
        await clearScanAlarm();
        await chrome.alarms.create(ROTATION_ALARM, {
          when: Date.now() + settings.rotationTimeoutSeconds * 1000
        });
        await appendLog({
          event: "rotation_prepared",
          tabId,
          details: {
            previousConversationId: value.previousConversationId,
            projectUrl: value.projectUrl,
            rotationNonce: value.rotationNonce
          }
        });
        sendResponse({ ok: true, action: "rotate", accepted: true, reason: value.reason, runtime: decision.runtime });
        try {
          await chrome.tabs.update(tabId, { url: value.projectUrl });
        } catch (error) {
          await enterError("設定済みプロジェクトURLへ移動できない", {
            error: error.message,
            projectUrl: value.projectUrl
          }, runToken);
        }
        return;
      }

      sendResponse({
        ok: true,
        action: "send",
        accepted: true,
        prompt: value.prompt,
        nonce: value.nonce,
        delayMs: value.delayMs,
        runtime: decision.runtime
      });
    })().catch(async (error) => {
      const runToken = String(message.runToken || "") || null;
      await enterError(error.message, {}, runToken);
      sendResponse({ ok: false, action: "stop", error: error.message });
    });
    return true;
  }

  if (message.type === "translation-loop-v051:submission-result") {
    (async () => {
      const tabId = sender.tab?.id ?? null;
      const runToken = String(message.runToken || "");
      if (!runToken) {
        sendResponse({ ok: true, ignored: true, reason: "missing-run-token" });
        return;
      }
      if (!message.ok) {
        const { runtime } = await getState();
        if (
          runtime.runToken === runToken &&
          runtime.ownerTabId === tabId &&
          runtime.pendingSubmissionNonce === message.nonce
        ) {
          const next = await enterError(message.error || "固定文の送信に失敗した", {
            nonce: message.nonce
          }, runToken);
          sendResponse({ ok: false, runtime: next });
          return;
        }
        sendResponse({ ok: true, ignored: true, reason: "stale-submission-failure" });
        return;
      }

      const committed = await runtimeGuard.mutateIfToken(runToken, async (runtime) => {
        if (
          runtime.ownerTabId !== tabId ||
          runtime.phase !== "SENDING" ||
          runtime.pendingSubmissionNonce !== message.nonce
        ) {
          return { value: null, reason: "submission-not-current" };
        }
        return {
          next: {
            ...runtime,
            enabled: true,
            phase: "WAITING_RESPONSE",
            pendingSubmissionNonce: null,
            lastSubmitAt: Date.now(),
            watchdogFailures: 0,
            lastError: null
          }
        };
      });
      if (!committed.committed) {
        sendResponse({ ok: true, ignored: true, reason: committed.reason });
        return;
      }
      await ensureScanAlarm();
      await appendLog({ event: "submission_verified", tabId, details: { nonce: message.nonce } });
      sendResponse({ ok: true, runtime: committed.runtime });
    })().catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "translation-loop-v051:route-changed") {
    (async () => {
      const tabId = sender.tab?.id ?? null;
      const { runtime } = await getState();
      if (runtime.enabled && runtime.ownerTabId === tabId) {
        const runToken = runtime.runToken;
        if (message.runToken && message.runToken !== runToken) {
          sendResponse({ ok: true, expected: true, reason: "stale-route-notification" });
          return;
        }
        if (["ROTATING", "SENDING_RESUME", "AWAITING_NEW_CONVERSATION"].includes(runtime.phase)) {
          sendResponse({ ok: true, expected: true });
          return;
        }
        const routeConversationId = String(message.to || "").match(/\/c\/([^/?#]+)/)?.[1] || null;
        const verifiedRouteChange =
          ["RESTARTING_AFTER_ROTATION", "WAITING_RESPONSE"].includes(runtime.phase) &&
          routeConversationId &&
          routeConversationId === runtime.currentConversationId &&
          routeConversationId === runtime.lastVerifiedConversationId;
        if (verifiedRouteChange) {
          sendResponse({ ok: true, expected: true, reason: "verified-rotation-route" });
          return;
        }
        const next = await enterError("実行中に意図しない別チャットへ移動した", {
          from: message.from,
          to: message.to
        }, runToken);
        sendResponse({ ok: false, runtime: next });
        return;
      }
      sendResponse({ ok: true });
    })().catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "translation-loop-v051:content-error") {
    const runToken = String(message.runToken || "") || null;
    enterError(message.error || "コンテンツ側エラー", message.details || {}, runToken).then((runtime) => {
      sendResponse({ ok: false, runtime });
    });
    return true;
  }

  return false;
});

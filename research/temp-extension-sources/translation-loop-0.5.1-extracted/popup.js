"use strict";

const $ = (id) => document.getElementById(id);
let latestLogs = [];
let settingsHydrated = false;
let settingsDirty = false;

const SETTING_FIELD_IDS = [
  "prompt",
  "maxTurns",
  "maxChats",
  "sendDelay",
  "rotation",
  "continueAfterRotation",
  "projectUrl",
  "resumePrompt",
  "phaseMarker",
  "fallback",
  "debug"
];

function formHasFocus() {
  return SETTING_FIELD_IDS.includes(document.activeElement?.id || "");
}

function markSettingsDirty() {
  settingsDirty = true;
}

function applySettingsToForm(settings) {
  $("prompt").value = settings.continuePrompt;
  $("maxTurns").value = settings.maxCompletedTurns;
  $("maxChats").value = settings.maxChatCycles;
  $("sendDelay").value = settings.sendDelayMs;
  $("rotation").checked = Boolean(settings.rotationEnabled);
  $("continueAfterRotation").checked = settings.continueAfterRotation !== false;
  $("projectUrl").value = settings.projectUrl || "";
  $("resumePrompt").value = settings.resumePrompt;
  $("phaseMarker").value = settings.phaseCompletionMarker || "規定フェイズ完了";
  $("fallback").checked = Boolean(settings.fallbackEnabled);
  $("debug").checked = Boolean(settings.debugEnabled);
  settingsHydrated = true;
  settingsDirty = false;
}

function call(message) {
  return chrome.runtime.sendMessage(message);
}

function phaseLabel(phase) {
  const labels = {
    IDLE: "IDLE",
    STARTING: "開始準備",
    WAITING_RESPONSE: "回答待ち",
    SENDING: "送信中",
    ROTATING: "プロジェクトへ移動中",
    WAITING_PROJECT: "プロジェクト入力欄待ち",
    SENDING_RESUME: "新規チャット開始文を送信中",
    AWAITING_NEW_CONVERSATION: "新しい会話ID待ち",
    ROTATION_VERIFIED: "新規チャット確認済み",
    RESTARTING_AFTER_ROTATION: "新規チャット監視を再開中",
    PAUSED: "一時停止",
    TARGET_REACHED: "同一チャット試験完了",
    RUN_COMPLETED: "設定チャット数完了",
    PHASE_COMPLETED: "規定フェイズ完了",
    ERROR: "ERROR"
  };
  return labels[phase] || phase;
}

async function refresh(options = {}) {
  const result = await call({ type: "translation-loop-v051:get-state" });
  if (!result?.ok) return;
  const { settings, runtime, logs } = result;
  $("phase").textContent = phaseLabel(runtime.phase);
  $("count").textContent = `${runtime.completedTurns} / ${settings.maxCompletedTurns}`;
  $("generation").textContent = `${(runtime.chatGeneration || 0) + 1} / ${settings.maxChatCycles}`;
  $("owner").textContent = runtime.ownerTabId == null ? "なし" : String(runtime.ownerTabId);
  $("conversation").textContent = runtime.currentConversationId || "なし";
  $("error").hidden = !runtime.lastError;
  $("error").textContent = runtime.lastError || "";
  const forceSettings = options.forceSettings === true;
  if (forceSettings || !settingsHydrated || (!settingsDirty && !formHasFocus())) {
    applySettingsToForm(settings);
  }
  latestLogs = Array.isArray(logs) ? logs : [];
  $("logPreview").textContent = latestLogs.slice(-14).map((item) => {
    const time = item.at?.slice(11, 19) || "";
    return `${time} ${item.event} ${JSON.stringify(item.details || {})}`;
  }).join("\n");
}

async function saveSettings() {
  const result = await call({
    type: "translation-loop-v051:update-settings",
    settings: {
      continuePrompt: $("prompt").value,
      maxCompletedTurns: Number($("maxTurns").value),
      maxChatCycles: Number($("maxChats").value),
      sendDelayMs: Number($("sendDelay").value),
      terminalMinStableMs: 1500,
      barConfirmCycles: 3,
      fallbackEnabled: $("fallback").checked,
      fallbackStableMs: 3000,
      fallbackPostGenerationMs: 6000,
      responseTimeoutMinutes: 90,
      debugEnabled: $("debug").checked,
      rotationEnabled: $("rotation").checked,
      continueAfterRotation: $("continueAfterRotation").checked,
      projectUrl: $("projectUrl").value,
      resumePrompt: $("resumePrompt").value,
      rotationTimeoutSeconds: 120,
      phaseCompletionMarker: $("phaseMarker").value
    }
  });
  if (!result?.ok) throw new Error(result?.error || "設定を保存できなかった");
  applySettingsToForm(result.settings);
  return result.settings;
}


for (const id of SETTING_FIELD_IDS) {
  const element = $(id);
  element.addEventListener("input", markSettingsDirty);
  element.addEventListener("change", markSettingsDirty);
}

$("save").addEventListener("click", async () => {
  try {
    await saveSettings();
    await refresh({ forceSettings: true });
  } catch (error) {
    window.alert(error.message);
  }
});

$("detectProject").addEventListener("click", async () => {
  const result = await call({ type: "translation-loop-v051:detect-project-url" });
  if (!result?.ok) {
    window.alert(result?.error || "プロジェクトURLを取得できなかった");
    return;
  }
  $("projectUrl").value = result.projectUrl;
  markSettingsDirty();
  try {
    await saveSettings();
  } catch (error) {
    window.alert(error.message);
  }
  await refresh({ forceSettings: true });
});

$("start").addEventListener("click", async () => {
  try {
    await saveSettings();
  } catch (error) {
    window.alert(error.message);
    return;
  }
  const result = await call({ type: "translation-loop-v051:start" });
  if (!result?.ok) window.alert(result?.error || "開始できなかった");
  await refresh();
});

$("pause").addEventListener("click", async () => {
  await call({ type: "translation-loop-v051:pause" });
  await refresh();
});

$("reset").addEventListener("click", async () => {
  await call({ type: "translation-loop-v051:reset" });
  await refresh();
});

$("copyLogs").addEventListener("click", async () => {
  await navigator.clipboard.writeText(JSON.stringify(latestLogs, null, 2));
});

refresh();
setInterval(refresh, 1000);

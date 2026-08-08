const enabled = document.getElementById("enabled");
const endpoint = document.getElementById("endpoint");
const token = document.getElementById("token");
const debugEnabled = document.getElementById("debugEnabled");
const status = document.getElementById("status");
const monitorStatus = document.getElementById("monitorStatus");
const debugLogs = document.getElementById("debugLogs");

const saveButton = document.getElementById("save");
const testButton = document.getElementById("test");
const refreshLogsButton = document.getElementById("refreshLogs");
const copyLogsButton = document.getElementById("copyLogs");
const clearLogsButton = document.getElementById("clearLogs");

const DEFAULT_ENDPOINT = "http://127.0.0.1:50333/speak";

function showStatus(message, ok) {
  status.textContent = message;
  status.style.color = ok ? "#176b2c" : "#9b1c1c";
}

function formatLog(entry) {
  const time = entry.at
    ? new Date(entry.at).toLocaleString("ja-JP", { hour12: false })
    : "時刻不明";
  const tab = entry.tabId === null || entry.tabId === undefined
    ? "-"
    : entry.tabId;
  const details = JSON.stringify(entry.details || {});
  return `${time}  tab=${tab}  ${entry.event}  ${details}`;
}

async function loadLogs() {
  chrome.runtime.sendMessage(
    { type: "voicebridge:get-debug" },
    (response) => {
      if (chrome.runtime.lastError) {
        showStatus(chrome.runtime.lastError.message, false);
        return;
      }

      const logs = Array.isArray(response?.logs) ? response.logs : [];
      debugLogs.value = logs.map(formatLog).join("\n");
      debugLogs.scrollTop = debugLogs.scrollHeight;
    }
  );
}

function loadMonitorStatus() {
  chrome.runtime.sendMessage(
    { type: "voicebridge:get-monitor-status" },
    (response) => {
      if (chrome.runtime.lastError) {
        monitorStatus.textContent =
          `監視接続の確認失敗: ${chrome.runtime.lastError.message}`;
        return;
      }

      const tabs = Number(response?.connectedTabs || 0);
      const ports = Number(response?.connectedPorts || 0);
      monitorStatus.textContent =
        `監視中のChatGPTタブ: ${tabs}（接続 ${ports}）`;
    }
  );
}

async function load() {
  const data = await chrome.storage.local.get({
    enabled: true,
    endpoint: DEFAULT_ENDPOINT,
    token: "",
    debugEnabled: false,
    lastStatus: "未設定",
    lastStatusOk: false
  });

  enabled.checked = Boolean(data.enabled);
  endpoint.value = data.endpoint || DEFAULT_ENDPOINT;
  token.value = data.token || "";
  debugEnabled.checked = Boolean(data.debugEnabled);
  showStatus(data.lastStatus || "未設定", Boolean(data.lastStatusOk));
  loadMonitorStatus();
  loadLogs();
}

async function save() {
  await chrome.storage.local.set({
    enabled: enabled.checked,
    endpoint: endpoint.value.trim() || DEFAULT_ENDPOINT,
    token: token.value.trim(),
    debugEnabled: debugEnabled.checked
  });
  showStatus("設定を保存した", true);
}

saveButton.addEventListener("click", save);

testButton.addEventListener("click", async () => {
  await save();
  showStatus("送信中…", true);

  chrome.runtime.sendMessage({ type: "voicebridge:test" }, (response) => {
    if (chrome.runtime.lastError) {
      showStatus(chrome.runtime.lastError.message, false);
      return;
    }

    if (response?.ok) {
      showStatus("テスト音声を送信した", true);
    } else {
      showStatus(response?.error || "送信できなかった", false);
    }

    loadLogs();
  });
});

refreshLogsButton.addEventListener("click", () => {
  loadMonitorStatus();
  loadLogs();
});

copyLogsButton.addEventListener("click", async () => {
  if (!debugLogs.value) {
    showStatus("コピーするログがない", false);
    return;
  }

  try {
    await navigator.clipboard.writeText(debugLogs.value);
    showStatus("判定ログをコピーした", true);
  } catch (error) {
    debugLogs.focus();
    debugLogs.select();
    const copied = document.execCommand("copy");
    showStatus(
      copied ? "判定ログをコピーした" : `コピー失敗: ${error.message}`,
      copied
    );
  }
});

clearLogsButton.addEventListener("click", () => {
  chrome.runtime.sendMessage(
    { type: "voicebridge:clear-debug" },
    (response) => {
      if (chrome.runtime.lastError) {
        showStatus(chrome.runtime.lastError.message, false);
        return;
      }

      if (response?.ok) {
        debugLogs.value = "";
        showStatus("判定ログを消去した", true);
      }
    }
  );
});

load();

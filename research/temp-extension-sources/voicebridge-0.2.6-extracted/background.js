const DEFAULTS = {
  enabled: true,
  endpoint: "http://127.0.0.1:50333/speak",
  token: "",
  debugEnabled: false,
  debugLogs: [],
  lastStatus: "未設定"
};

const recentDeliveries = new Map();
const DEDUPE_TTL_MS = 10 * 60 * 1000;
const DEDUPE_MAX = 300;
const DEBUG_LOG_MAX = 300;
const SCAN_PING_MS = 1000;

let debugWriteChain = Promise.resolve();
const contentPorts = new Map();
let scanPingTimer = null;

function portKey(port) {
  const tabId = port.sender?.tab?.id ?? "unknown";
  const frameId = port.sender?.frameId ?? 0;
  return `${tabId}:${frameId}`;
}

function startScanPings() {
  if (scanPingTimer !== null) {
    return;
  }

  scanPingTimer = setInterval(() => {
    if (contentPorts.size === 0) {
      clearInterval(scanPingTimer);
      scanPingTimer = null;
      return;
    }

    const now = Date.now();
    for (const [key, port] of contentPorts) {
      try {
        port.postMessage({
          type: "voicebridge:scan-now",
          at: now
        });
      } catch (_) {
        contentPorts.delete(key);
      }
    }
  }, SCAN_PING_MS);
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "voicebridge-monitor") {
    return;
  }

  const key = portKey(port);
  contentPorts.set(key, port);
  startScanPings();

  appendDebug({
    event: "monitor_connected",
    details: {
      key,
      connectedTabs: contentPorts.size
    }
  }, port.sender);

  try {
    port.postMessage({
      type: "voicebridge:scan-now",
      at: Date.now()
    });
  } catch (_) {
    contentPorts.delete(key);
  }

  port.onMessage.addListener((message) => {
    if (message?.type === "voicebridge:monitor-state") {
      // 状態通知を受けること自体が長時間接続の生存確認になる。
      return;
    }
  });

  port.onDisconnect.addListener(() => {
    contentPorts.delete(key);

    appendDebug({
      event: "monitor_disconnected",
      details: {
        key,
        connectedTabs: contentPorts.size
      }
    }, port.sender);

    if (contentPorts.size === 0 && scanPingTimer !== null) {
      clearInterval(scanPingTimer);
      scanPingTimer = null;
    }
  });
});

function rememberDelivery(key) {
  const now = Date.now();

  for (const [savedKey, savedAt] of recentDeliveries) {
    if (now - savedAt > DEDUPE_TTL_MS) {
      recentDeliveries.delete(savedKey);
    }
  }

  if (recentDeliveries.has(key)) {
    return false;
  }

  recentDeliveries.set(key, now);

  while (recentDeliveries.size > DEDUPE_MAX) {
    const oldestKey = recentDeliveries.keys().next().value;
    recentDeliveries.delete(oldestKey);
  }

  return true;
}

function forgetDelivery(key) {
  recentDeliveries.delete(key);
}

async function appendDebug(event, sender = null) {
  debugWriteChain = debugWriteChain.then(async () => {
    const data = await chrome.storage.local.get({
      debugEnabled: false,
      debugLogs: []
    });

    if (!data.debugEnabled) {
      return;
    }

    const tab = sender?.tab || null;
    const entry = {
      at: new Date().toISOString(),
      event: String(event?.event || "unknown"),
      tabId: tab?.id ?? null,
      title: tab?.title || "",
      url: tab?.url || event?.url || "",
      details: event?.details && typeof event.details === "object"
        ? event.details
        : {}
    };

    const logs = Array.isArray(data.debugLogs) ? data.debugLogs : [];
    logs.push(entry);

    if (logs.length > DEBUG_LOG_MAX) {
      logs.splice(0, logs.length - DEBUG_LOG_MAX);
    }

    await chrome.storage.local.set({ debugLogs: logs });
  }).catch(() => {});

  return debugWriteChain;
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(Object.keys(DEFAULTS));
  const missing = {};

  for (const [key, value] of Object.entries(DEFAULTS)) {
    if (current[key] === undefined) {
      missing[key] = value;
    }
  }

  if (Object.keys(missing).length) {
    await chrome.storage.local.set(missing);
  }
});

async function setStatus(message, ok) {
  await chrome.storage.local.set({
    lastStatus: message,
    lastStatusOk: Boolean(ok),
    lastStatusAt: new Date().toISOString()
  });
  await chrome.action.setBadgeText({ text: ok ? "" : "!" });
}

async function postSpeech(payload) {
  const settings = await chrome.storage.local.get(DEFAULTS);

  if (!settings.enabled) {
    return { ok: false, skipped: true, error: "拡張機能が無効" };
  }

  if (!settings.token) {
    const message = "VoiceBridgeのトークンが未設定";
    await setStatus(message, false);
    return { ok: false, error: message };
  }

  const endpoint = settings.endpoint || DEFAULTS.endpoint;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VoiceBridge-Token": settings.token
    },
    body: JSON.stringify(payload)
  });

  let body = {};
  try {
    body = await response.json();
  } catch (_) {
    body = {};
  }

  if (!response.ok || !body.ok) {
    const message = body.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  await setStatus("VoiceBridgeへ送信済み", true);
  return body;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    return false;
  }

  if (message.type === "voicebridge:debug") {
    appendDebug(message, sender).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "voicebridge:get-monitor-status") {
    const tabIds = new Set();

    for (const port of contentPorts.values()) {
      const tabId = port.sender?.tab?.id;
      if (tabId !== undefined && tabId !== null) {
        tabIds.add(tabId);
      }
    }

    sendResponse({
      ok: true,
      connectedTabs: tabIds.size,
      connectedPorts: contentPorts.size
    });
    return false;
  }

  if (message.type === "voicebridge:get-debug") {
    chrome.storage.local.get({ debugLogs: [] }).then((data) => {
      sendResponse({
        ok: true,
        logs: Array.isArray(data.debugLogs) ? data.debugLogs : []
      });
    });
    return true;
  }

  if (message.type === "voicebridge:clear-debug") {
    chrome.storage.local.set({ debugLogs: [] }).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "voicebridge:notify") {
    const conversationId = String(message.conversationId || "");
    const turnId = String(message.turnId || "");
    const text = String(message.text || "ChatGPTの回答が完了した");
    const deliveryKey = `${conversationId}::${turnId}`;

    appendDebug({
      event: "background_notice_receive",
      details: {
        conversationId,
        turnId,
        textLength: text.length
      }
    }, sender);

    if (!rememberDelivery(deliveryKey)) {
      appendDebug({
        event: "background_duplicate_skip",
        details: { conversationId, turnId }
      }, sender);
      sendResponse({ ok: true, skipped: true, duplicate: true });
      return false;
    }

    postSpeech({
      text,
      source: "chatgpt-commentary",
      session_id: conversationId,
      turn_id: turnId
    })
      .then(async (result) => {
        await appendDebug({
          event: "voicebridge_notice_accept",
          details: { conversationId, turnId }
        }, sender);
        sendResponse(result);
      })
      .catch(async (error) => {
        forgetDelivery(deliveryKey);
        await setStatus(`通知失敗: ${error.message}`, false);
        await appendDebug({
          event: "voicebridge_notice_error",
          details: {
            conversationId,
            turnId,
            error: error.message
          }
        }, sender);
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }

  if (message.type === "voicebridge:speak") {
    const conversationId = String(message.conversationId || "");
    const turnId = String(message.turnId || "");
    const text = String(message.text || "");
    const deliveryKey = `${conversationId}::${turnId}`;

    appendDebug({
      event: "background_receive",
      details: {
        conversationId,
        turnId,
        textLength: text.length
      }
    }, sender);

    if (!rememberDelivery(deliveryKey)) {
      appendDebug({
        event: "background_duplicate_skip",
        details: { conversationId, turnId }
      }, sender);
      sendResponse({ ok: true, skipped: true, duplicate: true });
      return false;
    }

    postSpeech({
      text,
      source: "chatgpt-final",
      session_id: conversationId,
      turn_id: turnId
    })
      .then(async (result) => {
        await appendDebug({
          event: "voicebridge_accept",
          details: { conversationId, turnId }
        }, sender);
        sendResponse(result);
      })
      .catch(async (error) => {
        forgetDelivery(deliveryKey);
        await setStatus(`送信失敗: ${error.message}`, false);
        await appendDebug({
          event: "voicebridge_error",
          details: {
            conversationId,
            turnId,
            error: error.message
          }
        }, sender);
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }

  if (message.type === "voicebridge:test") {
    postSpeech({
      text: "ChatGPTブラウザ連携のテストです。",
      source: "chatgpt-final",
      session_id: "extension-test",
      turn_id: String(Date.now())
    })
      .then(async (result) => {
        await appendDebug({
          event: "manual_test_ok",
          details: {}
        }, sender);
        sendResponse(result);
      })
      .catch(async (error) => {
        await setStatus(`テスト失敗: ${error.message}`, false);
        await appendDebug({
          event: "manual_test_error",
          details: { error: error.message }
        }, sender);
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }

  return false;
});

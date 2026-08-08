(() => {
  "use strict";

  if (globalThis.__mygptV3PageObserverLoaded) return;
  globalThis.__mygptV3PageObserverLoaded = true;

  const ARM_EVENT = "MYGPT_V3_ARM_PAGE_OBSERVER";
  const OBS_EVENT = "MYGPT_V3_PAGE_OBSERVED";
  const CONVERSATION_PATHS = ["/backend-api/conversation", "/backend-api/f/conversation"];
  let armed = null;

  function emit(kind, detail = {}) {
    window.dispatchEvent(new CustomEvent(OBS_EVENT, {
      detail: {
        source: "mygpt-v3-page-observer",
        kind,
        at: Date.now(),
        ...detail
      }
    }));
  }

  window.addEventListener(ARM_EVENT, (event) => {
    const detail = event?.detail || {};
    if (typeof detail.nonce !== "string" || !detail.nonce) return;
    armed = {
      nonce: detail.nonce,
      promptPrefix: typeof detail.promptPrefix === "string" ? detail.promptPrefix : "",
      armedAt: Date.now()
    };
  });

  function isConversationUrl(value) {
    let url;
    try {
      url = new URL(value, location.href);
    } catch (_) {
      return false;
    }
    return CONVERSATION_PATHS.some((path) => url.pathname === path);
  }

  async function requestBodyText(input, init) {
    try {
      if (typeof init?.body === "string") return init.body;
      if (input instanceof Request) return await input.clone().text();
    } catch (_) {}
    return "";
  }

  function recursiveFindConversationId(value, depth = 0) {
    if (depth > 8 || value == null) return null;
    if (typeof value !== "object") return null;
    for (const [key, child] of Object.entries(value)) {
      if ((key === "conversation_id" || key === "conversationId") && typeof child === "string" && child) {
        return child;
      }
    }
    for (const child of Object.values(value)) {
      const found = recursiveFindConversationId(child, depth + 1);
      if (found) return found;
    }
    return null;
  }

  function containsAsyncMarker(value, depth = 0) {
    if (depth > 8 || value == null) return false;
    if (typeof value === "string") {
      return value === "stream_handoff" || value === "conversation_async_status" || value === "image_gen_async";
    }
    if (typeof value !== "object") return false;
    for (const [key, child] of Object.entries(value)) {
      if (key === "image_gen_async" && child) return true;
      if (key === "async_source" && child) return true;
      if (containsAsyncMarker(child, depth + 1)) return true;
    }
    return false;
  }

  async function observeConversationResponse(response, sendContext) {
    if (!response?.ok || !sendContext?.nonce) return;
    let clone;
    try {
      clone = response.clone();
    } catch (_) {
      return;
    }
    const reader = clone.body?.getReader?.();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = "";
    let committed = false;
    let asyncSeen = false;

    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          let parsed;
          try {
            parsed = JSON.parse(payload);
          } catch (_) {
            continue;
          }

          if (!committed) {
            const conversationId = recursiveFindConversationId(parsed);
            if (conversationId) {
              committed = true;
              emit("conversation-commit", {
                nonce: sendContext.nonce,
                conversationId
              });
            }
          }

          if (!asyncSeen && containsAsyncMarker(parsed)) {
            asyncSeen = true;
            emit("conversation-async", { nonce: sendContext.nonce });
          }
        }
      }
    } catch (error) {
      emit("conversation-observer-error", {
        nonce: sendContext.nonce,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const originalFetch = window.fetch;
  window.fetch = async function mygptObservedFetch(input, init) {
    const method = String(init?.method || (input instanceof Request ? input.method : "GET") || "GET").toUpperCase();
    const urlValue = typeof input === "string" || input instanceof URL ? String(input) : input?.url || "";
    const context = armed && Date.now() - armed.armedAt <= 30000 ? { ...armed } : null;
    let matchesArmedPrompt = true;

    if (context && method === "POST" && isConversationUrl(urlValue) && context.promptPrefix) {
      const body = await requestBodyText(input, init);
      matchesArmedPrompt = !body || body.includes(context.promptPrefix);
    }

    const response = await originalFetch.apply(this, arguments);

    if (context && matchesArmedPrompt && method === "POST" && isConversationUrl(urlValue)) {
      armed = null;
      emit("conversation-request", { nonce: context.nonce });
      void observeConversationResponse(response, context);
    }

    return response;
  };

  const NativeWebSocket = window.WebSocket;
  if (typeof NativeWebSocket === "function") {
    function ObservedWebSocket(url, protocols) {
      const socket = protocols === undefined
        ? new NativeWebSocket(url)
        : new NativeWebSocket(url, protocols);
      try {
        if (String(url).includes("ws.chatgpt.com")) {
          socket.addEventListener("message", (event) => {
            if (typeof event.data !== "string") return;
            if (!/conversation-update|image_gen_async|stream_handoff|conversation_async_status/.test(event.data)) return;
            emit("websocket-conversation-update", { textLength: event.data.length });
          });
        }
      } catch (_) {}
      return socket;
    }
    ObservedWebSocket.prototype = NativeWebSocket.prototype;
    Object.setPrototypeOf(ObservedWebSocket, NativeWebSocket);
    for (const key of ["CONNECTING", "OPEN", "CLOSING", "CLOSED"]) {
      try { Object.defineProperty(ObservedWebSocket, key, { value: NativeWebSocket[key] }); } catch (_) {}
    }
    window.WebSocket = ObservedWebSocket;
  }
})();

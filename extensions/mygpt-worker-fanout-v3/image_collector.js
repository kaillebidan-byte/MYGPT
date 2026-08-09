"use strict";

(() => {
  const STATE_KEY = "mygptV4Runtime";
  const SLOT_IDS = Object.freeze(["F2", "F3", "F4"]);
  const RECOVERY_TERMINAL = new Set(["COMPLETE", "ERROR"]);
  let recoveryBusy = false;
  let recoveryQueued = false;

  function runKey(state) {
    return [state?.startedAt || 0, state?.fileName || "", state?.sourceTabId || 0].join(":");
  }

  function sanitizePart(value) {
    return String(value || "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")
      .slice(0, 80) || "output";
  }

  function stampFrom(ms) {
    const date = new Date(Number(ms) || Date.now());
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  function extensionFromCandidate(candidate) {
    const src = String(candidate?.src || "");
    try {
      const url = new URL(src);
      const match = url.pathname.match(/\.([a-zA-Z0-9]{2,5})$/);
      if (match && /^(png|jpe?g|webp|gif|avif)$/i.test(match[1])) return match[1].toLowerCase().replace("jpeg", "jpg");
    } catch (_) {}
    return "png";
  }

  function computeRecoveryPhase(state) {
    const slots = Array.isArray(state?.slots) ? state.slots : [];
    const statuses = SLOT_IDS.map((slotId) => slots.find((slot) => slot.slotId === slotId)?.imageRecovery?.status || "IDLE");
    if (statuses.every((status) => status === "COMPLETE")) return "COMPLETE";
    if (statuses.every((status) => RECOVERY_TERMINAL.has(status))) {
      const errors = statuses.filter((status) => status === "ERROR").length;
      return errors === statuses.length ? "ERROR" : "PARTIAL_ERROR";
    }
    if (statuses.some((status) => status === "RESOLVING" || status === "DOWNLOADING")) return "RECOVERING";
    if (statuses.some((status) => status === "PENDING")) return "PENDING";
    return "IDLE";
  }

  function generationComplete(state) {
    if (state?.phase !== "COMPLETE") return false;
    if (!Array.isArray(state.slots)) return false;
    return SLOT_IDS.every((slotId) => {
      const slot = state.slots.find((item) => item.slotId === slotId);
      return slot?.phase === "COMPLETE" && Number.isInteger(slot?.tabId);
    });
  }

  async function readState() {
    const stored = await chrome.storage.session.get(STATE_KEY);
    return stored[STATE_KEY] || null;
  }

  async function patchState(expectedKey, mutate) {
    const current = await readState();
    if (!current || runKey(current) !== expectedKey) return null;
    const next = mutate(current);
    if (!next) return current;
    next.updatedAt = Date.now();
    await chrome.storage.session.set({ [STATE_KEY]: next });
    return next;
  }

  async function initializeRecoveryState(state) {
    const expectedKey = runKey(state);
    return patchState(expectedKey, (current) => {
      const slots = current.slots.map((slot) => {
        if (!SLOT_IDS.includes(slot.slotId)) return slot;
        if (slot.imageRecovery?.status) return slot;
        return {
          ...slot,
          imageRecovery: {
            status: "PENDING",
            downloadId: null,
            filename: null,
            actualFilename: null,
            sourceUrl: null,
            width: null,
            height: null,
            fileSize: null,
            mime: null,
            error: null,
            updatedAt: Date.now()
          }
        };
      });
      const draft = { ...current, slots };
      return { ...draft, recoveryPhase: computeRecoveryPhase(draft) };
    });
  }

  async function patchSlot(expectedKey, slotId, recoveryPatch) {
    return patchState(expectedKey, (current) => {
      const slots = current.slots.map((slot) => {
        if (slot.slotId !== slotId) return slot;
        return {
          ...slot,
          imageRecovery: {
            ...(slot.imageRecovery || {}),
            ...recoveryPatch,
            updatedAt: Date.now()
          }
        };
      });
      const draft = { ...current, slots };
      return { ...draft, recoveryPhase: computeRecoveryPhase(draft) };
    });
  }

  async function extractLatestAssistantImage(tabId) {
    const execution = await chrome.scripting.executeScript({
      target: { tabId },
      func: async () => {
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const assistantSelectors = ['[data-message-author-role="assistant"]', '[data-turn="assistant"]'];
        const turnSelector = 'article[data-testid^="conversation-turn"], div[data-testid^="conversation-turn"], section[data-testid^="conversation-turn"], article[data-message-author-role], div[data-message-author-role], section[data-message-author-role], article[data-turn], div[data-turn], section[data-turn]';

        function latestAssistantNode() {
          const found = [];
          for (const selector of assistantSelectors) {
            document.querySelectorAll(selector).forEach((node) => {
              if (!found.includes(node)) found.push(node);
            });
          }
          const filtered = found.filter((node) => !node.parentElement?.closest(assistantSelectors.join(",")));
          return filtered[filtered.length - 1] || null;
        }

        function inspect() {
          const assistant = latestAssistantNode();
          if (!assistant) return { ok: false, reason: "ASSISTANT_TURN_NOT_FOUND", imageCount: 0 };
          const root = assistant.closest?.(turnSelector) || assistant;
          const images = Array.from(root.querySelectorAll("img"));
          const candidates = images.map((img, index) => {
            const src = String(img.currentSrc || img.src || img.getAttribute("src") || "");
            const rect = img.getBoundingClientRect();
            const naturalWidth = Number(img.naturalWidth || 0);
            const naturalHeight = Number(img.naturalHeight || 0);
            const renderedWidth = Math.max(0, Math.round(rect.width || 0));
            const renderedHeight = Math.max(0, Math.round(rect.height || 0));
            const width = naturalWidth || renderedWidth;
            const height = naturalHeight || renderedHeight;
            const score = Math.max(naturalWidth * naturalHeight, renderedWidth * renderedHeight);
            return {
              index,
              src,
              alt: String(img.alt || ""),
              naturalWidth,
              naturalHeight,
              renderedWidth,
              renderedHeight,
              width,
              height,
              score
            };
          }).filter((item) => item.src && /^(https?:|blob:|data:)/i.test(item.src));

          candidates.sort((a, b) => b.score - a.score || b.width - a.width || b.height - a.height);
          const large = candidates.find((item) => item.width >= 128 && item.height >= 128);
          const candidate = large || candidates[0] || null;
          if (!candidate) return { ok: false, reason: "OUTPUT_IMAGE_NOT_FOUND", imageCount: images.length };
          return { ok: true, candidate, imageCount: images.length };
        }

        let last = null;
        for (let attempt = 1; attempt <= 20; attempt += 1) {
          last = inspect();
          if (last.ok && last.candidate?.src && last.candidate.width > 0 && last.candidate.height > 0) {
            return { ...last, attempt };
          }
          await sleep(500);
        }
        return { ...(last || { ok: false, reason: "OUTPUT_IMAGE_NOT_FOUND" }), attempt: 20 };
      }
    });
    return execution?.[0]?.result || { ok: false, reason: "IMAGE_CAPTURE_NO_RESULT" };
  }

  async function reconcileDownload(expectedKey, slotId, downloadId) {
    let items = [];
    try { items = await chrome.downloads.search({ id: downloadId }); }
    catch (_) { return; }
    const item = items?.[0];
    if (!item) return;
    if (item.state === "complete") {
      await patchSlot(expectedKey, slotId, {
        status: "COMPLETE",
        actualFilename: item.filename || null,
        fileSize: Number.isFinite(item.fileSize) ? item.fileSize : null,
        mime: item.mime || null,
        error: null,
        completedAt: Date.now()
      });
    } else if (item.state === "interrupted") {
      await patchSlot(expectedKey, slotId, {
        status: "ERROR",
        actualFilename: item.filename || null,
        error: { code: "DOWNLOAD_INTERRUPTED", detail: item.error || null }
      });
    }
  }

  async function startSlotRecovery(state, slotId) {
    const expectedKey = runKey(state);
    let current = await readState();
    if (!current || runKey(current) !== expectedKey) return;
    let slot = current.slots.find((item) => item.slotId === slotId);
    if (!slot || !Number.isInteger(slot.tabId)) return;
    const status = slot.imageRecovery?.status || "PENDING";

    if (status === "COMPLETE" || status === "ERROR") return;
    if (status === "DOWNLOADING" && Number.isInteger(slot.imageRecovery?.downloadId)) {
      await reconcileDownload(expectedKey, slotId, slot.imageRecovery.downloadId);
      return;
    }

    await patchSlot(expectedKey, slotId, { status: "RESOLVING", error: null });

    let resolved;
    try { resolved = await extractLatestAssistantImage(slot.tabId); }
    catch (error) {
      resolved = { ok: false, reason: "IMAGE_CAPTURE_FAILED", detail: error instanceof Error ? error.message : String(error) };
    }
    if (!resolved?.ok || !resolved.candidate?.src) {
      await patchSlot(expectedKey, slotId, {
        status: "ERROR",
        error: { code: resolved?.reason || "OUTPUT_IMAGE_NOT_FOUND", detail: resolved || null }
      });
      return;
    }

    const candidate = resolved.candidate;
    const ext = extensionFromCandidate(candidate);
    const stem = sanitizePart((state.fileName || "canonical").replace(/\.[^.]+$/, ""));
    const filename = `MYGPT-Worker-Fanout/${stampFrom(state.startedAt)}_${stem}_${slotId}.${ext}`;

    let downloadId;
    try {
      downloadId = await chrome.downloads.download({
        url: candidate.src,
        filename,
        conflictAction: "uniquify",
        saveAs: false
      });
    } catch (error) {
      await patchSlot(expectedKey, slotId, {
        status: "ERROR",
        sourceUrl: candidate.src,
        width: candidate.width || null,
        height: candidate.height || null,
        filename,
        error: { code: "DOWNLOAD_START_FAILED", detail: error instanceof Error ? error.message : String(error) }
      });
      return;
    }

    await patchSlot(expectedKey, slotId, {
      status: "DOWNLOADING",
      downloadId,
      filename,
      sourceUrl: candidate.src,
      width: candidate.width || null,
      height: candidate.height || null,
      selectionEvidence: `latest-assistant-largest-image@attempt-${resolved.attempt || 1}`,
      error: null,
      startedAt: Date.now()
    });

    // A small image can finish before onChanged observes the persisted download id.
    // Reconcile immediately so that completion cannot be lost to that race.
    await reconcileDownload(expectedKey, slotId, downloadId);
  }

  async function runRecovery() {
    if (recoveryBusy) {
      recoveryQueued = true;
      return;
    }
    recoveryBusy = true;
    try {
      let state = await readState();
      if (!generationComplete(state)) return;
      state = await initializeRecoveryState(state) || state;
      const expectedKey = runKey(state);

      for (const slotId of SLOT_IDS) {
        const latest = await readState();
        if (!latest || runKey(latest) !== expectedKey || !generationComplete(latest)) return;
        await startSlotRecovery(latest, slotId);
      }

      const finalState = await readState();
      if (finalState && runKey(finalState) === expectedKey) {
        await patchState(expectedKey, (current) => ({ ...current, recoveryPhase: computeRecoveryPhase(current) }));
      }
    } finally {
      recoveryBusy = false;
      if (recoveryQueued) {
        recoveryQueued = false;
        queueMicrotask(() => runRecovery().catch(() => {}));
      }
    }
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "session") return;
    const next = changes?.[STATE_KEY]?.newValue;
    if (!next) return;
    if (generationComplete(next) && computeRecoveryPhase(next) !== "COMPLETE" && !["ERROR", "PARTIAL_ERROR"].includes(computeRecoveryPhase(next))) {
      queueMicrotask(() => runRecovery().catch(() => {}));
    }
  });

  chrome.downloads.onChanged.addListener((delta) => {
    if (!delta?.state?.current || !Number.isInteger(delta.id)) return;
    if (!RECOVERY_TERMINAL.has(delta.state.current === "complete" ? "COMPLETE" : delta.state.current === "interrupted" ? "ERROR" : "")) return;
    readState().then(async (state) => {
      if (!state) return;
      const slot = state.slots?.find((item) => item.imageRecovery?.downloadId === delta.id);
      if (!slot) return;
      await reconcileDownload(runKey(state), slot.slotId, delta.id);
    }).catch(() => {});
  });

  // MV3 can restart the service worker after downloads have begun. Reconcile
  // persisted download ids on startup and continue any still-pending recovery.
  queueMicrotask(() => runRecovery().catch(() => {}));
})();

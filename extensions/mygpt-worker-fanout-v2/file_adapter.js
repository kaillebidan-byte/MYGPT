"use strict";

(function installMygptFileAdapter(globalScope) {
  const FILE_INPUT_SELECTORS = Object.freeze([
    'input[type="file"][accept*="image"]',
    'form input[type="file"]',
    'input[type="file"]'
  ]);

  const ATTACHMENT_UI_SELECTORS = Object.freeze([
    '[data-testid*="attachment"]',
    '[data-testid*="file-preview"]',
    '[data-testid*="upload-preview"]',
    'img[src^="blob:"]',
    'img[src^="data:image/"]'
  ]);

  function decodeDataUrl(dataUrl) {
    if (typeof dataUrl !== "string") return null;
    const match = dataUrl.match(/^data:([^;,]*)(;base64)?,(.*)$/s);
    if (!match) return null;
    const mime = match[1] || "application/octet-stream";
    const isBase64 = Boolean(match[2]);
    const payload = match[3] || "";
    let binary;
    try {
      binary = isBase64 ? atob(payload) : decodeURIComponent(payload);
    } catch (_) {
      return null;
    }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i) & 0xff;
    }
    return { mime, bytes };
  }

  function createFile(fileSpec) {
    if (!fileSpec || typeof fileSpec.name !== "string" || !fileSpec.name) {
      return { ok: false, reason: "FILE_NAME_MISSING" };
    }
    const decoded = decodeDataUrl(fileSpec.dataUrl);
    if (!decoded) {
      return { ok: false, reason: "FILE_DATA_INVALID" };
    }
    const type = typeof fileSpec.type === "string" && fileSpec.type
      ? fileSpec.type
      : decoded.mime;
    const file = new File([decoded.bytes], fileSpec.name, {
      type,
      lastModified: Date.now()
    });
    return { ok: true, file };
  }

  function findFileInput(doc) {
    const documentRef = doc || document;
    for (const selector of FILE_INPUT_SELECTORS) {
      let nodes = [];
      try {
        nodes = documentRef.querySelectorAll(selector);
      } catch (_) {
        continue;
      }
      for (const node of nodes) {
        if (node && node.isConnected && !node.disabled) return node;
      }
    }
    return null;
  }

  function evidenceRoot(doc) {
    const documentRef = doc || document;
    return documentRef.querySelector("form") || documentRef.body || documentRef.documentElement;
  }

  function filenameVisible(fileName, doc) {
    const root = evidenceRoot(doc);
    if (!root || !fileName) return false;
    const text = root.innerText || root.textContent || "";
    if (text.includes(fileName)) return true;
    const labeled = root.querySelectorAll?.("[aria-label], [title]") || [];
    for (const node of labeled) {
      const aria = node.getAttribute?.("aria-label") || "";
      const title = node.getAttribute?.("title") || "";
      if (aria.includes(fileName) || title.includes(fileName)) return true;
    }
    return false;
  }

  function attachmentUiCount(doc) {
    const root = evidenceRoot(doc);
    if (!root || !root.querySelectorAll) return 0;
    const found = new Set();
    for (const selector of ATTACHMENT_UI_SELECTORS) {
      let nodes = [];
      try {
        nodes = root.querySelectorAll(selector);
      } catch (_) {
        continue;
      }
      for (const node of nodes) found.add(node);
    }
    return found.size;
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

  async function attachFile(fileSpec, options = {}) {
    const documentRef = options.document || document;
    const input = findFileInput(documentRef);
    if (!input) return { ok: false, reason: "FILE_INPUT_NOT_FOUND" };

    const made = createFile(fileSpec);
    if (!made.ok) return made;

    const beforeUiCount = attachmentUiCount(documentRef);
    const transfer = new DataTransfer();
    transfer.items.add(made.file);

    try {
      input.files = transfer.files;
    } catch (error) {
      return {
        ok: false,
        reason: "FILE_INPUT_ASSIGN_FAILED",
        detail: error instanceof Error ? error.message : String(error)
      };
    }

    // AutoGPT's proven ChatGPT path dispatches the file input's change event.
    // Do not fire an input event first: React can remount the file input between
    // the two events, leaving change attached to a stale node.
    input.dispatchEvent(new Event("change", { bubbles: true, composed: true }));

    const timeout = Number.isFinite(options.verifyTimeout) ? options.verifyTimeout : 10000;
    const interval = Number.isFinite(options.verifyInterval) ? options.verifyInterval : 150;
    const startedAt = Date.now();
    let inputAssigned = false;

    while (Date.now() - startedAt < timeout) {
      if (filenameVisible(made.file.name, documentRef)) {
        return {
          ok: true,
          evidence: "visible-filename",
          name: made.file.name,
          size: made.file.size,
          type: made.file.type
        };
      }

      if (attachmentUiCount(documentRef) > beforeUiCount) {
        return {
          ok: true,
          evidence: "visible-attachment-ui",
          name: made.file.name,
          size: made.file.size,
          type: made.file.type
        };
      }

      const selected = input.files && input.files.length
        ? Array.from(input.files).find((candidate) =>
            candidate.name === made.file.name && candidate.size === made.file.size)
        : null;
      if (selected) inputAssigned = true;

      await sleep(interval);
    }

    return {
      ok: false,
      reason: "FILE_ATTACHMENT_UI_NOT_CONFIRMED",
      name: made.file.name,
      size: made.file.size,
      type: made.file.type,
      inputAssigned
    };
  }

  const api = Object.freeze({
    FILE_INPUT_SELECTORS,
    ATTACHMENT_UI_SELECTORS,
    decodeDataUrl,
    findFileInput,
    attachmentUiCount,
    attachFile
  });

  globalScope.MYGPTFileAdapter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

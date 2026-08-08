"use strict";

(function installMygptFileAdapter(globalScope) {
  const FILE_INPUT_SELECTORS = Object.freeze([
    'form input[type="file"]',
    'input[type="file"][accept*="image"]',
    'input[type="file"]'
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

  function filenameVisible(fileName, doc) {
    const documentRef = doc || document;
    const form = documentRef.querySelector("form");
    const root = form || documentRef.body;
    if (!root || !fileName) return false;
    const text = root.innerText || root.textContent || "";
    return text.includes(fileName);
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

  async function attachFile(fileSpec, options = {}) {
    const documentRef = options.document || document;
    const input = findFileInput(documentRef);
    if (!input) return { ok: false, reason: "FILE_INPUT_NOT_FOUND" };

    const made = createFile(fileSpec);
    if (!made.ok) return made;

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

    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    input.dispatchEvent(new Event("change", { bubbles: true, composed: true }));

    const timeout = Number.isFinite(options.verifyTimeout) ? options.verifyTimeout : 4000;
    const interval = Number.isFinite(options.verifyInterval) ? options.verifyInterval : 150;
    const startedAt = Date.now();
    let inputEvidence = false;

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

      const selected = input.files && input.files.length
        ? Array.from(input.files).find((candidate) =>
            candidate.name === made.file.name && candidate.size === made.file.size)
        : null;
      if (selected) inputEvidence = true;

      await sleep(interval);
    }

    if (inputEvidence) {
      return {
        ok: true,
        evidence: "input-files",
        name: made.file.name,
        size: made.file.size,
        type: made.file.type
      };
    }

    return {
      ok: false,
      reason: "FILE_ATTACHMENT_EVIDENCE_MISSING",
      name: made.file.name,
      size: made.file.size
    };
  }

  const api = Object.freeze({
    FILE_INPUT_SELECTORS,
    decodeDataUrl,
    findFileInput,
    attachFile
  });

  globalScope.MYGPTFileAdapter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

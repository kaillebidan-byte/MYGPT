"use strict";

(function installMygptChatgptAdapter(globalScope) {
  const COMPOSER_SELECTOR = 'form[data-type="unified-composer"]';
  const FILE_INPUT_SELECTOR = 'input[type="file"]';
  const PROMPT_PARAGRAPH_SELECTOR = '#prompt-textarea p';
  const PROMPT_ROOT_SELECTOR = '#prompt-textarea';
  const SUBMIT_SELECTOR = '#composer-submit-button';
  const ATTACHMENT_UI_SELECTORS = Object.freeze([
    '[data-testid*="attachment"]',
    '[data-testid*="file-preview"]',
    '[data-testid*="upload-preview"]',
    'button[aria-label*="Remove file" i]',
    'button[aria-label*="Remove attachment" i]',
    'button[aria-label*="削除"]'
  ]);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

  function normalizeText(value) {
    return String(value || "")
      .replace(/\r\n?/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function getComposer(doc = document) { return doc.querySelector(COMPOSER_SELECTOR); }
  function getFileInput(doc = document) { return getComposer(doc)?.querySelector(FILE_INPUT_SELECTOR) || null; }
  function getPromptRoot(doc = document) { return doc.querySelector(PROMPT_ROOT_SELECTOR); }
  function getSubmitButton(doc = document) { return doc.querySelector(SUBMIT_SELECTOR); }

  // AutoGPT dispatches the paste to the first paragraph inside #prompt-textarea.
  function getPromptEditor(doc = document) {
    const paragraph = doc.querySelector(PROMPT_PARAGRAPH_SELECTOR);
    if (paragraph) return paragraph;
    const root = getPromptRoot(doc);
    if (!root) return null;
    if (root.matches?.('textarea, input, [contenteditable="true"]')) return root;
    return root.querySelector?.('p, [contenteditable="true"]') || root;
  }

  function isUploading(doc = document) { return Boolean(getComposer(doc)?.querySelector("circle")); }

  function attachmentSnapshot(doc = document) {
    const composer = getComposer(doc);
    if (!composer?.querySelectorAll) return { markers: 0, images: 0 };
    const markers = new Set();
    for (const selector of ATTACHMENT_UI_SELECTORS) {
      let nodes = [];
      try { nodes = composer.querySelectorAll(selector); } catch (_) { continue; }
      for (const node of nodes) markers.add(node);
    }
    return { markers: markers.size, images: composer.querySelectorAll("img").length };
  }

  function attachmentVisible(fileName, before, doc = document) {
    const composer = getComposer(doc);
    if (!composer) return null;
    const text = composer.innerText || composer.textContent || "";
    if (fileName && text.includes(fileName)) return { kind: "visible-filename" };
    const current = attachmentSnapshot(doc);
    if (current.markers > Number(before?.markers || 0)) return { kind: "attachment-marker", ...current };
    if (current.images > Number(before?.images || 0)) return { kind: "attachment-image", ...current };
    return null;
  }

  function editorText(editor) {
    if (!editor) return "";
    if (editor.tagName === "TEXTAREA" || editor.tagName === "INPUT") return normalizeText(editor.value);
    return normalizeText(editor.innerText || editor.textContent || "");
  }

  function composerStructuredText(doc = document) {
    const root = getPromptRoot(doc);
    if (!root) return editorText(getPromptEditor(doc));
    if (root.tagName === "TEXTAREA" || root.tagName === "INPUT") return editorText(root);
    const paragraphs = Array.from(root.querySelectorAll?.("p") || []);
    if (paragraphs.length) {
      return normalizeText(paragraphs.map((node) => normalizeText(node.innerText || node.textContent || "")).join("\n"));
    }
    return editorText(root);
  }

  function composerDraftText(doc = document) { return composerStructuredText(doc); }

  async function waitFor(test, options = {}) {
    const timeout = Number.isFinite(options.timeout) ? options.timeout : 15000;
    const interval = Number.isFinite(options.interval) ? options.interval : 150;
    const startedAt = Date.now();
    let lastError = null;
    while (Date.now() - startedAt < timeout) {
      try {
        const result = test();
        if (result) return result;
      } catch (error) { lastError = error; }
      await sleep(interval);
    }
    if (lastError) throw lastError;
    return null;
  }

  async function waitForComposer(doc = document, timeout = 15000) {
    return waitFor(() => {
      const composer = getComposer(doc);
      const editor = getPromptEditor(doc);
      const input = getFileInput(doc);
      return composer && editor && input ? { composer, editor, input } : null;
    }, { timeout, interval: 150 });
  }

  function createFile(fileSpec) {
    if (!fileSpec || typeof fileSpec.name !== "string" || !fileSpec.name) return { ok: false, reason: "FILE_NAME_MISSING" };
    if (typeof fileSpec.dataUrl !== "string") return { ok: false, reason: "FILE_DATA_MISSING" };
    const match = fileSpec.dataUrl.match(/^data:([^;,]*)(;base64)?,(.*)$/s);
    if (!match) return { ok: false, reason: "FILE_DATA_INVALID" };
    let binary;
    try { binary = match[2] ? atob(match[3] || "") : decodeURIComponent(match[3] || ""); }
    catch (_) { return { ok: false, reason: "FILE_DATA_DECODE_FAILED" }; }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i) & 0xff;
    const type = fileSpec.type || match[1] || "application/octet-stream";
    return { ok: true, file: new File([bytes], fileSpec.name, { type, lastModified: Date.now() }) };
  }

  async function waitForUploadSettled(doc = document, options = {}) {
    const timeout = options.timeout || 90000;
    const interval = options.interval || 250;
    const stableCyclesNeeded = options.stableCycles || 3;
    const startedAt = Date.now();
    let stableCycles = 0;
    let sawSpinner = false;
    while (Date.now() - startedAt < timeout) {
      const uploading = isUploading(doc);
      if (uploading) {
        sawSpinner = true;
        stableCycles = 0;
      } else {
        stableCycles += 1;
        if (stableCycles >= stableCyclesNeeded && Date.now() - startedAt >= 750) {
          return { settled: true, sawSpinner };
        }
      }
      await sleep(interval);
    }
    return null;
  }

  function fileInputReflects(input, file) {
    const selected = input?.files?.[0] || null;
    return Boolean(
      input?.files?.length === 1 &&
      selected &&
      selected.name === file.name &&
      selected.size === file.size &&
      selected.type === file.type
    );
  }

  async function dispatchAttachmentAttempt(file, options = {}) {
    const doc = options.document || document;
    const initial = await waitForComposer(doc, options.composerTimeout || 15000);
    if (!initial) return { ok: false, retryable: true, reason: "COMPOSER_OR_FILE_INPUT_NOT_FOUND" };

    const before = attachmentSnapshot(doc);
    const transfer = new DataTransfer();
    transfer.items.add(file);

    // Re-resolve immediately before assignment. ChatGPT can remount the composer/file input.
    const input = getFileInput(doc);
    if (!input) return { ok: false, retryable: true, reason: "FILE_INPUT_NOT_FOUND" };
    try { input.files = transfer.files; }
    catch (error) {
      return {
        ok: false,
        retryable: true,
        reason: "FILE_INPUT_ASSIGN_FAILED",
        detail: error instanceof Error ? error.message : String(error)
      };
    }
    if (!fileInputReflects(input, file)) {
      return { ok: false, retryable: true, reason: "FILE_INPUT_ASSIGN_NOT_REFLECTED" };
    }

    // Exact AutoGPT primitive: one bubbling change event; no synthetic input event.
    input.dispatchEvent(new Event("change", { bubbles: true }));

    const settled = await waitForUploadSettled(doc, {
      timeout: options.uploadTimeout || 90000,
      interval: options.uploadInterval || 250,
      stableCycles: 3
    });
    if (!settled) {
      return { ok: false, retryable: false, reason: "UPLOAD_SETTLE_TIMEOUT", sawSpinner: null };
    }

    // UI evidence is a guard against sending a text-only slot, but it is not allowed
    // to turn one transient React/file-input miss into a permanent slot failure.
    const visible = await waitFor(() => attachmentVisible(file.name, before, doc), {
      timeout: options.attachmentUiTimeout || 5000,
      interval: 200
    });
    if (!visible) {
      return {
        ok: false,
        retryable: true,
        reason: "ATTACHMENT_UI_NOT_CONFIRMED",
        sawSpinner: settled.sawSpinner,
        before,
        after: attachmentSnapshot(doc)
      };
    }

    return {
      ok: true,
      attachmentUiEvidence: visible.kind,
      sawSpinner: settled.sawSpinner
    };
  }

  async function attachFile(fileSpec, options = {}) {
    const doc = options.document || document;
    const made = createFile(fileSpec);
    if (!made.ok) return made;

    const initial = await waitForComposer(doc, options.composerTimeout || 15000);
    if (!initial) return { ok: false, reason: "COMPOSER_OR_FILE_INPUT_NOT_FOUND" };

    // Preserve the known-good AutoGPT upload primitive. The only recovery added here
    // is one bounded retry after re-resolving the React file input. This addresses the
    // live F4-only race without touching submit/monitor behavior or allowing text-only send.
    const originalSnapshot = attachmentSnapshot(doc);
    const attempts = [];
    const maxAttempts = Number.isFinite(options.maxAttachmentAttempts)
      ? Math.max(1, Math.min(2, Math.floor(options.maxAttachmentAttempts)))
      : 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (attempt > 1) {
        // If the first attempt was merely slow, accept its late-arriving UI evidence
        // instead of dispatching a second change and risking a duplicate attachment.
        const late = attachmentVisible(made.file.name, originalSnapshot, doc);
        if (late) {
          return {
            ok: true,
            evidence: "autogpt-upload+visible-attachment",
            attachmentUiEvidence: `${late.kind}@attempt-1-late`,
            attachmentAttempts: 1,
            recoveredLate: true,
            name: made.file.name,
            size: made.file.size,
            type: made.file.type
          };
        }
        await sleep(options.retryDelay || 750);
        const afterDelay = attachmentVisible(made.file.name, originalSnapshot, doc);
        if (afterDelay) {
          return {
            ok: true,
            evidence: "autogpt-upload+visible-attachment",
            attachmentUiEvidence: `${afterDelay.kind}@attempt-1-late`,
            attachmentAttempts: 1,
            recoveredLate: true,
            name: made.file.name,
            size: made.file.size,
            type: made.file.type
          };
        }
      }

      const result = await dispatchAttachmentAttempt(made.file, {
        document: doc,
        composerTimeout: options.composerTimeout || 15000,
        uploadTimeout: options.uploadTimeout || 90000,
        uploadInterval: options.uploadInterval || 250,
        attachmentUiTimeout: options.attachmentUiTimeout || 5000
      });
      attempts.push({
        attempt,
        ok: result.ok === true,
        reason: result.reason || null,
        sawSpinner: result.sawSpinner ?? null,
        before: result.before || null,
        after: result.after || null
      });

      if (result.ok) {
        return {
          ok: true,
          evidence: "autogpt-upload+visible-attachment",
          attachmentUiEvidence: `${result.attachmentUiEvidence}@attempt-${attempt}`,
          attachmentAttempts: attempt,
          sawSpinner: result.sawSpinner,
          name: made.file.name,
          size: made.file.size,
          type: made.file.type
        };
      }
      if (!result.retryable || attempt >= maxAttempts) {
        return {
          ok: false,
          reason: result.reason || "ATTACHMENT_FAILED",
          name: made.file.name,
          attachmentAttempts: attempt,
          attempts
        };
      }
    }

    return { ok: false, reason: "ATTACHMENT_FAILED", name: made.file.name, attempts };
  }

  async function pastePrompt(text, options = {}) {
    const doc = options.document || document;
    const win = options.window || window;
    const raw = String(text || "");
    const expected = normalizeText(raw);
    if (!expected) return { ok: false, reason: "PACKET_EMPTY" };
    const editor = await waitFor(() => getPromptEditor(doc), { timeout: options.editorTimeout || 15000, interval: 150 });
    if (!editor) return { ok: false, reason: "PROMPT_EDITOR_NOT_FOUND" };
    if (composerDraftText(doc)) return { ok: false, reason: "COMPOSER_NOT_EMPTY", observed: composerDraftText(doc) };

    editor.click?.();
    editor.focus?.();
    await sleep(50);
    const selection = win.getSelection?.();
    if (selection && doc.createRange) {
      const range = doc.createRange();
      const pill = editor.querySelector?.("[data-inline-selection-pill]") || null;
      try {
        if (pill?.parentNode) {
          range.setStartAfter(pill);
          range.setEnd(editor, editor.childNodes.length);
        } else {
          range.selectNodeContents(editor);
        }
        selection.removeAllRanges();
        selection.addRange(range);
        await sleep(100);
      } catch (_) {}
    }

    const pasteEvent = new ClipboardEvent("paste", { bubbles: true, cancelable: true });
    const clipboard = new DataTransfer();
    clipboard.setData("text/plain", raw);
    Object.defineProperty(pasteEvent, "clipboardData", { value: clipboard });
    editor.dispatchEvent(pasteEvent);

    let observed = "";
    const reflected = await waitFor(() => {
      const current = getPromptEditor(doc);
      observed = composerStructuredText(doc);
      return observed === expected ? current : null;
    }, { timeout: options.reflectTimeout || 5000, interval: 100 });

    if (!reflected) {
      return {
        ok: false,
        reason: "PROMPT_PASTE_VERIFY_FAILED",
        expectedChars: expected.length,
        observedChars: observed.length,
        observedPreview: observed.slice(0, 200)
      };
    }
    return {
      ok: true,
      evidence: "normalized-paragraph-readback",
      method: "autogpt-synthetic-paste",
      composerKind: reflected.tagName === "TEXTAREA" || reflected.tagName === "INPUT" ? "text-control" : "contenteditable",
      observedChars: observed.length
    };
  }

  const api = Object.freeze({
    COMPOSER_SELECTOR, FILE_INPUT_SELECTOR, PROMPT_PARAGRAPH_SELECTOR, PROMPT_ROOT_SELECTOR, SUBMIT_SELECTOR,
    ATTACHMENT_UI_SELECTORS, normalizeText, getComposer, getFileInput, getPromptRoot, getPromptEditor,
    getSubmitButton, isUploading, attachmentSnapshot, attachmentVisible, editorText, composerStructuredText,
    composerDraftText, waitFor, waitForComposer, createFile, waitForUploadSettled, fileInputReflects,
    dispatchAttachmentAttempt, attachFile, pastePrompt
  });
  globalScope.MYGPTChatGPTAdapter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

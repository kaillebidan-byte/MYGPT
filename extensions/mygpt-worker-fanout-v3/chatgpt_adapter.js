"use strict";

(function installMygptChatgptAdapter(globalScope) {
  const COMPOSER_SELECTOR = 'form[data-type="unified-composer"]';
  const FILE_INPUT_SELECTOR = 'input[type="file"]';
  const PROMPT_PARAGRAPH_SELECTOR = '#prompt-textarea p';
  const PROMPT_ROOT_SELECTOR = '#prompt-textarea';
  const SUBMIT_SELECTOR = '#composer-submit-button';

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

  // This adapter must execute in the page MAIN world. Synthetic ClipboardEvent
  // clipboardData is part of ChatGPT's page-side input contract.
  function normalizeText(value) {
    return String(value || "")
      .replace(/\r\n?/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function getComposer(doc = document) {
    return doc.querySelector(COMPOSER_SELECTOR);
  }

  function getFileInput(doc = document) {
    return getComposer(doc)?.querySelector(FILE_INPUT_SELECTOR) || null;
  }

  function getPromptRoot(doc = document) {
    return doc.querySelector(PROMPT_ROOT_SELECTOR);
  }

  // AutoGPT dispatches paste to the first paragraph inside #prompt-textarea.
  // Keep that event target, but never use a single paragraph as full-draft evidence.
  function getPromptEditor(doc = document) {
    const paragraph = doc.querySelector(PROMPT_PARAGRAPH_SELECTOR);
    if (paragraph) return paragraph;
    const root = getPromptRoot(doc);
    if (!root) return null;
    if (root.matches?.('textarea, input, [contenteditable="true"]')) return root;
    return root.querySelector?.('p, [contenteditable="true"]') || root;
  }

  function getSubmitButton(doc = document) {
    return doc.querySelector(SUBMIT_SELECTOR);
  }

  function isUploading(doc = document) {
    return Boolean(getComposer(doc)?.querySelector("circle"));
  }

  function isStopButton(button) {
    if (!button) return false;
    const testId = button.getAttribute?.("data-testid") || "";
    const aria = button.getAttribute?.("aria-label") || "";
    return testId === "stop-button" || testId === "composer-stop-button" || /stop generating|生成を停止/i.test(aria);
  }

  function getTranslationLoopSendButton(doc = document) {
    const guard = globalScope.MYGPTTranslationLoopSendGuard;
    if (!guard?.getEnabledSendButton) return null;
    return guard.getEnabledSendButton(getPromptRoot(doc) || getPromptEditor(doc), doc);
  }

  // AutoGPT supplies the upload mechanics/spinner predicate. Translation Loop
  // supplies the stronger positive ready evidence: a real composer-local send
  // control must exist and be enabled. A temporarily absent React button is
  // therefore never accepted as upload completion.
  function uploadReady(doc = document) {
    return !isUploading(doc) && Boolean(getTranslationLoopSendButton(doc));
  }

  function editorText(editor) {
    if (!editor) return "";
    if (editor.tagName === "TEXTAREA" || editor.tagName === "INPUT") {
      return normalizeText(editor.value);
    }
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

  function composerDraftText(doc = document) {
    return composerStructuredText(doc);
  }

  async function waitFor(test, options = {}) {
    const timeout = Number.isFinite(options.timeout) ? options.timeout : 15000;
    const interval = Number.isFinite(options.interval) ? options.interval : 150;
    const startedAt = Date.now();
    let lastError = null;
    while (Date.now() - startedAt < timeout) {
      try {
        const result = test();
        if (result) return result;
      } catch (error) {
        lastError = error;
      }
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
    if (!fileSpec || typeof fileSpec.name !== "string" || !fileSpec.name) {
      return { ok: false, reason: "FILE_NAME_MISSING" };
    }
    if (typeof fileSpec.dataUrl !== "string") {
      return { ok: false, reason: "FILE_DATA_MISSING" };
    }
    const match = fileSpec.dataUrl.match(/^data:([^;,]*)(;base64)?,(.*)$/s);
    if (!match) return { ok: false, reason: "FILE_DATA_INVALID" };
    let binary;
    try {
      binary = match[2] ? atob(match[3] || "") : decodeURIComponent(match[3] || "");
    } catch (_) {
      return { ok: false, reason: "FILE_DATA_DECODE_FAILED" };
    }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i) & 0xff;
    const type = fileSpec.type || match[1] || "application/octet-stream";
    return {
      ok: true,
      file: new File([bytes], fileSpec.name, { type, lastModified: Date.now() })
    };
  }

  async function attachFile(fileSpec, options = {}) {
    const doc = options.document || document;
    const made = createFile(fileSpec);
    if (!made.ok) return made;

    const initial = await waitForComposer(doc, options.composerTimeout || 15000);
    if (!initial) return { ok: false, reason: "COMPOSER_OR_FILE_INPUT_NOT_FOUND" };

    const transfer = new DataTransfer();
    transfer.items.add(made.file);
    const input = getFileInput(doc);
    if (!input) return { ok: false, reason: "FILE_INPUT_NOT_FOUND" };

    try {
      input.files = transfer.files;
    } catch (error) {
      return {
        ok: false,
        reason: "FILE_INPUT_ASSIGN_FAILED",
        detail: error instanceof Error ? error.message : String(error)
      };
    }

    input.dispatchEvent(new Event("change", { bubbles: true }));

    // AutoGPT performs the upload; Translation Loop's send-control monitor is
    // the final positive READY gate. Do not accept a transient missing button.
    await sleep(250);
    const ready = await waitFor(() => uploadReady(doc), {
      timeout: options.uploadTimeout || 90000,
      interval: options.uploadInterval || 250
    });
    if (!ready) {
      return { ok: false, reason: "UPLOAD_READY_TIMEOUT", name: made.file.name };
    }

    return {
      ok: true,
      evidence: "autogpt-upload-ready",
      name: made.file.name,
      size: made.file.size,
      type: made.file.type
    };
  }

  async function pastePrompt(text, options = {}) {
    const doc = options.document || document;
    const win = options.window || window;
    const raw = String(text || "");
    const expected = normalizeText(raw);
    if (!expected) return { ok: false, reason: "PACKET_EMPTY" };

    const editor = await waitFor(() => getPromptEditor(doc), {
      timeout: options.editorTimeout || 15000,
      interval: 150
    });
    if (!editor) return { ok: false, reason: "PROMPT_EDITOR_NOT_FOUND" };

    if (composerDraftText(doc)) {
      return { ok: false, reason: "COMPOSER_NOT_EMPTY", observed: composerDraftText(doc) };
    }

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

    // Match AutoGPT 0.0.71 ordering: create the paste event, then DataTransfer,
    // then define clipboardData on the event before dispatch.
    const pasteEvent = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true
    });
    const clipboard = new DataTransfer();
    clipboard.setData("text/plain", raw);
    Object.defineProperty(pasteEvent, "clipboardData", { value: clipboard });
    editor.dispatchEvent(pasteEvent);

    let observed = "";
    const reflected = await waitFor(() => {
      const current = getPromptEditor(doc);
      observed = composerStructuredText(doc);
      return observed === expected ? current : null;
    }, {
      timeout: options.reflectTimeout || 5000,
      interval: 100
    });

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
      evidence: "normalized-exact-readback",
      method: "autogpt-synthetic-paste",
      composerKind: reflected.tagName === "TEXTAREA" || reflected.tagName === "INPUT"
        ? "text-control"
        : "contenteditable",
      observedChars: observed.length
    };
  }

  const api = Object.freeze({
    COMPOSER_SELECTOR,
    FILE_INPUT_SELECTOR,
    PROMPT_PARAGRAPH_SELECTOR,
    PROMPT_ROOT_SELECTOR,
    SUBMIT_SELECTOR,
    normalizeText,
    getComposer,
    getFileInput,
    getPromptRoot,
    getPromptEditor,
    getSubmitButton,
    getTranslationLoopSendButton,
    isUploading,
    isStopButton,
    uploadReady,
    editorText,
    composerStructuredText,
    composerDraftText,
    waitFor,
    waitForComposer,
    attachFile,
    pastePrompt
  });

  globalScope.MYGPTChatGPTAdapter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

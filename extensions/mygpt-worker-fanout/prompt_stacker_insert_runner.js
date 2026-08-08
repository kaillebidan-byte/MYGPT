"use strict";

/*
 * Insert-only fork of the Prompt Stacker runner shipped in the user's
 * ChatGPT Translation Loop Test 0.5.1.
 *
 * Translation Loop's prompt_stacker_runner.js is adapted from Prompt Stacker
 * (thegreatLUCY/prompt-stacker, content.js, commit
 * 5a01391c124ecc1d8f4cc8c4538883cec6bde1c3).
 *
 * Gate 1 deliberately removes every send/submit activation primitive and keeps
 * only the proven editor discovery, native value setter/contenteditable path,
 * cancellable wait, draft protection and reflection verification.
 *
 * Licensed under MIT; see LICENSE-PROMPT-STACKER.
 */

(function installPromptStackerInsertRunner(globalScope) {
  const DEFAULT_ADAPTER = Object.freeze({
    editor: ["#prompt-textarea", 'div[contenteditable="true"]', "textarea"]
  });

  function normalizeText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function createRunController() {
    let runState = "idle";
    let cancel = false;
    let generation = 0;

    return {
      start() {
        generation += 1;
        cancel = false;
        runState = "running";
      },
      pause() {
        if (runState === "running") runState = "paused";
      },
      resume() {
        if (runState === "paused") runState = "running";
      },
      stop() {
        generation += 1;
        cancel = true;
        runState = "idle";
      },
      get state() {
        return runState;
      },
      get cancelled() {
        return cancel;
      },
      get generation() {
        return generation;
      },
      canRun(expectedGeneration = null) {
        return runState === "running" && !cancel &&
          (expectedGeneration == null || generation === expectedGeneration);
      }
    };
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

  async function waitFor(test, options = {}) {
    const timeout = Number.isFinite(options.timeout) ? options.timeout : 15000;
    const interval = Number.isFinite(options.interval) ? options.interval : 300;
    const controller = options.controller || null;
    const expectedGeneration = options.generation ?? null;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeout) {
      if (controller?.cancelled ||
          (expectedGeneration != null && controller?.generation !== expectedGeneration)) return null;
      if (controller?.state === "paused") {
        await sleep(Math.min(200, interval));
        continue;
      }
      const value = test();
      if (value) return value;
      await sleep(interval);
    }
    return null;
  }

  function createRunner(options = {}) {
    const documentRef = options.document || globalScope.document;
    const windowRef = options.window || globalScope.window;
    const adapter = {
      editor: [...(options.adapter?.editor || DEFAULT_ADAPTER.editor)]
    };
    const controller = createRunController();
    const ownRootSelector = options.ownRootSelector || null;
    const acceptNode = typeof options.acceptNode === "function" ? options.acceptNode : () => true;

    function outsideOwnUi(node) {
      return (!ownRootSelector || !node.closest?.(ownRootSelector)) && acceptNode(node);
    }

    function firstMatch(selectors, root = documentRef) {
      if (!root?.querySelectorAll) return null;
      for (const selector of selectors) {
        let nodes = [];
        try {
          nodes = root.querySelectorAll(selector);
        } catch (_) {
          continue;
        }
        for (const node of nodes) {
          if (outsideOwnUi(node)) return node;
        }
      }
      return null;
    }

    function getEditor() {
      return firstMatch(adapter.editor);
    }

    function editorText(editor) {
      if (!editor) return "";
      if (editor.tagName === "TEXTAREA" || editor.tagName === "INPUT") {
        return normalizeText(editor.value);
      }
      return normalizeText(editor.innerText || editor.textContent || "");
    }

    // Preserved from Translation Loop's proven Prompt Stacker runner:
    // native setter for textarea/input and execCommand for rich editors.
    function setPromptText(text, editor = getEditor()) {
      if (!editor) return false;
      editor.focus?.();

      if (editor.tagName === "TEXTAREA") {
        const proto = windowRef?.HTMLTextAreaElement?.prototype;
        const setter = proto && Object.getOwnPropertyDescriptor(proto, "value")?.set;
        if (setter) setter.call(editor, text); else editor.value = text;
        editor.dispatchEvent(new windowRef.Event("input", { bubbles: true }));
        return true;
      }

      if (editor.tagName === "INPUT") {
        const proto = windowRef?.HTMLInputElement?.prototype;
        const setter = proto && Object.getOwnPropertyDescriptor(proto, "value")?.set;
        if (setter) setter.call(editor, text); else editor.value = text;
        editor.dispatchEvent(new windowRef.Event("input", { bubbles: true }));
        return true;
      }

      if (!editor.isContentEditable) return false;
      const selection = windowRef.getSelection?.();
      const range = documentRef.createRange?.();
      if (selection && range) {
        range.selectNodeContents(editor);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      let inserted = false;
      try {
        inserted = documentRef.execCommand("insertText", false, text);
      } catch (_) {
        inserted = false;
      }
      if (!inserted) editor.textContent = text;
      editor.dispatchEvent(new windowRef.Event("input", { bubbles: true }));
      return true;
    }

    async function insertOnly(prompt, insertOptions = {}) {
      const runGeneration = controller.generation;
      if (!controller.canRun(runGeneration)) {
        return { ok: false, reason: "RUNNER_NOT_RUNNING", submitted: false };
      }

      const rawPrompt = String(prompt || "");
      const normalizedPrompt = normalizeText(rawPrompt);
      if (!normalizedPrompt) {
        return { ok: false, reason: "PACKET_EMPTY", submitted: false };
      }

      const editor = await waitFor(getEditor, {
        timeout: insertOptions.editorTimeout || 10000,
        interval: insertOptions.editorInterval || 150,
        controller,
        generation: runGeneration
      });
      if (!editor) {
        return {
          ok: false,
          reason: controller.cancelled ? "INSERT_CANCELLED" : "COMPOSER_NOT_FOUND",
          submitted: false
        };
      }

      if (editorText(editor)) {
        return { ok: false, reason: "COMPOSER_NOT_EMPTY", submitted: false };
      }

      if (!setPromptText(rawPrompt, editor)) {
        return { ok: false, reason: "COMPOSER_SET_FAILED", submitted: false };
      }

      const reflected = await waitFor(() => editorText(editor) === normalizedPrompt, {
        timeout: insertOptions.reflectTimeout || 3000,
        interval: insertOptions.reflectInterval || 100,
        controller,
        generation: runGeneration
      });
      if (!reflected) {
        return { ok: false, reason: "COMPOSER_INSERT_VERIFY_FAILED", submitted: false };
      }

      if (!controller.canRun(runGeneration)) {
        return { ok: false, reason: "INSERT_CANCELLED", submitted: false };
      }

      return {
        ok: true,
        submitted: false,
        exactMatch: true,
        composerKind: editor.tagName === "TEXTAREA" || editor.tagName === "INPUT"
          ? "text-control"
          : "contenteditable",
        method: "translation-loop-prompt-stacker-insert-only",
        observedChars: normalizedPrompt.length
      };
    }

    return {
      start: () => controller.start(),
      pause: () => controller.pause(),
      resume: () => controller.resume(),
      stop: () => controller.stop(),
      get state() { return controller.state; },
      get cancelled() { return controller.cancelled; },
      getEditor,
      editorText,
      setPromptText,
      insertOnly
    };
  }

  const api = {
    DEFAULT_ADAPTER,
    normalizeText,
    createRunController,
    waitFor,
    createRunner
  };

  globalScope.MYGPTPromptStackerInsert = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

"use strict";

/*
 * Prompt submission runner adapted from Prompt Stacker
 * (thegreatLUCY/prompt-stacker, content.js, commit
 * 5a01391c124ecc1d8f4cc8c4538883cec6bde1c3).
 *
 * Kept here as a small, auditable module rather than reimplementing rich-editor
 * input, button/Enter fallback, cancellable waits, and runner state in content.js.
 * Licensed under MIT; see LICENSE-PROMPT-STACKER.
 */

(function installPromptStackerRunner(globalScope) {
  const DEFAULT_ADAPTER = Object.freeze({
    editor: ["#prompt-textarea", 'div[contenteditable="true"]', "textarea"],
    send: [
      '#composer-submit-button',
      'button[data-testid="send-button"]',
      'button[data-testid*="composer-send"]',
      'button[aria-label*="Send" i]',
      'button[aria-label*="送信" i]',
      'button[type="submit"]'
    ],
    globalSend: [
      '#composer-submit-button',
      'button[data-testid="send-button"]',
      'button[data-testid*="composer-send"]',
      'button[type="submit"][data-testid*="send"]'
    ]
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
      editor: [...(options.adapter?.editor || DEFAULT_ADAPTER.editor)],
      send: [...(options.adapter?.send || DEFAULT_ADAPTER.send)],
      globalSend: [...(options.adapter?.globalSend || DEFAULT_ADAPTER.globalSend)]
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

    function enabledCandidate(selectors, root) {
      if (!root?.querySelectorAll) return null;
      for (const selector of selectors) {
        let nodes = [];
        try {
          nodes = root.querySelectorAll(selector);
        } catch (_) {
          continue;
        }
        for (const candidate of nodes) {
          if (!outsideOwnUi(candidate)) continue;
          const disabled = candidate.disabled ||
            candidate.getAttribute?.("aria-disabled") === "true" ||
            candidate.getAttribute?.("data-disabled") === "true";
          if (!disabled) return candidate;
        }
      }
      return null;
    }

    function getSendButton(editor = null) {
      const roots = [];
      const addRoot = (node) => {
        if (node && node !== documentRef?.body && node !== documentRef?.documentElement && !roots.includes(node)) {
          roots.push(node);
        }
      };
      addRoot(editor?.closest?.("form"));
      addRoot(editor?.closest?.('[data-testid*="composer"]'));
      addRoot(editor?.closest?.('[class*="composer"]'));
      let parent = editor?.parentElement || null;
      for (let depth = 0; parent && depth < 2; depth += 1) {
        addRoot(parent);
        parent = parent.parentElement;
      }

      for (const root of roots) {
        const candidate = enabledCandidate(adapter.send, root);
        if (candidate) return candidate;
      }

      // Global fallback is intentionally restricted to strong ChatGPT-specific
      // selectors. Generic submit/aria selectors are composer-local only.
      return enabledCandidate(adapter.globalSend, documentRef);
    }

    function editorText(editor) {
      if (!editor) return "";
      if (editor.tagName === "TEXTAREA" || editor.tagName === "INPUT") {
        return normalizeText(editor.value);
      }
      return normalizeText(editor.innerText || editor.textContent || "");
    }

    // Prompt Stacker uses the native setter for textarea and execCommand for
    // ProseMirror/contenteditable. Plain assignment is ignored by React editors.
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

    function pressEnter(editor) {
      if (!editor) return false;
      for (const type of ["keydown", "keypress", "keyup"]) {
        editor.dispatchEvent(new windowRef.KeyboardEvent(type, {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        }));
      }
      return true;
    }

    // Prompt Stacker's order: ordinary button.click(), then Enter fallback.
    function clickSend(editor = getEditor(), clickOptions = {}) {
      const button = clickOptions.button || getSendButton(editor);
      if (button) {
        button.click();
        return {
          ok: true,
          activation: "native-click",
          button: {
            testId: button.getAttribute?.("data-testid") || null,
            ariaLabel: button.getAttribute?.("aria-label") || null,
            type: button.getAttribute?.("type") || null
          }
        };
      }
      if (clickOptions.allowEnterFallback !== false && pressEnter(editor)) {
        return { ok: true, activation: "enter-fallback", button: null };
      }
      return { ok: false, error: "送信操作を実行できない" };
    }

    async function submit(prompt, submitOptions = {}) {
      const runGeneration = controller.generation;
      if (!controller.canRun(runGeneration)) {
        return { ok: false, error: "runnerが停止中" };
      }
      const normalizedPrompt = normalizeText(prompt);
      if (!normalizedPrompt) return { ok: false, error: "送信文が空" };

      const editor = await waitFor(getEditor, {
        timeout: submitOptions.editorTimeout || 10000,
        interval: 150,
        controller,
        generation: runGeneration
      });
      if (!editor) {
        return { ok: false, error: controller.cancelled ? "送信処理が停止された" : "入力欄が見つからない" };
      }
      if (editorText(editor)) return { ok: false, error: submitOptions.draftError || "入力欄に下書きがあるため停止した" };

      if (!setPromptText(String(prompt), editor)) return { ok: false, error: "入力欄へ送信文を反映できない" };
      const reflected = await waitFor(() => editorText(editor) === normalizedPrompt, {
        timeout: submitOptions.reflectTimeout || 3000,
        interval: 100,
        controller,
        generation: runGeneration
      });
      if (!reflected) return { ok: false, error: "入力欄へ送信文を反映できない" };

      if (typeof submitOptions.beforeActivate === "function") submitOptions.beforeActivate(editor);

      // ChatGPT updates the submit control through React after the input event.
      // The editor can already contain the text while the button is still disabled,
      // so wait for the enabled composer-local control instead of probing once.
      const allowEnterFallback = submitOptions.allowEnterFallback !== false;
      const readyButton = await waitFor(() => getSendButton(editor), {
        timeout: submitOptions.buttonTimeout || 5000,
        interval: submitOptions.buttonInterval || 100,
        controller,
        generation: runGeneration
      });
      if (!readyButton && !allowEnterFallback) {
        return { ok: false, error: "送信ボタンが有効にならない", activation: null, button: null };
      }

      if (!controller.canRun(runGeneration)) {
        return { ok: false, error: "送信処理が停止された" };
      }
      const activation = clickSend(editor, {
        allowEnterFallback,
        button: readyButton
      });
      if (!activation.ok) return activation;

      const verifier = submitOptions.verify;
      if (typeof verifier !== "function") return { ok: true, ...activation, evidence: null };
      const evidence = await waitFor(verifier, {
        timeout: submitOptions.verifyTimeout || 10000,
        interval: submitOptions.verifyInterval || 150,
        controller,
        generation: runGeneration
      });
      if (!evidence) {
        return {
          ok: false,
          error: submitOptions.verifyError || "送信後の変化を確認できない",
          ...activation,
          evidence: typeof submitOptions.finalEvidence === "function" ? submitOptions.finalEvidence() : null
        };
      }
      return { ok: true, ...activation, evidence };
    }

    return {
      start: () => controller.start(),
      pause: () => controller.pause(),
      resume: () => controller.resume(),
      stop: () => controller.stop(),
      get state() { return controller.state; },
      get cancelled() { return controller.cancelled; },
      getEditor,
      getSendButton,
      editorText,
      setPromptText,
      clickSend,
      submit
    };
  }

  const api = {
    DEFAULT_ADAPTER,
    normalizeText,
    createRunController,
    waitFor,
    createRunner
  };

  globalScope.TranslationLoopPromptStacker = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

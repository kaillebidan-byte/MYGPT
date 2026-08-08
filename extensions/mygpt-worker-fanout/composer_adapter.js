(function initMygptComposerAdapter(root) {
  "use strict";

  const MAX_PACKET_CHARS = 12000;
  const COMPOSER_SELECTORS = Object.freeze([
    "#prompt-textarea",
    "textarea[data-id='root']",
    "form textarea",
    "form [contenteditable='true'][role='textbox']",
    "form [contenteditable='true'][data-lexical-editor='true']",
    "form [contenteditable='true']"
  ]);

  function normalizeText(value) {
    return String(value == null ? "" : value)
      .replace(/\r\n?/g, "\n")
      .replace(/\u00a0/g, " ");
  }

  function normalizeObservedText(value) {
    const normalized = normalizeText(value);
    return normalized.endsWith("\n") ? normalized.slice(0, -1) : normalized;
  }

  function isTextControl(element) {
    return Boolean(
      element &&
      (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement)
    );
  }

  function isContentEditable(element) {
    return Boolean(element && element.isContentEditable);
  }

  function isUsable(element) {
    if (!element || !element.isConnected) {
      return false;
    }
    if (element.matches("[disabled], [aria-disabled='true']")) {
      return false;
    }
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function findComposer(doc) {
    const documentRef = doc || document;
    for (const selector of COMPOSER_SELECTORS) {
      const candidates = documentRef.querySelectorAll(selector);
      for (const element of candidates) {
        if (!isUsable(element)) {
          continue;
        }
        if (isTextControl(element) || isContentEditable(element)) {
          return element;
        }
      }
    }
    return null;
  }

  function readComposerText(element) {
    if (isTextControl(element)) {
      return normalizeText(element.value);
    }
    if (isContentEditable(element)) {
      const rendered = typeof element.innerText === "string"
        ? element.innerText
        : element.textContent;
      return normalizeObservedText(rendered || "");
    }
    return "";
  }

  function hasDraft(element) {
    return readComposerText(element).trim().length > 0;
  }

  function setTextControlValue(element, text) {
    const prototype = element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (!descriptor || typeof descriptor.set !== "function") {
      return false;
    }
    descriptor.set.call(element, text);
    element.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      composed: true,
      inputType: "insertText",
      data: text
    }));
    return true;
  }

  function setContentEditableValue(element, text) {
    element.focus();

    const selection = window.getSelection();
    if (!selection) {
      return { ok: false, method: null, reason: "SELECTION_UNAVAILABLE" };
    }

    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    if (typeof document.execCommand === "function") {
      const inserted = document.execCommand("insertText", false, text);
      if (inserted) {
        return { ok: true, method: "execCommand-insertText" };
      }
    }

    const fallbackRange = document.createRange();
    fallbackRange.selectNodeContents(element);
    fallbackRange.deleteContents();
    const textNode = document.createTextNode(text);
    fallbackRange.insertNode(textNode);
    fallbackRange.setStartAfter(textNode);
    fallbackRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(fallbackRange);
    element.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      composed: true,
      inputType: "insertText",
      data: text
    }));
    return { ok: true, method: "range-input-event" };
  }

  function insertPacket(element, packet) {
    const text = normalizeText(packet);
    if (!text.trim()) {
      return { ok: false, reason: "PACKET_EMPTY" };
    }
    if (text.length > MAX_PACKET_CHARS) {
      return { ok: false, reason: "PACKET_TOO_LARGE", maxChars: MAX_PACKET_CHARS };
    }
    if (!element) {
      return { ok: false, reason: "COMPOSER_NOT_FOUND" };
    }
    if (hasDraft(element)) {
      return {
        ok: false,
        reason: "COMPOSER_NOT_EMPTY",
        observedChars: readComposerText(element).length
      };
    }

    let method;
    if (isTextControl(element)) {
      if (!setTextControlValue(element, text)) {
        return { ok: false, reason: "TEXT_CONTROL_SETTER_UNAVAILABLE" };
      }
      method = "native-value-setter";
    } else if (isContentEditable(element)) {
      const result = setContentEditableValue(element, text);
      if (!result.ok) {
        return result;
      }
      method = result.method;
    } else {
      return { ok: false, reason: "UNSUPPORTED_COMPOSER" };
    }

    const observed = readComposerText(element);
    const expected = normalizeObservedText(text);
    if (observed !== expected) {
      return {
        ok: false,
        reason: "COMPOSER_INSERT_VERIFY_FAILED",
        method,
        expectedChars: expected.length,
        observedChars: observed.length
      };
    }

    return {
      ok: true,
      method,
      composerKind: isTextControl(element) ? "text-control" : "contenteditable",
      observedChars: observed.length,
      exactMatch: true
    };
  }

  const api = Object.freeze({
    MAX_PACKET_CHARS,
    normalizeText,
    normalizeObservedText,
    findComposer,
    readComposerText,
    insertPacket
  });

  root.MYGPTComposer = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : self);

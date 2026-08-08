"use strict";

const assert = require("node:assert/strict");
const {
  normalizeText,
  createRunController,
  waitFor,
  createRunner
} = require("../prompt_stacker_insert_runner.js");

class FakeEvent {
  constructor(type, options = {}) {
    this.type = type;
    Object.assign(this, options);
  }
}

class FakeTextarea {
  constructor() {
    this.tagName = "TEXTAREA";
    this.value = "";
    this.events = [];
    this.parentElement = null;
  }
  focus() {}
  dispatchEvent(event) {
    this.events.push(event.type);
    return true;
  }
  closest() { return null; }
}

function fakeDocument(editor) {
  return {
    querySelectorAll(selector) {
      if (
        selector.includes("prompt-textarea") ||
        selector.includes("contenteditable") ||
        selector === "textarea"
      ) {
        return editor ? [editor] : [];
      }
      return [];
    },
    createRange() { return null; },
    execCommand() { return false; }
  };
}

(async () => {
  assert.equal(normalizeText(" a\u00a0b \n\n\n c "), "a b\n\n c");

  const controller = createRunController();
  assert.equal(controller.state, "idle");
  controller.start();
  assert.equal(controller.canRun(), true);
  controller.pause();
  assert.equal(controller.state, "paused");
  controller.resume();
  assert.equal(controller.state, "running");
  controller.stop();
  assert.equal(controller.cancelled, true);
  assert.equal(controller.canRun(), false);

  const waitingController = createRunController();
  waitingController.start();
  let ready = false;
  setTimeout(() => { ready = true; }, 20);
  assert.equal(await waitFor(() => ready && "done", {
    timeout: 500,
    interval: 5,
    controller: waitingController
  }), "done");

  const editor = new FakeTextarea();
  const windowRef = {
    HTMLTextAreaElement: FakeTextarea,
    HTMLInputElement: class {},
    Event: FakeEvent,
    getSelection() { return null; }
  };
  const runner = createRunner({
    document: fakeDocument(editor),
    window: windowRef,
    adapter: { editor: ["#prompt-textarea"] }
  });
  runner.start();
  const inserted = await runner.insertOnly("Gate 1 packet", {
    editorTimeout: 500,
    editorInterval: 5,
    reflectTimeout: 500,
    reflectInterval: 5
  });
  assert.equal(inserted.ok, true);
  assert.equal(inserted.submitted, false);
  assert.equal(inserted.exactMatch, true);
  assert.equal(editor.value, "Gate 1 packet");
  assert.ok(editor.events.includes("input"));

  const draftEditor = new FakeTextarea();
  draftEditor.value = "existing draft";
  const draftRunner = createRunner({
    document: fakeDocument(draftEditor),
    window: windowRef,
    adapter: { editor: ["#prompt-textarea"] }
  });
  draftRunner.start();
  const draftResult = await draftRunner.insertOnly("must not overwrite", {
    editorTimeout: 100,
    editorInterval: 5
  });
  assert.equal(draftResult.ok, false);
  assert.equal(draftResult.reason, "COMPOSER_NOT_EMPTY");
  assert.equal(draftEditor.value, "existing draft");

  let delayedEditor = null;
  const delayedDocument = {
    querySelectorAll() { return delayedEditor ? [delayedEditor] : []; },
    createRange() { return null; },
    execCommand() { return false; }
  };
  const delayedRunner = createRunner({
    document: delayedDocument,
    window: windowRef,
    adapter: { editor: ["#prompt-textarea"] }
  });
  delayedRunner.start();
  setTimeout(() => { delayedEditor = new FakeTextarea(); }, 20);
  const delayedResult = await delayedRunner.insertOnly("delayed", {
    editorTimeout: 500,
    editorInterval: 5,
    reflectTimeout: 500,
    reflectInterval: 5
  });
  assert.equal(delayedResult.ok, true);
  assert.equal(delayedEditor.value, "delayed");

  const raceRunner = createRunner({
    document: fakeDocument(null),
    window: windowRef,
    adapter: { editor: ["#prompt-textarea"] }
  });
  raceRunner.start();
  const staleInsert = raceRunner.insertOnly("old packet", {
    editorTimeout: 100,
    editorInterval: 5
  });
  setTimeout(() => {
    raceRunner.stop();
    raceRunner.start();
  }, 20);
  const staleResult = await staleInsert;
  assert.equal(staleResult.ok, false);
  assert.notEqual(staleResult.submitted, true);

  console.log("Prompt Stacker insert-only runner tests: PASS");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

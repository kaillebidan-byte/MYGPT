"use strict";

const assert = require("node:assert/strict");
const {
  normalizeText,
  createRunController,
  waitFor,
  createRunner
} = require("./prompt_stacker_runner.js");

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

class FakeButton {
  constructor(onClick, { disabled = false, id = "" } = {}) {
    this.disabled = disabled;
    this.id = id;
    this.attrs = { "data-testid": "send-button", type: "button" };
    this.onClick = onClick;
  }
  click() { this.onClick(); }
  getAttribute(name) { return this.attrs[name] ?? null; }
  closest() { return null; }
}

function fakeDocument(editor, button) {
  return {
    querySelectorAll(selector) {
      if (selector.includes("prompt-textarea") || selector.includes("contenteditable") || selector === "textarea") {
        return [editor];
      }
      if (selector.includes("send") || selector.includes("submit") || selector.includes("composer-submit")) return [button];
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
  let committed = false;
  const button = new FakeButton(() => { committed = true; });
  const windowRef = {
    HTMLTextAreaElement: FakeTextarea,
    HTMLInputElement: class {},
    Event: FakeEvent,
    KeyboardEvent: FakeEvent,
    getSelection() { return null; }
  };
  const runner = createRunner({
    document: fakeDocument(editor, button),
    window: windowRef,
    adapter: {
      editor: ["#prompt-textarea"],
      send: ['button[data-testid="send-button"]']
    }
  });
  runner.start();
  const result = await runner.submit("作業の続きを", {
    allowEnterFallback: false,
    verifyTimeout: 500,
    verifyInterval: 5,
    verify: () => committed ? { committed: true } : null
  });
  assert.equal(result.ok, true);
  assert.equal(result.activation, "native-click");
  assert.equal(result.evidence.committed, true);
  assert.equal(editor.value, "作業の続きを");
  assert.ok(editor.events.includes("input"));


  // ChatGPT can render the text before React enables #composer-submit-button.
  const delayedEditor = new FakeTextarea();
  let delayedCommitted = false;
  const delayedButton = new FakeButton(() => { delayedCommitted = true; }, {
    disabled: true,
    id: "composer-submit-button"
  });
  const delayedRunner = createRunner({
    document: fakeDocument(delayedEditor, delayedButton),
    window: windowRef,
    adapter: {
      editor: ["#prompt-textarea"],
      send: ["#composer-submit-button"]
    }
  });
  delayedRunner.start();
  setTimeout(() => { delayedButton.disabled = false; }, 30);
  const delayedResult = await delayedRunner.submit("遅延送信", {
    allowEnterFallback: false,
    buttonTimeout: 500,
    buttonInterval: 5,
    verifyTimeout: 500,
    verifyInterval: 5,
    verify: () => delayedCommitted ? { committed: true } : null
  });
  assert.equal(delayedResult.ok, true);
  assert.equal(delayedResult.activation, "native-click");
  assert.equal(delayedCommitted, true);

  // A generic submit button outside the composer must never be selected.
  const scopedEditor = new FakeTextarea();
  const disabledComposerButton = new FakeButton(() => {}, { disabled: true });
  disabledComposerButton.attrs = { type: "submit" };
  const unrelatedButton = new FakeButton(() => { throw new Error("must not click unrelated submit"); });
  unrelatedButton.attrs = { type: "submit" };
  const composerRoot = {
    querySelectorAll(selector) {
      return selector === 'button[type="submit"]' ? [disabledComposerButton] : [];
    }
  };
  scopedEditor.closest = (selector) => selector === "form" ? composerRoot : null;
  const scopedDocument = {
    body: {},
    documentElement: {},
    querySelectorAll(selector) {
      if (selector === "#prompt-textarea") return [scopedEditor];
      if (selector === 'button[type="submit"]') return [unrelatedButton];
      return [];
    },
    createRange() { return null; },
    execCommand() { return false; }
  };
  const scopedRunner = createRunner({
    document: scopedDocument,
    window: windowRef,
    adapter: {
      editor: ["#prompt-textarea"],
      send: ['button[type="submit"]'],
      globalSend: ['#composer-submit-button', 'button[data-testid="send-button"]']
    }
  });
  scopedRunner.start();
  assert.equal(scopedRunner.getSendButton(scopedEditor), null,
    "generic document-wide submit buttons must be ignored");

  // Stop followed by a new Start must not revive an older pending submit.
  const raceEditor = new FakeTextarea();
  let raceClicks = 0;
  const raceButton = new FakeButton(() => { raceClicks += 1; }, { disabled: true });
  const raceRunner = createRunner({
    document: fakeDocument(raceEditor, raceButton),
    window: windowRef,
    adapter: {
      editor: ["#prompt-textarea"],
      send: ['button[data-testid="send-button"]']
    }
  });
  raceRunner.start();
  const oldSubmit = raceRunner.submit("古い送信", {
    allowEnterFallback: false,
    buttonTimeout: 200,
    buttonInterval: 5
  });
  setTimeout(() => {
    raceRunner.stop();
    raceRunner.start();
    raceButton.disabled = false;
  }, 20);
  const oldResult = await oldSubmit;
  assert.equal(oldResult.ok, false);
  assert.equal(raceClicks, 0, "a new runner generation must not revive the old submit");

  runner.stop();
  const stopped = await runner.submit("送らない");
  assert.equal(stopped.ok, false);
  assert.match(stopped.error, /runnerが停止中/);

  console.log("prompt stacker runner tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

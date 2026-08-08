"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { evaluateChatLimit } = require("./loop_core.js");

const root = __dirname;
const background = fs.readFileSync(path.join(root, "background.js"), "utf8");
const popup = fs.readFileSync(path.join(root, "popup.js"), "utf8");
const popupHtml = fs.readFileSync(path.join(root, "popup.html"), "utf8");

assert.deepEqual(evaluateChatLimit(0, 2), {
  currentChatNumber: 1,
  maxChatCycles: 2,
  reached: false
});
assert.deepEqual(evaluateChatLimit(1, 2), {
  currentChatNumber: 2,
  maxChatCycles: 2,
  reached: true
});
assert.equal(evaluateChatLimit(0, 1).reached, true);

assert.match(background, /maxChatCycles: 2/);
assert.match(background, /phase: "RUN_COMPLETED"/);
assert.match(background, /reason: "chat-limit-reached"/);
assert.match(background, /const chatLimit = evaluateChatLimit\(runtime\.chatGeneration, settings\.maxChatCycles\)/);
assert.ok(
  background.indexOf('if (message.phaseCompletionMatched === true)') <
    background.indexOf('const chatLimit = evaluateChatLimit(runtime.chatGeneration, settings.maxChatCycles)'),
  "phase completion marker must stop before the chat-count boundary"
);
assert.ok(
  background.indexOf('const chatLimit = evaluateChatLimit(runtime.chatGeneration, settings.maxChatCycles)') <
    background.indexOf('if (!settings.rotationEnabled)'),
  "the final chat must stop before any rotation decision"
);
assert.match(popupHtml, /id="maxChats"/);
assert.match(popup, /maxChatCycles: Number\(\$\("maxChats"\)\.value\)/);
assert.match(popup, /RUN_COMPLETED: "設定チャット数完了"/);

console.log("chat cycle limit policy tests passed");

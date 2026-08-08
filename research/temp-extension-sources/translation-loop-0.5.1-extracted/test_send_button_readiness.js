"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");

const runner = fs.readFileSync("prompt_stacker_runner.js", "utf8");
const content = fs.readFileSync("content.js", "utf8");

assert.match(runner, /#composer-submit-button/);
assert.match(content, /#composer-submit-button/);
assert.match(runner, /const readyButton = await waitFor\(\(\) => getSendButton\(editor\)/);
assert.match(runner, /送信ボタンが有効にならない/);

console.log("send button readiness tests passed");

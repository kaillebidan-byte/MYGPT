"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

global.atob = global.atob || ((value) => Buffer.from(value, "base64").toString("binary"));
const adapter = require("../chatgpt_adapter.js");

assert.equal(adapter.normalizeText(" a\u00a0 b\r\n c "), "a b\nc");
assert.equal(adapter.COMPOSER_SELECTOR, 'form[data-type="unified-composer"]');
assert.equal(adapter.FILE_INPUT_SELECTOR, 'input[type="file"]');
assert.equal(adapter.PROMPT_PARAGRAPH_SELECTOR, '#prompt-textarea p');
assert.equal(adapter.SUBMIT_SELECTOR, '#composer-submit-button');

const source = fs.readFileSync(path.resolve(__dirname, "../chatgpt_adapter.js"), "utf8");
assert.match(source, /new DataTransfer\(\)/);
assert.match(source, /new Event\("change", \{ bubbles: true \}\)/);
assert.doesNotMatch(source, /new Event\("input"/);
assert.match(source, /new ClipboardEvent\("paste"/);
assert.match(source, /clipboard\.setData\("text\/plain"/);
assert.match(source, /querySelector\("circle"\)/);
assert.match(source, /90000/);
assert.match(source, /2000/);
assert.match(source, /must execute in the page MAIN world/);
console.log("AutoGPT MAIN-world ChatGPT adapter contract: PASS");

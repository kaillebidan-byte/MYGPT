"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

global.atob = global.atob || ((value) => Buffer.from(value, "base64").toString("binary"));
const {
  decodeDataUrl,
  FILE_INPUT_SELECTORS,
  ATTACHMENT_UI_SELECTORS
} = require("../file_adapter.js");

const decoded = decodeDataUrl("data:text/plain;base64,QUJD");
assert.ok(decoded);
assert.equal(decoded.mime, "text/plain");
assert.deepStrictEqual(Array.from(decoded.bytes), [65, 66, 67]);
assert.equal(decodeDataUrl("not-a-data-url"), null);
assert.equal(FILE_INPUT_SELECTORS[0], 'input[type="file"][accept*="image"]');
assert.ok(FILE_INPUT_SELECTORS.includes('input[type="file"]'));
assert.ok(ATTACHMENT_UI_SELECTORS.includes('[data-testid*="attachment"]'));

const source = fs.readFileSync(path.resolve(__dirname, "../file_adapter.js"), "utf8");
assert.match(source, /new Event\("change"/);
assert.doesNotMatch(source, /new Event\("input"/);
assert.match(source, /FILE_ATTACHMENT_UI_NOT_CONFIRMED/);
assert.doesNotMatch(source, /evidence:\s*"input-files"/);

console.log("AutoGPT-style file adapter tests: PASS");

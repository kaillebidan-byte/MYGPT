"use strict";

const assert = require("node:assert/strict");

global.atob = global.atob || ((value) => Buffer.from(value, "base64").toString("binary"));
const { decodeDataUrl, FILE_INPUT_SELECTORS } = require("../file_adapter.js");

const decoded = decodeDataUrl("data:text/plain;base64,QUJD");
assert.ok(decoded);
assert.equal(decoded.mime, "text/plain");
assert.deepStrictEqual(Array.from(decoded.bytes), [65, 66, 67]);
assert.equal(decodeDataUrl("not-a-data-url"), null);
assert.ok(FILE_INPUT_SELECTORS.includes('input[type="file"]'));

console.log("AutoGPT-style file adapter pure tests: PASS");

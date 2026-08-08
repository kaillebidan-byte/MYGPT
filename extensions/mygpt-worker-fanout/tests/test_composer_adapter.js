"use strict";

const assert = require("assert");
const adapter = require("../composer_adapter.js");

assert.strictEqual(adapter.normalizeText("a\r\nb\rc"), "a\nb\nc");
assert.strictEqual(adapter.normalizeText("a\u00a0b"), "a b");
assert.strictEqual(adapter.normalizeObservedText("abc\n"), "abc");
assert.strictEqual(adapter.normalizeObservedText("abc"), "abc");
assert.strictEqual(adapter.MAX_PACKET_CHARS, 12000);

console.log("composer adapter pure tests: PASS");

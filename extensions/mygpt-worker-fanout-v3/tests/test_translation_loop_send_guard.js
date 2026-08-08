"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const guard = require("../translation_loop_send_guard.js");

assert.ok(guard.SEND_SELECTORS.includes('#composer-submit-button'));
assert.ok(guard.GLOBAL_SEND_SELECTORS.includes('#composer-submit-button'));
assert.equal(typeof guard.enabledCandidate, "function");
assert.equal(typeof guard.getEnabledSendButton, "function");

const enabled = { disabled: false, getAttribute: () => null };
const ariaDisabled = { disabled: false, getAttribute: (name) => name === "aria-disabled" ? "true" : null };
const root = { querySelectorAll: () => [ariaDisabled, enabled] };
assert.equal(guard.enabledCandidate(["button"], root), enabled);

const source = fs.readFileSync(path.resolve(__dirname, "../translation_loop_send_guard.js"), "utf8");
assert.match(source, /aria-disabled/);
assert.match(source, /data-disabled/);
assert.doesNotMatch(source, /\.click\s*\(/);
assert.doesNotMatch(source, /KeyboardEvent/);
assert.doesNotMatch(source, /\.requestSubmit\s*\(/);
console.log("Translation Loop send readiness guard: PASS");

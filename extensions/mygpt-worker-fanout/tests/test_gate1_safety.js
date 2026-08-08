"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = [
  "manifest.json",
  "background.js",
  "content.js",
  "prompt_stacker_insert_runner.js",
  "popup.js"
];
const source = files.map((name) => fs.readFileSync(path.join(root, name), "utf8")).join("\n");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

assert.deepStrictEqual(manifest.permissions, ["storage"]);
assert.strictEqual((source.match(/chrome\.tabs\.create\s*\(/g) || []).length, 1);
assert.ok(manifest.content_scripts[0].js.includes("prompt_stacker_insert_runner.js"));
assert.ok(!manifest.content_scripts[0].js.includes("composer_adapter.js"));

const forbidden = [
  /\/backend-api/i,
  /\bBearer\b/i,
  /declarativeNetRequest/i,
  /\bdownloads\b/i,
  /XMLHttpRequest/i,
  /WebSocket/i,
  /\bfetch\s*\(/i,
  /DataTransfer/i,
  /new\s+File\s*\(/i,
  /\.requestSubmit\s*\(/i,
  /\.submit\s*\(/i,
  /\.click\s*\(/i,
  /KeyboardEvent/i,
  /send-button/i,
  /composer-submit-button/i
];

for (const pattern of forbidden) {
  assert.strictEqual(pattern.test(source), false, `forbidden source pattern: ${pattern}`);
}

assert.ok(source.includes("MYGPT_GATE1_INSERT_PACKET"));
assert.ok(source.includes("COMPOSER_NOT_EMPTY"));
assert.ok(source.includes("submitted: false"));
assert.ok(source.includes("translation-loop-prompt-stacker-insert-only"));

console.log("Gate 1 safety contract: PASS");

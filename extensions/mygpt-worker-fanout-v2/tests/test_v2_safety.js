"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const productionFiles = [
  "manifest.json",
  "route_adapter.js",
  "runtime_guard.js",
  "prompt_stacker_insert_runner.js",
  "file_adapter.js",
  "content.js",
  "background.js",
  "popup.js"
];
const source = productionFiles.map((name) =>
  fs.readFileSync(path.join(root, name), "utf8")
).join("\n");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

assert.deepStrictEqual(
  manifest.permissions,
  ["storage", "tabs", "scripting", "unlimitedStorage"]
);
assert.strictEqual((source.match(/chrome\.tabs\.create\s*\(/g) || []).length, 1);
assert.ok(source.includes("TranslationLoopRuntimeGuard"));
assert.ok(source.includes("MYGPTPromptStackerInsert"));
assert.ok(source.includes("DataTransfer"));
assert.ok(source.includes("new File"));
assert.ok(source.includes("submitted: false"));

const rejected = [
  /\/backend-api/i,
  /\bBearer\b/i,
  /Authorization/i,
  /declarativeNetRequest/i,
  /\bdownloads\b/i,
  /XMLHttpRequest/i,
  /WebSocket/i,
  /\bfetch\s*\(/i,
  /window\.fetch/i,
  /CSP/i,
  /X-Frame-Options/i,
  /visibilityState/i,
  /sendBeacon/i,
  /google-analytics/i,
  /imgbb/i
];

for (const pattern of rejected) {
  assert.equal(pattern.test(source), false, `rejected mechanism found: ${pattern}`);
}

const noSubmit = [
  /\.requestSubmit\s*\(/i,
  /\.submit\s*\(/i,
  /\.click\s*\(/i,
  /KeyboardEvent/i,
  /send-button/i,
  /composer-submit-button/i
];
for (const pattern of noSubmit) {
  assert.equal(pattern.test(source), false, `submit path found in READY-only build: ${pattern}`);
}

console.log("MYGPT Worker Fanout v2 READY safety tests: PASS");

"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const files = [
  "manifest.json", "route_adapter.js", "runtime_guard.js", "page_observer.js",
  "translation_loop_send_guard.js", "chatgpt_adapter.js", "content.js", "background.js", "popup.js"
];
const source = files.map((name) => fs.readFileSync(path.join(root, name), "utf8")).join("\n");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

assert.deepStrictEqual(manifest.permissions, ["storage", "tabs", "scripting", "unlimitedStorage"]);
assert.equal(manifest.content_scripts[0].world, "MAIN");
assert.ok(manifest.content_scripts[0].js.includes("translation_loop_send_guard.js"));
assert.ok(manifest.content_scripts[0].js.includes("chatgpt_adapter.js"));
assert.ok(!manifest.content_scripts[1].js.includes("chatgpt_adapter.js"));
assert.ok(source.includes('world: "MAIN"'));
assert.ok(source.includes('executionWorld: "MAIN"'));
assert.ok(source.includes("autogpt-upload+visible-attachment"));
assert.ok(source.includes("translation-loop-send-ready"));
assert.ok(source.includes("COMPOSER_SEND_NOT_READY"));
assert.ok(source.includes("MYGPTTranslationLoopSendGuard"));
assert.ok(source.includes("enabledCandidate"));
assert.ok(source.includes("autogpt-synthetic-paste"));
assert.ok(source.includes("TranslationLoopRuntimeGuard"));
assert.ok(source.includes("MYGPT_V3_PAGE_OBSERVED"));
assert.ok(source.includes("/backend-api/conversation")); // passive observer only
assert.ok(source.includes("ws.chatgpt.com"));
assert.ok(source.includes("submitted: false"));

const banned = [
  /Authorization/i,
  /\bBearer\b/i,
  /google-analytics/i,
  /imgbb/i,
  /Autojourney/i,
  /membership/i,
  /declarativeNetRequest/i,
  /\bdownloads\b/i,
  /X-Frame-Options/i,
  /Content-Security-Policy/i,
  /document\.hidden\s*=/i,
  /visibilityState\s*=/i,
  /sendBeacon/i
];
for (const pattern of banned) assert.equal(pattern.test(source), false, `banned mechanism: ${pattern}`);

const noSubmit = [
  /new KeyboardEvent\([^\n]*Enter/i,
  /\.requestSubmit\s*\(/i,
  /\.submit\s*\(/i,
  /#composer-submit-button[^\n]*\.click\s*\(/i
];
for (const pattern of noSubmit) assert.equal(pattern.test(source), false, `submission path present: ${pattern}`);

assert.equal((source.match(/chrome\.tabs\.create\s*\(/g) || []).length, 1);
assert.ok(source.includes("openSlotTab"));
assert.ok(source.includes("verifySlotTab"));
assert.ok(source.includes("prepareStagedSlot"));
console.log("MYGPT Worker Fanout v3.4 safety contract: PASS");

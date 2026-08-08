"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const content = fs.readFileSync(path.join(root, "content.js"), "utf8");
const background = fs.readFileSync(path.join(root, "background.js"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

assert.equal(manifest.version, "0.5.1");
assert.equal(content.includes("hidden_terminal_deferred"), false, "hidden tabs must not defer a proven terminal turn");
assert.equal(content.includes('if (document.visibilityState === "hidden")'), false, "visibility must not veto completion");
assert.match(content, /translation-loop-v051:scan-now/, "content script must accept watchdog scans");
assert.match(content, /active: enabled && armed/, "watchdog response must expose whether monitoring is still armed");
assert.match(content, /addEventListener\("resume"/, "frozen pages must rescan on resume");
assert.match(content, /addEventListener\("pageshow"/, "restored pages must rescan on pageshow");
assert.match(background, /SCAN_PERIOD_MINUTES = 0\.5/, "MV3 watchdog must use the supported 30 second period");
assert.match(background, /chrome\.alarms\.create\(SCAN_ALARM/, "watchdog must use chrome.alarms");
assert.equal(background.includes("setInterval(() =>"), false, "background worker must not be kept alive by a polling interval");
assert.equal(background.includes("runtime.onConnect"), false, "background watchdog must not depend on a persistent port");
assert.match(background, /changeInfo\.discarded === true/, "discarded owner tabs must fail closed");
assert.match(background, /response\.active !== true/, "lost content monitoring must fail closed");
assert.match(background, /ブラウザ再起動後の自動復旧は未実装/, "browser restart must fail closed until recovery is implemented");
assert.match(background, /拡張機能更新後の自動復旧は未実装/, "extension update must fail closed until recovery is implemented");

console.log("background tab policy tests passed");

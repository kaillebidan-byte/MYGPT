"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const background = fs.readFileSync(path.join(root, "background.js"), "utf8");
const content = fs.readFileSync(path.join(root, "content.js"), "utf8");
const popup = fs.readFileSync(path.join(root, "popup.js"), "utf8");
const popupHtml = fs.readFileSync(path.join(root, "popup.html"), "utf8");

assert.match(background, /phaseCompletionMarker: "規定フェイズ完了"/);
assert.match(background, /phase: "PHASE_COMPLETED"/);
assert.match(background, /reason: "phase-completion-marker"/);
assert.match(content, /endsWithCompletionMarker\(text, settings\.phaseCompletionMarker\)/);
assert.match(content, /phaseCompletionMatched:/);
assert.match(popup, /PHASE_COMPLETED: "規定フェイズ完了"/);
assert.match(popupHtml, /id="phaseMarker"/);

console.log("phase completion policy tests passed");

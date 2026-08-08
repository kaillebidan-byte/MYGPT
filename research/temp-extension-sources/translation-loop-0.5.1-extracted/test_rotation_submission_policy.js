"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const content = fs.readFileSync(path.join(root, "content.js"), "utf8");
const runner = fs.readFileSync(path.join(root, "prompt_stacker_runner.js"), "utf8");
const background = fs.readFileSync(path.join(root, "background.js"), "utf8");
const urlCore = fs.readFileSync(path.join(root, "url_core.js"), "utf8");

assert.match(content, /function detectCanonicalProjectUrl\(/, "content must discover the named project URL from page links");
assert.match(content, /a\[href\*="\/g\/g-p-"\]/, "project discovery must inspect existing project links");
assert.match(urlCore, /function projectRouteSegmentFromUrl\(/, "shared URL core must preserve the full project route segment");
assert.match(urlCore, /function hasProjectSlug\(/, "shared URL core must distinguish a named project URL from a bare ID URL");
assert.match(background, /detectCanonicalProjectUrlInTab/, "background must ask the page for the canonical project URL");
assert.match(content, /TranslationLoopPromptStacker\?\.createRunner/, "content must use the imported Prompt Stacker runner");
assert.match(runner, /editor\?\.closest\?\.\("form"\)/, "send control lookup must be scoped to the active composer");
assert.match(runner, /button\.click\(\)/, "Prompt Stacker native click must be the primary activation path");
assert.match(content, /allowEnterFallback: false/, "the integration must disable Enter fallback to preserve fail-closed sending");
assert.match(content, /function rotationSubmissionEvidence\(/, "rotation submission must collect positive evidence");
assert.match(content, /rotation_submit_unverified/, "missing evidence must be logged and fail closed");
assert.match(content, /URL変化・ユーザーターン・生成開始を確認できない/, "missing evidence must return an explicit failure");
assert.match(background, /rotation_submit_evidence_accepted/, "background must only advance after evidence is returned");
assert.equal(content.includes("translation-loop-v051:rotation-submit-clicked"), false, "content must not report a click as a successful send");
assert.equal(background.includes("translation-loop-v051:rotation-submit-clicked"), false, "background must not accept click-only success");
assert.equal(content.includes("function robustClick"), false, "custom synthetic click sequence must be removed");
assert.equal(content.includes("function setNativeValue"), false, "custom editor insertion must be replaced by Prompt Stacker code");

console.log("rotation submission policy tests passed");

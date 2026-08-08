"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const background = fs.readFileSync(path.join(root, "background.js"), "utf8");
const content = fs.readFileSync(path.join(root, "content.js"), "utf8");
const popup = fs.readFileSync(path.join(root, "popup.js"), "utf8");
const popupHtml = fs.readFileSync(path.join(root, "popup.html"), "utf8");

assert.match(background, /continueAfterRotation: true/, "cross-chat continuation must default on");
assert.match(background, /async function restartLoopAfterRotation\(/, "background must restart monitoring after verification");
assert.match(background, /phase: "RESTARTING_AFTER_ROTATION"/, "restart must have an explicit transient phase");
assert.match(background, /completedTurns: 0/, "new chat must reset its per-chat answer count");
assert.match(background, /waitForSubmittedResponse: true/, "restart must watch the already submitted resume prompt response");
assert.match(background, /event: "rotation_loop_resumed"/, "successful restart must be logged");
assert.match(background, /reason: "verified-rotation-route"/, "late route-change messages from the verified rotation must not stop the restarted loop");
assert.match(content, /rotation-resume-current-or-next-generation/, "content must arm for current or imminent generation");
assert.match(content, /arm\("rotation-resume-current-or-next-generation", true\)/, "restart must include a response that completed before monitoring was rearmed");
assert.match(content, /currentPath = location\.pathname;[\s\S]*currentUrl = location\.href;/, "restart must adopt the new SPA route before scanning");
assert.match(content, /mode: generating \? "waiting-current-generation" : "waiting-next-generation"/, "restart must cover the URL-before-generation race");
assert.match(popupHtml, /id="continueAfterRotation"/, "popup must expose the continuation switch");
assert.match(popup, /continueAfterRotation/, "popup must save and restore the continuation switch");
assert.match(background, /translation-loop-v051:pause/, "manual pause must remain available");
assert.match(background, /translation-loop-v051:reset/, "manual reset must remain available");
assert.match(background, /phase: "ERROR"/, "fail-closed stopping must remain available");

console.log("rotation continuation policy tests passed");

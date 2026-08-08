"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const content = fs.readFileSync(path.join(root, "content.js"), "utf8");
const background = fs.readFileSync(path.join(root, "background.js"), "utf8");
const runner = fs.readFileSync(path.join(root, "prompt_stacker_runner.js"), "utf8");
const storage = fs.readFileSync(path.join(root, "prompt_stacker_storage.js"), "utf8");
const notices = fs.readFileSync(path.join(root, "THIRD_PARTY_NOTICES.md"), "utf8");

assert.deepEqual(
  manifest.content_scripts[0].js.slice(0, 4),
  ["loop_core.js", "terminal_gate.js", "prompt_stacker_runner.js", "content.js"],
  "core and upstream runner must load before the integration content script"
);
assert.match(background, /importScripts\("loop_core\.js", "url_core\.js", "rotation_verification\.js", "prompt_stacker_storage\.js", "runtime_guard\.js"\)/);
assert.ok(background.includes('files: ["loop_core.js", "terminal_gate.js", "prompt_stacker_runner.js", "content.js"]'),
  "manual injection must include the shared core and upstream runner");
assert.match(content, /promptRunner\.submit\(/, "normal and rotation sends must use the shared runner");
assert.match(runner, /thegreatLUCY\/prompt-stacker/);
assert.match(storage, /thegreatLUCY\/prompt-stacker/);
assert.match(notices, /Prompt Stacker/);
assert.ok(fs.existsSync(path.join(root, "LICENSE-PROMPT-STACKER")));
assert.equal(content.includes("__chatgptTranslationLoopTestV020Loaded"), false,
  "old content protocol must not mask the new runner");
assert.match(content, /__chatgptTranslationLoopTestV050Loaded/);
assert.equal(background.includes("translation-loop-v020"), false);
assert.equal(content.includes("translation-loop-v020"), false);

console.log("upstream reuse policy tests passed");

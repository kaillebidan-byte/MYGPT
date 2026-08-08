"use strict";

const assert = require("node:assert/strict");
const {
  normalizeCustomGptIdentity,
  sameWorkerIdentity
} = require("../route_adapter.js");

function ok(url) {
  const result = normalizeCustomGptIdentity(url);
  assert.equal(result.ok, true, `${url}: ${JSON.stringify(result)}`);
  return result;
}

const root = ok("https://chatgpt.com/g/g-AbC123xyz-worker-name");
assert.equal(root.workerKey, "g-AbC123xyz-worker-name");
assert.equal(root.workerPath, "/g/g-AbC123xyz-worker-name");
assert.equal(root.workerUrl, "https://chatgpt.com/g/g-AbC123xyz-worker-name");

const conversation = ok(
  "https://chatgpt.com/g/g-AbC123xyz-worker-name/c/12345678?model=foo#bar"
);
assert.equal(conversation.workerKey, root.workerKey);
assert.equal(conversation.workerUrl, root.workerUrl);
assert.equal(sameWorkerIdentity(root, conversation), true);

const legacyOrigin = ok("https://chat.openai.com/g/g-AbC123xyz-worker-name/");
assert.equal(sameWorkerIdentity(root, legacyOrigin), true);

const other = ok("https://chatgpt.com/g/g-ZZZ999-other-worker");
assert.equal(sameWorkerIdentity(root, other), false);

assert.equal(
  normalizeCustomGptIdentity("https://chatgpt.com/g/g-p-project123/project").reason,
  "PROJECT_ROUTE_REJECTED"
);
assert.equal(
  normalizeCustomGptIdentity("https://chatgpt.com/c/123").reason,
  "NOT_CUSTOM_GPT_ROUTE"
);
assert.equal(
  normalizeCustomGptIdentity("https://example.com/g/g-AbC123xyz-worker-name").reason,
  "UNSUPPORTED_ORIGIN"
);
assert.equal(normalizeCustomGptIdentity("not a url").reason, "INVALID_URL");

console.log("test_route_adapter.js: PASS");

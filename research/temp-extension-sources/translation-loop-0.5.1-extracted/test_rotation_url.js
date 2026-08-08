"use strict";

const assert = require("node:assert/strict");
const {
  projectRouteSegmentFromUrl,
  projectIdentityFromUrl,
  conversationIdFromUrl,
  normalizeProjectUrl,
  hasProjectSlug
} = require("./url_core.js");

const stableId = "g-p-6a611115e9a88191bb7fbe440dafe238";
const namedSegment = `${stableId}-fan-yi`;
const bareConversation = `https://chatgpt.com/g/${stableId}/c/6a66a688-0b80-83e9-84e3-64ee85bb39d0`;
const namedConversation = `https://chatgpt.com/g/${namedSegment}/c/6a66a688-0b80-83e9-84e3-64ee85bb39d0`;
const namedProject = `https://chatgpt.com/g/${namedSegment}/project`;
const next = `https://chatgpt.com/g/${stableId}/c/new-conversation-id`;

assert.equal(projectIdentityFromUrl(bareConversation), stableId);
assert.equal(projectIdentityFromUrl(namedConversation), stableId);
assert.equal(projectIdentityFromUrl(namedProject), stableId);
assert.equal(projectRouteSegmentFromUrl(namedProject), namedSegment);
assert.equal(normalizeProjectUrl(namedConversation), namedProject);
assert.equal(normalizeProjectUrl(bareConversation), `https://chatgpt.com/g/${stableId}/project`);
assert.equal(hasProjectSlug(namedProject), true);
assert.equal(hasProjectSlug(bareConversation), false);
assert.equal(conversationIdFromUrl(bareConversation), "6a66a688-0b80-83e9-84e3-64ee85bb39d0");
assert.equal(conversationIdFromUrl(namedProject), null);
assert.equal(conversationIdFromUrl(next), "new-conversation-id");
assert.notEqual(conversationIdFromUrl(bareConversation), conversationIdFromUrl(next));
assert.equal(projectIdentityFromUrl("https://chatgpt.com/"), null);
assert.throws(() => normalizeProjectUrl("https://example.com/g/g-p-test/c/x"));

console.log("rotation URL tests passed");

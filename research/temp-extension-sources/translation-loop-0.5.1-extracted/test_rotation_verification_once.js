"use strict";

const assert = require("node:assert/strict");
const { createRotationVerificationCoordinator } = require("./rotation_verification.js");

const projectUrl = "https://chatgpt.com/g/g-p-test-project/project";
const oldConversationId = "old-conversation";
const newConversationId = "new-conversation";
const newConversationUrl = `https://chatgpt.com/g/g-p-test-project/c/${newConversationId}`;

let runtime = {
  enabled: true,
  phase: "AWAITING_NEW_CONVERSATION",
  ownerTabId: 17,
  currentConversationId: oldConversationId,
  previousConversationId: oldConversationId,
  chatGeneration: 0,
  pendingSubmissionNonce: "rotation-nonce-1",
  rotationNonce: "rotation-nonce-1",
  rotationProjectUrl: projectUrl,
  rotationStartedAt: 100,
  lastVerifiedRotationNonce: null,
  lastVerifiedConversationId: null,
  lastVerifiedAt: 0,
  lastError: null
};

let saveCount = 0;
let clearAlarmCount = 0;
let verifiedLogCount = 0;
let failedCount = 0;
const logs = [];

function conversationIdFromUrl(url) {
  const match = new URL(url).pathname.match(/\/c\/([^/?#]+)/);
  return match ? match[1] : null;
}

function projectIdentityFromUrl(url) {
  const match = new URL(url).pathname.match(/^\/g\/(g-p-[^/]+)/);
  return match ? match[1] : null;
}

const coordinator = createRotationVerificationCoordinator({
  readRuntime: async () => ({ ...runtime }),
  saveRuntime: async (next) => {
    saveCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    runtime = { ...next };
    return { ...runtime };
  },
  clearAlarm: async () => {
    clearAlarmCount += 1;
  },
  appendVerifiedLog: async (entry) => {
    verifiedLogCount += 1;
    logs.push(entry);
  },
  fail: async () => {
    failedCount += 1;
  },
  conversationIdFromUrl,
  validateProjectMembership: (currentUrl, expectedUrl) => (
    projectIdentityFromUrl(currentUrl) === projectIdentityFromUrl(expectedUrl)
  ),
  now: () => 123456
});

(async () => {
  const results = await Promise.all([
    coordinator.verify({ tabId: 17, url: newConversationUrl }),
    coordinator.verify({ tabId: 17, url: newConversationUrl }),
    coordinator.verify({ tabId: 17, url: newConversationUrl })
  ]);

  assert.equal(results.every((result) => result.verified), true);
  assert.equal(results.filter((result) => result.alreadyVerified === false).length, 1);
  assert.equal(results.filter((result) => result.alreadyVerified === true).length, 2);
  assert.equal(saveCount, 1, "same nonce must be committed once");
  assert.equal(clearAlarmCount, 1, "rotation alarm must be cleared once");
  assert.equal(verifiedLogCount, 1, "rotation_verified must be logged once");
  assert.equal(failedCount, 0);

  assert.equal(runtime.enabled, false);
  assert.equal(runtime.phase, "ROTATION_VERIFIED");
  assert.equal(runtime.currentConversationId, newConversationId);
  assert.equal(runtime.chatGeneration, 1);
  assert.equal(runtime.pendingSubmissionNonce, null);
  assert.equal(runtime.rotationNonce, null);
  assert.equal(runtime.rotationProjectUrl, null);
  assert.equal(runtime.rotationStartedAt, 0);
  assert.equal(runtime.lastVerifiedRotationNonce, "rotation-nonce-1");
  assert.equal(runtime.lastVerifiedConversationId, newConversationId);
  assert.equal(runtime.lastVerifiedAt, 123456);

  assert.equal(logs[0].details.nonce, "rotation-nonce-1");
  assert.equal(logs[0].details.previousConversationId, oldConversationId);
  assert.equal(logs[0].details.newConversationId, newConversationId);
  assert.equal(logs[0].details.chatGeneration, 1);

  const repeated = await coordinator.verify({ tabId: 17, url: newConversationUrl });
  assert.equal(repeated.verified, true);
  assert.equal(repeated.alreadyVerified, true);
  assert.equal(saveCount, 1);
  assert.equal(verifiedLogCount, 1);

  console.log("rotation verification once tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

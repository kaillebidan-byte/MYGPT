"use strict";

const assert = require("node:assert/strict");
const {
  evaluateSubmissionEvidence,
  endsWithCompletionMarker,
  evaluateChatLimit
} = require("./loop_core.js");

const prompt = "作業の続きを";
const before = {
  userCount: 3,
  latestUserKey: "user-3",
  latestUserHash: "same-hash",
  generationActive: false,
  conversationId: "conversation-1",
  url: "https://chatgpt.com/g/g-p-test/c/conversation-1"
};

let evidence = evaluateSubmissionEvidence(prompt, before, {
  ...before,
  latestUserText: prompt,
  composerCleared: false
});
assert.equal(evidence.committed, false, "an old identical user turn must not prove a new send");
assert.equal(evidence.latestUserMatched, true);
assert.equal(evidence.latestUserChanged, false);

evidence = evaluateSubmissionEvidence(prompt, before, {
  ...before,
  userCount: 4,
  latestUserKey: "user-4",
  latestUserHash: "new-hash",
  latestUserText: prompt
});
assert.equal(evidence.committed, true);
assert.equal(evidence.userCountIncreased, true);

evidence = evaluateSubmissionEvidence(prompt, before, {
  ...before,
  latestUserKey: "user-4",
  latestUserHash: "new-hash",
  latestUserText: prompt
});
assert.equal(evidence.committed, true, "virtualized lists may replace the latest turn without growing the count");
assert.equal(evidence.latestUserChanged, true);

evidence = evaluateSubmissionEvidence(prompt, before, {
  ...before,
  latestUserText: prompt,
  generationActive: true
});
assert.equal(evidence.committed, true);
assert.equal(evidence.generationStarted, true);

evidence = evaluateSubmissionEvidence(prompt, before, {
  ...before,
  latestUserText: prompt,
  composerCleared: true
});
assert.equal(evidence.committed, false, "composer clearing alone is not positive send evidence");

evidence = evaluateSubmissionEvidence(prompt, {
  ...before,
  conversationId: null,
  url: "https://chatgpt.com/g/g-p-test/project"
}, {
  ...before,
  conversationId: "new-conversation",
  url: "https://chatgpt.com/g/g-p-test/c/new-conversation",
  latestUserText: prompt
}, { rotation: true });
assert.equal(evidence.committed, true);
assert.equal(evidence.conversationCreated, true);

assert.equal(endsWithCompletionMarker("作業結果\n\n規定フェイズ完了", "規定フェイズ完了"), true);
assert.equal(endsWithCompletionMarker("規定フェイズ完了\n", "規定フェイズ完了"), true);
assert.equal(endsWithCompletionMarker("規定フェイズ完了。ただし続きあり", "規定フェイズ完了"), false);
assert.equal(endsWithCompletionMarker("規定フェイズ完了", ""), false);

let chatLimit = evaluateChatLimit(0, 2);
assert.deepEqual(chatLimit, { currentChatNumber: 1, maxChatCycles: 2, reached: false });
chatLimit = evaluateChatLimit(1, 2);
assert.deepEqual(chatLimit, { currentChatNumber: 2, maxChatCycles: 2, reached: true });
chatLimit = evaluateChatLimit(0, 1);
assert.equal(chatLimit.reached, true, "a one-chat run must finish without rotating");
chatLimit = evaluateChatLimit(5, 3);
assert.equal(chatLimit.reached, true, "a restored over-limit generation must fail closed at the limit");

console.log("loop core tests passed");

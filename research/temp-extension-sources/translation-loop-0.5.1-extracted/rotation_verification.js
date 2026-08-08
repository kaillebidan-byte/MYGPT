"use strict";

(function installRotationVerification(globalScope) {
  function createRotationVerificationCoordinator(dependencies) {
    const deps = dependencies || {};
    let verificationChain = Promise.resolve();

    function enqueue(task) {
      const execution = verificationChain.then(task, task);
      verificationChain = execution.catch(() => {});
      return execution;
    }

    async function verify({ tabId, url }) {
      return enqueue(async () => {
        const newConversationId = deps.conversationIdFromUrl(url);
        if (!newConversationId) {
          return { verified: false, reason: "conversation-id-missing" };
        }

        const runtime = await deps.readRuntime();

        if (
          runtime.phase === "ROTATION_VERIFIED" &&
          runtime.currentConversationId === newConversationId &&
          runtime.lastVerifiedRotationNonce
        ) {
          return {
            verified: true,
            alreadyVerified: true,
            nonce: runtime.lastVerifiedRotationNonce,
            runtime
          };
        }

        if (!runtime.enabled || runtime.ownerTabId !== tabId) {
          return { verified: false, reason: "not-owner-or-disabled" };
        }
        if (!["SENDING_RESUME", "AWAITING_NEW_CONVERSATION"].includes(runtime.phase)) {
          return { verified: false, reason: `phase-${runtime.phase}` };
        }
        if (!runtime.rotationNonce) {
          await deps.fail("ローテーションnonceを確認できない", { url, phase: runtime.phase, runToken: runtime.runToken });
          return { verified: false, failed: true, reason: "rotation-nonce-missing" };
        }
        if (!deps.validateProjectMembership(url, runtime.rotationProjectUrl)) {
          await deps.fail("新規チャットが設定済みプロジェクト外に作成された", {
            url,
            nonce: runtime.rotationNonce,
            runToken: runtime.runToken
          });
          return { verified: false, failed: true, reason: "project-mismatch" };
        }
        if (newConversationId === runtime.previousConversationId) {
          await deps.fail("会話IDが変わらなかった", {
            previousConversationId: runtime.previousConversationId,
            newConversationId,
            nonce: runtime.rotationNonce,
            runToken: runtime.runToken
          });
          return { verified: false, failed: true, reason: "conversation-id-unchanged" };
        }

        const nonce = runtime.rotationNonce;
        const previousConversationId = runtime.previousConversationId;
        const projectUrl = runtime.rotationProjectUrl;
        const verifiedAt = deps.now();

        await deps.clearAlarm();
        const next = await deps.saveRuntime({
          ...runtime,
          enabled: false,
          phase: "ROTATION_VERIFIED",
          currentConversationId: newConversationId,
          chatGeneration: (runtime.chatGeneration || 0) + 1,
          pendingSubmissionNonce: null,
          rotationNonce: null,
          rotationProjectUrl: null,
          rotationStartedAt: 0,
          lastVerifiedRotationNonce: nonce,
          lastVerifiedConversationId: newConversationId,
          lastVerifiedAt: verifiedAt,
          lastError: null
        });
        if (
          next.phase !== "ROTATION_VERIFIED" ||
          next.lastVerifiedRotationNonce !== nonce ||
          next.currentConversationId !== newConversationId
        ) {
          return { verified: false, reason: "stale-runtime" };
        }

        await deps.appendVerifiedLog({
          tabId,
          details: {
            nonce,
            previousConversationId,
            newConversationId,
            projectUrl,
            chatGeneration: next.chatGeneration
          }
        });

        return {
          verified: true,
          alreadyVerified: false,
          nonce,
          runtime: next
        };
      });
    }

    return { verify };
  }

  const api = { createRotationVerificationCoordinator };
  globalScope.TranslationLoopRotationVerification = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : self);

# MYGPT Worker Fanout v2

Status: **v0.2.1 STATIC PASS candidate — 1-worker READY live re-test pending**

This is the fast rebuild path. It does not build browser orchestration primitives from scratch.

## Reuse policy

- **Translation Loop 0.5.1**
  - `runtime_guard.js` is reused directly.
  - the existing Prompt-Stacker-derived editor path is reused for draft protection, native setter/contenteditable insertion, cancellation generation and reflected-text verification.
  - the v2 coordinator follows its runToken/stale-result model.
- **VoiceBridge 0.2.6**
  - generic `/g/...` DOM observation, SPA route-change observation and visible stop-button generation-state style are used in the content observer.
  - speech/localhost behavior is not part of this extension.
- **AutoGPT 0.0.71**
  - only the useful visible-file primitive is used: ChatGPT `input[type=file]` + browser `File` + `DataTransfer` + `change` event.
  - internal ChatGPT API/token interception, security-header removal, telemetry, third-party upload and output scraping are excluded.

This is a local project utility, not a publication-hardening exercise.

## v0.2.1 live-fix

The first v0.2.0 Vivaldi run reached the correct worker and reconstructed the canonical file, but ended with:

```text
Phase: ERROR
Attachment: input-files
COMPOSER_INSERT_VERIFY_FAILED
```

The returned attachment detail showed `input.files` assignment succeeded, but no visible ChatGPT attachment UI had been confirmed. v0.2.0 also dispatched an `input` event before `change`; React can remount the file input between those two events, leaving the later `change` on a stale node.

v0.2.1 therefore:
- follows the AutoGPT-proven ChatGPT file path more closely: `DataTransfer -> input.files -> change`;
- no longer treats `input.files` alone as successful attachment evidence;
- requires visible filename or a newly appeared attachment/preview UI before moving on;
- waits for the composer editor DOM to remain stable before inserting the packet;
- reacquires the current editor while verifying reflected packet text, so a React remount is not automatically mistaken for insertion failure;
- reports `FILE_ATTACHMENT_UI_NOT_CONFIRMED` rather than continuing when only the stale input retains the file.

## Current one-worker scope

One click prepares **one** background worker tab:

1. derive the current Custom GPT identity from the active source tab;
2. open the same normalized `/g/<worker>` root in one background tab;
3. verify destination identity;
4. ensure the composer has no existing draft;
5. attach the selected canonical image through ChatGPT's file input and require visible UI evidence;
6. wait for a stable current composer;
7. insert the packet using the Translation Loop-derived prompt runner;
8. require reflected packet equality and `submitted: false`;
9. mark state `READY`.

There is no send action in v0.2.1.

## Vivaldi live test

1. Replace/reload the unpacked extension with v0.2.1.
2. Open `MYGPT Single Frame Worker Test` in the active tab.
3. Open the extension popup.
4. Select the real canonical image.
5. Leave the inert packet unchanged for the first re-test.
6. Reset old state if necessary, then click **1 workerをREADYまで準備**.
7. Wait for `Phase: READY`.
8. Click **prepared worker tabへ移動**.
9. Visually verify:
   - it is the same `MYGPT Single Frame Worker Test`;
   - the canonical is visibly attached;
   - the exact packet is in the composer as an unsent draft;
   - there is no new user turn;
   - no assistant/image generation starts.

Expected READY diagnostics:
- `Attachment: visible-filename` or `visible-attachment-ui`
- `Composer: contenteditable` or `text-control`
- `Insert: translation-loop-prompt-stacker-insert-only`

If attachment still does not appear in ChatGPT UI, v0.2.1 should stop at `FILE_ATTACHMENT_UI_NOT_CONFIRMED`; do not interpret `input.files` alone as success.

## Next after live PASS

Do not redesign the control plane again.

- turn the exact one-worker prepare routine into three fixed slots F2/F3/F4;
- reuse one selected canonical payload for all three;
- use three distinct packets;
- leave all three READY and unsent;
- then enable the original Translation Loop send/positive-evidence path for controlled submit.

## Static checks

```text
node --check route_adapter.js
node --check runtime_guard.js
node --check prompt_stacker_insert_runner.js
node --check file_adapter.js
node --check content.js
node --check background.js
node --check popup.js
node tests/test_route_adapter.js
node tests/test_prompt_stacker_insert_runner.js
node tests/test_runtime_guard.js
node tests/test_file_adapter.js
node tests/test_v2_safety.js
```

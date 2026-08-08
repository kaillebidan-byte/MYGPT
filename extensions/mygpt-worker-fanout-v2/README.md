# MYGPT Worker Fanout v2

Status: **v0.2.0 STATIC PASS candidate — 1-worker READY live test pending**

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
  - only the useful visible-file primitive is used: ChatGPT `input[type=file]` + browser `File` + `DataTransfer` + normal input/change events.
  - internal ChatGPT API/token interception, security-header removal, telemetry, third-party upload and output scraping are excluded.

This is a local project utility, not a publication-hardening exercise.

## v0.2.0 scope

One click prepares **one** background worker tab:

1. derive the current Custom GPT identity from the active source tab;
2. open the same normalized `/g/<worker>` root in one background tab;
3. verify destination identity;
4. ensure the composer has no existing draft;
5. attach the selected canonical image through ChatGPT's file input;
6. insert the packet using the Translation Loop-derived prompt runner;
7. require `submitted: false`;
8. mark state `READY`.

There is no send action in v0.2.0.

## Vivaldi live test

1. Extract this directory and load it as an unpacked extension.
2. Open `MYGPT Single Frame Worker Test` in the active tab.
3. Open the extension popup. No manual source-tab reload should be required; v2 has `scripting` permission and injects its content bundle into an already-open source tab when needed.
4. Select the real canonical image.
5. Leave the default inert packet unchanged for the first test.
6. Click **1 workerをREADYまで準備**.
7. Wait for `Phase: READY`.
8. Click **prepared worker tabへ移動**.
9. Visually verify:
   - it is the same `MYGPT Single Frame Worker Test`;
   - the canonical is visibly attached;
   - the exact packet is in the composer as an unsent draft;
   - there is no new user turn;
   - no assistant/image generation starts.

Expected READY diagnostics:
- `Attachment: visible-filename` or `input-files`
- `Composer: contenteditable` or `text-control`
- `Insert: translation-loop-prompt-stacker-insert-only`

If file input discovery fails, the expected concrete error is `FILE_INPUT_NOT_FOUND`; that is the point to borrow more of AutoGPT's attachment/new-chat DOM handling.

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

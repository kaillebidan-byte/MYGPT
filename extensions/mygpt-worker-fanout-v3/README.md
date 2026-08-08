# MYGPT Worker Fanout v3

Status: **v0.3.2 STATIC PASS candidate — full-root readback + pre-staged tabs live re-test pending**

This is the stripped-AutoGPT rebuild. v0.3.2 keeps the MAIN-world AutoGPT path and fixes the remaining READY verification/tab-staging issues.

## Architecture

- AutoGPT 0.0.71 ChatGPT behavior, reimplemented narrowly in page MAIN world:
  - unified composer
  - `DataTransfer -> input.files -> change`
  - AutoGPT-style upload-ready predicate
  - ChatGPT-specific synthetic paste
  - passive page-world fetch/WebSocket observation without Bearer capture
- Translation Loop 0.5.1:
  - `runtime_guard.js` reused for serialized state mutation / runToken
- VoiceBridge 0.2.6 concepts:
  - route + generation MutationObserver diagnostics

No Google Analytics, membership, Autojourney services, prompt export, imgbb, external upload, direct internal API calls, Bearer capture, downloads, DNR header stripping or visibility shim are included.

## v0.3.2 live-fix

The v0.3.1 live screenshot proved that F2 upload and paste were actually successful.
The visible three-line packet was present, while verification reported `observedChars: 18`;
18 is exactly the first line `[MYGPT_V3_F2_TEST]`. The adapter had correctly targeted
`#prompt-textarea p` for the AutoGPT paste event but incorrectly reused that single paragraph
for full-draft readback. v0.3.2 keeps the paste target and reads/verifies `#prompt-textarea`
as a whole.

F3/F4 then opened with the F2 draft already present. v0.3.2 therefore creates and verifies
all F2/F3/F4 worker tabs before inserting any slot packet. Preparation remains sequential only
after all three tabs are staged, preventing later-created worker roots from restoring the F2 draft.

## v0.3.1 live failure fix

The first v0.3.0 live run reached `autogpt-upload-ready` but returned
`PROMPT_PASTE_VERIFY_FAILED` with `observedChars: 0`. The cause was architectural:
AutoGPT's `main.js` creates and dispatches the synthetic paste from the page MAIN world,
while v0.3.0 ran `chatgpt_adapter.js` in the isolated extension world.

v0.3.1 moves the ChatGPT adapter itself to MAIN world and invokes READY preparation with
`chrome.scripting.executeScript({world:"MAIN"})`. Translation Loop's runToken/state guard
remains in the extension background. Identity/generation evidence is re-read from the isolated
content script after MAIN-world preparation.

## v0.3.2 live scope

One click prepares exactly three fresh tabs: F2/F3/F4. Each must remain unsent.

1. active tab must be the target Custom GPT;
2. derive its normalized `/g/<worker>` identity;
3. create F2/F3/F4 tabs to the same worker root;
4. verify each identity;
5. attach the same canonical with AutoGPT's file-input pattern;
6. wait for AutoGPT-style composer upload-ready state;
7. paste a distinct packet with a synthetic paste event;
8. verify normalized readback;
9. require `submitted:false` and no active generation;
10. final phase = `READY` only when all three slots pass.

All three worker tabs are opened and verified before any draft insertion. READY preparation then runs sequentially by slot to reduce Vivaldi hidden-tab contention.

## Live test

1. Disable the older Worker Fanout extensions.
2. Load this directory unpacked.
3. Open `MYGPT Single Frame Worker Test` in the active tab.
4. Choose the canonical.
5. Keep the inert F2/F3/F4 test packets.
6. Click `F2/F3/F4をREADYまで準備`.
7. Expected final `Phase: READY`.
8. Open each slot and verify:
   - same Custom GPT;
   - canonical attached;
   - correct distinct packet present;
   - nothing submitted;
   - no generation started.

Expected slot diagnostics:

- attachment: `autogpt-upload-ready`
- insertion: `autogpt-synthetic-paste`

## Passive observer

`page_observer.js` is already installed in MAIN world for the next controlled-submit step. It can observe the page's own conversation POST stream and `ws.chatgpt.com` updates, but v0.3.2 does not trigger submission and does not read/store Authorization headers.

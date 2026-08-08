# MYGPT Worker Fanout v3

Status: **v0.3.0 STATIC PASS candidate — three-slot READY live test pending**

This is the stripped-AutoGPT rebuild. It supersedes the v2 READY implementation for new live tests.

## Architecture

- AutoGPT 0.0.71 ChatGPT behavior, reimplemented narrowly:
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

## v0.3.0 live scope

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

The first live run is sequential by slot to reduce Vivaldi hidden-tab contention.

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

`page_observer.js` is already installed in MAIN world for the next controlled-submit step. It can observe the page's own conversation POST stream and `ws.chatgpt.com` updates, but v0.3.0 does not trigger submission and does not read/store Authorization headers.

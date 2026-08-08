# MYGPT Worker Fanout v2 rebuild — static record

Date: 2026-08-09 JST
Status: **STATIC PASS / 1-worker READY live test pending**

## Direction change

The browser add-on is not the product goal. Rebuild for speed by reusing the supplied, already-working extensions instead of repeatedly reimplementing their primitives.

Reuse order:
- Translation Loop 0.5.1: primary control plane and prompt-runner source.
- VoiceBridge 0.2.6: route/generation/background-tab observer source.
- AutoGPT 0.0.71: selectively reuse only useful visible-UI primitives such as file input + File/DataTransfer; reject its internal API/token/security-header/telemetry/upload mechanisms.

Both user-supplied local extension ZIPs have now been reconstructed into `research/temp-extension-sources/*-extracted/` for direct source reuse. Temporary source lifecycle/deletion rule remains unchanged.

## New implementation

`extensions/mygpt-worker-fanout-v2/`

v0.2.0 prepares one worker to an unsent READY state:
1. current Custom GPT identity from active source tab;
2. open same worker root in a background tab;
3. verify identity;
4. composer draft preflight;
5. attach selected canonical through ChatGPT file input with File/DataTransfer;
6. insert packet through Translation-Loop-derived Prompt Stacker path;
7. require `submitted: false` and exact reflected text;
8. transition to READY.

The coordinator directly reuses Translation Loop `runtime_guard.js` and its runToken/stale-mutation model. It requests `tabs` and `scripting` rather than preserving the earlier minimal-permission experiment; this permits recovery/injection into already-open ChatGPT tabs without a manual reload. `unlimitedStorage` is used for the temporary canonical data URL so this local utility is not constrained by the normal local-storage quota.

VoiceBridge 0.2.6 source is recovered and verified as the source for later generation/route/background-tab observation. v0.2.0 does not yet need its completion loop because no submit occurs.

## Static verification

Local source matching the v2 implementation passed:

```text
python -m json.tool manifest.json                         PASS
node --check route_adapter.js                            PASS
node --check runtime_guard.js                            PASS
node --check prompt_stacker_insert_runner.js             PASS
node --check file_adapter.js                             PASS
node --check content.js                                  PASS
node --check background.js                               PASS
node --check popup.js                                    PASS
node tests/test_route_adapter.js                         PASS
node tests/test_prompt_stacker_insert_runner.js          PASS
node tests/test_runtime_guard.js                         PASS
node tests/test_file_adapter.js                          PASS
node tests/test_v2_safety.js                             PASS
```

Selected AutoGPT-style primitives intentionally present:
- `File`
- `DataTransfer`
- `input[type=file]`
- input/change events

Still excluded:
- ChatGPT `/backend-api`
- Bearer/Authorization capture
- fetch interception
- declarativeNetRequest/security-header removal
- telemetry/membership
- external image upload
- generated-output scraping/download

v0.2.0 contains no submit/click/Enter path.

## CURRENT stopping point

Run the Vivaldi **1-worker READY** live test with the real canonical image. If READY passes visually, do not add more gates around the same primitives: turn this exact routine into fixed F2/F3/F4 slots, then re-enable Translation Loop's original controlled-send + positive-evidence path and VoiceBridge's generation observer.

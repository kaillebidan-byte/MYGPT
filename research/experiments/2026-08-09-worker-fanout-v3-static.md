# MYGPT Worker Fanout v3 v0.3.0 — static acceptance record

Date: 2026-08-09 JST
Status: **STATIC PASS / VIVALDI LIVE THREE-SLOT READY TEST PENDING**

## Candidate

Repository path:

`extensions/mygpt-worker-fanout-v3/`

Distribution ZIP:

`mygpt-worker-fanout-v3-v0.3.0.zip`

SHA-256:

`eec9e2a7d079573aea523a206e12ed5fd000d9c9da2a839d12a4f7b459e56527`

## Scope

The candidate prepares exactly three isolated slots, F2/F3/F4, to an **unsent READY** state.

Each slot must:

1. open the same normalized Custom GPT identity;
2. attach the same canonical through the stripped AutoGPT ChatGPT attachment primitive;
3. wait for AutoGPT-style upload-ready state;
4. insert its distinct packet through the stripped AutoGPT synthetic paste primitive;
5. remain `submitted:false`;
6. have no generation active.

Slots are prepared sequentially in v0.3.0 to reduce hidden/background-tab contention during the first Vivaldi live check.

## Reused architecture

- AutoGPT 0.0.71 ChatGPT engine subset:
  - unified composer selectors
  - `DataTransfer -> input.files -> change`
  - upload-ready predicate
  - synthetic paste prompt insertion
  - passive MAIN-world conversation fetch/WebSocket observer already staged for later controlled submit
- Translation Loop 0.5.1:
  - `runtime_guard` runToken / serialized mutation / stale-operation rejection
- VoiceBridge 0.2.6 concepts:
  - SPA route and visible generation-state MutationObserver diagnostics

## Explicitly absent from v0.3.0

- submit/send activation
- generated image invocation
- Bearer capture
- Authorization storage
- direct internal ChatGPT requests
- output URL extraction/download
- Google Analytics
- Autojourney membership/account services
- external prompt export
- imgbb/external upload
- DNR security-header stripping
- visibility/focus shim

The page observer contains the conversation endpoint strings only for passive observation of the page's own requests; it is not armed or used to trigger anything in READY-only v0.3.0.

## Static checks

PASS:

```text
python -m json.tool manifest.json
node --check route_adapter.js
node --check runtime_guard.js
node --check page_observer.js
node --check chatgpt_adapter.js
node --check content.js
node --check background.js
node --check popup.js
node tests/test_chatgpt_adapter.js
node tests/test_page_observer.js
node tests/test_route_adapter.js
node tests/test_runtime_guard.js
node tests/test_v3_safety.js
```

Test outputs:

- `AutoGPT ChatGPT adapter contract: PASS`
- `Passive page observer contract: PASS`
- `test_route_adapter.js: PASS`
- `Translation Loop runtime_guard reuse tests: PASS`
- `MYGPT Worker Fanout v3 safety contract: PASS`

## Live acceptance condition

Vivaldi live PASS requires overall `Phase: READY` and all F2/F3/F4 slots to show:

- attachment evidence: `autogpt-upload-ready`
- insertion method: `autogpt-synthetic-paste`

Manual inspection of each owned tab must confirm:

- same `MYGPT Single Frame Worker Test` Custom GPT;
- canonical visibly attached;
- correct distinct slot packet present;
- no user turn committed;
- no assistant/image generation started.

Do not progress to controlled submit until this live check passes.

# MYGPT Worker Fanout — Gate 1 implementation record

Date: 2026-08-08 / 2026-08-09 JST
Status: **v0.1.1 STATIC RECHECK REQUIRED / VIVALDI LIVE TEST PENDING**

## Prior accepted gate

Gate 0 v0.0.2 is accepted in the user's Vivaldi environment.

Observed accepted Gate 0 PASS:

```text
Status: PASS
Expected: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Observed: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Tab: 22739685
```

## Gate 1 v0.1.0 — superseded implementation

The first Gate 1 implementation used a newly written `composer_adapter.js`. It implemented native textarea value setting and contenteditable insertion, but this duplicated functionality already present in the user-authored `ChatGPT Translation Loop Test 0.5.1` ZIP.

The user explicitly clarified that Translation Loop is their own extension and was supplied for direct reuse, not merely conceptual prior art. Therefore the custom composer adapter was removed rather than extended further.

## Translation Loop source recovery

The repository already contained the user-supplied Translation Loop 0.5.1 ZIP as temporary split-base64 escrow under `research/temp-extension-sources/`.

A temporary GitHub Actions workflow reconstructed it, verified the known ZIP SHA-256:

```text
2c10ed7156ad30fbb8454fa962cff604e24a5ad029f4406d92576fe9400e1b2a
```

and extracted the source into:

`research/temp-extension-sources/translation-loop-0.5.1-extracted/`

The temporary extraction workflow was deleted after the source was committed. The extracted source remains temporary and is covered by the existing mandatory cleanup rule at final accepted Worker Fanout completion.

Actual files inspected include:
- `prompt_stacker_runner.js`
- `runtime_guard.js`
- `content.js`
- `test_prompt_stacker_runner.js`
- `LICENSE-PROMPT-STACKER`

## Gate 1 v0.1.1 — Translation Loop direct reuse

`composer_adapter.js` and `tests/test_composer_adapter.js` were deleted.

New production file:
- `extensions/mygpt-worker-fanout/prompt_stacker_insert_runner.js`

This is an insert-only fork of the actual Translation Loop `prompt_stacker_runner.js`, preserving the proven editor-input portion while deleting every submit activation primitive.

Reused from Translation Loop:
- editor selector model;
- textarea/input native `value` setter;
- contenteditable `execCommand("insertText")` path;
- rich-editor text fallback;
- ordinary `input` event dispatch;
- `waitFor` with bounded timeout/interval;
- runner generation/cancel controller;
- existing-draft fail-closed behavior;
- reflection wait before success.

Removed for Gate 1:
- send-button selectors and discovery;
- `.click()` activation;
- KeyboardEvent/Enter fallback;
- submit workflow;
- post-submit evidence verification.

The Prompt Stacker MIT license carried by Translation Loop is copied to:
- `extensions/mygpt-worker-fanout/LICENSE-PROMPT-STACKER`

New/updated tests:
- `tests/test_prompt_stacker_insert_runner.js`, adapted from Translation Loop's runner test structure;
- `tests/test_gate1_safety.js`, now scans the production insert-only runner and rejects send/submit/file/network primitives.

## v0.1.0 Vivaldi screenshot and corrected diagnosis

The first v0.1.0 screenshot showed:

```text
Status: AWAITING_DESTINATION
Expected: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Observed: -
Tab: 22739706
Gate1: IDLE
```

Initial diagnosis treated this as a definite Gate 0 handshake regression. That was too strong.

Inspection found a popup UI defect: after Gate 0 start, popup rendered the `START` response snapshot but did not subscribe to later `chrome.storage.session` updates. Therefore background could already have transitioned to PASS while the still-open popup continued showing the older AWAITING snapshot.

v0.1.1 fixes this by:
- subscribing popup to `chrome.storage.onChanged` for `session` state;
- rendering the new state immediately;
- tracking `updatedAt` so a late older response cannot overwrite a newer PASS state.

## Additional Gate 0 race hardening in v0.1.1

A second real timing edge was also closed without adding polling or permissions.

If the destination content script reports the correct same-worker identity while state is still `OPENING` and before `openedTabId` is persisted, background now temporarily buffers that report keyed by sender tab ID.

After `chrome.tabs.create()` returns:
- ownership is persisted;
- only the buffered report whose tab ID exactly equals the returned owned tab ID can be accepted;
- all other early reports are discarded;
- the existing direct probe remains as an event-bound fallback.

This is not periodic retry and does not broaden permissions.

## Gate 1 contract retained

Gate 1 still requires:
1. Gate 0 `PASS`;
2. owned destination tab and expected worker identity;
3. non-empty packet <= 12,000 chars;
4. Gate 1 operation token and `IDLE -> INSERTING`;
5. preflight owned-tab identity query;
6. content-side identity check;
7. visible composer discovery by Translation Loop-derived runner;
8. fail closed if an existing draft is present;
9. insert-only text reflection;
10. response evidence `submitted: false`, `exactMatch: true`, matching worker and runToken;
11. stale-result check before committing Gate 1 PASS.

## Permission / forbidden surface

Manifest permissions remain exactly:

```json
["storage"]
```

No `tabs`, `scripting`, `alarms`, `downloads`, or `declarativeNetRequest` permission is added.

Gate 1 production source must contain no:
- internal `/backend-api` access;
- Bearer capture;
- fetch/XHR/WebSocket interception;
- `DataTransfer` / file attachment;
- `.click()`;
- `.submit()` / `requestSubmit()`;
- KeyboardEvent;
- send-button/composer-submit-button discovery;
- image generation invocation;
- response scraping/download;
- automatic retry/rate-driving.

## Next verification

Before another Vivaldi run, v0.1.1 must pass local static checks:

```text
python -m json.tool manifest.json
node --check route_adapter.js
node --check prompt_stacker_insert_runner.js
node --check content.js
node --check background.js
node --check popup.js
node tests/test_route_adapter.js
node tests/test_prompt_stacker_insert_runner.js
node tests/test_gate1_safety.js
```

Then perform only Gate 0 + Gate 1 insertion-only live verification.

Do not start canonical attachment or controlled submit until Gate 1 live PASS.

`research/temp-extension-sources/` remains in place until accepted Worker Fanout completion.

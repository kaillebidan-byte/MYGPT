# MYGPT Worker Fanout — Gate 1 static implementation record

Date: 2026-08-08 JST
Status: **STATIC PASS / VIVALDI LIVE TEST PENDING**

## Prior accepted gate

Gate 0 v0.0.2 is accepted in the user's Vivaldi environment.

Observed Gate 0 PASS:

```text
Status: PASS
Expected: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Observed: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Tab: 22739685
```

Gate 0 is not reopened by this change.

## Gate 1 scope implemented

Extension version: `0.1.0`

Gate 1 implements only controlled packet insertion into the Gate 0 owned destination tab.

Flow:
1. require Gate 0 `PASS`;
2. require existing owned destination tab ID and expected Custom GPT identity;
3. accept one non-empty packet up to 12,000 characters;
4. create a Gate 1 `operationToken` and transition `IDLE -> INSERTING`;
5. directly query the owned tab's current identity before touching the composer;
6. reject if current identity differs from the Gate 0 expected worker;
7. destination content script re-verifies worker identity and Gate 0 `runToken` presence;
8. find a visible supported ChatGPT composer;
9. reject `COMPOSER_NOT_EMPTY` before modification if any existing draft is present;
10. insert packet into textarea/input with native value setter + input event, or contenteditable with `insertText` and a DOM/input-event fallback;
11. read the composer back and require exact packet equality after narrow newline/NBSP normalization;
12. require returned evidence `submitted: false`, exact worker identity match, matching Gate 0 `runToken`, and `exactMatch: true`;
13. re-read background state and reject stale async completion before committing Gate 1 `PASS`.

Gate 1 state is independent under `state.gate1` and supports explicit Gate 1-only reset without discarding an accepted Gate 0 ownership state.

## Composer adapter

New file:
- `extensions/mygpt-worker-fanout/composer_adapter.js`

Selector order is deliberately narrow:
- `#prompt-textarea`
- `textarea[data-id='root']`
- `form textarea`
- form-scoped contenteditable textbox/editor selectors

There is no generic page-wide click/send control discovery.

Existing drafts are fail-closed. Gate 1 does not overwrite a non-empty composer.

## Explicit no-submit boundary

Gate 1 source contains no:
- send-button lookup;
- `.click()` submission;
- `form.submit()` / `requestSubmit()`;
- KeyboardEvent / Enter fallback;
- file input / `File` / `DataTransfer` attachment;
- image-generation invocation;
- internal ChatGPT API;
- Bearer/token capture;
- `fetch` / XHR / WebSocket interception;
- response parsing/output scraping/download;
- declarativeNetRequest/security-header modification;
- telemetry/external upload;
- periodic polling or automatic retry.

The content-script insertion response explicitly carries `submitted: false`; background requires it before Gate 1 can become `PASS`.

## Permission surface

Manifest permissions remain exactly:

```json
["storage"]
```

Host permissions remain only ChatGPT origins.

No `tabs`, `scripting`, `alarms`, `downloads`, or `declarativeNetRequest` permission was added.

## Static verification

Local source matching the committed GitHub blobs passed:

```text
python -m json.tool manifest.json                  PASS
node --check route_adapter.js                     PASS
node --check composer_adapter.js                  PASS
node --check content.js                           PASS
node --check background.js                        PASS
node --check popup.js                             PASS
node tests/test_route_adapter.js                  PASS
node tests/test_composer_adapter.js               PASS
node tests/test_gate1_safety.js                   PASS
chrome.tabs.create occurrence count = 1           PASS
manifest permissions = ["storage"]               PASS
```

`test_gate1_safety.js` statically rejects the following source patterns:
- `/backend-api`
- `Bearer`
- `declarativeNetRequest`
- downloads
- XHR / WebSocket / fetch
- `DataTransfer` / `new File(`
- `.requestSubmit(` / `.submit(` / `.click(`
- `KeyboardEvent`
- `send-button`

GitHub blob SHA comparison against the local build also matched for all Gate 1 changed/new implementation files.

## Default live-test packet

```text
[MYGPT_GATE1_TEST]
mode=INSERT_ONLY
submit=FORBIDDEN
purpose=verify_composer_insertion
```

This packet is deliberately an inert insertion canary rather than a real image-generation request.

## Vivaldi live acceptance still required

Gate 1 is **not yet live PASS**.

Use `extensions/mygpt-worker-fanout/README.md` for the exact procedure.

PASS requires all of the following:
- Gate 0 remains `PASS`;
- Gate1 popup status becomes `PASS`;
- the exact default packet is visibly present in the owned destination composer as an unsent draft;
- popup reports Composer and Method values;
- no user turn appears in history;
- no assistant/image generation starts;
- no file is attached;
- no additional tab is opened;
- no extension/service-worker error occurs.

Any automatic submission, generation start, wrong-tab modification, partial/duplicated packet, or Gate 1 error is a hard stop.

## CURRENT stopping point

**Gate 1 code = implemented and statically verified. Gate 1 Vivaldi insertion-only live test = pending.**

Do not start canonical attachment or controlled submit until Gate 1 live PASS.

`research/temp-extension-sources/` remains in place because Worker Fanout has not reached accepted completion.

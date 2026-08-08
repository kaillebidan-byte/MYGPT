# MYGPT Worker Fanout — Gate 0 static implementation record

Date: 2026-08-08 JST
Status: **STATIC PASS / VIVALDI LIVE TEST PENDING**

## Source-of-truth basis

Gate 0 was implemented only after re-reading and reconciling:
- `research/handoffs/2026-08-08-2239-next-chat.md`;
- `research/PROJECT-HANDOFF.md`;
- `research/decisions/2026-08-08-three-extension-synthesis.md`;
- `research/runtime/2026-08-08-single-frame-worker-live-snapshot.md`;
- `research/audits/2026-08-08-autogpt-0.0.71-static-analysis.md`;
- `research/audits/2026-08-08-voicebridge-0.2.6-reuse-assessment.md`;
- `research/audits/2026-08-08-translation-loop-0.5.1-static-analysis.md`;
- `research/decisions/2026-08-08-temp-extension-source-lifecycle.md`.

The implementation follows the CURRENT three-way synthesis rather than modifying any of the three inspected extensions.

## Implemented directory

`extensions/mygpt-worker-fanout/`

Files:
- `manifest.json`
- `route_adapter.js`
- `content.js`
- `background.js`
- `popup.html`
- `popup.js`
- `tests/test_route_adapter.js`
- `README.md`

## Gate 0 behavior

Implemented only the non-generation identity gate:
1. obtain the current page identity from a user-opened Custom GPT `/g/...` route;
2. normalize it to the worker root `/g/<worker-segment>`;
3. explicitly reject ChatGPT Project `g-p-...` routes;
4. open exactly one new tab at the same normalized worker root;
5. bind that tab ID to an ephemeral Gate 0 `runToken` in `chrome.storage.session`;
6. have the destination content script report its observed route/worker identity to the background service worker;
7. PASS only if the report comes from the owned tab and its worker identity equals the expected identity;
8. fail closed on invalid destination identity, identity mismatch, or owned-tab closure before verification;
9. require an explicit Reset after PASS/FAIL before another Gate 0 run.

SPA route observation is event-driven through MutationObserver plus popstate/hashchange/pageshow. No one-second ping/watchdog was added.

## Permission decision

Gate 0 manifest currently requests:
- `storage`;
- host permissions only for `https://chatgpt.com/*` and legacy `https://chat.openai.com/*`.

It does **not** request `scripting`, `alarms`, `downloads`, `declarativeNetRequest`, or broad all-sites access.

The implementation uses `chrome.tabs.create/query/onUpdated/onRemoved` but does not request the `tabs` permission at this gate. This follows the prior VoiceBridge audit's narrow-permission hypothesis and must be confirmed in the Vivaldi live test. If Vivaldi rejects the required tab operation, that concrete failure is the condition for adding `tabs`; it is not pre-added speculatively.

Because `scripting` is intentionally absent, a ChatGPT tab that was already open before loading/updating the unpacked extension must be reloaded once before the popup can query its content script.

## Explicit exclusions retained

No Gate 0 code implements:
- prompt insertion;
- canonical/file attachment;
- send/submit automation;
- image-generation invocation;
- ChatGPT internal API calls;
- Bearer/token capture;
- fetch/XHR/WebSocket interception;
- response parsing or output scraping;
- generated-output download;
- CSP/security-header modification;
- visibility/focus spoofing;
- telemetry;
- third-party upload;
- automatic retry/rate-driving.

This preserves the rejection reasons from the AutoGPT audit and does not import Translation Loop's Project-specific parser or VoiceBridge's speech/persistent-ping path.

## Static verification performed before repository write

Local source matching the committed implementation passed:

```text
python -m json.tool manifest.json                  PASS
node --check route_adapter.js                     PASS
node --check content.js                           PASS
node --check background.js                        PASS
node --check popup.js                             PASS
node tests/test_route_adapter.js                  PASS
forbidden-mechanism source scan                   PASS
chrome.tabs.create occurrence count = 1           PASS
```

The route-adapter test covers:
- Custom GPT root normalization;
- conversation suffix/query/hash removal;
- same-worker comparison;
- different-worker mismatch;
- legacy `chat.openai.com` origin;
- Project `g-p-...` rejection;
- ordinary-chat rejection;
- unsupported-origin rejection;
- malformed URL rejection.

## Live acceptance test — still required

This record is **not** a live Gate 0 PASS. Browser behavior must still be verified in the user's actual Vivaldi environment.

Use `extensions/mygpt-worker-fanout/README.md` for the exact load-unpacked procedure.

PASS requires all of the following:
- one click opens exactly one new tab;
- opened page is visibly the same `MYGPT Single Frame Worker Test` Custom GPT;
- popup status becomes `PASS`;
- Expected and Observed `/g/...` identities are equal;
- no prompt insertion, file attachment, send, or image generation occurs;
- no Vivaldi extension/service-worker error occurs.

If any condition fails, stop at Gate 0 and record the concrete failure before changing permissions or route logic.

## CURRENT stopping point

**Gate 0 code = implemented and statically verified. Gate 0 live Vivaldi verification = pending.**

Do not start Gate 1 packet insertion until the live Gate 0 acceptance conditions pass.

`research/temp-extension-sources/` remains in place because `MYGPT Worker Fanout` has not reached accepted completion. Its mandatory deletion rule is unchanged.

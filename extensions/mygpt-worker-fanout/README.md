# MYGPT Worker Fanout

Status: **Gate 0 v0.0.2 — Vivaldi LIVE PASS**

This is a separate Manifest V3 extension for the MYGPT project. Gate 0 deliberately implements only Custom GPT route identity capture and one-tab open/verify.

## Gate 0 contract

Implemented:
- derive a normalized worker root from the current `https://chatgpt.com/g/...` (or legacy `chat.openai.com`) Custom GPT route;
- reject Project `g-p-...` routes;
- create exactly one new tab at the same normalized worker root;
- bind that tab ID to one ephemeral Gate 0 `runToken` in `chrome.storage.session`;
- content script reports its destination route/worker identity to the background service worker;
- after ownership is persisted, background also probes the owned tab directly with `GET_IDENTITY` when the tab is already complete or when its single `complete` lifecycle event arrives;
- PASS only when the owned destination tab reports the same worker identity;
- fail closed on invalid/mismatched destination identity or owned-tab close before verification;
- observe SPA route changes with DOM mutation/popstate/hashchange/pageshow signals, without a one-second ping loop.

Not implemented in Gate 0:
- prompt insertion;
- canonical/file attachment;
- send/submit controls;
- image generation invocation;
- response parsing or output scraping;
- download automation;
- ChatGPT internal API access;
- Bearer/token capture;
- `fetch`/XHR/WebSocket interception;
- CSP/security-header modification;
- visibility/focus spoofing;
- telemetry or external upload;
- automatic retry loop.

## Live result that led to v0.0.2

The first Vivaldi run opened exactly one destination tab and preserved the expected worker path, but the popup stayed at `AWAITING_DESTINATION` with `Observed: -`.

That showed `chrome.tabs.create()` was working without adding the `tabs` permission, while the destination report handshake could still be lost if `document_idle` and `tabs.onUpdated("complete")` both occurred before `openedTabId` finished persisting.

v0.0.2 closes that race by querying the owned destination content script directly after ownership is persisted. It still has no periodic polling or automatic retry loop.

## Vivaldi live acceptance — PASS

Accepted on 2026-08-08 JST with v0.0.2.

Observed popup state:

```text
Status: PASS
Expected: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Observed: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Tab: 22739685
```

This confirms in the user's actual Vivaldi environment:
- the owned destination tab can be created;
- the normalized Custom GPT worker identity is preserved;
- destination identity reaches the background handshake;
- Expected and Observed are exactly equal;
- the Gate 0 flow works without adding the `tabs` permission.

Gate 0 is therefore accepted. Do not reopen Gate 0 unless a later regression produces concrete evidence.

## Historical Vivaldi test procedure

1. Use the directory containing this `manifest.json` as an unpacked extension directory.
2. Open `vivaldi://extensions`.
3. Enable Developer mode.
4. Choose **Load unpacked** and select the `extensions/mygpt-worker-fanout/` directory.
5. If an older build is already loaded, replace/update the files and press the extension's **Reload** button in `vivaldi://extensions`.
6. Manually open the existing `MYGPT Single Frame Worker Test` Custom GPT page.
7. Reload that ChatGPT tab once after loading/updating the unpacked extension. This is required because Gate 0 intentionally does not request `scripting` permission for retroactive injection.
8. Open the extension popup. Before starting, confirm the page is the intended Custom GPT and not a ChatGPT Project route.
9. If an old run remains, click **Gate 0状態をリセット** once.
10. Click **Gate 0を実行** once.
11. Expected behavior: exactly one new tab opens at the normalized `/g/<same-worker>` root. The extension does not type, attach, or send anything.
12. Visually confirm the opened page is `MYGPT Single Frame Worker Test`.
13. Reopen the extension popup in that tab. `Status` must be `PASS`, and `Expected` and `Observed` must show the same `/g/...` worker root.

## Static checks

From this directory:

```bash
node --check route_adapter.js
node --check content.js
node --check background.js
node --check popup.js
node tests/test_route_adapter.js
```

## CURRENT stopping point

**Gate 0 is accepted. Next gate is Gate 1: controlled packet insertion into the owned worker tab, with no submit/send action.**

Gate 1 must preserve the existing forbidden-mechanism constraints and must not add canonical attachment or generation yet.

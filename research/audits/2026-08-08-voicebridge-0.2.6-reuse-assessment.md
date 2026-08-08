# ChatGPT VoiceBridge 0.2.6 — N3 reuse assessment

Date: 2026-08-08 JST
Status: VERIFIED STATIC ANALYSIS / CANDIDATE A — BASE NOT YET SELECTED

## Evidence

User supplied:
- `chatgpt_voicebridge_extension_0.2.6.zip`

Static-only analysis. No extension code was executed by the audit.

SHA-256:
- ZIP: `05feb875dd5d7b381f4fff328662ef12efde49ffd61d8bc194ef7b295dfa41be`
- `manifest.json`: `84477cfce1c3b11f4687c186af9b8ecde833a458687a7f1e9c60287832b38c29`
- `content.js`: `096cbef8530cd98449e01285f2bcaa1ccd69d599e3659f39a8211e9aa39f04ea`
- `background.js`: `acea39df0d22861c32242cf51a3171a61680da1b7b3f25973f8354dc3158bdf8`

## Current architecture

Manifest V3.

Permissions:
- `storage`

Host permissions:
- `https://chatgpt.com/*`
- `https://chat.openai.com/*`
- `http://127.0.0.1/*`

Content script:
- injected at `document_idle`
- covers all `chatgpt.com/*`, therefore includes Custom-GPT `/g/...` pages
- uses standard DOM only
- tracks assistant message nodes by `data-message-author-role`
- watches send/composer events
- watches route changes by `location.pathname` / `location.href`
- detects generation via visible stop-button selectors
- uses `MutationObserver` plus a long-lived runtime port

Background service worker:
- maintains long-lived connections to multiple ChatGPT tabs
- pings each connected tab once per second for DOM scans
- can report connected ChatGPT tab count
- sends completed response text only to configured local VoiceBridge endpoint

## Security / dependency profile

Unlike the inspected AutoGPT 0.0.71 bundle, this extension currently contains no evidence of:
- `window.fetch` monkey-patching
- ChatGPT `backend-api` calls
- Bearer Authorization capture
- response-stream interception
- generated-output extraction/download automation
- CSP / X-Frame-Options / COOP / COEP removal
- focus/visibility spoofing
- telemetry / analytics
- third-party membership API
- third-party image upload

The only explicit network `fetch()` in the current code is to the configured local VoiceBridge endpoint, defaulting to `http://127.0.0.1:50333/speak`.

Debug logs intentionally store metadata such as tab/url/event state, but not response body text or VoiceBridge token.

## Relevance to N3

This is a strong candidate engineering base and better than starting a new extension from scratch **if no stronger existing local add-on is found**.

Already-proven primitives:
1. ChatGPT/Custom-GPT DOM injection.
2. SPA route-change handling.
3. multi-tab background/content-script communication.
4. generation-state observation.
5. send/composer selector knowledge.
6. local-only settings/debug infrastructure.

Missing N3 primitives:
1. create/open fresh Custom-GPT tabs;
2. verify destination GPT identity;
3. insert prepared packet text;
4. attach canonical through ChatGPT's visible file input;
5. optional controlled submit;
6. associate three worker tabs with F2/F3/F4 packet slots.

## Important implementation note

Current extension does not call `chrome.tabs.create()` and does not declare a `tabs` permission.
Chrome's current extension API documentation says creating a tab does not itself require the `tabs` permission; the service worker can use `chrome.tabs.create()`. Sensitive tab properties such as URL/title are where the `tabs` permission matters.

Therefore the first fan-out prototype can likely retain the current narrow permission surface while adding tab creation through the service worker. Verify in Vivaldi before changing permissions.

## Runtime-duty-cycle consideration

User has stated that another existing add-on is also available and is only expected to run for a few hours per day.

That changes the base-selection criteria:
- always-on minimal background overhead is less important than previously assumed;
- a candidate that already has more of the required short-session orchestration primitives may be preferable even if it is less optimized for continuous operation;
- however, security boundary, external communication, ChatGPT-internal API use, and identity-isolation behavior still outrank convenience.

Therefore do not select VoiceBridge solely because it is already low-privilege and DOM-oriented. Inspect the alternate add-on first and compare actual reusable primitives.

## Candidate-A modification strategy if selected

Do not merge orchestration directly into the existing VoiceBridge readout path at first.
Keep the established voice-monitor behavior intact and add a separate, opt-in `MYGPT worker` section/module.

First implementation gate should be non-generation and reversible:
1. popup button opens one fresh `MYGPT Single Frame Worker Test` Custom-GPT tab;
2. existing content script detects the new tab and reports its route;
3. verify the page still identifies the same Custom GPT;
4. no prompt insertion or submission yet.

After that passes, add one primitive at a time:
- text insertion without submit;
- canonical attachment;
- manual-submit gate;
- three-tab fan-out;
- only then consider automatic submit.

Do not add AutoGPT-derived internal API interception, output scraping, authorization capture, header weakening, telemetry, or auto-retry logic.

## Current verdict

**VoiceBridge 0.2.6 = Candidate A, not yet the selected N3 base.**

Base selection is deferred until the user's other existing add-on is statically inspected and compared on:
1. current ChatGPT / Custom-GPT DOM compatibility;
2. fresh-tab/new-chat primitives;
3. prompt insertion / controlled submit primitives;
4. file-input/upload primitives;
5. multi-tab coordination;
6. external communication / privilege surface;
7. internal ChatGPT API interception or token handling;
8. modification cost and regression risk to the add-on's existing purpose;
9. suitability for the stated few-hours-per-day operating window.

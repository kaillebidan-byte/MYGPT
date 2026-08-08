# ChatGPT Translation Loop Test 0.5.1 — N3 reuse assessment

Date: 2026-08-08 JST
Status: VERIFIED STATIC ANALYSIS / CANDIDATE B — STRONG CONTROL-PLANE BASE

## Evidence

User supplied:
- `chatgpt-translation-loop-test-0.5.1.zip`

Static analysis was performed without loading the extension into a browser.

SHA-256:
- ZIP: `2c10ed7156ad30fbb8454fa962cff604e24a5ad029f4406d92576fe9400e1b2a`
- `manifest.json`: `aa627655e53422d6ba0ff6d1e1f71d465072dfc7bbcb3824d0f90b69c878eb27`
- `background.js`: `857d236ae77bad48a35154978505cdadade52c506f91dc0ffcae2165940c1aa6`
- `content.js`: `3a7bd17e1ddde4627728fe1c68ef3e52c2a446959c607590f91c6997b28a8dbc`
- `prompt_stacker_runner.js`: `96fb88e2a512d5ad83b4abc4c4585acf6b969255c5700a18b869bdf30c01ea21`

All JavaScript files pass `node --check`.
All bundled `test_*.js` tests pass when run under Node.

## Manifest / privilege surface

Manifest V3.

Permissions:
- `storage`
- `tabs`
- `scripting`
- `alarms`

Host permissions:
- `https://chatgpt.com/*`
- `https://chat.openai.com/*`

No declarative network rules.
No download permission.
No localhost / third-party host permission.

No application-level `fetch()` / XHR / WebSocket communication was found in the extension source.

Important nuance:
- settings are mirrored to `chrome.storage.sync` when available;
- runtime and logs remain in `chrome.storage.local`.

For MYGPT reuse, worker packets / canonical metadata should remain local-only rather than being synced.

## Existing function — what it already solves

The extension is designed to run a bounded ChatGPT loop for a few hours, detect a completed answer, submit a configured follow-up, and rotate into a fresh chat inside the same ChatGPT Project.

The relevant reusable engineering is broader than its translation-loop purpose.

### 1. Robust prompt insertion / controlled submit

`prompt_stacker_runner.js` already implements:
- current composer discovery;
- textarea native value setter;
- contenteditable insertion with input events;
- wait-until-send-button-enabled behavior;
- composer-local send-button selection;
- normal DOM `button.click()` submission;
- cancellation support;
- optional post-submit evidence verification;
- fail-closed behavior when the composer contains an existing draft;
- Enter fallback can be disabled, and is disabled by the current extension for safety.

This is a stronger starting point than AutoGPT's generic batch automation for MYGPT because it explicitly verifies the UI state instead of assuming a click succeeded.

### 2. Positive submission evidence

`loop_core.js` does not treat an emptied composer as sufficient proof of submission.
It accepts stronger evidence such as:
- user-turn count increased;
- newest user-turn identity changed and matches the submitted prompt;
- generation changed from idle to active;
- rotation created a new conversation / URL.

This is directly useful for MYGPT fan-out because a frame packet must not silently fail or be sent twice.

### 3. Concurrency / stale-run protection

`runtime_guard.js` serializes state mutations and attaches a `runToken` to one active run.
Pause / reset / stale asynchronous completion cannot overwrite a newer run.

This is useful for a three-worker fan-out where one tab may be slow or fail independently.

### 4. Bounded operation and fail-closed behavior

The extension deliberately stops on ambiguous state:
- unexpected route change;
- tab closed/discarded;
- composer draft already present;
- send control unavailable;
- submission evidence absent;
- stale Content script;
- browser restart / extension update during a run.

It also supports an explicit maximum chat count.

This matches the user's stated operating pattern of a few hours per day better than an always-running automation framework.

### 5. Tab / route control

The background script already uses:
- `chrome.tabs.get/query/update`;
- `chrome.tabs.onUpdated` / `onRemoved`;
- `chrome.scripting.executeScript`;
- `chrome.alarms` watchdog;
- conversation-ID validation;
- new-route verification after rotation.

This is the strongest of the three inspected add-ons for orchestration state management.

## Important limitation — current route logic is Project-specific

The current URL core is explicitly written for ChatGPT Project routes:
- `/g/g-p-.../project`
- `/g/g-p-.../c/<conversation>`

Its identity parser expects `g-p-...`.

MYGPT production worker is a user-created Custom GPT, not the same route type.
Therefore:
- do not copy the Project route parser unchanged;
- retain the *pattern* of stable-ID normalization and route verification;
- implement a separate Custom-GPT route adapter based on the current worker `/g/...` URL.

The Project rotation workflow is not itself the target production architecture.

## Completion observation

The extension has a mature text-answer completion gate:
- no stop button;
- no strong Thinking indicator;
- text fingerprint stable;
- completion action bar stable over multiple observations;
- optional fallback based on VoiceBridge-derived timing.

However its README explicitly says image-generation special completion forms are out of scope.

For MYGPT v0 fan-out this is not blocking because the first automation target only needs to start three independent image jobs. Automatic result extraction / automatic retry is not required.

If later completion awareness is needed, use a dedicated visible-DOM image-state adapter rather than internal response interception.

## Comparison to inspected AutoGPT 0.0.71

Advantages:
- no ChatGPT internal `backend-api` access;
- no Bearer token capture;
- no `window.fetch` interception;
- no generated-output scraping / auto-download;
- no CSP / X-Frame-Options / COOP / COEP removal;
- no focus/visibility spoofing;
- no telemetry / membership API;
- explicit safety state machine and tests.

Missing primitive that AutoGPT demonstrated:
- canonical image attachment via ChatGPT's visible file input / `DataTransfer`.

That primitive can be reimplemented independently without carrying over AutoGPT's invasive mechanisms.

## Comparison to VoiceBridge 0.2.6

Translation Loop is stronger for:
- tab ownership;
- controlled send;
- route verification;
- stale-run suppression;
- bounded operation;
- fail-closed state transitions;
- test coverage.

VoiceBridge is stronger / simpler for:
- generic Custom-GPT DOM observation;
- SPA route-change monitoring without Project assumptions;
- multi-tab observer connections;
- existing generation-start / generation-end DOM observation.

Therefore neither should be copied wholesale as the MYGPT worker extension.

## Verdict

**Translation Loop 0.5.1 is the strongest control-plane source among the user's two local add-ons.**

Recommended reuse:
- state machine / runToken approach;
- prompt runner;
- positive submission evidence;
- bounded chat/tab ownership;
- fail-closed policies;
- tests and module separation.

Do not reuse unchanged:
- Project-specific `g-p-...` route logic;
- translation loop semantics;
- settings sync for MYGPT packet/canonical data;
- automatic continuation after arbitrary assistant text.

Combine it with VoiceBridge's generic DOM observation and a clean-room reimplementation of AutoGPT's visible file-input/new-chat primitives.
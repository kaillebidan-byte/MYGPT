# N3 synthesis — AutoGPT + VoiceBridge + Translation Loop

Date: 2026-08-08 JST
Revised: 2026-08-09 00:55 JST
Status: CURRENT IMPLEMENTATION DIRECTION

## Decision

Build `MYGPT Worker Fanout` primarily by **directly reusing the user's already-working extension code**, not by reimplementing equivalent mechanisms from scratch.

Reuse policy:
- **ChatGPT Translation Loop Test 0.5.1:** strong/direct reuse is the default. Reuse its control plane, runToken/runtime guard, tab ownership, prompt runner, composer handling, submission evidence, fail-closed behavior, bounded execution and tests unless a concrete MYGPT incompatibility requires adaptation.
- **ChatGPT VoiceBridge 0.2.6:** strong/direct reuse is the default for generic ChatGPT DOM observation, SPA route watching, generation-state observation and multi-tab messaging. Do not rewrite these mechanisms merely for architectural neatness.
- **Autojourney AutoGPT 0.0.71:** selective reuse only. Take the useful visible-UI primitives and proven browser techniques, but exclude the invasive/internal-network/account/telemetry mechanisms identified by audit.

The fact that an implementation is broadly used or already proven in the user's own working extensions is positive engineering evidence. A model-generated preference for a narrower or more "clean-room" design is **not** by itself a reason to replace proven code. Reject or rewrite an existing mechanism only when there is concrete evidence of incompatibility, an actual security/privacy issue, a licensing constraint, or a requirement conflict.

This revises the earlier wording that treated Translation Loop and VoiceBridge mainly as pattern/reference sources. They are implementation assets and may be copied/adapted directly.

## Evidence set

### Autojourney AutoGPT 0.0.71

Useful/proven parts that may be reused or adapted:
- Custom-GPT UI operation;
- visible new-chat navigation/control;
- composer manipulation through visible DOM;
- ChatGPT file input population with browser `File` / `DataTransfer`;
- ordinary visible send-control activation;
- browser-side orchestration that does not require separately billed OpenAI API calls.

Do **not** import the audited invasive parts:
- ChatGPT `fetch` interception;
- Bearer Authorization capture;
- direct `backend-api` calls;
- response-stream parsing;
- membership/account API integration;
- external telemetry;
- third-party upload helpers;
- CSP / X-Frame-Options / COOP / COEP stripping;
- visibility/focus spoofing;
- automatic generated-output scraping/download unless separately designed and accepted;
- uncontrolled automatic retry/rate-driving.

Record:
- `research/audits/2026-08-08-autogpt-0.0.71-static-analysis.md`

### ChatGPT VoiceBridge 0.2.6

Direct-reuse candidates:
- low-privilege standard DOM content-script structure;
- `/g/...` Custom-GPT route coverage;
- MutationObserver-based DOM observation;
- SPA route-change awareness;
- multi-tab content/background communication;
- visible stop-button generation-state detection;
- local debugging patterns.

Do not bring speech-specific network behavior into Worker Fanout unless it becomes relevant.
The one-second ping loop is not forbidden categorically; retain/reuse it if real Vivaldi lifecycle behavior shows it is useful. Do not remove proven lifecycle support solely for theoretical minimalism.

Record:
- `research/audits/2026-08-08-voicebridge-0.2.6-reuse-assessment.md`

### ChatGPT Translation Loop Test 0.5.1

This is the **primary implementation base** for Worker Fanout orchestration.

Direct-reuse candidates include:
- `prompt_stacker_runner.js` editor discovery and React-compatible native value setter/contenteditable insertion;
- draft-presence fail-closed behavior;
- wait/reflect verification;
- send-control discovery and normal DOM activation when the controlled-submit gate is reached;
- positive post-submit evidence;
- `runtime_guard.js` serialized mutations and runToken stale-operation rejection;
- tab ownership and route verification;
- bounded operation;
- cancellation/stop semantics;
- existing unit-test patterns and test files;
- relevant background/content messaging structure.

Adapt only what MYGPT actually requires:
- replace Project `g-p-...` identity assumptions with the already-validated Custom-GPT `/g/...` worker adapter;
- replace translation-loop semantics with finite worker-slot/fanout semantics;
- keep packet/canonical run data ephemeral/local rather than syncing it unnecessarily.

Record:
- `research/audits/2026-08-08-translation-loop-0.5.1-static-analysis.md`
- temporary extracted source under `research/temp-extension-sources/translation-loop-0.5.1-extracted/` while implementation remains in progress.

## Resulting architecture

```text
MYGPT planner
  -> worker packets + canonical
        |
        v
MYGPT Worker Fanout extension
  Control plane
    - DIRECTLY reuse/adapt Translation Loop runtime guard / runToken / ownership
    - bounded worker slots F2/F3/F4
    - fail closed on concrete route/draft/state mismatch

  Route / identity adapter
    - existing validated Custom-GPT `/g/...` adapter
    - VoiceBridge route observation where useful
    - adapt away only the Translation Loop Project-specific `g-p-...` parser

  Composer / submit adapter
    - DIRECTLY reuse Translation Loop Prompt Stacker runner
    - Gate 1 exposes insertion-only subset
    - later controlled-submit gate re-enables its proven send/evidence path

  File attachment adapter
    - use AutoGPT's proven visible `input[type=file]` + `File` / `DataTransfer` technique
    - exclude its internal API/token/telemetry machinery

  Observer
    - DIRECTLY reuse VoiceBridge observation primitives where they already solve the problem
    - visible generation state only

  Browser coordinator
    - reuse Translation Loop tab/runtime patterns
    - adapt to exactly three Custom-GPT worker tabs

  Session/runtime data
    - ephemeral/local for packets/canonical/slot state
    - no external telemetry
```

## Engineering rule: reuse before reinvention

Before implementing a browser/DOM/state primitive from scratch:
1. check Translation Loop source for an existing implementation;
2. check VoiceBridge source for an existing implementation;
3. if neither solves it, check AutoGPT for a safe visible-UI implementation/technique;
4. only then write a new mechanism.

When existing code has already passed real browser use or bundled tests, preserve it unless a concrete MYGPT requirement disproves it.

Do not treat speculative concerns, stylistic preferences, or a desire for unusually narrow permissions as sufficient evidence to discard working code. Permissions and mechanisms should be judged against actual required browser behavior and observed risk.

## Gate sequence

Gate 0 — worker identity/tab ownership:
- already Vivaldi LIVE PASS;
- do not rewrite without concrete regression evidence.

Gate 1 — packet insertion only:
- use Translation Loop Prompt Stacker implementation directly/adapted;
- no submit during this gate;
- live Vivaldi test required.

Next gates after Gate 1 PASS:
1. canonical selection + one-tab attachment using safe AutoGPT-derived visible file-input technique;
2. attachment + packet preparation in one tab;
3. exactly-three-tab fanout, still without auto-submit;
4. non-generation isolation check;
5. controlled submit using Translation Loop's existing send-control + positive-evidence logic;
6. one known static image-generation packet;
7. three-worker generation.

## AutoGPT selection boundary

AutoGPT is the exception to the direct-reuse default because its audited bundle mixes useful UI automation with mechanisms that are unnecessary for MYGPT and expand the trust surface.

Safe/useful candidates:
- visible new-chat control/navigation;
- visible composer interaction;
- visible file input;
- `File` / `DataTransfer` attachment;
- normal visible send-button activation;
- ordinary DOM-based browser automation.

Excluded unless separately justified later:
- Bearer/token acquisition;
- ChatGPT internal backend endpoints;
- response interception/parsing;
- security-header removal;
- focus/visibility spoofing;
- membership/account integration;
- telemetry;
- third-party upload;
- automatic output extraction/download;
- uncontrolled retry/rate-driving.

## Current decision

**Primary base: Translation Loop 0.5.1, reused directly and adapted to Custom-GPT worker semantics.**

**Observer/lifecycle support: VoiceBridge 0.2.6, reused directly where applicable.**

**Missing UI primitives: take the safe visible-browser pieces from AutoGPT 0.0.71, while excluding its invasive/internal-service pieces.**

The project should prefer proven existing code over reimplementation. New code is for actual gaps, not for replacing working mechanisms because of model-specific architectural taste.

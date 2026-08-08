# N3 synthesis — AutoGPT + VoiceBridge + Translation Loop

Date: 2026-08-08 JST
Status: CURRENT IMPLEMENTATION DIRECTION

## Decision

Do not adopt any of the three extensions wholesale.
Do not pick a single one as the universal base.

Build a dedicated MYGPT worker-fanout extension by combining the strongest *behaviors / architecture patterns* from all three while preserving the validated Custom-GPT isolation boundary.

AutoGPT is used as prior-art evidence for visible ChatGPT UI primitives; do not copy its proprietary/minified implementation directly.
VoiceBridge and Translation Loop are treated as local source candidates whose modules/patterns can be reused where appropriate.

## Evidence set

### Autojourney AutoGPT 0.0.71

Verified strengths:
- works on the Custom-GPT page at least at UI-injection level;
- visible new-chat DOM control is automatable;
- prompt composer can be filled through visible DOM events;
- ChatGPT file input can be populated with a `File`/`DataTransfer` flow;
- image-generation workflows can be initiated without a separately billed OpenAI API.

Rejected mechanisms:
- ChatGPT `fetch` interception;
- Bearer Authorization capture;
- direct `backend-api` calls;
- response-stream parsing;
- automatic generated-output extraction/download;
- CSP / X-Frame-Options / COOP / COEP stripping;
- visibility/focus spoofing;
- membership/account telemetry infrastructure;
- third-party upload path;
- automatic retry/rate-driving behavior.

Record:
- `research/audits/2026-08-08-autogpt-0.0.71-static-analysis.md`

### ChatGPT VoiceBridge 0.2.6

Verified strengths:
- low-privilege standard DOM content script on all ChatGPT routes, including `/g/...`;
- MutationObserver-based assistant/generation observation;
- SPA route-change awareness;
- multi-tab content/background communication;
- visible stop-button generation state detection;
- local debug infrastructure;
- no ChatGPT internal API interception.

Weakness for orchestration:
- no tab creation;
- no prompt insertion;
- no file attachment;
- no orchestration state machine;
- long-lived one-second background ping is useful for its voice use case but not necessary for initial MYGPT fan-out.

Record:
- `research/audits/2026-08-08-voicebridge-0.2.6-reuse-assessment.md`

### ChatGPT Translation Loop Test 0.5.1

Verified strengths:
- strongest control-plane implementation of the three;
- `chrome.tabs` / scripting / alarms ownership;
- robust prompt runner with native setter / contenteditable handling;
- fail-closed draft protection;
- positive post-submit evidence rather than composer-clear heuristics;
- runToken / serialized mutation guard against stale async operations;
- route/conversation verification;
- bounded operation and safe stop behavior;
- bundled tests; all included `test_*.js` tests pass under Node in this audit.

Weakness for MYGPT:
- current route parser and rotation semantics target Project `g-p-...` routes, not user-created Custom GPT workers;
- text-completion loop is broader than the required three-frame fan-out;
- settings use sync mirroring, which is unnecessary for MYGPT packet/canonical session data.

Record:
- `research/audits/2026-08-08-translation-loop-0.5.1-static-analysis.md`

## Resulting architecture

Use separate modules. Do not merge overlapping code indiscriminately.

```text
MYGPT planner
  -> three copy-ready local packets
        |
        v
MYGPT Worker Fanout extension
  Control plane
    - Translation-Loop-style run token / state machine
    - bounded exactly-three worker slots
    - fail closed on route/draft/state mismatch

  Route / identity adapter
    - VoiceBridge-style generic ChatGPT route observation
    - new Custom-GPT stable-ID parser (not g-p Project parser)
    - verify every tab remains the same worker GPT

  DOM adapter
    - Translation-Loop-style composer detection + native setter
    - AutoGPT-proven visible file-input/DataTransfer technique, clean-room reimplemented
    - visible ChatGPT controls only

  Observer
    - MutationObserver + visible stop-button state
    - no response interception

  Browser coordinator
    - open 3 Custom-GPT tabs
    - bind worker slot F2/F3/F4 to tab IDs
    - attach same canonical independently
    - insert one distinct packet per tab
    - controlled submit

  Session storage
    - local/session only
    - no external telemetry
    - no prompt/canonical sync to browser account
```

## Division of responsibility

### Take from Translation Loop

Primary control-plane concepts:
- `runToken` / stale-operation rejection;
- serialized runtime mutation;
- explicit phases;
- tab ownership;
- route mismatch -> stop;
- draft present -> stop;
- send button not enabled -> stop;
- positive submission evidence;
- one worker failure isolated from the other slots;
- deterministic max-worker count = 3;
- unit-test-first module split.

### Take from VoiceBridge

Observer concepts:
- generic ChatGPT `/g/...` content-script coverage;
- MutationObserver;
- SPA route-change recognition;
- stop-button generation start/end detection;
- lightweight metadata-only debugging;
- no hidden ChatGPT API dependency.

Do not carry over the VoiceBridge speech endpoint into the MYGPT extension.
Do not carry over the one-second persistent ping unless real Vivaldi background-tab behavior proves it necessary.

### Learn from AutoGPT

Clean-room reimplement only these user-visible UI primitives:
- new/fresh ChatGPT worker navigation;
- `input[type=file]` attachment through a browser `File` object and `DataTransfer`;
- normal composer insertion;
- normal send-button activation.

Do not copy bundled/minified AutoGPT source into the MYGPT repository.
Do not reuse its internal API/token/output-extraction path.

## Custom GPT handling

Custom GPT remains the worker boundary.

The extension must derive the current worker identity from the user-opened `MYGPT Single Frame Worker Test` page and store a normalized Custom-GPT root/stable ID for the current run.

Do not use the Translation Loop Project parser unchanged.

First implementation test:
1. user opens the worker GPT manually;
2. extension captures its normalized `/g/...` identity;
3. extension opens one new tab from that worker identity;
4. content script reports the resulting route;
5. PASS only if the same Custom-GPT identity remains present;
6. no prompt is sent in this first test.

Only after this passes may three-tab fan-out be enabled.

## Canonical handling

Goal:
- user selects the canonical once in the extension UI for one run;
- the extension recreates a `File` for each worker and supplies it to ChatGPT's own visible file input;
- no external upload service;
- no generated frame becomes canon.

Storage rule:
- canonical bytes and packets are ephemeral/local for the current run;
- clear them on explicit reset/completion;
- do not mirror to `chrome.storage.sync`.

Exact transport mechanism between extension UI/background/content script must be implemented and tested against the actual canonical file size before finalizing storage representation.

## Submission policy

Initial version should support two modes:

### Gate mode — first live tests
- open tab;
- verify worker identity;
- attach canonical;
- insert packet;
- **do not submit automatically**;
- user visually confirms all three prepared tabs.

### Controlled-submit mode — only after Gate mode PASS
- require all three slots to be READY;
- send each through visible ChatGPT send controls;
- verify positive evidence that each user turn was committed / generation started;
- if any tab fails before commit, stop that slot without duplicating sends on the others;
- no auto retry in v0.1.

## Completion / output policy

The first operational milestone does not need to scrape or download generated outputs.

Do not implement:
- backend response parsing;
- image URL extraction;
- automatic download;
- hidden token/API access.

Visible image results remain user-reviewed and user-saved.

If later automation of post-generation handling is requested, it requires a separate design/terms review and separate acceptance gate.

## Permission target

Aim for a narrow Manifest V3 surface:
- `storage`
- `tabs` only if needed for reliable tab identity/coordinator behavior
- `scripting` only if needed for already-open-tab injection / recovery
- host permissions limited to ChatGPT domains

Do not request:
- `downloads`
- `declarativeNetRequest`
- broad all-sites host access

Avoid `alarms` unless a real watchdog need appears; for the stated few-hours-per-day three-worker workflow, event-driven tab/content messages should be sufficient initially.

## What is explicitly not being merged

- AutoGPT membership/telemetry layer;
- AutoGPT security-header rules;
- AutoGPT internal ChatGPT API logic;
- Translation Loop's automatic arbitrary multi-chat continuation loop;
- Translation Loop Project `g-p` route model;
- VoiceBridge speech network path;
- VoiceBridge continuous one-second monitor ping;
- any generated-output scraper.

## Implementation order

1. create a separate `MYGPT Worker Fanout` extension; do not modify the two working local add-ons first;
2. implement Custom-GPT route normalization + one-tab open/verify;
3. implement packet insertion without submit;
4. implement one-time canonical selection + one-tab attachment;
5. combine attachment + packet preparation in one tab;
6. fan out to exactly three tabs, still no auto-submit;
7. run the non-generation isolation check;
8. add controlled submit using Translation-Loop-style positive evidence;
9. invoke one known static image packet;
10. only after single-slot PASS, invoke all three workers;
11. keep output saving/manual review outside the extension for v0.1.

## Current decision

**Yes: the correct path is a three-way synthesis, not selecting one extension wholesale.**

Primary control plane: Translation Loop concepts.
Primary DOM observer: VoiceBridge concepts.
Missing file/new-chat primitives: clean-room reimplementation informed by AutoGPT behavior.

This gives the shortest path to fan-out while preserving the production-v0 worker isolation and avoiding the invasive mechanisms found in the full AutoGPT product.
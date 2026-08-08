# CURRENT decision — stripped AutoGPT ChatGPT engine + Translation Loop + VoiceBridge

Date: 2026-08-09 JST
Status: **CURRENT / supersedes visible-UI-only AutoGPT reuse verdict**

## Decision

For MYGPT browser orchestration, do not continue treating AutoGPT 0.0.71 as a source of only a few visible UI ideas.

The supplied 0.0.71 build has now been deeply traced. Its ChatGPT implementation is a layered automation engine whose mature ChatGPT-specific mechanisms are useful beyond the surface DOM layer.

Current implementation direction:

```text
stripped AutoGPT ChatGPT engine
  + Translation Loop control plane
  + VoiceBridge lifecycle/DOM observation
```

## Strip from AutoGPT

Remove product/external-service layers that are unrelated to local MYGPT orchestration:

- Google Analytics;
- membership / entitlement checks;
- account email export to Autojourney services;
- external prompt translation / optimization;
- imgbb and unrelated provider upload paths;
- unrelated generation-provider adapters;
- marketing / plan / gallery product UI not needed by MYGPT.

## Retain / adapt from AutoGPT

- ChatGPT unified-composer handling;
- visible image-mode switching;
- `DataTransfer -> input.files -> change` attachment;
- ChatGPT upload-ready predicate;
- ChatGPT-specific synthetic-paste prompt insertion;
- visible new-chat operation;
- per-send nonce;
- observer-before-trigger sequencing;
- bounded rate-limit/backpressure logic;
- passive conversation fetch cloning for positive commit evidence;
- passive `ws.chatgpt.com` async observation.

## Optional, requirement-driven AutoGPT layers

Keep available as separately gated mechanisms rather than deleting conceptually:

- visibility/focus compatibility shim for Vivaldi hidden-tab stalls;
- Bearer capture/storage;
- direct internal conversation polling;
- direct file-download metadata resolution;
- automatic output extraction/download.

The first two groups are not inseparable. Passive fetch/WS observation can be reused without automatically adding active internal requests.

## Translation Loop responsibility

Use directly/adapt strongly:

- `runtime_guard`;
- runToken;
- serialized mutation;
- tab ownership;
- stale async rejection;
- fail-closed lifecycle;
- orchestration state machine;
- existing tested send/verification concepts where they remain stronger than AutoGPT's equivalent.

## VoiceBridge responsibility

Use directly/adapt strongly:

- SPA route observation;
- MutationObserver lifecycle observation;
- generation start/end DOM signals;
- long-lived tab/background monitoring where useful;
- empirical Vivaldi hidden-tab behavior handling.

## Reference source

Implementation lookup:

- `research/reference/2026-08-09-autogpt-0.0.71-internal-structure-map.md`

Architectural analysis:

- `research/audits/2026-08-09-autogpt-0.0.71-deep-architecture-analysis.md`

## Superseded wording

Older documents may say:

- AutoGPT should contribute only visible UI primitives;
- all fetch observation should be excluded categorically;
- visibility/focus behavior has no value;
- AutoGPT retry logic is uncontrolled.

Those statements are superseded by the detailed 2026-08-09 analysis.

Future work must consult this decision and the internal structure map before reopening the original AutoGPT archive or reimplementing a mechanism from scratch.
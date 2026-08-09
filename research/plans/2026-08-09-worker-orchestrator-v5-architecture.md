# Worker Orchestrator v5 — architecture start

Date: 2026-08-09 JST
Status: **IMPLEMENTATION START / BRANCH-FIRST ARCHITECTURE**

## Goal

Start a new Worker Orchestrator line without mutating the live-proven v0.4.4/v0.4.5 baseline on `main`.

The motivation is not only selected-folder permission handling. Future work may require a different conversation lifecycle:

```text
Instant preparation
-> branch conversation
-> switch branch to Thinking
-> generate in branch
```

That should not be implemented as a large set of conditional branches inside the proven fresh-chat fanout state machine.

## Architecture rule

Treat **conversation/session creation strategy** as a replaceable layer.

Initial strategies:

- `fresh-chat`
  - current proven behavior;
  - uses the existing v0.4.x fanout engine;
- `branch-thinking`
  - reserved future strategy;
  - not implemented or selectable for production yet.

## v5 compatibility approach

Do not rewrite the successful primitives.

Reuse unchanged unless new evidence requires otherwise:

- AutoGPT `DataTransfer -> input.files -> change` attachment;
- MAIN-world synthetic paste;
- Translation Loop native send click;
- observer-before-trigger ordering;
- positive submit evidence;
- runToken / stale async guard;
- passive completion monitoring;
- v0.4.5 image recovery;
- selected-folder relocation write/verify logic.

The current v0.4.x background engine is exposed as a `fresh-chat` compatibility engine. A new orchestration router owns v5 run requests and chooses a session strategy.

## Output permission ordering

Use the Chrome / VS Code Web permission pattern already recorded in:

- `research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md`

For a selected custom directory, the popup performs permission preflight from the user's Run click:

```text
Run click
-> queryPermission({mode:"readwrite"})
-> if prompt: requestPermission({mode:"readwrite"})
-> denied/error: abort before any worker generation starts
-> granted: start selected session strategy
```

The post-run `PERMISSION_REQUIRED` path remains only as a defensive fallback if permission changes during a long run.

## Why this is Branch-friendly

OpenAI's Branch feature creates a separate chat continuing from an earlier point. Therefore future automation should model a worker as a **conversation session**, not only as a tab opened at the Custom GPT base URL.

A future `branch-thinking` engine can implement its own lifecycle:

```text
create/prepare parent session under Instant
-> establish required canonical/context without image generation
-> branch from the intended message/turn
-> verify branched chat identity/context
-> switch branch to Thinking
-> submit image-generation packet
-> hand resulting tab/conversation back to the same monitor/recovery layers
```

The fresh-chat engine remains intact while the new engine is developed and tested independently.

## Acceptance for first v5 build

- new extension line is isolated from main v0.4.x baseline;
- manifest identifies v5 separately;
- popup Run performs custom-directory permission preflight before starting fanout;
- denied permission starts zero worker generations;
- `fresh-chat` routes to the existing proven engine;
- `branch-thinking` exists only as a reserved strategy and cannot accidentally run;
- generation/recovery primitives remain unchanged.

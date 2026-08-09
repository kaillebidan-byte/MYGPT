# Post-image critic trigger — explicit follow-up turn

Date: 2026-08-10 JST
Status: **CURRENT RUNTIME DECISION / G1a-1 SUPERSEDES AUTO-CONTINUATION ASSUMPTION**

## Evidence

POSTGEN-G1a-1 under Instant produced the requested image but no `POSTGEN_AUDIT` assistant body text.

DOM evidence contained the generation turn but no audit marker.

Record:
- `research/experiments/2026-08-10-postgen-g1a1-manual-result.md`

## Decision

Do not design the quality loop around an assumption that native image generation automatically continues into ordinary assistant text in the same user turn.

The next supported architecture is:

```text
user pose request
-> image generation
-> IMAGE_READY
-> bind/capture candidate image
-> explicit second user turn: audit request
-> dialogue model critic
-> structured audit JSON
-> ACCEPT / RETRY_REQUIRED
```

The second user turn may later be sent automatically by Worker Orchestrator; it is still a normal explicit conversation turn, not hidden same-turn continuation.

## Why this fits the existing architecture

The browser extension already has proven primitives for:
- waiting for generation completion;
- sending text to a Custom GPT conversation;
- positive submit evidence;
- reading assistant DOM state;
- recovering the generated image.

Therefore a post-image critic does not require a new model-side continuation mechanism.
It can be orchestrated as a deterministic second turn after the image candidate is fixed.

## Critical ordering

Do not send the audit turn before binding the generated image.

Current collector uses the latest assistant turn. Once an audit assistant turn exists, generic `latest assistant` lookup may no longer point at the generation turn.

Future ordering should be:

```text
GENERATION_COMPLETE
-> identify/bind generation turn and candidate image
-> persist candidate metadata/source
-> AUDIT_REQUEST_SUBMITTED
-> wait for audit response
-> parse structured audit
```

Only after this ordering is live-proven should recovery/output be integrated with the audit state machine.

## Immediate manual gate

Before extension code changes, use the already-completed G1a-1 conversation and send one explicit second user message requesting audit only.

Exact prompt is stored in the current G1 user procedure/addendum.

PASS if:
- no second image generation occurs;
- dialogue model returns the structured audit;
- it can inspect the canonical, requested pose, and immediately preceding generated image in conversation context.

## Actions / Code Interpreter

Still later.

First prove the plain dialogue critic on the explicit second turn.
Then test:
1. narrow read-only Action from that audit turn;
2. Code Interpreter file access from that audit turn.

Do not combine these variables before the plain second-turn critic passes.

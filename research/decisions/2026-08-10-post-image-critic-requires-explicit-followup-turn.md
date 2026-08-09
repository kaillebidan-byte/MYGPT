# Post-image critic trigger — explicit follow-up turn / Branch Thinking critic

Date: 2026-08-10 JST
Status: **CURRENT RUNTIME DECISION / BRANCH-THINKING CRITIC SINGLE-RUN LIVE PASS**

## Evidence 1 — same-turn auto-continuation failed

POSTGEN-G1a-1 under Instant produced the requested image but no `POSTGEN_AUDIT` assistant body text.

DOM evidence contained the generation turn but no audit marker.

Record:
- `research/experiments/2026-08-10-postgen-g1a1-manual-result.md`

Decision from that result:
- do not assume native image generation automatically continues into ordinary assistant text in the same user turn.

## Evidence 2 — Branch -> Thinking critic succeeded

User then continued from the image-bearing context through a Branch under Thinking.

Thinking returned ordinary text only:

```text
POSTGEN_AUDIT {"identity_obvious_drift":false,"pose_obvious_error":false,"topology_obvious_error":false,"verdict":"PASS"}
```

No new image generation occurred.

DOM evidence showed the image-bearing assistant turn and later audit assistant turn as distinct turns; the audit turn contained zero images.

Record:
- `research/experiments/2026-08-10-postgen-branch-thinking-critic-result.md`

Important boundary:
- **Thinking as critic: single-run LIVE PASS**;
- **Thinking as image generator: still not stably understood / not proven**.

## Current architecture candidates

### Route A — parent Instant explicit follow-up critic

```text
user pose request
-> Instant image generation
-> IMAGE_READY
-> bind/capture candidate image
-> explicit second user turn in same parent conversation
-> Instant dialogue critic
-> structured audit JSON
```

Status:
- next direct comparison;
- simpler to automate than Branch/model switching if it works well.

### Route B — Branch -> Thinking critic

```text
user pose request
-> Instant image generation
-> IMAGE_READY
-> bind/capture candidate image in parent
-> Branch from image-bearing context
-> switch branch to Thinking
-> audit-only request
-> Thinking structured audit JSON
```

Status:
- single-run LIVE PASS;
- promising because parent generation conversation can remain image-terminal while audit text lives in the branch.

## Branch -> Thinking generation is a separate problem

Do not conflate critic success with Thinking image-generation success.

The user reports that a stable method for making Thinking perform image generation is still unknown.

For the identity-quality pipeline, this is not currently blocking because generation can remain on the proven Instant path and Thinking can be evaluated only as a critic.

## Critical image-binding ordering

Do not submit an audit before the generated image is bound.

Current collector uses the latest assistant turn. The Branch Thinking DOM evidence directly proves that the later audit turn may contain no image.

Required ordering for any closed-loop implementation:

```text
GENERATION_COMPLETE
-> identify/bind generation turn and candidate image
-> persist candidate metadata/source or keep parent tab/image turn reference
-> submit audit request (same chat or branch)
-> wait for audit response
-> parse structured audit
```

The live v0.5.0 collector remains unchanged until a critic route is selected and a separate experimental extension line is created.

## Immediate next gate

Use the **same already-generated candidate** to compare Route A against the successful Route B.

Return to the parent Instant conversation and send the same audit-only second-turn prompt.

This avoids generation stochasticity:

```text
same candidate
A: parent Instant explicit follow-up critic
B: Branch -> Thinking critic (single-run PASS)
```

Decision rule:
- if Instant same-chat critic works and is sufficiently accurate, prefer it initially for automation simplicity;
- if it fails or is materially weaker than Thinking/human review, prefer Branch -> Thinking as the critic path.

## Actions / Code Interpreter

Still later.

First choose/validate the plain dialogue critic route.
Then test:
1. narrow read-only Action from the chosen audit turn;
2. Code Interpreter file access from that audit turn.

Do not combine these variables before the critic transport/model route is selected.

# POSTGEN — Branch -> Thinking critic live result

Date: 2026-08-10 JST
Status: **SINGLE-RUN LIVE PASS — CRITIC ONLY / THINKING IMAGE GENERATION NOT PROVEN**

## Context

This result continues POSTGEN-G1 after the Instant same-turn auto-audit attempt failed.

Previous result:
- Instant image generation succeeded;
- the same user turn did **not** automatically continue into `POSTGEN_AUDIT` text;
- therefore auto-continuation inside the generation turn was rejected as an architecture assumption.

Record:
- `research/experiments/2026-08-10-postgen-g1a1-manual-result.md`

## New user live evidence

The already-generated image/context was taken into a Branch and the branch was run under Thinking.

Thinking returned ordinary text only:

```text
POSTGEN_AUDIT {"identity_obvious_drift":false,"pose_obvious_error":false,"topology_obvious_error":false,"verdict":"PASS"}
```

No new image generation occurred in the Thinking response.

User explicitly notes:
- a stable way to make Thinking perform image generation is still unknown;
- this run therefore proves **critic behavior only**, not Thinking image-generation reliability.

## DOM evidence supplied by user

Observed filtered turn list:

```text
0: user pose request, images: 1
1: assistant generation/branch source, text includes branch marker, images: 3
2: branch user turn, images: 1
3: assistant POSTGEN_AUDIT text, images: 0
```

The important structural fact is that the audit exists in a later assistant turn with **zero images**, while the generated image remains in an earlier assistant turn.

## Confirmed

1. Branch context can retain enough prior visual/conversation state for Thinking to emit a structured audit over the already-generated candidate in this observed run.
2. Thinking can act as a **text-only post-image critic** without invoking image generation.
3. Image-generation turn and audit turn are distinct DOM turns.
4. A generic `latest assistant turn` image lookup is therefore unsafe after audit text exists.
5. Thinking image generation is not needed for this critic architecture.

## Not confirmed

- reproducibility across multiple Branch -> Thinking critic runs;
- whether the audit verdict is more human-aligned than Instant same-chat critique;
- stable browser automation selectors for Branch creation and model switching;
- stable Thinking image generation;
- generated image byte/file access to Code Interpreter or Actions.

## Architectural implication

Split Branch -> Thinking into two separate concepts:

### A. Branch -> Thinking as generation strategy

Status: **DEFERRED / UNPROVEN**.

Stable Thinking image generation is still unknown.
Do not make it a production generation dependency.

### B. Branch -> Thinking as critic strategy

Status: **SINGLE-RUN LIVE PASS / PROMISING**.

Candidate flow:

```text
Instant isolated generator
-> generated image becomes IMAGE_READY
-> bind/capture candidate in parent conversation
-> Branch from the image-bearing context
-> switch branch to Thinking
-> send audit-only request
-> Thinking returns structured text audit
-> no image generation in critic branch
```

This is attractive because the parent Instant generation conversation can remain image-terminal while the branch carries later audit text.

## Collector consequence

The current `image_collector.js` searches the latest assistant turn for an image.

This result gives direct runtime evidence that a later audit turn can contain zero images.

Therefore any closed-loop implementation must bind the candidate **before** audit submission, or keep recovery pointed at the parent generation conversation while the audit occurs in a branch.

Do not patch the live v0.5.0 collector yet; implement this only in an experimental extension line after the critic route is selected.

## Best next comparison

Do not generate another image yet.
Use the exact same parent Instant candidate and compare critic routes:

```text
same candidate
A: parent Instant -> explicit second-turn audit
B: Branch -> Thinking -> audit (this run = PASS)
```

This isolates critic/session/model behavior from generation stochasticity.

If parent Instant also returns the structured audit, prefer the simpler same-chat route initially unless Thinking materially improves audit quality.
If parent Instant fails or is visibly weaker, Branch -> Thinking becomes the stronger critic candidate.

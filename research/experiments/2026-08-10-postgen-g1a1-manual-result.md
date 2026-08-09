# POSTGEN-G1a-1 manual runtime result

Date: 2026-08-10 JST
Status: **FAIL — IMAGE GENERATED / NO POSTGEN_AUDIT TEXT**

## Purpose

Characterize whether the tested Instant Custom GPT path resumes the dialogue model after native image generation when the worker Instructions explicitly require a post-image structured text audit.

This is a runtime-boundary experiment. It is not an identity-quality A/B.

## Experimental worker

`MYGPT Single Frame Worker POSTGEN G1`

G1a settings:
- Instant path
- Image Generation ON
- Web OFF
- Code Interpreter & Data Analysis OFF
- Actions NONE
- Knowledge NONE
- production worker left unchanged

Instructions required:

```text
image generation
-> no second image generation
-> emit exactly one POSTGEN_AUDIT {...} text line
-> stop
```

## Fixed test pose

R2-B — clear shallow forward inclination.

Reason for selection:
- historical R2-B first-pass PASS for torso pose, planted feet, passive arms, broad identity/topology;
- avoids the known R1-B spatial failure and R2-C first-pass endpoint/expression failure.

## User live evidence

Observed output:
- image generation succeeded;
- one generated portrait image was returned;
- no normal assistant body text containing `POSTGEN_AUDIT` appeared after generation;
- no autonomous second image generation was reported.

User description:

```text
画像生成のみで本文無
```

## DOM observation supplied by user

Console result contained two filtered conversation turns:

```text
0: { index: 0, text: <R2-B user prompt>, images: Array(1) }
1: { index: 1, text: "編集", images: Array(3) }
```

No returned turn contained `POSTGEN_AUDIT`.

Interpretation of DOM evidence:
- the assistant/image turn exists;
- its visible extracted text is only `編集` UI text;
- the requested post-image audit marker is absent;
- therefore this run does not show dialogue-model continuation after the image tool result.

Do not infer from `Array(3)` that three generated outputs existed; the query counted image elements within the turn and can include non-output/UI image elements. The decisive evidence is the absence of the audit marker and visible body text.

## G1a-1 verdict

**FAIL.**

PASS required all of:
- exactly one image generation;
- post-image audit text without another user message;
- no autonomous repair generation;
- observable image/audit turn relationship.

The second condition failed.

## Consequence

Do **not** proceed to G1a-2 Worker Orchestrator compatibility yet.

Reason:
- G1a-2 was intended to test collector compatibility with a worker that actually emits post-image audit text;
- that prerequisite behavior did not occur in G1a-1;
- running the orchestrator now would only reconfirm the existing image-only baseline and would not test the new boundary.

Do not patch `image_collector.js` or terminal state logic from this result. The predicted latest-assistant-turn failure did not occur because no later audit turn was created.

## Revised runtime conclusion

Previous project evidence remains:
- the user has separately observed an Instant path where a dialogue model can be invoked after image generation.

New evidence adds:
- **Instructions alone, in this G1a configuration, were insufficient to force that post-image continuation.**

Therefore the next question is no longer `same turn or separate turn?`.
It is:

> What trigger/mechanism caused the previously observed post-image dialogue-model invocation, and can that trigger be reproduced deterministically in a Custom GPT worker?

Candidate distinctions to isolate next:
- automatic continuation from Instructions only;
- explicit tool/Action continuation;
- Code Interpreter continuation;
- a separate assistant/tool orchestration path used in the prior successful observation;
- user-follow-up continuation versus same-user-turn continuation.

Do not assume which one is responsible until the prior successful case is reconstructed or a controlled trigger succeeds.

## Frozen boundaries

Remain unchanged:
- production worker;
- Worker Orchestrator v0.5.0;
- canonical identity source;
- one-pose isolation;
- fresh retry architecture;
- collector/recovery/output code.

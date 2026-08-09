# Identity quality — closed-loop direction

Date: 2026-08-09 JST
Status: **CURRENT QUALITY-RESEARCH DIRECTION / PRODUCTION BASELINE UNCHANGED**

## Decision

The next identity-quality work will not treat image generation as a terminal one-shot operation.

Use the newly observed Instant runtime capability:

```text
image generation
-> dialogue model resumes after image generation
```

as a **post-image critic stage**.

Combine it with the earlier isolated-worker identity plan:

```text
same original canonical
+ one worker-local pose/structure condition
+ minimal local text
-> isolated candidate
-> post-image structured critic
-> ACCEPT or RETRY_REQUIRED
-> retry, if needed, in a NEW isolated worker from the ORIGINAL canonical
```

The current v0.5.0 production/fresh-chat path remains the control baseline. Do not mutate its proven worker Instructions yet.

Detailed evidence/research:
- `research/experiments/2026-08-09-post-image-dialogue-audit-loop-reassessment.md`
- `research/prior-art/2026-08-09-identity-preserving-variation-isolated-workers.md`

## Why this replaces the earlier one-way quality plan

Before the post-image dialogue observation, the feasible pipeline was mainly:

```text
generate independent candidate(s)
-> external/browser-side selection
```

Now the same isolated generation can expose a structured diagnostic stage immediately after the image tool returns.

This enables:
- identity defect localization;
- pose-compliance diagnosis;
- versioned audit-policy lookup;
- Action calls after generation;
- targeted retry packets;
- optional machine metrics once image-byte transport is proven.

## Reuse, not reinvention

Evaluation/critic design should adapt existing work:

1. DreamBench++
   - separate concept preservation from prompt following;
   - reuse its human-aligned GPT/VLM evaluation structure/code where useful.

2. Beyond the Pixels
   - hierarchical feature-level identity comparison rather than vague whole-image similarity.

3. EditRefiner
   - perception -> reasoning -> localized action -> evaluation loop.

4. MaSC
   - official pip-installable foreground-masked identity metric;
   - especially compatible with MYGPT because chroma output makes concept masks easy.

5. Existing MYGPT chroma scripts
   - `audit/scripts/remove_chroma_key.py` can produce transparent foreground/mask information;
   - `machine_audit_board.py` remains mechanical-only and is not promoted to identity evaluation.

## Actions role

First Action integration should **not depend on sending image bytes**.

Preferred narrow API surface:

```text
getAuditPolicy(version)
recordAudit(run_id, slot_id, candidate_id, audit_json)
getRetryPolicy(failure_codes)
```

Purpose:
- keep versioned rules/scripts in durable external state;
- avoid copying large audit logic into Custom GPT Instructions;
- keep repository/tool context out of the generation-facing stage;
- make audit records machine-readable.

Only add an image-metric Action such as `runIdentityMetric(...)` after image transport is separately proven.

## Code Interpreter role

Potentially useful post-image, but not assumed yet.

Gate:
- verify generated image is actually accessible to Code Interpreter after native image generation.

If yes:
- run local deterministic mask/mechanical scripts;
- possibly reuse lightweight external evaluation packages.

If no:
- use dialogue visual audit + narrow Actions first;
- run heavy metrics on an external service fed by browser-orchestrator image bytes later.

## Same-worker critic is diagnostic, not autonomous controller

Do not allow:

```text
generate
-> self-critique
-> edit same candidate
-> self-critique
-> edit again
-> ...
```

as an unbounded same-chat loop.

Reasons:
- multi-round image editing accumulates drift;
- naive visual self-correction can degrade;
- it would weaken the proven canonical-reset architecture.

Instead:
- post-image model emits structured audit;
- browser orchestrator owns PASS/FAIL and retry count;
- failed candidate is not the identity source for retry.

## Independent judge is preferred if self-audit is biased

Future judge architecture:

```text
generator worker
-> candidate capture/recovery
-> non-generating judge GPT
   receives canonical + candidate
-> structured identity verdict
```

A separate judge can use:
- Image Generation OFF;
- Code Interpreter optional;
- read-only/narrow Actions;
- fixed audit schema.

Because the judge does not generate, multiple comparison images do not create the generation-time 2x2/sheetification risk.

## Browser-orchestrator gate before implementation

The current collector assumes the desired generated image is in the **latest assistant turn**.

Before post-image audit is added, run `POSTGEN-G1`:
- observe whether image and final audit text are in one assistant turn or separate turns;
- determine when terminal monitoring marks COMPLETE;
- confirm current image collector still captures the generated image.

Do not patch collector/terminal logic until this runtime evidence is captured.

If needed, future slot state becomes:

```text
GENERATING
-> IMAGE_READY
-> AUDITING
-> ACCEPTED / RETRY_REQUIRED
```

rather than treating image completion as final acceptance.

## Experiment order

1. `POSTGEN-G1` — observe post-image turn/tool structure under Instant.
2. `ID-V1 + SELF-AUDIT` — current wording vs explicit canonical edit/source wording.
3. `ID-V2 + SELF-AUDIT` — canonical + one worker-local pose guide.
4. independent judge A/B vs same-worker audit and human review.
5. MaSC / DreamBench++ machine-metric reuse after image transport gate.
6. best-of-2 only for hard frames or failed first pass.
7. Branch -> Thinking remains later; revalidate post-image dialogue/tool behavior there separately.

## Frozen boundaries

Until new failure evidence exists:
- same original canonical for every generation;
- one pose/state per generation-facing worker;
- no F2 -> F3 -> F4 image chaining;
- no multi-pose sheets/guides exposed to generator;
- v0.5.0 attachment/paste/send/recovery/output baseline remains unchanged;
- retry uses fresh isolated worker.

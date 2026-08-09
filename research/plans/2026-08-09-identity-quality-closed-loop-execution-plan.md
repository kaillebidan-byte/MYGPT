# Identity quality closed-loop — gated execution plan

Date: 2026-08-09 JST
Updated: 2026-08-10 JST
Status: **CURRENT QUALITY PLAN / TEMPORARILY DEFERRED BY THINKING IMAGE-GENERATION ROUTE GATE**

## Temporary priority override — 2026-08-10

This remains the source of truth for the identity-quality phases, sample design, evaluator progression and stop conditions **after runtime routing is settled**.

It is **not** the current immediate execution plan.

The user-prioritized CURRENT focused gate is:
- `research/plans/2026-08-10-custom-gpt-thinking-imagegen-route-matrix.md`

Immediate NEXT ONLY is currently:
- **T1 — same-chat warm Instant seed -> switch same chat to Thinking/reasoning -> R2-B image request, no Branch**.

Reason:
- historical N2 proved one Thinking image-generation success but confounded clean Instant seed, delayed model switch and Branch;
- those route variables must be isolated before browser automation or identity-quality A/B work resumes.

Resume this identity-quality plan only after the focused Thinking route gate reaches one of its stop conditions:
1. a Thinking generator route reaches the pragmatic repeatability screen and is selected; or
2. no route reaches that screen and production remains `Instant generator -> Thinking critic/reasoner`.

Historical POSTGEN-G1 findings are retained below as evidence, but `POSTGEN-G1` is no longer NEXT ONLY.

## Goal

Build a repeatable pipeline that produces pet-feature-like visual variations from one canonical character image while preserving identity across pose/state changes.

The plan assumes the following live-proven base:

- original canonical is the sole identity source;
- F2/F3/F4 are generated in isolated Custom GPT conversations;
- each generator sees only the canonical + its own one-pose packet;
- generated frames are never chained as identity sources;
- Worker Orchestrator v0.5.0 fresh-chat generation/recovery/output is LIVE PASS;
- selected-folder output is already solved;
- Instant image generation is the current production generator;
- post-image same-turn automatic audit did not occur in G1a-1;
- Branch -> Thinking has produced a text-only structured critic result on an already-generated image;
- historical N2 produced one native Thinking image-generation success through a clean-seed Branch route, but route causality/repeatability remain unresolved.

The plan deliberately separates:

```text
identity conditioning
pose / structure conditioning
post-image diagnosis
machine evaluation
retry / selection
execution strategy
```

Do not change more than one layer at a time.

Related current decision:
- `research/decisions/2026-08-09-identity-quality-closed-loop-direction.md`

Runtime reassessment:
- `research/experiments/2026-08-09-post-image-dialogue-audit-loop-reassessment.md`
- `research/experiments/2026-08-10-postgen-g1a1-manual-result.md`
- `research/experiments/2026-08-10-postgen-branch-thinking-critic-result.md`

Prior art:
- `research/prior-art/2026-08-09-identity-preserving-variation-isolated-workers.md`

---

## Global frozen boundaries

Until a specific gate produces contrary evidence, keep all of these unchanged:

- original canonical remains the only identity authority;
- one pose/state per generation-facing worker;
- no F2 -> F3 -> F4 generated-image chaining;
- no multi-pose board/sheet/sequence context in generator;
- no generated character sheet or generated multiview promoted to canonical;
- fresh isolated retry always restarts from original canonical;
- current v0.5.0 attachment / paste / native-send / submit-evidence / completion-monitor / image-recovery / output-relocation primitives remain untouched;
- current production worker remains the control and is not edited for experiments;
- post-image critic may diagnose, but it does not autonomously enter an unlimited same-chat regenerate/edit loop.

Experimental changes belong in cloned experimental GPTs and, if browser code is later required, a separate development branch/version.

---

# Historical Phase 0 — freeze control and create experimental audit worker

## Purpose

Create an experimental surface without contaminating the current LIVE PASS control.

## Control worker

Keep current production/control worker unchanged:

`MYGPT Single Frame Worker Test`

Validated control characteristics:
- Instant
- Image Generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Knowledge NONE

## Experimental worker

`MYGPT Single Frame Worker POSTGEN G1` was created for the post-image runtime test.

Historical G1a-1 result:
- image generation succeeded;
- automatic `POSTGEN_AUDIT` text did not appear in the same user turn;
- therefore same-turn automatic continuation is not a valid architecture assumption.

This phase is evidence, not the current next action.

---

# Historical Phase 1 — POSTGEN-G1 runtime characterization

POSTGEN-G1 established two useful facts:

1. Instructions alone did not force ordinary assistant audit text after native image generation in the same user turn.
2. A later Branch -> Thinking path could inspect the already-generated image and return structured `POSTGEN_AUDIT` text without generating another image.

It also exposed the browser-side constraint that an audit-only assistant turn can become later than the image-bearing assistant turn, so a future audit integration must bind the generation turn/image before sending the audit request.

Potential future states remain:

```text
GENERATING
-> IMAGE_READY
-> AUDITING
-> ACCEPTED / RETRY_REQUIRED
```

Do not patch the current v0.5.0 collector/state machine during the manual Thinking route gate.

---

# Phase 2 — ID-V1: canonical edit/source wording + structured audit

Priority after runtime route selection: **P1**

## Hypothesis

Explicitly framing the canonical as the **source image to preserve/edit**, rather than only a semantic character reference, improves identity preservation while allowing the requested pose change.

## Conditions

A — control wording:
- current canonical-reference generation semantics.

B — edit/source wording:
- preserve this exact source character;
- change only the requested pose/state;
- preserve materials, markings, proportions, clothing topology and unspecified regions.

Everything else remains identical.

## Test poses

Use two known-different stress classes to avoid optimizing for one motion only:

1. known-hard limb/sleeve/hand pose from the R1 class;
2. torso-dominant shallow-bow pose from the R2 class.

## Sampling

Initial screen:
- 2 independent isolated candidates per condition per pose;
- total initial candidates: 8.

If the result is ambiguous:
- add one more independent candidate only to the ambiguous condition/pose cell;
- do not automatically triple every test.

## Audit dimensions

Keep identity and pose separate.

Identity fields:
- face / eye character;
- hat / hair boundary;
- chest motif;
- active sleeve structure;
- active sleeve opening;
- gold trim;
- grey lining;
- non-active sleeve;
- waist medallion;
- cords / tassels / attachment topology;
- lower garment;
- shoes;
- body proportions.

Pose fields:
- requested limb/torso state;
- anatomical side;
- hand orientation where visible;
- required landmark spacing;
- occlusion/topology compliance.

## Evaluators

At first:
- selected dialogue critic route if accepted;
- human review remains acceptance authority.

Do not add MaSC or a new judge GPT yet unless needed to resolve a disagreement.

## Decision rule

Adopt edit/source wording only if it improves identity fidelity without a material loss in pose compliance across more than one stress class.

If B improves one pose but harms the other, do not globally replace the control wording; classify when edit-source framing helps.

---

# Phase 3 — ID-V2: one worker-local visual pose/structure guide

Priority: **P2**

Run only if text-only pose conditioning remains a material source of failures after ID-V1.

## Hypothesis

Separating identity and pose into distinct visual channels improves pose/occlusion topology without forcing the generator to reinterpret character identity.

## Input architecture

Each generation gets only:

```text
original canonical = identity/global appearance
ONE guide = current worker's pose/structure only
short local text = disambiguation only
```

Never provide:
- all F2/F3/F4 guides together;
- sequence labels;
- board/sheet layout;
- previous generated frames.

## Guide hierarchy

Test the least semantically rich guide first:

1. minimal skeleton / key joints;
2. only if insufficient, silhouette / coarse body blocks;
3. only if necessary, annotated local landmarks.

Do not begin with a fully rendered pose-reference character, because that creates appearance-role ambiguity.

## A/B

A — winning Phase 2 condition, no visual guide.

B — same condition + exactly one local pose guide.

Use the same R1/R2 stress classes.

## PASS criterion

Pose/topology improves while identity remains within the Phase 2 accepted range.

If pose improves but identity degrades, simplify the guide before adding more identity text.

---

# Phase 4 — evaluator separation: same-worker critic vs independent judge GPT

Priority: **P3**

## Purpose

Measure whether the generator's own/post-image critic is systematically optimistic, inconsistent, or blind to defects.

## Judge GPT design

Separate non-generating Custom GPT:

- Image Generation OFF;
- Web OFF by default;
- fixed identity-audit schema;
- narrow Action optional;
- Code Interpreter optional later;
- receives original canonical + candidate image;
- receives target pose text only for pose-compliance evaluation.

Because this GPT does not generate images, canonical + candidate comparison does not create generation-time sheetification risk.

## Comparison set

Reuse already-generated Phase 2/3 candidates rather than generating a fresh dataset first.

For each candidate, record:
- selected dialogue critic verdict;
- independent judge verdict;
- human verdict.

## Adoption rule

Use independent judge as final gate if it tracks human review materially better.

If both are similar, keep the simpler critic for first-line diagnosis and reserve independent judge for ambiguous/hard cases.

---

# Phase 5 — machine metric reuse: MaSC / DreamBench++

Priority: **P4**

Do not start until image transport is solved.

## Transport gate

At least one must be proven:

- generated image is directly usable in post-image Code Interpreter;
- stable file/URL can be passed through an Action;
- browser orchestrator uploads original canonical + recovered candidate bytes to an audit service.

## Reuse order

1. use existing chroma background to create deterministic foreground masks;
2. reuse MaSC for foreground concept-preservation scoring if deployment is practical;
3. reuse DreamBench++ evaluation code/criteria where useful;
4. only then consider a custom local metric for character-specific topology.

Do not turn `machine_audit_board.py` into an identity metric; it remains geometry/chroma-only.

Machine metric is supporting evidence, not the only acceptance signal.

---

# Phase 6 — best-of-2 gated retry for hard frames

Priority: **P5**

Only after an evaluator is trusted.

Default behavior:
- use one candidate first;
- trigger a second independent candidate only when first candidate is `RETRY_REQUIRED`, the frame is a known-hard class, or the judge is uncertain.

Flow:

```text
original canonical + same local target
-> candidate A
-> audit
-> PASS: stop
-> FAIL/UNCERTAIN:
     NEW isolated worker
     original canonical again
     same target + localized failure constraints
     -> candidate B
-> judge A/B if both are viable
-> choose best accepted candidate
```

Never use candidate A as identity input for B.

Initial research cap:
- maximum 2 generated candidates per slot before human/manual review.

---

# Phase 7 — optional canonical-derived local detail reference

Priority: **P6 / only if failures remain localized**

Use only when evidence says one small structure repeatedly drifts despite accepted global identity conditioning.

Allowed reference:
- one lossless crop from the original canonical.

Not allowed:
- generated crop;
- generated multiview;
- multiple simultaneous identity crops by default.

Test one region at a time.

---

# Execution-strategy axis after route selection

Thinking is not an identity-conditioning method. It is a runtime/execution strategy.

The focused route matrix now tests these candidate generator routes before any automation:
- T1 same-chat warm seed -> Thinking;
- T2 clean seed -> Branch -> Thinking;
- T3 Instant image -> retry/regenerate with Thinking;
- T0 direct Thinking only as matched baseline.

If a route becomes repeatable, add it behind the existing session-strategy boundary rather than modifying the proven `fresh-chat` engine.

If no Thinking route reaches the route matrix acceptance screen, retain:

```text
Instant = generator
Thinking = optional critic/reasoner
```

and resume identity-quality work from Phase 2.

---

# Action / GitHub architecture boundary

## Generation-facing stage

Keep repository context out.

Generator receives only:
- original canonical;
- one local pose/structure condition;
- minimal local text.

## Post-image stage

GitHub-backed/versioned audit state may be used through narrow interfaces.

Preferred first endpoints:

```text
getAuditPolicy(version)
recordAudit(run_id, slot_id, candidate_id, audit_json)
getRetryPolicy(failure_codes)
```

Do not expose a broad arbitrary GitHub API to the generation worker when a narrow policy service suffices.

Image-metric endpoints come only after image transport is proven.

---

# Data and evidence format

Every quality experiment should persist, at minimum:

```text
experiment_id
worker/runtime version
canonical identifier
pose packet identifier
conditioning variant
candidate identifier
critic audit JSON
independent-judge JSON if used
machine metric JSON if used
human verdict
final ACCEPT / RETRY_REQUIRED
failure codes
retry packet delta
```

Do not save only prose summaries. Structured evidence is required before automating retries.

---

# Stop conditions

Stop adding complexity when a simpler layer already solves the target reliably.

Examples:
- if ID-V1 materially improves identity and pose is already acceptable, do not force visual pose guides into production;
- if the selected dialogue critic tracks human judgment well, independent judge may remain a hard-case tool;
- if VLM/human evaluation is sufficient, do not add a heavyweight metric just because it exists;
- if one candidate usually passes, best-of-2 remains retry-only;
- if Instant already meets the quality target and no Thinking generator route is repeatable, do not block production on Thinking generation.

The objective is pet-feature-like stable visual variation, not maximal pipeline complexity.

---

# Immediate next action

This plan is temporarily deferred.

Follow:
`research/plans/2026-08-10-custom-gpt-thinking-imagegen-route-matrix.md`

**NEXT ONLY: T1 same-chat warm seed -> Thinking/reasoning, no Branch.**

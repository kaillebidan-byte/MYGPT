# Identity quality closed-loop — gated execution plan

Date: 2026-08-09 JST
Status: **CURRENT EXECUTION PLAN / IMPLEMENTATION NOT STARTED**

## Goal

Build a repeatable pipeline that produces pet-feature-like visual variations from one canonical character image while preserving identity across pose/state changes.

The plan assumes the following live-proven base:

- original canonical is the sole identity source;
- F2/F3/F4 are generated in isolated Custom GPT conversations;
- each generator sees only the canonical + its own one-pose packet;
- generated frames are never chained as identity sources;
- Worker Orchestrator v0.5.0 fresh-chat generation/recovery/output is LIVE PASS;
- under Instant, the dialogue model can resume after image generation;
- selected-folder output is already solved.

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

# Phase 0 — freeze control and create experimental audit worker

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
- stop after image generation

## Experimental worker

Create a clone dedicated to post-image tests.

Initial experimental settings:
- Instant
- Image Generation ON
- Web OFF
- Code Interpreter OFF for the first POSTGEN-G1 run
- one narrow read-only Action may be enabled only for the Action subtest
- no broad GitHub repository access in generation-facing instructions
- same canonical + one local pose only

The only behavioral difference required for POSTGEN-G1 is:

```text
image generation
-> after image is ready, emit one short structured text audit
-> do not generate/edit another image
```

## Exit condition

Experimental worker exists and the production/control worker is unchanged.

---

# Phase 1 — POSTGEN-G1: characterize post-image runtime before changing code

Priority: **P0 / NEXT ONLY**

## Question

What exactly happens in the ChatGPT DOM/runtime when Instant resumes dialogue after image generation?

This gate exists because current `image_collector.js` searches the **latest assistant turn** for the generated image.

## Test input

Use:
- original canonical;
- one already-understood local pose packet;
- no other F2/F3/F4 context;
- no visual pose guide yet;
- no identity prompt experiment yet.

## Post-image audit output

Keep the first audit intentionally short and deterministic, for example a fixed JSON-shaped text object with fields such as:

```text
identity_obvious_drift
pose_obvious_error
topology_obvious_error
verdict
```

The purpose is runtime observation, not high-quality identity scoring yet.

## Required observations

Record all of the following:

1. image generation completes;
2. dialogue model resumes without a second user turn if that is the observed behavior;
3. image and audit text are in the same assistant turn or separate assistant turns;
4. current completion monitor's terminal evidence and timing;
5. current `image_collector.js` result;
6. whether recovered image is still the correct candidate;
7. whether audit text remains available after recovery;
8. if a read-only Action is enabled, whether it can be called after image generation without triggering another image generation;
9. optional later subtest: whether Code Interpreter can access the generated image as a usable file.

## PASS criteria

POSTGEN-G1 passes if:

- image generation succeeds;
- post-image audit text is produced;
- runtime/DOM turn structure is understood;
- generated image can still be deterministically identified/recovered, either by existing collector behavior or by an evidence-backed minimal selector change;
- Action/tool use does not force generator context contamination.

## Failure handling

### Case A — current collector still works

Do not modify collector/state machine.
Proceed to Phase 2.

### Case B — audit becomes a later assistant turn and collector misses image

Patch only the image-turn binding / state boundary in a new extension version.
Do not redesign attachment/paste/send/recovery/output.

Candidate future states only if required by evidence:

```text
GENERATING
-> IMAGE_READY
-> AUDITING
-> ACCEPTED / RETRY_REQUIRED
```

The candidate image must be bound to the generation turn, not generic `latest assistant`.

### Case C — post-image dialogue itself is unstable

Do not build the quality loop around it yet.
Fall back to external/independent judge experiments while preserving current generation baseline.

## Deliverable

Create a dedicated experiment record with:
- exact experimental worker configuration;
- DOM/turn evidence;
- collector evidence;
- Action evidence if tested;
- Code Interpreter evidence if tested;
- PASS/FAIL and next local patch, if any.

---

# Phase 2 — ID-V1: canonical edit/source wording + structured self-audit

Priority: **P1**

Start only after POSTGEN-G1 is understood.

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

For this phase:
- same-worker structured critic;
- human review remains the acceptance authority.

Do not add MaSC or a new judge GPT yet unless needed to resolve a disagreement.

## Decision rule

Adopt edit/source wording only if it improves identity fidelity without a material loss in pose compliance across more than one stress class.

If B improves one pose but harms the other, do not globally replace the control wording; classify when edit-source framing helps.

## Output

One A/B experiment note plus the exact winning/losing packet differences.

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

If pose improves but identity degrades, the guide is too appearance-rich or role binding is unclear; simplify the guide before adding more identity text.

---

# Phase 4 — evaluator separation: same-worker critic vs independent judge GPT

Priority: **P3**

## Purpose

Measure whether the generator's own post-image critic is systematically optimistic, inconsistent, or blind to the same defects it produced.

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
- same-worker critic verdict;
- independent judge verdict;
- human verdict.

## Adoption rule

Use independent judge as final gate if it tracks human review materially better than same-worker self-audit.

If both are similar, keep the simpler same-worker critic for first-line diagnosis and reserve independent judge for ambiguous/hard cases.

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

## Role

Machine metric is supporting evidence, not the only acceptance signal.

Keep dimensions separate:
- identity preservation;
- pose compliance;
- mechanical/background quality.

---

# Phase 6 — best-of-2 gated retry for hard frames

Priority: **P5**

Only after an evaluator is trusted.

## Default behavior

Do not double all generation cost globally.

Use one candidate first.

Trigger a second independent candidate only when:
- first candidate is `RETRY_REQUIRED`;
- the frame belongs to a known-hard class;
- or the judge is uncertain.

## Flow

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

## Retry cap

Initial research cap:
- maximum 2 generated candidates per slot before escalating to human/manual review.

Do not create an unlimited autonomous generation loop.

---

# Phase 7 — optional canonical-derived local detail reference

Priority: **P6 / only if failures remain localized**

This corresponds to earlier `ID-V3`.

Use only when evidence says one small structure repeatedly drifts despite accepted global identity conditioning.

Allowed reference:
- one lossless crop from the original canonical.

Not allowed:
- generated crop;
- generated multiview;
- multiple simultaneous identity crops by default.

Test one region at a time, e.g. active sleeve or waist ornament.

---

# Phase 8 — Branch -> Thinking execution strategy

Priority: **LATER / separate axis**

Do not treat Thinking as an identity-conditioning method.

It is an execution/runtime strategy to test after the identity/audit loop is understood under Instant.

Future gate:

```text
Instant preparation
-> Branch in new chat
-> verify Custom GPT identity/context
-> switch branch to Thinking
-> generate
-> verify post-image dialogue/tool behavior again
-> run the same accepted identity audit
```

Required comparison:
- Instant accepted pipeline vs Branch->Thinking accepted pipeline;
- generation quality;
- identity quality;
- pose compliance;
- post-image dialogue/tool reliability;
- runtime/automation reliability.

Do not modify the proven `fresh-chat` engine to implement Branch. Add a separate strategy behind the existing strategy boundary.

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
same-worker audit JSON
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
- if same-worker critic tracks human judgment well, independent judge may remain a hard-case tool;
- if VLM/human evaluation is sufficient, do not add a heavyweight metric just because it exists;
- if one candidate usually passes, best-of-2 remains retry-only;
- if Instant already meets quality target, Branch->Thinking remains optional research.

The objective is pet-feature-like stable visual variation, not maximal pipeline complexity.

---

# Immediate next action

**Run Phase 1: POSTGEN-G1.**

Before that run:
1. create/clone the experimental audited Custom GPT;
2. leave production worker unchanged;
3. do not change Worker Orchestrator v0.5.0 code;
4. use one known local pose packet;
5. collect DOM/turn/recovery evidence;
6. update this plan and CURRENT documents from the result before proceeding to ID-V1.

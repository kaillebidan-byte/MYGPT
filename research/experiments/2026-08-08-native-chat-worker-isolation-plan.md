# Native Chat worker isolation on Plus

Date: 2026-08-08
Status: N0/N1 COMPLETED — context boundary proven; N2/N3 DEFERRED until identity/continuity quality passes
Constraint: no ChatGPT Work / no Codex agentic allowance / no OpenAI API billing

Basis:
- M2b human-separated local static calls PASS
- M2d standalone carrier with weak temporal roles
- M2e temporal roles restored but 2x2 sheet regression
- `research/chatgpt-project-practices/native-chat-context-isolation.md`
- `research/chatgpt-project-practices/custom-gpt-thinking-imagegen-known-issue.md`
- `research/experiments/2026-08-08-n0-custom-gpt-thinking-instant-result.md`
- `research/experiments/2026-08-08-n1-fresh-custom-gpt-instant-four-frame-result.md`
- `research/decisions/2026-08-08-identity-continuity-direction.md`

## Original question

Can the missing `今はこの1姿勢だけ考えろ` boundary be created inside ChatGPT Plus without Work/API by using fresh Custom-GPT conversations as isolated image-generation workers?

## Minimal worker configuration used

Temporary worker concept:
`MYGPT Single Frame Worker Test`

Capabilities:
- Image generation: ON
- Web/search: OFF
- Code/Data Analysis: OFF
- Actions: NONE
- Apps: NONE
- Knowledge files: NONE

Behavioral contract:
- direct-attached image is the canonical
- only the current single static pose is handled
- do not plan other time states or the full motion
- one person / one pose / full body / front-facing / portrait
- one image generation then stop

Do not include motion / four-state / progress / board / sheet / compose / audit / repair vocabulary in worker-facing context.

---

## N0 result — model/runtime gate

### Custom GPT / Thinking

Result: FAIL for tool availability.

Observed:
`画像生成ツールがこの環境で利用できないため、画像ファイルを返せません。`

Interpretation:
- consistent with the separately recorded Custom-GPT Thinking image-generation issue
- not a failure of the isolated-worker context design
- do not keep prompt-repairing Thinking for this path

### Custom GPT / Instant

Result: PASS for N0.

Observed:
- visible generated image returned
- one person / one pose / portrait
- no multi-panel
- anatomical right arm active
- requested upper-abdomen / solar-plexus pose was followed
- major canonical identity features stayed close enough to justify N1

Important:
- this was a redraw, not unchanged-pixel preservation
- one frame cannot establish temporal continuity

Decision:
Use Instant for the worker path.

---

## N1 result — fresh worker boundary proof

Execution:
- same minimal Custom GPT
- Instant
- four completely new conversations
- same high-resolution canonical directly attached in every conversation
- each worker received exactly one local static-pose packet
- no worker saw the full motion, the other three poses, progress percentages, or F1-F4/sequence/sheet concepts

Result: PASS for carrier/context isolation.

Observed:
- 4/4 standalone portraits
- no 2x2 / labels / dividers
- anatomical right hand progressed in the intended temporal direction

Core conclusion:
**A fresh Custom-GPT / Instant conversation can act as the missing native context boundary inside ChatGPT Plus.**

This resolves the main sheet-carrier question enough to move on.

---

## N1 quality finding — why the project does not move directly to automation

The regenerated neutral-start frame drifted more strongly from the canonical in body width/proportions and other whole-body geometry.

The moving frames were more stable overall, but independent redraw still leaves continuity risk in:
- active anatomical-right sleeve silhouette/opening/folds
- hand shape
- local arm/torso occlusion
- fine accessory topology such as tassels/cords/fasteners

Therefore the next problem is identity/temporal continuity, not chat spawning UX.

Current candidate changes the four-frame plan to:
- F1 = canonical itself, no generation
- F2/F3/F4 = three fresh Custom-GPT / Instant workers

See:
`research/decisions/2026-08-08-identity-continuity-direction.md`

---

## N2 — Branch-from-clean-seed friction reduction

Status: DEFERRED.

Do not run N2 yet.

Reason:
Proving Branch convenience before the candidate frames pass identity/continuity quality would optimize an architecture that may still need a different image-control mechanism.

Run N2 only after C0/C1 passes.

When resumed:
- branch only from a clean pre-motion seed
- no global motion plan in inherited context
- verify Custom GPT configuration remains correct
- verify Instant remains selected/usable
- verify canonical attachment remains an effective reference
- first test one branch, then four only if the first passes

If branch inheritance is unreliable, keep explicit fresh conversations.

---

## N3 — automation ceiling assessment

Status: DEFERRED.

Known so far:
- manual fresh worker boundary works inside Plus
- normal Chat has no confirmed documented primitive for a parent chat to programmatically spawn multiple independent Custom-GPT conversations and send separate packets into them
- `@workerGPT` is rejected because current conversation context is retained
- branching after planner output is rejected because the global plan would be inherited

UX levels remain:
A. manual fresh-worker boundary — proven
B. clean-seed branch boundary — not yet tested
C. zero-click orchestration — not documented in normal Chat

Work/API remain outside the original constraint unless the user explicitly changes it.

---

## Immediate next stage outside N-series

Do not generate new test images first.

C0:
- use F1 canonical + existing N1 moving frames
- run deterministic chroma removal / normalization / board or strip composition
- visually audit identity/continuity

C1:
- add machine-assisted continuity signals if useful
- do not lengthen worker prompt

Only if C0 fails:
- C2 local edit diagnostic
- then C3 canonical identity + one single-pose visual guide role-separated reference test

---

## Rejected shortcuts

- `@workerGPT` from planner chat
- branch after planner output
- same Project for planner and worker isolation proof
- scheduled Tasks for immediate canonical-image frame generation
- interpreting Custom-GPT Thinking failure as architecture failure
- interpreting Instant single-frame success as production continuity proof
- direct 2x2 generation
- four-pose visual guide as generation reference
- generated-frame chaining as identity source

## Operational rule

Save every generated image immediately.
If a fail condition is already clear, stopping is allowed after the evidence needed for diagnosis has been saved.
Do not change production MYGPT Instructions/Sources until the current C0/C1 identity-continuity decision is evaluated.

# Native Chat worker isolation on Plus

Date: 2026-08-08
Status: N0/N1/N2 COMPLETED — fresh-worker and clean-seed Branch boundaries proven; N3 remains open
Constraint: no ChatGPT Work / no Codex agentic allowance / no OpenAI API billing

Basis:
- M2b human-separated local static calls PASS
- M2d standalone carrier with weak temporal roles
- M2e temporal roles restored but 2x2 sheet regression
- `research/chatgpt-project-practices/native-chat-context-isolation.md`
- `research/chatgpt-project-practices/custom-gpt-thinking-imagegen-known-issue.md`
- `research/experiments/2026-08-08-n0-custom-gpt-thinking-instant-result.md`
- `research/experiments/2026-08-08-n1-fresh-custom-gpt-instant-four-frame-result.md`
- `research/experiments/2026-08-08-n2-branch-thinking-followup-result.md`
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

## N0 result — historical model/runtime gate

### Custom GPT / Thinking

Historical observed result: FAIL for tool availability.

Observed:
`画像生成ツールがこの環境で利用できないため、画像ファイルを返せません。`

At N0 time this was treated as a runtime/tool-availability failure, not a context-isolation failure.

**Follow-up correction:**
N2 later produced a successful image-generation response after a clean-seed Branch chat was switched to Thinking. Therefore the N0 failure is not a universal Custom-GPT/Thinking limitation and must not be used as a permanent prohibition.

No evidence currently establishes that Branch itself caused the later Thinking success.

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

Decision after the full project evidence chain:
Use Instant as the validated production default because N1/W1-W4/C0 were completed on that path.
Do not interpret this as proof that Thinking cannot work.

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

This resolved the sheet-carrier question enough to continue to identity/continuity work.

---

## N1 quality finding

The regenerated neutral-start frame drifted more strongly from the canonical in body width/proportions and other whole-body geometry.

The moving frames were more stable overall, but independent redraw left continuity risk in:
- active anatomical-right sleeve silhouette/opening/folds
- hand shape
- local arm/torso occlusion
- fine accessory topology such as tassels/cords/fasteners

This led to the later production candidate:
- F1 = canonical itself, no generation
- F2/F3/F4 = three isolated Custom-GPT workers

W1-W4 and C0 subsequently closed the generation-quality stage.

---

## N2 — Branch-from-clean-seed friction reduction

Status: **PASS**.

See:
`research/experiments/2026-08-08-n2-branch-thinking-followup-result.md`

Execution:
- start the same minimal Custom GPT in a fresh conversation
- attach canonical directly
- before any motion context, send only the clean seed that declares the attachment to be the sole canonical and says no image should be generated yet
- branch from that clean-seed point

Verified in branch:
- same Custom GPT remained active
- Instant remained available / usable
- canonical attachment was inherited
- canonical remained an effective image-generation reference
- no global motion / F1-F4 / board / sequence context had been introduced before the branch

Result:
**A clean pre-motion seed can be branched and used as the same isolated worker boundary without reattaching the canonical.**

Practical benefit:
- removes repeated canonical attachment
- gives workers the same clean inherited starting context

Limit:
- still requires manual branch creation
- still requires manually sending separate local pose packets
- does not provide zero-click worker fan-out

Fresh conversations remain valid and proven. Branch is an optional friction reduction, not a replacement requirement.

### N2 Thinking follow-up

After Branch PASS, the branch was switched to Thinking and a single-pose request was run.

Observed:
- image generation succeeded
- two alternatives (A/B) were returned
- both were standalone 1024x1536 portraits
- both used the correct anatomical-right active arm
- both preserved canonical identity strongly enough to show effective reference inheritance
- visible redraw amount and active-sleeve geometry differed between the two alternatives

Interpretation:
- supersedes any stable claim that Thinking cannot generate images in this Custom GPT
- does not prove Thinking is more reliable than Instant
- does not prove Branch caused Thinking availability
- does not establish A/B multiplicity as a guaranteed output contract

Production default stays Instant because that is the mode with the completed N1/W1-W4/C0 evidence chain.

---

## N3 — automation ceiling assessment

Status: OPEN.

Known so far:
- manual fresh worker boundary works inside Plus
- clean-seed Branch boundary works inside Plus
- normal Chat still has no confirmed documented primitive in this project for a parent chat to programmatically spawn multiple independent Custom-GPT conversations and send separate packets into them
- `@workerGPT` remains rejected because current conversation context is retained
- branching after planner output remains rejected because the global plan would be inherited

UX levels:
A. manual fresh-worker boundary — proven
B. clean-seed branch boundary — proven, optional friction reduction
C. zero-click orchestration — not established in normal Chat

Work/API remain outside the original constraint unless the user explicitly changes it.

---

## Rejected shortcuts / constraints retained

- `@workerGPT` from planner chat
- branch after planner output
- same Project for planner and worker isolation proof
- scheduled Tasks for immediate canonical-image frame generation
- interpreting a single Instant frame as production continuity proof
- direct 2x2 generation
- four-pose visual guide as generation reference
- generated-frame chaining as identity source
- treating the historical N0 Thinking failure as a permanent platform rule
- switching production from Instant to Thinking based on one later success

## Operational rule

Save every generated image immediately.
If a fail condition is already clear, stopping is allowed after the evidence needed for diagnosis has been saved.
Do not reopen W-series tuning unless new composed evidence shows a production-blocking failure.

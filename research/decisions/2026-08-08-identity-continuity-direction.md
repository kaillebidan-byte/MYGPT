# Identity / continuity direction after W4

Date: 2026-08-08 JST
Status: CURRENT DECISION
Constraint: ChatGPT Plus / no Work / no Codex agentic allowance / no OpenAI API billing for production path

## Current decision in one sentence

Fresh Custom-GPT / Instant workers plus one targeted active-sleeve invariant now produce a usable four-state candidate; stop generation-prompt tuning and move to deterministic post-processing / composed-sequence audit.

## What is already solved enough to move on

### Carrier / context isolation

N1 established that fresh Custom-GPT / Instant conversations provide the required generation boundary:
- one worker conversation sees one local static pose only
- standalone portrait output
- no global 4-state / sheet contamination
- no active-limb side swap

Custom GPT / Thinking remains unusable in the tested runtime because image generation stopped with the tool-unavailable failure. Do not spend prompt-repair trials on Thinking now.

### Broad identity

The raw N1 audit showed that the moving Instant frames do not suffer broad uncontrolled identity collapse. The regenerated neutral frame was the clear outlier, so the start frame is no longer generated when canonical already represents the start pose.

### Targeted active-sleeve continuity

W1 added only one worker invariant for the active anatomical-right large sleeve:
- the sleeve may deform with arm motion
- keep the same basic large-sleeve construction
- preserve opening / gold trim / grey lining / motif rather than redesigning or deleting them

W1/W2/W3/W4 showed this targeted rule materially improves sleeve continuity without reintroducing sheetification.

### Hand articulation / spatial packets

W2 showed hand shape can be stabilized by local-packet wording.
W3 showed that an over-strong landmark constraint can encode the wrong temporal state even when the model follows it; W3-B is therefore repurposed as the early state rather than treated as a placement failure.
W4 produced a usable endpoint over the chest flower while retaining the sleeve improvement.

## Current four-frame candidate

Use exactly:
- F1 = canonical `kokyo_base_20260805.png`
- F2 = W3-B `19_12_14 (2)`
- F3 = W2 `19_07_53`
- F4 = W4 `19_17_55`

Motion reads:
- F1 neutral start
- F2 early raise near upper waist / lower torso
- F3 later raise near chest flower
- F4 stop with hand over chest flower

Do not use the regenerated neutral N1 frame as F1.
Do not use the old N1 endpoint when W4 is available.

## Production candidate architecture

When canonical already represents the one-shot start state:

```text
natural motion request
→ planner understands the full motion
→ planner emits three independent local pose packets
→ F1 = canonical itself, no generation
→ F2 = fresh Custom-GPT / Instant conversation
→ F3 = fresh Custom-GPT / Instant conversation
→ F4 = fresh Custom-GPT / Instant conversation
→ each worker sees canonical + one local pose only
→ deterministic chroma removal
→ common scale / baseline normalization
→ deterministic strip / board composition
→ visual identity / motion audit
→ machine geometry / chroma audit
```

This uses three image generations for a four-keypose one-shot.

## Worker configuration to keep

- model mode: Instant
- direct-attach the same high-resolution canonical every generated frame
- fresh conversation per generated frame
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- Knowledge NONE
- never use a generated frame as the next identity source
- never show full motion / other packets / progress percentages / F1-F4 / sequence / board / sheet concepts
- keep worker prompt short
- retain only the proven targeted active-sleeve invariant beyond the minimal single-frame worker rules

Do not add the full `01-character-identity.md` contract to the worker prompt. Use it as an audit contract.

## Local packet rule for visible hands

When hand shape matters, state the hand articulation absolutely inside each isolated local packet. Do not tell a worker to match other frames.

For this motion class, the useful invariant is approximately:
- fingers naturally together and lightly extended
- not a fist
- not a dramatically splayed palm
- palm orientation explicitly stated when needed

Spatial wording must encode the desired temporal state itself. Avoid adding geometric exclusions that accidentally push a hand into an earlier/later state.

## Immediate next stage — C0 deterministic post-processing

No new generation first.

Use the final candidate set:
- F1 canonical
- F2 W3-B
- F3 W2
- F4 W4

Reactivate existing assets:
1. `audit/scripts/remove_chroma_key.py`
2. `audit/scripts/compose_keypose_board_from_frames.py`
3. `audit/scripts/build_motion_strip.py`
4. `audit/scripts/machine_audit_board.py` for geometry/chroma only
5. `project/sources/production/01-character-identity.md` as visual audit contract

Apply:
- chroma removal
- common scale / baseline normalization
- chronological strip and/or deterministic board compose

Then audit:
- proportions
- silhouette
- hat/hair boundary
- chest flower emblem
- non-active sleeve
- active sleeve opening / grey lining / gold trim / motif
- hand articulation / local arm-torso occlusion
- waist medallion
- tassel / cord / fastener count and attachment
- lower garment
- shoes
- motion progression / endpoint

## Stage C1 — machine-assisted continuity audit if useful

Existing `machine_audit_board.py` does not determine identity.
If additional code is added, keep it advisory:
- foreground bbox / center
- normalized width-height ratio
- silhouette overlap after alignment
- stable-region structural similarity
- canonical / adjacent-frame comparison

Do not use one SSIM or pixel score as the identity verdict.
Topology / part count / attachment / overlap / occlusion remain visual audit items.

## C2 / C3 only if the composed candidate still fails

### C2 local edit diagnostic

Only if post-processing reveals unacceptable whole-redraw drift, test local edit around the active arm/sleeve. This remains a quality diagnostic; do not assume manual selection is automatable or perfectly confined.

### C3 role-separated two-reference

Only if text-only isolated generation remains insufficient:
- Reference A = canonical identity / costume / proportions / topology
- Reference B = one single-pose visual guide
- local text = current still pose

Prefer a skeletal/mannequin/silhouette pose guide with minimal identity/style information.
Never provide all four pose guides together.
Never return `four-pose-portrait.png` as a generation reference.

## Branch / automation decision

Do not test Branch before the final candidate passes deterministic composed-sequence audit.
After that, Branch may be tested only as friction reduction from a clean pre-motion seed.

Zero-click spawning of multiple independent worker chats is still not documented in normal Chat. Work/API remain outside the original constraint.

## Do not do now

- no broad identity Knowledge
- no additional global worker prose
- no new pose-reference image yet
- no rerun of F2/F3 merely to chase small redraw differences
- no direct 2x2 generation
- no generated-frame identity chaining
- no full-board repair
- no Custom GPT Thinking prompt repair

## Evidence

See:
- `research/audits/2026-08-08-n1-raw-identity-continuity-audit.md`
- `research/experiments/2026-08-08-w1-targeted-sleeve-invariant-result.md`
- `research/experiments/2026-08-08-w2-hand-shape-position-result.md`
- `research/experiments/2026-08-08-w3-ab-spatial-overconstraint-result.md`
- `research/experiments/2026-08-08-w4-endpoint-and-final-candidate-result.md`

## Operational rule

Save every generated image immediately in future tests.
If a fail condition is already clear, stop after evidence needed for diagnosis has been saved.
Do not reopen generation-control experiments until the final candidate has been evaluated after deterministic normalization / composition.

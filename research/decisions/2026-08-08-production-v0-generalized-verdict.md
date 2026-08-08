# Production v0 generalized verdict

Date: 2026-08-08 JST
Status: CURRENT — PRODUCTION V0 GENERALIZED PASS

## Scope of this verdict

This PASS applies only to the production-v0 scope fixed in `2026-08-08-production-v0-acceptance.md`:
- one canonical character
- canonical neutral pose as F1
- one-shot motion
- four keyposes total
- F2/F3/F4 generated independently
- front-facing baseline camera
- chroma background
- deterministic board / strip post-processing

It does not extend automatically to loop motion, non-canonical start poses, multiple people, large camera/viewpoint changes, complex external interaction, Thinking as default, or zero-click fan-out.

## Evidence chain

### R0 — anatomical-right hand raise

Status: PASS.

Evidence:
- C0 final candidate
- identity / motion visual audit PASS
- active right large-sleeve invariant PASS
- deterministic compose PASS
- machine geometry/chroma flags all false
- despill path validated on white / black composites

### R1 — mirrored anatomical-left hand raise

Status: FINAL PASS after local B retries.

Evidence:
- correct mirrored side selection
- no side swap
- active left sleeve topology retained
- hand progression and endpoint PASS
- first-pass B and retry-1 B local landmark-compliance failures retained in history
- retry-2 B PASS without global worker changes
- deterministic compose / machine audit PASS

### R2 — torso-dominant shallow bow

Status: FINAL PASS after local C retry.

Evidence:
- torso/head forward posture generalizes beyond unilateral hand motion
- no side-turn substitution
- feet remain planted
- no independent arm gesture
- both sleeves remain passive structures
- first-pass C endpoint-depth / expression failure retained in history
- C retry PASS without global worker changes
- deterministic compose / machine audit PASS

## Acceptance-rule check

Required by the contract:
- R0 remains PASS: YES
- R1 final PASS: YES
- R2 final PASS: YES
- same worker global configuration: YES
- no new broad Knowledge: YES
- no global prompt tuning required by motion: YES
- deterministic post-processing PASS: YES
- machine audit PASS: YES
- observed failures were localizable to local pose/endpoint compliance: YES

Therefore:

**PRODUCTION V0 GENERALIZED PASS**

## Important limitation retained

First-pass reliability is not perfect.

Observed local failures:
- R1 late hand state repeatedly snapped too close to a small chest landmark before a successful local retry
- R2 endpoint initially used facial expression change instead of increasing torso depth

These do not invalidate the architecture because:
- carrier / isolation / broad identity remained stable
- failures were confined to a single local state
- global worker configuration did not need to change
- failed frames could be retried independently from canonical

Production operation should therefore preserve failure accounting and local retry isolation rather than assuming every three-frame set will pass first try.

## CURRENT production worker

Keep:
- minimal Custom GPT
- Instant validated default
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- Knowledge NONE
- canonical direct attachment or clean-seed Branch inheritance
- one current static pose only
- proven targeted large-sleeve invariant
- absolute local hand articulation / palm orientation when needed

Do not add broad identity prose from the retry experiments.

## N3 follow-up

N3 orchestration investigation is complete under the current Plus / ordinary ChatGPT / Project / Custom GPT constraints.

Record:
- `research/experiments/2026-08-08-n3-orchestration-ceiling.md`

Current conclusion:
- no official zero-click / one-click fan-out of three isolated Custom GPT workers with three dynamic packets was found
- production v0 is manual-assisted
- clean-seed Branch reduces canonical reattachment but does not remove three branch actions or three packet sends

Do not reopen generation-quality tuning merely to reduce UI clicks.
Reopen orchestration only if official product capability changes or the user explicitly relaxes the no-API / no-agentic-production constraint.

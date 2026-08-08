# Identity / continuity direction after N1

Date: 2026-08-08 JST
Status: CURRENT DECISION
Constraint: ChatGPT Plus / no Work / no Codex agentic allowance / no OpenAI API billing for production path

## Current decision in one sentence

Carrier/context isolation is sufficiently proven by fresh Custom-GPT / Instant conversations; stop adding orchestration prompts and move to identity/continuity audit using `F1 = canonical` plus three isolated generated moving frames.

## What is already solved enough to move on

N1 established that fresh Custom-GPT / Instant conversations can create the missing generation boundary:
- one worker conversation sees one local static pose only
- 4/4 outputs were standalone portrait images
- no 2x2 / multi-panel regression
- anatomical right hand progressed through the requested motion states

Custom GPT / Thinking remains unusable in the tested runtime because image generation stopped with the tool-unavailable failure. Do not count that as failure of the context-boundary idea and do not spend further prompt-repair trials on Thinking now.

Therefore sheet carrier / context isolation is no longer the first unresolved problem.

## Current unresolved problem

The primary unresolved problem is identity / temporal continuity across independently redrawn frames.

Observed N1 behavior:
- the regenerated neutral start drifted more strongly in body width/proportions than the moving frames
- the moving Instant outputs were much more stable overall
- the main visible jitter is the active anatomical-right sleeve / hand / local occlusion and potentially fine accessory topology
- identity is maintained by redraw, not by unchanged-pixel preservation

Treat continuity as a separate quality problem from carrier.

## Production candidate

When the canonical already represents the one-shot start state:

```text
natural motion request
→ planner creates three local target-pose packets after start
→ F1 = canonical itself, no generation
→ F2 = fresh Custom-GPT / Instant conversation
→ F3 = fresh Custom-GPT / Instant conversation
→ F4 = fresh Custom-GPT / Instant conversation
→ each worker sees canonical + one local pose only
→ identity / continuity audit
→ deterministic chroma / scale / baseline normalization
→ deterministic board / strip compose
```

This uses three image generations for a four-keypose one-shot.

Worker rules:
- direct-attach the same high-resolution canonical every time
- never use a generated frame as the next identity source
- do not show full motion, other pose packets, progress percentages, F1-F4 labels, sequence/sheet concepts
- keep worker prompts short
- do not paste the full `01-character-identity.md` contract into image-generation prompts

## Dormant GitHub assets to reactivate now

1. `project/sources/production/01-character-identity.md`
   - use as the audit contract
   - canonical remains the visual identity anchor

2. `audit/scripts/remove_chroma_key.py`
   - per-frame background removal

3. `audit/scripts/compose_keypose_board_from_frames.py`
   - common scale, baseline, safe gaps, deterministic board geometry

4. `audit/scripts/build_motion_strip.py`
   - normalized chronological strip and later inbetween assembly

5. `audit/scripts/machine_audit_board.py`
   - geometry/chroma checks only
   - never treat it as identity or motion-semantic audit

Do not reactivate:
- `four-pose-portrait.png` as generation reference
- direct 2x2 generation
- generated-frame identity chaining
- full-board repair
- broad-region M2c-style crossfade/morph

## Stage C0 — immediate next step, no new image generation

Use the images already available:
- F1 = original canonical image
- F2 = N1 early moving frame
- F3 = N1 late moving frame
- F4 = N1 endpoint moving frame

Apply only deterministic post-processing:
- chroma removal
- common scale / baseline normalization
- chronological strip and/or deterministic board compose

Then visually audit against `01-character-identity.md`.

Primary review targets:
- proportions
- silhouette
- hat/hair boundary
- chest flower emblem
- non-active sleeve
- active sleeve silhouette / opening / fold
- waist medallion
- tassel / cord / fastener count and attachment
- overlap / occlusion around active arm and torso
- lower garment
- shoes

If this set is acceptable after normalization, do not add a new generation-control mechanism.

## Stage C1 — add machine-assisted continuity audit

The missing code component is an advisory identity/continuity audit, not another generator prompt.

Useful signals:
- foreground bbox width/height/center
- normalized character width-height ratio
- stable anchors after alignment
- silhouette overlap after translation/scale normalization
- stable-region structural similarity against canonical and adjacent frames
- chroma/background diagnostics

Do not use one SSIM or pixel score as the identity verdict.
Topology / part count / attachment / overlap / occlusion remain visual audit items.

## Stage C2 — only if C0 fails because of global redraw drift

Test local edit on the canonical, selecting only the anatomical-right arm/sleeve region and requesting one target still pose.

Purpose:
- determine whether local selection materially reduces whole-body redraw drift

This is a diagnostic quality test first.
Do not assume manual selection is automatable.
Do not assume selected-area edits are perfectly confined outside the mask.

## Stage C3 — only if C2/text-only path is still insufficient

Test role-separated two-reference generation with exactly:
- Reference A = canonical identity / costume / proportions / colors / topology
- Reference B = one single-pose visual guide
- local text = current still pose

Priority:
- A wins for identity/outfit/proportions/topology
- B controls pose/limb angles/hand location only
- B should preferably be skeletal/mannequin/silhouette and carry minimal identity/style information

Never provide all four pose guides together.
Never return `four-pose-portrait.png` as a generation reference.

## Branch / automation decision

N1 proved the manual fresh-conversation boundary.
Do not run N2 Branch merely because carrier passed.
First establish that the identity/continuity quality of the candidate pipeline is acceptable.

Only after C0/C1 passes should Branch be tested as friction reduction:
- clean seed only
- no global motion context
- verify canonical attachment inheritance
- verify Instant/model configuration remains correct

Zero-click spawning of multiple independent worker chats is still not documented in normal Chat. Work/API remain outside the original constraint.

## External evidence already consulted

OpenAI official:
- ChatGPT Images supports local editing but warns changes can extend outside the selected area.
  - https://help.openai.com/en/articles/11084440
- OpenAI Academy recommends explicitly assigning roles when multiple reference images are used.
  - https://openai.com/academy/image-generation/
- GPT Image documentation treats high-fidelity image input as a distinct capability.
  - https://developers.openai.com/api/docs/models/gpt-image-2

Existing MYGPT external research:
- `research/chatgpt-project-practices/china-imagegen-practices.md`
  - identity and pose/structure are often separated into different visual control channels
  - candidate fallback: canonical identity + one single-pose visual guide

Do not repeat the same external searches unless new evidence requires another angle.

## Operational rule

No new generation experiment before C0/C1 unless the current saved frames are unavailable.
Save every generated image immediately in future tests.
If a test has already produced enough evidence for FAIL, stop only after needed images/logs have been saved.

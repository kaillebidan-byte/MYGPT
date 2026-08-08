# Identity / continuity direction after N1

Date: 2026-08-08 JST
Status: DECISION
Constraint: ChatGPT Plus / no Work / no Codex agentic allowance / no OpenAI API billing for production path

## Why the problem changed

N1 established that fresh Custom-GPT / Instant conversations can preserve the missing context boundary:
- one worker conversation sees one local static pose only
- 4/4 outputs were standalone portrait images
- no 2x2 / multi-panel regression
- anatomical right hand progressed monotonically through the requested motion states

Therefore carrier/context isolation is no longer the first unresolved problem.
The primary unresolved problem is now identity / temporal continuity across independently redrawn frames.

## Current image evidence

Use canonical itself as F1 instead of regenerating the neutral start.
The regenerated neutral-start image drifted more strongly in body width/proportions than the moving frames.

The three moving Instant outputs were notably more stable:
- same output canvas
- same top / right / bottom foreground bounds in the current N1 set
- non-active side visually stays close to canonical
- main remaining visible jitter is active right sleeve / hand / local occlusion and accessory geometry

A rough structural comparison of the non-active right-side region showed that the three moving frames are much closer to each other than the regenerated neutral-start frame is to them. Treat this only as an advisory continuity signal, not an identity PASS metric.

## Dormant GitHub assets to reactivate

### Reuse now

1. `project/sources/production/01-character-identity.md`
   - Keep as audit contract.
   - Do NOT paste the full contract into generation prompts.
   - Canonical remains the main visual identity anchor.

2. `audit/scripts/remove_chroma_key.py`
   - Use for per-frame background removal after generation.

3. `audit/scripts/compose_keypose_board_from_frames.py`
   - Use only after standalone frames pass identity/motion review.
   - Own common scale, baseline, safe gaps, board geometry.

4. `audit/scripts/build_motion_strip.py`
   - Reuse for normalized chronological strips / later inbetween assembly.

5. `audit/scripts/machine_audit_board.py`
   - Keep for geometry/chroma checks only.
   - Do not pretend it covers identity or motion semantics.

### Do not reactivate

- `four-pose-portrait.png` as a generation reference
- direct 2x2 generation
- generated frame as the next identity canonical
- full-board repair
- broad-region crossfade / M2c-style morphing

## External evidence consulted after N1

### OpenAI official

- ChatGPT Images supports editing an uploaded/existing image and provides a selection tool for local edits. OpenAI explicitly warns that edits can extend beyond the selected area.
  - https://help.openai.com/en/articles/11084440

- OpenAI Academy recommends referring to multiple images by order and explicitly explaining their relationship when combining references.
  - https://openai.com/academy/image-generation/

- GPT Image 2 documentation describes high-fidelity image inputs; API documentation also exposes an `input_fidelity` control. This is supporting evidence that identity preservation is a distinct control dimension, although production MYGPT is not using API billing.
  - https://developers.openai.com/api/docs/models/gpt-image-2

### Existing MYGPT external research

`china-imagegen-practices.md` already found a strong production pattern:
- identity reference and pose / structure reference are treated as different control roles
- when text-only pose control is insufficient, use canonical identity image + one single-pose visual guide
- never use a four-pose sheet as the pose guide

### Research / community direction

Recent character-consistency and pose-control work continues to treat identity preservation and spatial/pose control as separate objectives. Multi-condition systems explicitly decouple semantic identity cues from layout/pose cues. This supports testing role-separated references only if the current single-reference path cannot meet continuity quality.

## Decision: next path

Do NOT immediately add more prompt instructions or another motion-orchestration experiment.
Do NOT immediately add a second pose reference either, because N1 already achieved usable monotonic pose control and extra references add a new binding variable.

Proceed in this order.

### Stage C0 — reuse current N1 outputs, no new image generation

Build the candidate four-state sequence as:

- F1 = original canonical image itself
- F2 = N1 early generated frame
- F3 = N1 late generated frame
- F4 = N1 endpoint generated frame

Run existing deterministic post-processing only:
- chroma removal
- common scale / baseline normalization
- chronological strip and/or deterministic board compose

Then visually audit identity/continuity using `01-character-identity.md`.

Primary review targets:
- proportions
- hat/hair boundary
- chest flower emblem
- non-active sleeve
- active sleeve silhouette and inner opening
- waist medallion
- tassel/cord/fastener count and attachment
- overlap / occlusion around the active arm and torso
- lower garment / shoes

If this current set is already acceptable after normalization, do not add a new generation-control mechanism.

### Stage C1 — add a machine-assisted continuity audit, not a generator prompt

Existing machine audit does not cover identity. Add a new advisory script rather than lengthening the worker prompt.

Suggested outputs:
- foreground bbox width/height and center
- normalized character height / width ratio
- top / bottom / right stable anchors
- silhouette overlap after translation/scale normalization
- stable-region structural similarity against canonical and adjacent frames
- chroma/background diagnostics

Do NOT use a single SSIM/pixel score as the identity verdict.
Topology / part count / attachment / occlusion remain visual-model or human audit items.

### Stage C2 — only if C0 fails due global redraw drift: test local edit

Use ChatGPT Images editor on the canonical and select only the anatomical-right arm/sleeve region.
Request the target single pose while preserving the rest.

Purpose:
- determine whether local selection materially reduces whole-body redraw drift

This is a diagnostic quality test first. The selection UI is manual and may not be automatable inside the eventual Custom-GPT worker flow. Also, OpenAI warns edits may extend outside the selected region.

Do not call C2 a production architecture until automation feasibility is separately proven.

### Stage C3 — only if text/local-edit control still fails: role-separated two-reference test

One generation gets exactly:
- Reference A = canonical identity / costume / proportions
- Reference B = one single-pose visual guide only
- local text describing the current still frame

Explicitly state roles and conflict priority:
- A wins for identity, outfit, proportions, colors, topology
- B controls pose / limb angles / hand location only
- do not copy B's identity, clothing, style or background

The pose guide should be stripped of identity information where possible (skeletal/mannequin/silhouette guide preferred over another dressed character).

Never provide all four pose guides together.

## Why this order

The current worker already solved the major carrier failure. Adding more references now could fix a problem that may already be small enough after deterministic normalization while simultaneously reintroducing reference-binding failures.

Therefore:
1. exploit current successful outputs first;
2. reactivate deterministic GitHub post-processing;
3. build missing identity-continuity audit;
4. only then test local edit or role-separated pose references if measured drift remains unacceptable.

## Production architecture candidate if C0 passes

Natural motion request
→ planner creates three generated target states after start
→ three fresh Custom-GPT Instant worker conversations
→ each sees canonical + one local pose only
→ F1 is canonical itself
→ per-frame identity/continuity audit
→ deterministic chroma removal / scale / baseline normalization
→ deterministic board / strip compose
→ optional later inbetweens

This requires only three image generations for a four-keypose one-shot when the canonical already represents the start state.

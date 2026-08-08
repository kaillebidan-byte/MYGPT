# N1 — fresh Custom GPT Instant conversations, four-frame result

Date: 2026-08-08
Status: PASS for carrier/context isolation; PARTIAL for production continuity

## Purpose

Test whether the missing context boundary can be created inside Plus/ChatGPT UI without Work/API by using the same minimal Custom GPT as a stateless single-frame worker, but opening a brand-new conversation for every frame.

The planner/global motion context is not shown to any worker conversation. Each worker sees only:
- the directly attached high-resolution canonical;
- one local static-pose request;
- the minimal single-frame worker instructions.

Model mode: Instant only, because N0 confirmed the Custom-GPT Thinking image-generation path fails in the current runtime.

Canonical:
- `kokyo_base_20260805.png`
- 1024x1536

## Observed four outputs

All four outputs were standalone portrait images:
- 1 person
- 1 pose
- full body
- no 2x2
- no multi-panel
- no labels/dividers
- no left/right active-limb swap

The four local requests produced the intended semantic progression:
1. start: both arms down
2. early: anatomical right arm raised to upper-abdomen / solar-plexus region
3. late: anatomical right hand higher, below the chest-flower endpoint
4. endpoint: anatomical right hand reaches the chest-flower area

Therefore the M2e sheet-collapse behavior did NOT recur when each pose was placed in a fresh Custom-GPT conversation.

## Primary conclusion

**PASS for native context isolation.**

The key architecture hypothesis is now supported by direct UI evidence:

> A fresh Custom-GPT conversation can act as the missing native context boundary. When the worker sees only one current static pose, the global four-state motion plan no longer causes a 2x2 sheet.

This is achievable on Plus without ChatGPT Work, Codex agentic allowance, or OpenAI API billing.

The remaining problem is not carrier isolation; it is now continuity/identity quality plus how much of the fresh-chat fan-out can be automated or friction-reduced in normal ChatGPT UI.

## Identity / continuity review

### Start frame redraw is the weakest frame

The regenerated neutral-start output is visibly less faithful than the canonical even though no pose change was required.

Observed drift includes:
- narrower overall silhouette;
- altered full-body proportions;
- larger/taller framing relative to the canvas;
- hat/head/body proportions shift;
- sleeve/body spacing changes;
- waist ornament/tassel arrangement is redrawn rather than preserved.

A simple foreground-bounding-box check also confirms a geometry shift:
- canonical foreground bbox: approximately x=190..823, y=53..1488
- regenerated start bbox: approximately x=218..797, y=31..1490

Thus regenerating the start pose introduces avoidable identity drift.

### Early / late / endpoint are much more coherent with each other

The three raised-arm outputs share a much more stable non-active body, face, lower garment and non-active sleeve.

Direct pixel-space MAE is still nonzero because every output is a redraw, but stable-region comparisons are substantially closer between the raised-arm frames than between the canonical and the regenerated start.

Examples among raised-arm frames:
- non-active viewer-right region MAE: roughly 3.8–6.6
- lower-leg region MAE: roughly 4.6–7.2

This does not prove pixel preservation, but visually and numerically it supports that the three action frames form a more coherent family than the regenerated neutral frame.

### Remaining active-side topology drift

The anatomical-right / viewer-left sleeve is the main continuity risk:
- sleeve opening shape changes across early/late/endpoint;
- internal gray lining exposure changes;
- decorative motif placement changes;
- fold/silhouette geometry is reinterpreted with each independently generated pose;
- hand shape changes as the hand approaches the chest.

This is now the dominant frame-to-frame motion-quality issue.

### Chroma is not identical

Green background tone varies between generated frames. This was not the primary N1 variable and should remain separate from the carrier/context result.

## Important production implication

The canonical is already the exact desired start pose. There is no reason to regenerate that state.

Candidate architecture supported by this result:
- Frame 1: use the canonical itself directly
- Frame 2: fresh Instant worker conversation, early pose
- Frame 3: fresh Instant worker conversation, late pose
- Frame 4: fresh Instant worker conversation, endpoint pose

This removes the weakest redraw, preserves perfect identity at time zero, reduces one generation call, and keeps the successful fresh-worker context boundary for the three states that actually require pose change.

This is a candidate for the next proof, not yet a production change.

## External-example check before the next experiment

A targeted web sweep was performed before planning the next test.

Relevant existing patterns:
- character-animation research explicitly treats temporal consistency and faithful preservation of the reference image as difficult separate problems;
- reference-driven animation systems use the source image as an appearance/reference anchor rather than regenerating every unchanged state;
- frame-interpolation workflows preserve source frames instead of regenerating them;
- first/last-frame video workflows accept fixed endpoint images as inputs.

Sources checked:
- ComfyUI frame interpolation workflow: https://docs.comfy.org/tutorials/utility/frame-interpolation
- ComfyUI first/last-frame node: https://docs.comfy.org/built-in-nodes/ByteDanceFirstLastFrameNode
- Animate Anyone: https://arxiv.org/abs/2311.17117
- MagicAnimate: https://arxiv.org/abs/2311.16498
- AniDoc: https://arxiv.org/abs/2412.14173

The external evidence does not prove that ChatGPT Images will preserve all later-frame topology, but it supports the narrower design choice of not regenerating an already-correct starting reference frame.

## Next experiment candidate

Before testing Branch/automation friction, run one no-new-generation assembly/audit using:
- canonical as frame 1;
- the existing early, late, endpoint Instant outputs as frames 2–4.

Purpose:
- evaluate the actual four-state continuity after removing the unnecessary regenerated start;
- determine whether Instant quality is already sufficient for the motion stage or whether active-sleeve topology must be improved first.

No new image generation is required for that audit.

Only after that continuity gate should Branch-from-clean-seed friction reduction be tested.

# Reference start frame and temporal continuity — targeted existing-example sweep

Date: 2026-08-08
Status: DONE for the immediate N1 follow-up decision

## Trigger

N1 fresh Custom-GPT Instant workers solved the 2x2 carrier problem, but the regenerated neutral-start frame drifted more from the canonical than the three action frames did from one another.

Question:
Should the next proof regenerate the neutral start, or use the already-correct canonical directly as frame 1 and generate only the changed states?

## Search terms

```text
AI character animation use original reference image as first keyframe generate subsequent keyframes consistency independent frames
ComfyUI character animation first frame source image keyframe preserve original generate later poses
site:docs.comfy.org animation keyframe reference image first frame workflow
site:openai.com image generation reference image preserve unchanged regions edit pose character consistency
```

## Sources checked

Primary / documentation:
- ComfyUI frame interpolation workflow
  - https://docs.comfy.org/tutorials/utility/frame-interpolation
- ComfyUI ByteDance first/last-frame node documentation
  - https://docs.comfy.org/built-in-nodes/ByteDanceFirstLastFrameNode

Research:
- Animate Anyone
  - https://arxiv.org/abs/2311.17117
- MagicAnimate
  - https://arxiv.org/abs/2311.16498
- AniDoc
  - https://arxiv.org/abs/2412.14173
- I2V3D
  - https://arxiv.org/abs/2503.09733

Supplementary practice:
- Runway character-reference guidance
  - https://runwayml.com/resources/ai-character-references-tips
- OpenAI Developer Community pose-transfer / sprite-sheet discussion
  - https://community.openai.com/t/developing-sprite-sheets-with-gpt-image-2/1379831

## What is established

- Temporal consistency and faithful preservation of a detailed reference character are separate hard problems in character animation.
- Reference-driven animation systems explicitly carry appearance/reference information rather than relying on independent unconstrained redraws.
- Frame interpolation workflows preserve supplied source frames instead of regenerating them.
- First/last-frame workflows accept fixed endpoint images as actual inputs.
- Practical pose-transfer workflows similarly treat identity reference and pose control as separate inputs/roles.

## What this does NOT establish

- It does not prove that ChatGPT Images Instant will keep accessory topology stable across three independently generated pose frames.
- It does not prove that using the canonical directly as frame 1 automatically makes a final GIF/video smooth.
- It does not solve active-sleeve redraw variation.

## MYGPT implication

The immediate low-risk design candidate is:
- frame 1 = canonical directly, no generation;
- frames 2–4 = fresh isolated single-frame workers for changed poses.

This is preferable to regenerating an already-correct neutral state because N1 directly showed that the neutral redraw introduced avoidable body/silhouette drift.

Before spending more image generations, assemble/audit the already available canonical + N1 action frames and decide whether active-sleeve continuity is acceptable.

## Next different search angle

Only if the active-sleeve continuity fails the assembly/audit:
- search `identity reference + pose reference` role binding specifically for GPT Image / ChatGPT Images;
- search visual pose-guide workflows that preserve garment topology;
- do not repeat generic character-consistency/reference-image searches.

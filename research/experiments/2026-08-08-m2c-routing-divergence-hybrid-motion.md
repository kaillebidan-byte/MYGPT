# M2c-R — hidden motion orchestration diverged into hybrid motion-production route

Date: 2026-08-08
Status: ROUTING DIVERGENCE / not a valid 4-call frame-first PASS or FAIL

## Intended M2c goal

Test whether a single natural-language one-shot motion request can be internally decomposed into four static states and executed as four sequential image-generation calls **without visibly exposing the four-state plan before generation**.

Expected architecture:

```text
user motion request
  -> assistant internally derives 4 static states
  -> image call 1 receives state 1 only
  -> image call 2 receives state 2 only
  -> image call 3 receives state 3 only
  -> image call 4 receives state 4 only
```

No board/sheet/panel/2x2/compose/audit/repair vocabulary was intended during generation.

## Actual behavior

The model did not immediately execute four image-generation calls.

Visible reasoning instead reframed the task as direct animation production:

- interpret the request as a one-shot animation problem
- define start and endpoint poses
- consider interpolation between them
- inspect the canonical with PIL
- check ffmpeg availability
- manually construct arm/sleeve masks
- experiment with rotation and coordinate transforms
- attempt warping / inpainting / region replacement
- later use a separately generated pose image as a pose source
- composite the canonical and pose image over a masked viewer-left / anatomical-right arm region
- synthesize transitional frames with a smoothstep blend and transient Gaussian blur
- encode the result as MP4 with ffmpeg
- save a final-pose PNG

The supplied trace shows the final code using:

- canonical: `kokyo_base_20260805.png`
- pose source: `a_clean_studio_like_character_illustration_on_a_so.png`
- `fps = 30`
- movement duration `0.55 s`
- final hold duration `0.70 s`
- masked image-space blending rather than four independently generated chronological keyframes
- output MP4: `right_hand_raise_oneshot.mp4`
- output PNG: `right_hand_raise_final_pose.png`

## Uploaded visual outputs

The user supplied:

- canonical image
- three standalone generated pose images

All three generated images are single-person portrait images, not 2x2 sheets.

However, they do not form the intended four-state sequence:

- no neutral start image among the three supplied generated outputs
- hand shape / pose differs between attempts
- at least one image uses a clenched/closed hand near the flower emblem
- another uses an open hand near the chest
- another uses a closed hand near the chest

Therefore the generated images behave more like endpoint / pose candidates than a controlled four-state sequence.

## Important interpretation

This run cannot be used to answer the original M2c question:

`Does hidden internal four-state planning leak enough context to make four image calls sheetify?`

The reason is that the model changed the execution architecture before that test occurred.

The result instead establishes a new failure mode:

> If Project Instructions say "internally decompose motion" and "produce four generations" but still leave the model free to optimize for the user's final animation goal, the main model may route around the intended frame-generation experiment and directly construct an animation with Python/OpenCV/ffmpeg.

This is an orchestration/tool-routing problem, separate from image-sheet contamination.

## Why this matters for production design

The model is not merely a dumb dispatcher that executes a fixed image pipeline. It may reinterpret the user's high-level motion request and choose a different means to satisfy it.

Therefore production Instructions must distinguish:

1. **required intermediate artifacts** — the four raw static frames are mandatory outputs of the generation phase;
2. **forbidden substitutions during that phase** — do not replace the four image-generation calls with Python image warping, crossfading, region rotation, optical-style interpolation, or direct video construction;
3. **post-generation work** — compose / interpolation / MP4/GIF generation is allowed only after the four raw frames exist and are accepted.

This restriction is different from exposing a visible four-state plan. The instructions can require four image-generation calls as an execution rule while still keeping the four concrete pose descriptions private/local to each call.

## Motion-quality note on the generated MP4 approach

The final code does not create articulated motion from four actual poses. It blends a large viewer-left region between canonical and one pose image.

Consequences:

- the transition is an image-space morph/crossfade rather than a physically articulated arm trajectory;
- non-identical sleeve, torso, waist, and hand pixels inside the mask can morph simultaneously;
- Gaussian blur hides some transition artifacts but does not restore structural continuity;
- this method may preserve much of the untouched canonical outside the mask, but it can create ghosting / topology interpolation inside the replaced region.

This approach is therefore not adopted as the production motion-generation architecture.

## Next test: M2d — enforce four image calls, hide concrete state list

Use another completely clean Project.

Keep:
- Project Sources 0
- canonical directly attached
- no retired four-pose reference
- no repair/audit/compose during generation
- do not visibly enumerate the four concrete pose states before generation

Change the minimal Instructions so they explicitly require:

- the generation phase must create exactly four separate still-image outputs by invoking image generation four times;
- do not use Python/OpenCV/ffmpeg or direct animation/video construction before those four images exist;
- derive each next static pose internally immediately before its image call;
- each image call receives only the canonical identity rule plus that call's current static pose;
- do not expose the other three pose descriptions to the image-generation call;
- do not display the four-state plan to the user before generation;
- after the fourth raw image is produced, stop; no compose/audit/repair/video in this isolation test.

The user request remains the natural-language one-shot motion request only.

Interpretation:

- 4/4 standalone portraits -> hidden/local four-call orchestration is viable once tool-routing substitution is blocked.
- sheetification -> internal multi-state plan is still leaking into generation-facing context.
- tool-routing divergence again -> Project-level natural-language instructions are insufficient to force this execution boundary; a stronger architecture / external orchestrator may be needed.

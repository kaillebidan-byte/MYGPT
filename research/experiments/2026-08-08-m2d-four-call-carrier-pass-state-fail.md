# M2d — four outputs, carrier PASS / temporal-state FAIL / call-count unverified

Date: 2026-08-08
Status: PARTIAL PASS

## Goal

Require four still-image outputs while keeping the concrete four-state list hidden from the user and out of local generation descriptions. This test also checks whether explicit still-image requirements avoid the M2c tool-routing divergence into Python/OpenCV/ffmpeg.

## Conditions

- completely new Project
- Project Sources: 0
- high-resolution canonical `kokyo_base_20260805.png` directly attached
- no retired `four-pose-portrait.png`
- no production board / compose / audit / repair pipeline
- Instructions required four separate still-image generation outputs
- Instructions prohibited substituting Python/OpenCV/ffmpeg/GIF/MP4 for those outputs
- four concrete states were not exposed as a visible A/B/C/D list before generation
- user request remained a single natural-language one-shot motion request
- assistant returned no explanatory body text; only image outputs were presented

## Observed outputs

Four generated images were returned in addition to the canonical.

Carrier / layout:
- 4/4 are standalone portrait images
- 4/4 contain one character and one pose
- no 2x2
- no divider
- no labels / pose names / arrows
- no multi-panel sequence representation

Tool-routing observation:
- unlike M2c-R, the visible result did not end in a Python/OpenCV/ffmpeg animation artifact
- four separate still-image outputs were produced

Important uncertainty:
- the uploaded images alone do **not** prove that the system executed four distinct image-generation tool calls
- the generated filenames/timestamps are nearly simultaneous, so one generation operation returning multiple image outputs remains possible
- therefore `four distinct calls executed` is **not confirmed** from this run

## Motion-state result

Temporal decomposition did not succeed.

Instead of a clear sequence of:
1. neutral start with both arms down
2. early/intermediate raise toward upper abdomen
3. later intermediate below chest emblem
4. endpoint at chest height

the four generated outputs all show the anatomical right arm already raised near the chest area.

Visible variation exists in hand shape and exact contact location:
- open hand spread across upper chest / emblem region
- closed or semi-closed fist near the emblem
- another open-hand chest placement
- another similar endpoint-like placement

None of the four clearly serves as the original neutral start pose. There is no clean monotonic progression from low to high hand position.

Therefore M2d is not a full motion-generation PASS.

## Identity observations

Compared with the canonical:
- overall character identity remains strongly anchored
- hat, hair, chest emblem, waist medallion, lower garment, shoes remain recognizable and structurally close
- active limb remains the anatomical right arm; no obvious left/right swap

Frame-to-frame drift remains in:
- sleeve silhouette and opening shape on the active side
- hand pose / finger topology
- overlap between active sleeve, torso, and waist ornaments
- some waist tassel / cord visibility

These identity issues are secondary to the current M2d failure mode.

## Interpretation

### Carrier PASS

`A hidden-state setup can return four standalone portrait outputs without M2a-style 2x2 collapse.`

This is strong evidence that visible four-state exposure, rather than simply asking for four outputs, is a major sheetification trigger.

### Python/video rerouting not observed

The M2c-R diversion into direct animation synthesis did not recur in the visible result. Explicitly requiring still-image outputs appears useful for constraining the task, but this run does not prove exact tool-call count.

### Temporal semantics FAIL

`Internal decomposition of the high-level motion was not sufficient to bind the four outputs to distinct chronological roles.`

The system preserved the global endpoint goal (`raise hand to chest and stop`) but sampled several endpoint-like pose variants instead of start/intermediate/intermediate/end progression.

The remaining problem is therefore state-role binding: each output needs a distinct temporal role without globally exposing a concrete four-state sequence to the image generator.

## Next experiment direction

Do not return to visible A/B/C/D lists.
Do not reintroduce board/sheet vocabulary.
Keep the requirement for four still-image outputs so the M2c direct-video route is discouraged.

Next test should strengthen only hidden temporal-role assignment. A clean candidate is an abstract internal progress contract:

- output 1 = motion progress 0% (start)
- output 2 = early progress around one-third
- output 3 = late progress around two-thirds
- output 4 = 100% endpoint

The assistant should convert only the current progress value into one concrete static pose immediately before producing that output. The four progress values should not be printed for the user before generation, and they should not be presented together to a single image-generation request.

Because M2d did not expose tool traces, the next run should also preserve any visible execution trace or thinking summary if available so that distinct call count can be distinguished from one multi-output image operation.

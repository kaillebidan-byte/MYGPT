# M2d — four image calls forced, carrier PASS / temporal-state FAIL

Date: 2026-08-08
Status: PARTIAL PASS

## Goal

Force the assistant to use image generation exactly four times while keeping the concrete four-state list hidden from the user and out of each local generation description. This isolates two questions:

1. Can explicit four-call routing avoid the M2c tool-routing divergence into Python/OpenCV/ffmpeg?
2. Can hidden/internal motion decomposition still produce four chronological states rather than four endpoint-like variants?

## Conditions

- completely new Project
- Project Sources: 0
- high-resolution canonical `kokyo_base_20260805.png` directly attached
- no retired `four-pose-portrait.png`
- no production board / compose / audit / repair pipeline
- Instructions explicitly required four separate image-generation calls
- Instructions prohibited substituting Python/OpenCV/ffmpeg/GIF/MP4 for the four image generations
- four concrete states were not exposed as a visible A/B/C/D list before generation
- user request remained a single natural-language one-shot motion request

## Observed outputs

Four generated outputs were returned in addition to the canonical.

Carrier / layout:
- 4/4 are standalone portrait images
- 4/4 contain one character and one pose
- no 2x2
- no divider
- no labels / pose names / arrows
- no multi-panel sequence representation

Tool routing:
- unlike M2c-R, the assistant did not replace the four image generations with a Python/OpenCV/ffmpeg animation workflow
- the explicit requirement to perform four image-generation calls successfully constrained tool routing

## Motion-state result

Temporal decomposition did not succeed.

Instead of a clear sequence of:
1. neutral start with both arms down
2. early/intermediate raise toward upper abdomen
3. later intermediate below chest emblem
4. endpoint at chest height

the four outputs all show the anatomical right arm already raised near the chest area.

Visible variation exists in hand shape and exact contact location:
- one frame uses an open hand spread across the upper chest / emblem region
- one uses a closed or semi-closed fist near the emblem
- another uses an open hand near the upper chest
- another is a similar endpoint-like open-hand placement

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

M2d gives two separate results:

### Carrier / routing PASS

`Explicitly requiring four separate image-generation calls, without exposing a visible four-state list, can produce four standalone portraits and avoid the M2c Python/video-routing divergence.`

This is important because it shows that the model can be constrained to the intended tool path without reintroducing sheetification.

### Temporal semantics FAIL

`Telling the assistant to internally decompose one motion into four calls is not sufficient to make the four calls occupy distinct chronological states.`

The model appears to preserve the global motion goal (`raise hand to chest and stop`) but repeatedly samples endpoint-like interpretations rather than assigning distinct progress states.

This means the remaining problem is no longer primarily the single-frame carrier. It is state-role binding: each call needs a distinct temporal role without globally exposing a four-state sequence to the image generator.

## Next experiment direction

Do not return to visible A/B/C/D lists.
Do not reintroduce board/sheet vocabulary.
Do not remove the explicit four-image-generation requirement, because M2c showed the model may otherwise reroute into Python/video synthesis.

Next test should keep four-call routing but strengthen only the hidden state-role assignment. A clean candidate is an abstract internal progress contract:

- call 1 = motion progress 0% (start)
- call 2 = early progress around one-third
- call 3 = late progress around two-thirds
- call 4 = 100% endpoint

The assistant should convert only the current progress value into one concrete static pose immediately before that call, and the local generation description should still contain only that one static pose. The four progress values should not be printed for the user before generation and should not be passed together to a single image call.

This would test whether abstract hidden temporal-role binding can create true progression without causing M2a-style multi-panel contamination.

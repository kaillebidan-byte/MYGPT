# Incident — frame-first same-turn jobs collapsed into sequence sheets

Date: 2026-08-08
Status: CONFIRMED / current frame-first same-turn architecture rejected pending isolation

## Test goal

After removing the old 2x2 layout-guide path and rewriting Project sources around `1 visual job = 1 frame`, test whether one natural-language one-shot motion request can produce four separate raw frames in one assistant turn.

Canonical used:
- `kokyo_base_20260805.png`
- 1024x1536
- directly attached to the generation chat
- high-resolution pre-processing candidate, not the earlier ~164x372 derivative

Requested motion:
- raise the anatomical right arm toward chest height
- stop at chest height
- one-shot

Expected raw outputs:
- F1: one person / one pose / one portrait image
- F2: one person / one pose / one portrait image
- F3: one person / one pose / one portrait image
- F4: one person / one pose / one portrait image

Repair policy:
- one repair round
- only failed frames regenerated

## Actual result

Every INITIAL generation and every REPAIR generation returned a multi-pose sequence sheet rather than one raw frame.

Count:
- INITIAL jobs: 4 / 4 sheetified
- REPAIR jobs: 4 / 4 sheetified
- total: 8 / 8 sheetified

All eight uploaded generated files were 1254x1254 square images, not portrait single-frame outputs.

Observed sheet artifacts included:
- 2x2 divisions
- white or dark divider lines
- `F1` / `F2` / `F3` / `F4` labels
- `I1` / `I2` / `I3` / `I4` labels
- bare `1` / `2` / `3` / `4` labels
- arrows between cells
- one green-background sequence despite magenta request
- occasional floor/contact shadow or background variation

The per-job prompts explicitly prohibited:
- multiple poses
- sheet
- board
- panel
- split
- 2x2
- numbers
- labels
- arrows
- divider lines

Strengthening the same negative wording in REPAIR did not change the behavior.

## Visual review result

The Project correctly marked all raw frames as invalid:

- identity: FAIL
- state: FAIL
- unintended output: FAIL
- sequence motion semantics: FAIL
- continuity: FAIL
- endpoint: FAIL

The repair round produced no FAIL->PASS transition, so INITIAL remained selected by the existing delta rule.

## What this disproves

The previous working hypothesis was:

> If `four-pose-portrait.png` and direct-2x2 Project sources are removed, four same-turn image-generation jobs can behave as isolated one-pose jobs.

This test disproves that hypothesis for the tested ChatGPT Project path.

Removing the old layout guide and rewriting Sources was not sufficient to obtain per-call visual isolation.

## Strongest interpretation

Do not treat each image-generation call inside one motion turn as an isolated worker.

The image-generation system is evidently still conditioned by broader conversation / task context strongly enough that a local prompt saying `one person / one pose only` is overridden by the overall motion-sequence intent.

This is consistent with the observed behavior:
- all 8 calls independently produced a representation of the overall sequence
- labels varied (`F`, `I`, bare numbers), meaning the exact local anti-label wording was not controlling the global sequence representation
- REPAIR repeated the behavior despite stronger single-frame wording

This does **not** prove that every motion request always yields a sheet. The remaining causal split is:

A. the mere presence of a motion-level request causes sequence-sheet generation, or
B. the Project instruction to run four same-turn generation jobs / the full multi-frame workflow causes the image tool to retain sequence context across calls.

## Next isolation test

Before another architecture rewrite, run exactly one image generation in the actual MYGPT Project with the current high-resolution canonical and current Sources.

Use a static-pose request, not a motion request:

`このキャラクターが、正面を向いたまま右手を胸の高さに置いている全身画像を1枚作ってください。`

No F1/F2/F3/F4 contract, no repair, no board compose, no second image call.

Interpretation:

- If this also returns a sequence sheet:
  current Project Instructions / Sources still contaminate even static single-pose generation; inspect the Project configuration again.

- If this returns one person / one portrait image:
  current Sources can support single-pose generation, and the failure is specifically the same-turn motion/multi-job architecture. Mark `4 image-generation jobs in one motion turn` as REJECTED.

## Do not repeat

- Do not run another 4 INITIAL + 4 REPAIR attempt with only stronger `no sheet / no 2x2` wording.
- Do not claim `1 visual job = 1 frame` is working in ChatGPT Project until the isolation test above passes and a mechanism for actual per-job context isolation is demonstrated.
- Do not blame the canonical image for the sheet behavior; the same high-resolution canonical produced a correct single-person image in the empty-Project isolation test.

## Architectural implication if static-pose isolation passes

The same-turn frame-first design cannot be the production automation without a real isolated worker/subagent or equivalent image-input execution boundary.

Feasible directions then become:
- one generated sequence-source image followed by deterministic cell extraction/recomposition, or
- one user/assistant turn per raw frame (not same-turn automation), or
- an execution environment with true isolated image-generation workers.

Do not choose among these until the static-pose isolation test is recorded.

# Incident — frame-first same-turn jobs collapsed into sequence sheets

Date: 2026-08-08
Status: CONFUNDED / rerun in progress after deleting retained Project chat

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

## Actual result of the first run

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

## Newly discovered confound

After the first run, it was discovered that an older chat remained inside the same ChatGPT Project. That older chat contained repeated generation of four chibi-character poses in 2x2 layouts.

Because Project memory can use other chats inside the same Project as context, the first 8/8 sheetification result was **not cleanly isolated from prior 2x2 conversation history**.

The older 2x2 chat has now been deleted and the same frame-first motion test is being resent.

Therefore the first-run result must not be used to claim either of the following as established facts:

- `same-turn 4 image-generation jobs inherently collapse into sequence sheets`
- `the current 01-05 Project Sources still force 2x2 output`

Both remain hypotheses until the post-deletion rerun is observed.

## What the first run still confirms

Even with the confound, these observations remain factual for that run:

- 8 / 8 generated images were sequence sheets.
- stronger local `one person / one pose / no sheet` wording did not override the active context.
- the model represented the broader motion sequence rather than only the requested local frame state.
- the high-resolution canonical did not prevent sheetification.

This shows that some active context strongly favored sequence-sheet output, but the source of that context was not isolated.

## Current causal split

After discovering the retained old chat, the candidates are now:

A. retained Project chat history with repeated 2x2/chibi outputs contaminated the run;
B. current Project Instructions / Sources still contain enough sequence context to cause sheetification;
C. one motion-level request plus four same-turn image-generation calls causes sequence context to persist across calls;
D. more than one of A-C contributed.

Do not choose among these before the post-deletion rerun result.

## Rerun now in progress

Conditions for the rerun:
- delete the retained old 2x2/chibi Project chat;
- keep the current frame-first Instructions / Sources;
- keep `four-pose-portrait.png` removed from Project Sources;
- use the 1024x1536 high-resolution canonical directly attached to the new generation chat;
- resend the same one-shot motion request and inspect INITIAL outputs separately from any repair outputs.

Interpretation:

- If F1-F4 now become one-person single-pose images:
  - Project chat-history contamination becomes the leading explanation for the previous 8/8 sheet run;
  - same-turn frame-first remains viable and should not be rejected from the first run.

- If F1-F4 still all become sequence sheets:
  - retained chat history was not sufficient to explain the failure;
  - current motion-level/same-turn architecture or remaining Project configuration becomes the next target.

- If behavior is mixed:
  - do not collapse it to PASS/FAIL only;
  - record which call first sheetified and whether later calls followed that pattern, because cross-call conditioning may be occurring within the new chat itself.

## Do not do before rerun result

- Do not add more `no sheet / no 2x2` wording.
- Do not rewrite the architecture again solely from the first 8/8 run.
- Do not mark frame-first as REJECTED yet.
- Do not restore the retired layout guide.
- Do not switch back to low-resolution canonical.

## Follow-up logging rule

When the post-deletion rerun finishes, append the exact result here before changing Project Sources or generation architecture. Record INITIAL F1-F4 separately from REPAIR so the first failure point is not hidden by the repair stage.

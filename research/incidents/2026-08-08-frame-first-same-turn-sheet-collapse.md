# Incident — frame-first same-turn jobs collapsed into sequence sheets

Date: 2026-08-08
Status: STATIC CONTROL PASS / root cause narrowed to motion orchestration context

## Test goal

Test whether one natural-language one-shot motion request can produce four separate raw frames in one assistant turn after removing the retired 2x2 layout-guide path and rewriting Project sources around `1 visual job = 1 frame`.

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

## First run in the old Project

Every INITIAL generation and every REPAIR generation returned a multi-pose sequence sheet rather than one raw frame.

Count:
- INITIAL jobs: 4 / 4 sheetified
- REPAIR jobs: 4 / 4 sheetified
- total: 8 / 8 sheetified

Observed artifacts included:
- 2x2 divisions
- divider lines
- `F1` / `F2` / `F3` / `F4` labels
- `I1` / `I2` / `I3` / `I4` labels
- bare numbers
- arrows
- occasional green background despite magenta request

The per-job prompts explicitly prohibited multiple poses, sheet, board, panel, 2x2, numbers, labels, arrows, and divider lines. Strengthening the same negative wording did not solve the behavior.

## Old-Project confound discovered

An older Project chat was found that contained repeated four-pose chibi 2x2 generations. That chat was deleted and the test was rerun.

After deletion, the old Project still produced sequence sheets for the motion workflow. One later REPAIR F4 call did produce a single portrait frame, proving that same-turn motion context does not make single-frame output impossible in every call, but sheetification remained dominant.

The successful single F4 was not a direct pixel copy of the canonical; it was a strongly anchored redraw/local-pose regeneration.

## Clean new-Project reproduction

A newly created ChatGPT Project was then tested to remove old Project conversation history as a causal factor.

Conditions:
- new Project
- no old Project chats transferred
- retired `four-pose-portrait.png` not used as Project Source
- current frame-first Project Instructions
- current production Sources 01-05
- same 1024x1536 canonical directly attached
- same one-shot motion request

Result:
- sequence-sheet / 2x2 behavior reproduced in the new Project.

Therefore retained old Project chat history is **not sufficient to explain the failure** and is no longer the leading cause.

## Static single-frame control

A static control was then run in the new Project using the same high-resolution canonical and current Project configuration, but without a motion request.

User request:
`このキャラクターが、正面を向いたまま右手を胸の高さに置いている全身画像を1枚作ってください。`

Result:
- one image only
- one person only
- one pose only
- portrait 1024x1536
- no 2x2 sheet
- no labels/dividers
- requested right hand placed at chest height

This is a decisive separation result.

It disproves:
- `the current Project Sources always force 2x2 output`
- `merely being inside the new Project is enough to cause sheetification`
- `the canonical itself causes 2x2 output`

The static output is a redraw, not a direct copy of the canonical. Identity is strongly anchored but non-moving regions are still regenerated at pixel level.

## Strongest current conclusion

The failure is tied to **motion orchestration context**, not ordinary single-pose generation.

Current evidence now points to one or both of:

A. exposing the full four-state workflow (`motion contract`, four chronological states, repeated frame calls) before/during image generation causes the image system to represent the whole sequence in each call;

B. the full Project Instructions repeatedly mention global sequence/layout concepts (`F1-F4`, four jobs, board, 2x2, sheet, compose, audit, repair), so each image-generation call receives too much global multi-frame context even when the local prompt requests only one pose.

The next experiment must distinguish A from B.

## Next isolation experiment

Do not run the full current Instructions again.

### Test B — minimal four-call motion orchestration with zero layout vocabulary

Use temporary Project Instructions containing only:
- current chat's directly attached canonical is the identity reference;
- convert the user's motion into four chronological pose states internally;
- call image generation four times sequentially;
- each image call receives only the canonical identity rule and that call's one pose state;
- do not display or pass the other three states to the image call;
- do not perform repair or audit during this experiment.

Crucially, the temporary Instructions must contain **none** of these concepts or words:
- board
- sheet
- panel
- 2x2
- compose
- grid
- layout guide
- Python compose
- machine audit
- repair
- comparison
- F1/F2/F3/F4 as visible generation labels

The four states can be represented internally as `state_a` through `state_d` or equivalent, but image prompts must receive only one state at a time.

Interpretation:
- Test B PASS -> current full Instructions/Sources contaminate generation context; redesign production orchestration so layout/audit vocabulary is unavailable until generation finishes.
- Test B FAIL -> four-state same-turn motion orchestration itself is enough to trigger sequence representation in this Project path; per-frame same-turn automation is unreliable without a true isolated execution boundary.

## Do not repeat

- Do not add more `no sheet / no 2x2` wording to the current full Instructions.
- Do not blame old Project chat memory as the main cause after the new-Project reproduction.
- Do not treat `1 visual job = 1 frame` as demonstrated just because one repair call escaped into a single frame.
- Do not restore `four-pose-portrait.png`.
- Do not switch back to low-resolution canonical.
- Do not rerun the full 4 INITIAL + repair workflow before Test B.

## Architectural implication

Generation-facing context and post-generation/audit context must be separated as much as the ChatGPT Project execution model permits.

The static-control PASS proves the image model can produce a correct single-pose portrait in the same new Project. The unresolved question is whether removing global layout/audit vocabulary is enough to preserve that behavior across four same-turn motion calls.

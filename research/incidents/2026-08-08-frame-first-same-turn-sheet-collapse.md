# Incident — frame-first same-turn jobs collapsed into sequence sheets

Date: 2026-08-08
Status: CONFIRMED reproduction in a newly created Project; root cause narrowed to current workflow context

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

## What is now ruled down

The following explanation is now weak:

> The old Project's historical 2x2/chibi chats were the primary reason the current frame-first workflow kept returning 2x2 sheets.

The behavior reproduces in a newly created Project with the current configuration.

## Strongest current hypothesis

The current Project Instructions / Sources themselves expose too much global sequence structure to the image-generation call.

In particular, `project/instructions/post-generation-review-test.md` explicitly contains the entire workflow before image generation begins:

`canonical -> motion contract -> F1 -> F2 -> F3 -> F4 -> Python compose -> audit -> repair`

The same Instructions repeatedly mention concepts such as:
- F1-F4
- four image-generation jobs
- 2x2 board
- sheet / board / panel
- compose four frames
- repair selected frames

Many of those terms appear inside negative rules (`do not make a sheet`, `do not make 2x2`). This may still prime the image-generation system with the global multi-pose representation even when the local frame prompt requests one person and one pose.

This is a hypothesis about active context, not a claim about undocumented platform internals. The evidence is:
- empty/minimal Project static single-pose generation succeeded;
- full current Project motion workflow reproduces sheetification even in a new Project;
- stronger local negative wording does not reliably override it;
- one REPAIR F4 call escaped to a single frame, so the behavior is probabilistic/context-sensitive rather than a hard format constraint.

## Next isolation experiment

Do **not** run another full 4 INITIAL + 4 REPAIR test yet.

Use a newly created or clean test Project and change only the orchestration context.

### Test A — minimal single-frame static control
Project Instructions:
- only canonical identity rule
- one person / one pose / one portrait image
- no motion workflow, no F labels, no board/compose/audit language

User request:
`このキャラクターが、正面を向いたまま右手を胸の高さに置いている全身画像を1枚作ってください。`

Expected: one portrait frame.

### Test B — minimal four-call motion orchestration with no board vocabulary
If A passes, use a minimal temporary Instructions file that says only:
- internally derive four chronological pose states from one motion request;
- call image generation four times;
- each call receives only canonical identity + that call's one pose state;
- do not mention any other states inside the image prompt;
- no audit, compose, board, sheet, panel, 2x2, F1-F4 display labels, repair, or Python text before all four image calls finish.

The generation-facing context should contain no board/sheet terminology at all.

Interpretation:
- A PASS, B PASS -> current full Instructions/Sources are contaminating generation context; redesign orchestration to keep audit/board vocabulary out of the pre-generation context.
- A PASS, B FAIL -> four-call motion orchestration itself is enough to trigger sequence representation; same-turn frame-first is not reliable without a true isolated execution boundary.
- A FAIL -> even minimal current Project static generation is contaminated; inspect Project setup before any motion architecture work.

## Do not repeat

- Do not add more `no sheet / no 2x2` wording to the current full Instructions.
- Do not blame old Project chat memory as the main cause after the new-Project reproduction.
- Do not treat `1 visual job = 1 frame` as demonstrated just because one repair call happened to escape into a single frame.
- Do not restore `four-pose-portrait.png`.
- Do not switch back to low-resolution canonical.

## Architectural implication

The likely design error is that orchestration, audit, and output-layout rules were all placed in Project context before image generation. For the next design, generation-facing context and post-generation/audit context must be separated as much as the ChatGPT Project execution model permits.

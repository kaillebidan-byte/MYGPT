# Incident — frame-first same-turn jobs collapsed into sequence sheets

Date: 2026-08-08
Status: M1 PASS / M2a visible-four-state FAIL / next: M2b accumulation isolation

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

## Follow-up M1 — motion request + one image call

A completely clean isolation Project was used with:
- Project Sources 0
- no retired layout image
- directly attached high-resolution canonical
- minimal single-static-pose Instructions
- the same natural-language one-shot motion request
- one image-generation call only

Result:
- one image
- one person
- one pose
- portrait
- no 2x2
- no labels/dividers
- anatomical right arm active
- identity strongly anchored

M1 therefore PASSed.

This rejects the stronger hypothesis that **the presence of a motion request by itself necessarily sheetifies the first image call**.

Detailed record:
- `research/experiments/2026-08-08-m1-motion-context-single-call.md`

## Follow-up M2a — visible four-state plan

The intended next test was supposed to keep the other three states out of each image call. However, the test instruction given to the user mistakenly told them to paste POSE A/B/C/D together into one message.

This introduced a confound, so the result is recorded separately as M2a rather than as the planned M2.

Condition:
- separate clean Project from M1
- Sources 0
- directly attached high-resolution canonical
- minimal Instructions
- the motion request plus four named chronological static poses were all visible in the same user message before generation

Observed uploaded outputs from the generation session:
- three explicit 2x2 sequence sheets
- four later standalone portraits produced during recovery attempts

The three sheets included:
- four poses in one image
- central vertical/horizontal dividers
- visible `POSE A`, `POSE B`, `POSE C`, `POSE D` labels
- label styling that changed across retries

This is strong evidence that the generation system absorbed the visible four-state structure and pose names into the composition instead of treating them as independent output jobs.

The later standalone portraits do not make this run a PASS. Recovery prompts introduced strong negative layout wording and one path explicitly requested extraction of the upper-right POSE B from a generated four-way image. That recovery architecture is outside the intended frame-first test and should not be treated as production evidence.

Detailed record:
- `research/experiments/2026-08-08-m2a-visible-four-state-sheet-collapse.md`

## Strongest current conclusion

The failure is tied to **multi-state orchestration context**, not ordinary single-pose generation and not motion wording alone.

Current evidence supports the following hierarchy:

1. Static single-pose request: standalone portrait PASS.
2. Natural-language motion request + one image call: standalone portrait PASS.
3. Full production workflow with global four-state / layout / audit context: strong sheetification.
4. Minimal Project but all four named chronological states exposed together before generation: strong sheetification.

Therefore a leading trigger is now **global multi-state exposure before/during image generation**.

Still unresolved:
- whether repeated same-chat image calls alone cause contamination when the conversation never exposes a global four-state plan;
- whether automated one-turn four-call orchestration can keep generation-facing context local enough to avoid sheetification.

## Next isolation experiment — M2b

Do not run the full current Instructions again.

Use another completely new Project.

Keep:
- Project Sources 0
- no `four-pose-portrait.png`
- high-resolution canonical directly attached
- minimal Instructions that only describe one current static pose at a time
- no repair, audit, Python compose, or post-generation correction

Run four user turns in the same chat. Each turn requests only one static pose.

Do **not** tell the model that the four turns form one motion or four chronological states. Do not use `POSE A/B/C/D` labels in the actual generation text.

Turn 1:
- neutral front-facing full-body stance
- both arms naturally down

Turn 2:
- same character
- anatomical right elbow lightly bent
- right hand to upper abdomen / solar plexus
- left arm, legs, torso, head, expression preserved

Turn 3:
- same character
- anatomical right elbow bent further
- right hand just below the chest flower emblem
- not yet endpoint
- other body regions preserved

Turn 4:
- same character
- anatomical right hand at chest-emblem area
- stopped endpoint
- other body regions preserved

Interpretation:
- 4/4 standalone portraits -> repeated same-chat calls / progressive pose changes alone are not sufficient. Global four-state exposure becomes the stronger trigger.
- first call standalone, later calls sheetify -> accumulating same-chat image context is a causal candidate.
- first call sheetifies -> inspect Project setup for contamination before drawing a new conclusion.

If M2b PASSes, proceed to M2c in another clean Project: restore one natural-language motion request and automated four-call orchestration, but never visibly enumerate all four states before the first image call.

## Do not repeat

- Do not add more `no sheet / no 2x2` wording to the current full Instructions.
- Do not blame old Project chat memory as the main cause after the new-Project reproduction.
- Do not treat `1 visual job = 1 frame` as demonstrated just because one repair call escaped into a single frame.
- Do not restore `four-pose-portrait.png`.
- Do not switch back to low-resolution canonical.
- Do not rerun the full 4 INITIAL + repair workflow.
- Do not treat M2a recovery portraits as evidence that visible four-state orchestration succeeded.
- Do not expose all four named states together again when testing accumulation-only behavior.

## Architectural implication

Generation-facing context and post-generation/audit context must be separated as much as the ChatGPT Project execution model permits.

The static control and M1 show that the image system can make a single-pose portrait even when the user's high-level intent is motion. M2a shows that exposing the full named four-state structure before generation strongly pushes the same system toward multi-panel representation.

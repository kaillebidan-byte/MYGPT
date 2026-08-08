# Incident — frame-first same-turn jobs collapsed into sequence sheets

Date: 2026-08-08
Status: M1 PASS / M2a visible-four-state FAIL / M2b repeated-static PASS / next: M2c hidden orchestration

## Test goal

Test whether one natural-language one-shot motion request can produce four separate raw frames after removing the retired 2x2 layout-guide path and isolating generation-facing context.

Canonical used:
- `kokyo_base_20260805.png`
- 1024x1536
- directly attached to generation chats
- high-resolution pre-processing candidate, not the earlier ~164x372 derivative

Requested motion:
- raise the anatomical right arm toward chest height
- stop at chest height
- one-shot

Expected production raw outputs:
- four separate portrait images
- one person / one pose per image

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

Therefore retained old Project chat history is not sufficient to explain the failure and is no longer the leading cause.

## Static single-frame control

A static control was run in the new Project using the same high-resolution canonical and current Project configuration, but without a motion request.

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

This disproved:
- `the current Project Sources always force 2x2 output`
- `merely being inside the new Project is enough to cause sheetification`
- `the canonical itself causes 2x2 output`

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

M1 PASSed.

This rejects the stronger hypothesis that the presence of a motion request by itself necessarily sheetifies the first image call.

Detailed record:
- `research/experiments/2026-08-08-m1-motion-context-single-call.md`

## Follow-up M2a — visible four-state plan

The intended next test was supposed to keep the other three states out of each image call. However, the test instruction mistakenly told the user to paste POSE A/B/C/D together into one message.

This introduced a confound, so the result is recorded separately as M2a.

Condition:
- separate clean Project from M1
- Sources 0
- directly attached high-resolution canonical
- minimal Instructions
- motion request plus four named chronological static poses all visible in the same user message before generation

Observed uploaded outputs:
- three explicit 2x2 sequence sheets
- four later standalone portraits produced during recovery attempts

The three sheets included:
- four poses in one image
- central vertical/horizontal dividers
- visible `POSE A`, `POSE B`, `POSE C`, `POSE D` labels
- different label styling across retries

This is strong evidence that the generation system absorbed the visible four-state structure and pose names into the composition instead of treating them as independent output jobs.

The later standalone portraits do not make this run a PASS. Recovery prompts introduced strong negative layout wording and one path explicitly requested extraction of one quadrant from a generated four-way image.

Detailed record:
- `research/experiments/2026-08-08-m2a-visible-four-state-sheet-collapse.md`

## Follow-up M2b — repeated same-chat static calls without global plan

A third completely new Project isolated repeated-call accumulation.

Conditions:
- Project Sources 0
- same high-resolution canonical reattached on every generation turn
- same chat for all four turns
- each turn requested only one static pose
- no `motion`, `one-shot`, `sequence`, `four states`, `POSE A/B/C/D`, board/sheet/panel/2x2/compose/audit/repair vocabulary in generation requests
- previous generated images were not promoted to identity canon

Chronological outputs:
1. neutral stance, both arms down
2. anatomical right hand raised toward upper abdomen / waist
3. anatomical right hand raised below the chest emblem
4. anatomical right hand raised to chest-emblem area

Result:
- 4 / 4 standalone portraits
- 4 / 4 one person
- 4 / 4 one pose
- no 2x2
- no divider
- no labels / numbers / arrows
- no active-limb left/right swap

Pose semantics were not perfect: the second frame's hand was somewhat lower than the intended solar-plexus target. Identity also drifted in proportions, sleeve silhouette, hand visibility, waist attachments, and occlusion relationships. Those are separate identity/continuity problems, not carrier failure.

Detailed record:
- `research/experiments/2026-08-08-m2b-repeated-static-calls-pass.md`

## Strongest current conclusion

The failure is tied to global multi-state / sequence-level context, not ordinary single-pose generation, motion wording alone, or repeated same-chat image calls alone.

Current separation results:

1. Static single-pose request -> standalone portrait PASS.
2. Natural-language motion request + one image call -> standalone portrait PASS.
3. Minimal Project + all four named chronological states exposed together -> repeated labeled 2x2 sheet FAIL.
4. Same chat + four sequential static-pose requests with no global four-state exposure -> 4/4 standalone portrait PASS.
5. Full production workflow with global four-state / layout / audit vocabulary -> dominant sheetification.

Therefore the strongest current trigger candidate is:

**global four-state / sequence intent being available to the generation-facing rewrite before or during individual image calls.**

Repeated same-chat calls by themselves are no longer a leading explanation.

Still unresolved:
- whether one natural-language motion request can be automatically decomposed internally into four states while keeping each generation-facing call local;
- whether assistant-internal planning leaks through prompt rewriting even when the full state list is never displayed;
- how to preserve identity / sleeve topology / waist attachments across independent portrait generations after sheetification is solved.

## Next isolation experiment — M2c

Use another completely new Project.

Target:
- user provides only one natural-language motion request
- assistant internally chooses four chronological static states
- assistant does not display the four-state list before generation
- image generation is called four times
- each image call deals only with its current concrete static pose
- no board/sheet/panel/2x2/compose/audit/repair vocabulary during generation
- high-resolution canonical is the identity reference; generated frames do not become canon

Interpretation:
- 4/4 standalone portraits -> hidden/local frame-first orchestration is viable. Current full production Instructions/Sources become the stronger contamination source.
- sheetification returns -> assistant-internal four-state planning is likely reaching generation-facing context through conversation-level prompt rewriting; a stronger isolation boundary may be needed.

Do not add chroma, audit, repair, or Python compose until M2c decides the carrier architecture.

## Do not repeat

- Do not add more `no sheet / no 2x2` wording to the current full Instructions.
- Do not blame old Project chat memory as the main cause after the new-Project reproduction.
- Do not restore `four-pose-portrait.png`.
- Do not switch back to low-resolution canonical.
- Do not rerun the full 4 INITIAL + repair workflow.
- Do not treat M2a recovery portraits as evidence that visible four-state orchestration succeeded.
- Do not expose all four named states together again when testing hidden orchestration.
- Do not treat M2b identity drift as evidence of sheetification; carrier and identity are separate axes.

## Architectural implication

Generation-facing context and post-generation/audit context must be separated as much as the ChatGPT Project execution model permits.

M1 and M2b show that single-pose portrait generation remains stable even with motion-adjacent work and repeated calls. M2a shows that exposing a global four-state representation strongly pushes the system toward a multi-panel representation. The next production question is whether the conversation model can keep the global plan private enough that only one static pose reaches each image generation call.

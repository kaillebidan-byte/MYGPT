# M2e — hidden progress contract restores temporal roles but regresses to sheets

Date: 2026-08-08
Status: REPRODUCIBLE FAIL for single-frame carrier / useful temporal-semantics result

## Goal

Keep the concrete four-pose list hidden while assigning four internal progress roles:
- 0%
- ~35%
- ~70%
- 100%

The assistant was instructed to generate one image at a time, sequentially, and to keep each local generation description limited to the current static pose.

## Conditions

- completely new isolation Project
- Project Sources 0
- high-resolution canonical `kokyo_base_20260805.png` directly attached
- no retired `four-pose-portrait.png`
- no production compose/audit/repair pipeline
- Instructions explicitly required four sequential still-image generations
- Instructions also contained a hidden four-step progress contract: 0 / 35 / 70 / 100 percent
- user sent one natural-language one-shot motion request

## First run

User observed before stopping:
- 7 split / multi-pose outputs
- 2 standalone outputs during later autonomous recovery

The assistant repeatedly strengthened local repair wording around the start pose, including prohibitions against:
- four-way split
- continuous poses
- collage
- multiple people
- motion sheet
- 2x2
- comparison diagram
- character sheet
- split layout

The later standalone outputs occurred only after this autonomous recovery loop. They do not count as success of the original M2e condition.

The run was stopped before all intermediate images could be saved. Operational lesson: when an experiment is already a FAIL but image evidence is still being produced, save each output as soon as it appears before stopping.

## Re-run

The same request was resent under the same condition.
The first outputs again followed the split-image pattern, so the behavior was judged sufficiently reproduced. The user saved the available outputs and stopped early.

Three saved generated images from the re-run are all explicit 2x2 / four-pose compositions.

Carrier/layout observations:
- 3/3 saved outputs are four-pose sheets
- each image contains four renditions of the character
- clear 2x2 spatial organization
- some attempts have strong central whitespace/division structure even without printed labels
- no evidence in the saved set of a clean one-person one-pose portrait carrier

## Important temporal-semantics observation

Unlike M2d, the 2x2 sheets generally show a recognizable chronological progression inside each single generated image:
- upper-left: neutral / arms-down start
- upper-right: early raise
- lower-left: later raise toward chest
- lower-right: chest-height endpoint or near-endpoint

Exact hand shape and intermediate height vary, but the intended 0% -> intermediate -> endpoint ordering is much more visible than in M2d.

This means the hidden progress contract likely improved **state-role binding**, while simultaneously making the overall four-state structure salient enough to collapse back into a multi-panel carrier.

## Comparison with M2d

M2d:
- four standalone portrait outputs observed
- no sheetification
- but all outputs clustered near endpoint-like poses
- temporal decomposition failed

M2e:
- temporal progression is visibly encoded
- start and intermediates are distinguishable inside the generated composition
- but the four temporal roles are bundled into one 2x2 image repeatedly

Therefore the current problem is not simply that the model cannot understand four temporal roles.
It can understand them, but when the four roles are made sufficiently explicit at the orchestration level, the image system tends to represent the whole set together.

## Current interpretation

The experiments now expose a tradeoff:

- weak/global-hidden temporal role specification -> single-image carrier survives but frames collapse toward endpoint variants
- strong four-role progress specification -> temporal semantics improve but carrier isolation collapses into sequence sheets

This supports the hypothesis that conversation-level orchestration information is leaking into generation-facing intent even when the local image description is supposed to contain only one static pose.

## Operational rule added

For future experiments:
- save every generated image immediately when it appears
- if FAIL is already established, stopping is allowed only after desired evidence has been saved
- distinguish outputs produced before autonomous repair from outputs produced after negative-layout repair prompts
- do not count repair-escaped standalone images as success of the original condition

## Next design implication

Do not retry M2e by adding more negative sheet vocabulary.
Do not expose stronger four-role wording globally.

A next useful test should look for a real execution boundary between:
1. motion/state planner
2. single-frame image generator

If ChatGPT Project natural-language Instructions cannot keep hidden progress/state information out of the generation-facing context, a true isolated worker or external orchestrator may be required.

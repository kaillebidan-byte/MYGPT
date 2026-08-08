# M2b — repeated same-chat static calls without global plan

Date: 2026-08-08
Status: PASS for standalone portrait carrier

## Goal

Test whether repeated image-generation calls in the same chat are sufficient to cause sequence-sheet / 2x2 collapse when the model is never told that the four requests are states of one motion.

This condition follows M2a, where exposing POSE A/B/C/D together before generation strongly induced 2x2 labeled sheets.

## Conditions

- completely new Project, separate from M1 and M2a
- Project Sources: 0
- retired `four-pose-portrait.png`: absent
- same high-resolution canonical `kokyo_base_20260805.png`
- canonical reattached on every generation turn
- same chat for all four generation turns
- no `motion`, `one-shot`, `sequence`, `four states`, `POSE A/B/C/D`, `board`, `sheet`, `panel`, `2x2`, `compose`, `audit`, or `repair` vocabulary in the actual generation requests
- each turn described only one static pose
- no generated frame was promoted to canonical or explicitly supplied as the visual reference for the next call

Chronological outputs by timestamp:

1. `17_01_48` — neutral front-facing stance, both arms down
2. `17_01_56` — anatomical right arm raised toward upper abdomen / solar-plexus region
3. `17_02_04` — anatomical right hand raised below the chest flower emblem
4. `17_02_11` — anatomical right hand raised to the chest-emblem region

All files are 1024x1536 RGBA.

## Output-form result

4 / 4 generations are standalone portrait images.

For every call:
- one image object
- one person
- one pose
- portrait
- no 2x2
- no divider
- no labels / numbers / arrows
- no explicit multi-pose or comparison composition

Therefore repeated same-chat image calls alone were not sufficient to reproduce the sequence-sheet failure under this minimized context.

## Pose semantics

Call 1:
- neutral standing pose is correct
- both arms remain down

Call 2:
- anatomical right arm is correctly selected (viewer-left)
- hand is raised, but appears somewhat lower than the intended upper-abdomen / solar-plexus target, closer to belt / upper-waist height
- still usable as an early intermediate state conceptually, but not a strict pose-spec PASS

Call 3:
- anatomical right arm remains active
- hand reaches below / near the lower edge of the chest emblem
- reasonably matches the requested late intermediate state

Call 4:
- anatomical right arm remains active
- hand reaches the chest-emblem area
- endpoint semantics are substantially correct

No active-limb left/right swap is visible in this run.

## Identity observations

Identity remains strongly recognizable across all four calls, but the outputs are redraws and not strict structure-preserving edits.

Relatively stable:
- front-facing overall identity
- hat and orange top ornament
- hair / face framing
- chest flower emblem
- waist medallion and major hanging ornament group
- lower-garment concept
- boots

Drift / redraw differences:
- body proportions are somewhat taller / slimmer than the canonical
- sleeve openings and hand visibility change substantially across calls
- the canonical's very large sleeve silhouette is simplified / reinterpreted
- waist cords / tassels / attachment and occlusion relations vary
- inactive-side sleeve silhouette changes between frames
- background changed from canonical green to white because this M2b isolation did not preserve chroma as a controlled variable

These are identity / continuity issues and are not scored as carrier failure for M2b.

## Interpretation

M2b PASS.

Evidence now rejects the stronger hypothesis:

`Simply making four image calls in the same chat is sufficient to trigger 2x2 / sequence-sheet output.`

Together with M2a:

- M2a: visible four-state plan before generation -> repeated explicit 2x2 labeled sheets
- M2b: four sequential static requests with no visible global plan -> 4/4 standalone portraits

This strongly elevates **global multi-state exposure / sequence-level intent** as the leading trigger for sheetification.

The remaining unresolved production question is whether the conversation model can receive one natural-language motion request and internally orchestrate four calls without leaking the four-state plan into generation-facing context.

## Next test: M2c — one motion request, hidden/local four-call orchestration

Use another completely new Project.

Target condition:
- user gives only the natural-language motion request
- assistant internally chooses four chronological static states
- assistant does not display the full four-state list before the first generation
- image call 1 receives only state 1 static-pose content
- image call 2 receives only state 2 static-pose content
- image call 3 receives only state 3 static-pose content
- image call 4 receives only state 4 static-pose content
- no board/sheet/panel/2x2/compose/audit/repair vocabulary during generation
- canonical is directly attached / reattached as needed; generated frames do not become identity canon

Interpretation:
- 4/4 standalone portraits -> automated hidden-state frame-first orchestration is viable; current full production Instructions/Sources are the stronger contamination source.
- sheetification returns despite no visible four-state list -> assistant-internal motion planning is likely leaking through prompt rewriting / conversation context; true isolation boundaries may be required.

Do not add chroma, audit, repair, or Python compose until the carrier behavior is decided.

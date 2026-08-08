# M2a — visible four-state plan collapses into sequence sheets

Date: 2026-08-08
Status: FAIL for direct four-state exposure / useful separation result

## Why this is M2a rather than the planned M2

The previously recorded M2 design required each image-generation call to receive only its own concrete static pose and not the other three states.

However, the test instruction given immediately before this run mistakenly told the user to paste POSE A/B/C/D together in one message. This exposed the entire four-state chronological plan to the conversation before image generation.

Therefore this run does **not** cleanly test repeated same-chat calls with local-only pose prompts. It is preserved as a separate condition: `M2a = visible four-state exposure`.

## Conditions

- separate clean Project from M1
- Sources 0
- high-resolution canonical `kokyo_base_20260805.png` directly attached
- minimal Project Instructions
- user message explicitly contained the one-shot motion plus POSE A, B, C, D descriptions together
- no production Sources / Python compose / audit pipeline

## Uploaded outputs

The uploaded run contains seven new 1024x1536 outputs from the 16:49 generation session.

Observed output forms in the presented set:
- three outputs are explicit 2x2 sequence sheets
- four outputs are standalone portraits produced during subsequent recovery attempts

The three sheet outputs contain:
- four characters / four poses in one image
- central vertical and horizontal dividers
- visible `POSE A`, `POSE B`, `POSE C`, `POSE D` labels
- different label styling across attempts (plain white text, boxed text, outlined text)

This is strong evidence that the visible four-state vocabulary was not merely ignored: the generation system incorporated the pose names and four-state structure into the image composition.

## Recovery behavior

The visible follow-up generation instructions included increasingly local repair wording such as:

- generate only POSE A as one image
- generate only POSE B as one image
- do not draw four-way split / comparison / labels / other poses
- extract only the upper-right POSE B from the immediately preceding four-way image and remove labels/dividers

Standalone portraits eventually appeared.

These later portraits do **not** make M2a a PASS because:
- the initial multi-state generation already collapsed into sheets;
- recovery added negative layout vocabulary that the isolation test was meant to avoid;
- one recovery path explicitly used quadrant extraction from a generated sheet, which is not the frame-first production architecture;
- autonomous repair/retry was excluded from the intended M2 condition.

The standalone recoveries are still useful evidence that single portraits remain possible in the same broader context. The behavior is context-sensitive rather than an absolute hard prohibition.

## Pose / identity observations

Across the sheets, the intended anatomical right arm is generally the active arm; the dominant failure in this run is output representation, not the earlier left/right swap failure.

The chronological hand position varies among the three sheet attempts, so pose-state semantics are not fully stable. Some intermediate poses rise too high toward the chest relative to the requested upper-abdomen / below-emblem staging.

Identity remains visually anchored at a coarse level, but sheet generation rescales the character and changes sleeve/hand/waist occlusion relationships. These outputs should not be promoted to canonical identity references.

## Interpretation

Confirmed for this tested condition:

`Exposing all four named chronological states in the same conversation before generation strongly induces a 2x2 / multi-panel representation.`

Not yet determined:
- whether repeated image calls alone cause sheetification when no global four-state plan is visible;
- whether one-turn orchestration can keep each generation-facing prompt local while the conversation model internally knows it must produce four outputs;
- whether same-chat accumulation across A -> B -> C -> D is sufficient without any explicit global sequence vocabulary.

## Next test: M2b — accumulation without global plan

Use another completely new Project.

Keep:
- Sources 0
- same high-resolution canonical directly attached
- minimal single-static-pose Instructions
- no motion / one-shot / sequence / four-state / board / sheet / panel / 2x2 / compose / audit / repair vocabulary in generation requests

Run four user turns in the same chat, one static pose per turn:

1. A only — neutral front-facing stance, both arms down.
2. B only — anatomical right hand to upper abdomen / solar plexus.
3. C only — anatomical right hand below chest emblem, not endpoint.
4. D only — anatomical right hand at chest-emblem area.

Do not tell the model these are four states of one motion. Do not use POSE A/B/C/D labels in the actual generation requests; those names are experiment bookkeeping only.

Interpretation:
- 4/4 standalone portraits -> repeated same-chat calls / progressive pose changes alone are not sufficient; global four-state exposure becomes the leading trigger.
- first call standalone, later calls sheetify -> same-chat accumulation itself is causal candidate.
- first call sheetifies despite no global plan -> unexpected contamination; inspect Project/chat setup before further inference.

If M2b passes, proceed to a separate M2c that restores one user motion request and automated four-call orchestration without visibly enumerating all four states before the first image call.

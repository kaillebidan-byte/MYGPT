# M1 — motion context + single image call

Date: 2026-08-08
Status: PASS for single-portrait isolation

## Goal

Test whether the existence of a natural-language motion request by itself is enough to collapse one image-generation call into a multi-pose / 2x2 sequence sheet.

This test intentionally stops after one image call. It does not test four-call orchestration yet.

## Conditions

- completely new isolation Project
- no old chats
- Project Sources: 0
- retired `four-pose-portrait.png`: absent
- high-resolution canonical `kokyo_base_20260805.png` directly attached to the generation chat
- canonical size: 1024x1536
- minimal Project Instructions only
- no production board / sheet / panel / 2x2 / compose / audit / repair workflow
- user request: `このキャラクターが、右手を胸の高さまで上げて、その位置で止まるone-shotモーションを作ってください。`
- one image-generation call only

## Observed output

Uploaded result checked against the canonical.

Layout / output form:
- one image object
- one person
- one pose
- portrait
- no 2x2
- no divider
- no labels / numbers / arrows
- no multi-pose sequence representation

Pose:
- the character's anatomical right arm (viewer-left arm) is raised
- the hand reaches the chest / flower-emblem area
- the inactive side remains down
- the generated pose is closer to the requested stopping endpoint than to the earlier intermediate `mizo-ochi` pose used in the proposed M1 observation point

This endpoint choice is not treated as M1 failure because the actual user request described the complete motion and M1's primary dependent variable is sheetification vs single portrait.

## Identity inspection

Strongly preserved:
- overall proportions and body scale
- front-facing silhouette
- hat main shape and orange top ornament
- hair arrangement and face framing
- chest flower emblem
- waist medallion location and main topology
- viewer-right inactive large sleeve silhouette
- lower garment silhouette and hem structure
- shoes
- major tassel / cord group on viewer-right waist

Pose-dependent / changed region:
- viewer-left sleeve and arm region is substantially redrawn to follow the raised anatomical-right arm
- some viewer-left waist ornament visibility changes because the raised sleeve overlaps that area

No obvious left/right active-limb swap is present in this result.

## Pixel-level note

The canonical file is 1024x1536; the generated result is 1024x1535.
After aligning the common 1535-row area, only about 0.32% of pixels are exactly identical. The output is therefore not a direct pixel copy of the canonical even though visual identity is strongly anchored.

## Chroma note

The generated result uses the same green background family as the canonical.
This is not scored as a chroma failure for M1 because the actual test request did not explicitly pass the magenta-background requirement into this isolated condition. Chroma remains a later independent requirement.

## Interpretation

M1 PASS.

Evidence now rejects the stronger hypothesis:

`a natural-language motion request alone necessarily causes the first image call to become a 2x2 / sequence sheet.`

The remaining leading hypothesis moves downstream:
- explicit four-state planning,
- repeated same-chat image calls,
- or other orchestration context introduced when the system tries to fulfill the motion as multiple chronological outputs.

This result is consistent with the earlier static control but is stronger because the user request itself contains motion intent.

## Next test: M2

Use a separate completely new Project.

Keep:
- Sources 0
- direct high-resolution canonical attachment
- minimal Instructions
- no board / sheet / panel / 2x2 / compose / audit / repair vocabulary

Change only one factor:
- explicitly plan four concrete chronological static poses and perform four image calls in the same chat.

Each image call should receive only its own concrete static pose description, not the other three states.

Record for each call:
- call index 1-4
- single portrait vs multi-pose sheet
- active-limb correctness
- pose-state correctness
- identity structural drift

Interpretation:
- 4/4 single portraits -> four-state same-chat orchestration can work under minimized context; full production Instructions/Sources remain the stronger contamination source.
- call 1 single, later calls sheetify -> accumulation from previous calls / sequence plan is a strong candidate.
- call 1 already sheetifies -> explicit four-state planning itself is sufficient to trigger sequence representation.
- mixed non-monotonic behavior -> probabilistic context contamination rather than a hard rule.

Do not add repair, audit, Python compose, or post-generation correction during M2.

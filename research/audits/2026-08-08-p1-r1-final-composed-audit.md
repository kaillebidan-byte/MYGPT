# P1-R1 — mirrored unilateral final composed audit

Date: 2026-08-08 JST
Status: FINAL PASS AFTER LOCAL B RETRIES / FIRST-PASS FAILURE RETAINED

## Purpose

Production v0 generalization gate R1.
The controlled change from R0 is active-side mirroring from anatomical-right to anatomical-left while keeping the same minimal Custom GPT / Instant worker global configuration.

## Final selected sequence

- F1 = canonical `kokyo_base_20260805.png`
- F2 = A2 `ChatGPT Image 2026年8月8日 20_29_13 (2).png`
- F3 = B2 `ChatGPT Image 2026年8月8日 20_39_04.png`
- F4 = C `ChatGPT Image 2026年8月8日 20_31_39.png`

First-pass B and retry-1 B remain recorded as failures. They are not rewritten as first-pass PASS.

## Raw visual audit

### Carrier / side selection — PASS

All selected generated frames:
- one person
- one pose
- full body
- portrait 1024x1536
- no 2x2 / grid / divider / label / number
- anatomical-left arm is active (viewer-right)
- anatomical-right arm stays non-active/down

No side swap.

### Motion semantics — PASS

Final sequence reads monotonically:
1. F1 canonical: both arms down / neutral
2. F2 A2: anatomical-left hand at upper-waist / lower-torso early state
3. F3 B2: anatomical-left hand at lower-chest line, clearly above F2 but below the chest flower
4. F4 C: anatomical-left hand reaches / overlaps chest flower endpoint

B2 does not touch or overlap the chest flower.
Endpoint occurs only at F4.
No endpoint reversion.

### Identity / topology — PASS

No production-blocking failure found in:
- proportions / major silhouette
- hat / hair relation
- non-active anatomical-right sleeve
- chest flower except intended F4 hand occlusion
- waist medallion
- major tassel / cord layout
- lower garment
- shoes

### Active anatomical-left large sleeve — PASS

Across F2/F3/F4, the active sleeve changes orientation and foreshortening with the arm pose but retains the same large-sleeve construction:
- opening remains readable
- gold trim remains coherent
- grey inner lining remains present
- sleeve motif remains attached to the same sleeve topology

F3 is more foreshortened than F2/F4, but not reinterpreted into a different sleeve structure.

### Visible left hand — PASS

Selected frames use a broadly compatible lightly extended articulation.
No fist / dramatic splay regression.
The hand path is readable without switching anatomical side.

## Retry history

First-pass B:
- FAIL because hand already overlapped chest flower.

Retry-1 B `20_36_21`:
- FAIL because fingertips still overlapped the lower part of chest flower.

Retry-2 B `20_39_04`:
- PASS after changing the positive spatial landmark from `flower directly below` to the lower-chest / white-garment lower edge region.

Interpretation:
- failures were local hand-to-landmark spatial-compliance failures
- carrier, side selection, isolation and broad identity remained stable
- no worker global instruction change was needed
- do not convert the local retry wording into new global worker prose

## Deterministic processing

Current-main processing behavior was applied to the selected final sequence.

Chroma removal:
- `remove_chroma_key.py`
- detected green key per frame
- dominant-channel despill enabled

Despill pixel counts:
- F1: 4068
- F2: 3466
- F3: 3628
- F4: 3278

White and black composite review:
- no production-blocking green fringe found
- thin residual antialias variation is not judged blocking

2x2 deterministic compose:
- output size: 1024x1536
- common scale: ~0.4394993
- outer margin: 48
- center gap X: 96
- center gap Y: 112
- slot padding: 16

Placed bboxes:
- F1: [116, 64, 395, 696]
- F2: [632, 64, 904, 696]
- F3: [132, 840, 379, 1472]
- F4: [644, 840, 891, 1472]

## Machine geometry / chroma audit

All current flags false:
- wrong_aspect: false
- outer_edge_contact: false
- center_vertical_contamination: false
- center_horizontal_contamination: false
- divider_like_vertical_white_band: false
- divider_like_horizontal_white_band: false
- border_not_uniform: false
- background_not_uniform: false
- shadow_like_background: false

Additional signals:
- aspect ratio: 0.666667
- border key match ratio: 1.0
- outer-edge non-chroma pixels: 0
- vertical center gap: 237 px
- horizontal center gap: 144 px
- background deviation ratio: 0.0
- shadow-like background ratio: 0.0

## R1 verdict

**FINAL PASS after local B retries.**

This establishes that the validated isolated-worker path can generalize to the mirrored anatomical side without side swap or broad identity collapse.

It does not establish first-pass spatial reliability near a small visual landmark: B required two local retries.
That limitation remains part of production-v0 evidence.

No generation tuning / broad Knowledge / global worker-prose change is warranted from R1.

Next production-v0 gate: R2 torso-dominant motion.

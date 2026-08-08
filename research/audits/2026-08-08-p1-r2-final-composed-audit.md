# P1-R2 — torso-dominant shallow bow final composed audit

Date: 2026-08-08 JST
Status: FINAL PASS AFTER LOCAL C RETRY / FIRST-PASS FAILURE RETAINED

## Purpose

Production v0 generalization gate R2.
R0/R1 were unilateral hand motions. R2 changes the dominant motion surface to torso posture while keeping the same validated minimal Custom GPT / Instant worker global configuration.

## Final selected sequence

- F1 = canonical `kokyo_base_20260805.png`
- F2 = A `ChatGPT Image 2026年8月8日 20_47_00.png`
- F3 = B `ChatGPT Image 2026年8月8日 20_48_07.png`
- F4 = C retry `ChatGPT Image 2026年8月8日 20_51_52.png`

First-pass C `20_49_18` remains recorded as a failure and is not rewritten as first-pass PASS.

## Raw visual audit

### Carrier — PASS

All selected generated frames:
- one person
- one pose
- full body
- portrait 1024x1536
- no 2x2 / grid / divider / labels / numbers
- uniform green chroma background retained

### Motion semantics — PASS

Final sequence reads as a monotonic shallow bow:
1. F1 canonical: upright neutral start
2. F2 A: torso/head move forward/down together
3. F3 B: clearly deeper shallow bow
4. F4 C retry: completed shallow bow, visibly deeper than B

No endpoint reversion.
No side-body rotation substitutes for forward bow.
No neck-only nod substitutes for torso inclination.

Advisory geometry supports the visual B -> C separation:
- foreground top Y: B about 110 / C retry about 117
- upper-torso orange-region centroid in the same advisory detector: B about 570.3 / C retry about 586.9

These values are not standalone pose gates; they only support the visual finding that C retry moves the upper torso further forward/down than B.

### Expression — PASS

The first-pass C changed to closed eye + small smile and was rejected.
C retry restores the canonical expression role:
- visible eye remains open
- mouth remains broadly neutral
- endpoint readability comes from torso posture rather than an unrelated facial change

### Feet / arms / role continuity — PASS

Across the final sequence:
- both feet remain planted
- no kneeling or large knee bend
- feet keep their canonical left/right roles
- arms do not create a new independent gesture
- both large sleeves hang passively with the torso posture

### Identity / topology — PASS

No production-blocking collapse found in:
- proportions / major silhouette
- hat identity under forward-view perspective change
- hair identity
- both large-sleeve constructions
- chest flower
- waist medallion
- major tassel / cord attachment layout
- lower garment
- shoes
- left/right relation
- major overlap / occlusion order

The hat increasingly exposes its top surface as the character bows; this is consistent with pose/perspective change and is not treated as a topology failure.

## Retry history

First-pass C `20_49_18`:
- FAIL: torso depth nearly the same as B
- FAIL: unrequested closed-eye + smile expression

C retry `20_51_52`:
- PASS after using an absolute torso-angle target and explicitly preserving open-eye / neutral expression

Interpretation:
- first-pass failure was local endpoint-state compliance
- broad carrier / isolation / identity architecture remained stable
- no global worker instruction change was needed
- retry wording must not be promoted to new global worker prose

## Deterministic processing

Current-main processing behavior was applied.

Chroma removal:
- `audit/scripts/remove_chroma_key.py`
- dominant-channel despill enabled

Despill pixel counts:
- F1: 4068
- F2: 2230
- F3: 2204
- F4: 1990

White / black composite review:
- no production-blocking green fringe found
- no new shadow/background artifact found

2x2 deterministic compose:
- output size: 1024x1536
- common scale: ~0.4394993
- outer margin: 48
- center gap X: 96
- center gap Y: 112
- slot padding: 16

Placed bboxes:
- F1: [116, 64, 395, 696]
- F2: [641, 78, 895, 696]
- F3: [125, 865, 387, 1472]
- F4: [639, 870, 897, 1472]

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
- outer-edge non-chroma pixels: 0
- vertical center gap: 244 px
- horizontal center gap: 169 px
- background deviation ratio: 0.0
- shadow-like background ratio: 0.0

## R2 verdict

**FINAL PASS after one local C retry.**

R2 establishes that the isolated-worker architecture generalizes beyond unilateral hand motion to a torso-dominant posture change without broad identity collapse, side-turn substitution, foot-role loss, or independent arm gesture.

The first-pass C endpoint/expression failure remains part of production evidence.
No generation tuning / broad Knowledge / global worker-prose change is warranted.

With R0 C0 PASS + R1 FINAL PASS + R2 FINAL PASS, the production v0 generalization gate is now satisfied subject to the acceptance contract.

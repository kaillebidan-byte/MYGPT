# P1-R2 — torso-dominant shallow bow first-pass result

Date: 2026-08-08 JST
Status: FIRST-PASS PARTIAL PASS — A PASS / B PASS / C endpoint-expression FAIL

## Inputs

Canonical:
- `kokyo_base_20260805.png`

R2 A — very slight forward inclination:
- `ChatGPT Image 2026年8月8日 20_47_00.png`

R2 B — clear shallow forward inclination:
- `ChatGPT Image 2026年8月8日 20_48_07.png`

R2 C — completed shallow bow endpoint:
- `ChatGPT Image 2026年8月8日 20_49_18.png`

Worker global configuration was not intentionally changed from the validated minimal Custom GPT / Instant setup.

## Carrier — PASS 3/3

All three generated frames:
- standalone 1024x1536 portrait
- one person
- one pose
- full body
- no 2x2 / grid / divider / label / number
- chroma background retained

## Feet / orientation / arm-role continuity — PASS

Across A/B/C:
- both feet remain planted and approximately in the canonical role/position
- no side-on body rotation substitutes for the bow
- no kneeling or deep knee bend
- arms do not create a new independent gesture
- both large sleeves hang passively with the torso posture

## A — PASS

Observed:
- torso and head both move forward/down relative to canonical
- movement is not a neck-only nod
- front-facing orientation remains readable
- eyes remain open and expression remains close to canonical neutral
- both sleeves remain passive
- hat / hair / chest emblem / waist / lower garment / shoes remain recognizable

The inclination is visually noticeable rather than extremely tiny, but it remains clearly shallower than B and does not violate the shallow-bow motion role.

## B — PASS

Observed:
- clear shallow bow
- torso/head act as one posture rather than a head-only nod
- no side rotation
- arms remain passive
- feet remain planted
- identity/topology remains usable
- expression remains broadly neutral with the eye open

B is clearly more bowed than A.

## C — FAIL

Carrier and broad identity remain usable, but the endpoint frame fails two linked acceptance conditions.

### 1. Endpoint separation / monotonic torso progression — FAIL

Visually, C is not clearly more torso-forward than B.
B and C read as nearly the same bow depth; most of the perceptual difference comes from the face rather than a stronger completed torso posture.

Advisory image-geometry signals, not used as standalone pose gates:
- foreground top Y: canonical 52 / A 83 / B 110 / C 111
- foreground bottom remains ~1489-1490 for all frames
- orange chest-region centroid Y: canonical ~517.6 / A ~529.6 / B ~539.3 / C ~540.0

These measurements support the visual finding that B→C adds almost no torso-depth separation.

### 2. Unrequested expression change — FAIL

C changes the canonical neutral face:
- visible eye becomes closed
- mouth reads as a small smile

The packet explicitly required expression to remain canonical unless otherwise specified.
This is an unintended secondary state change and must not be used to create endpoint readability.

## Identity / topology

No production-blocking collapse found in A/B/C for:
- major character silhouette
- hat identity under forward-view perspective change
- hair identity
- both large-sleeve constructions
- chest flower
- waist medallion
- major tassel / cord layout
- lower garment
- shoes

The hat shows more of its upper surface as the body bows, which is consistent with the pose and is not treated as a topology change by itself.

## First-pass sequence verdict

```text
F1 canonical
→ A: PASS — early torso inclination
→ B: PASS — clear shallow bow
→ C: FAIL — torso depth nearly same as B + expression changed
```

R2 first-pass verdict: **FAIL due to C local endpoint state only**.

Per production-v0 acceptance rules, this first-pass failure remains recorded even if a C retry succeeds.

## Post-processing decision

Do not run chroma removal / deterministic compose / machine audit on this first-pass sequence.

Reason:
The raw visual motion/identity gate already fails at C. Post-processing cannot add endpoint separation or restore the canonical expression.

## Minimal retry — C only

Keep worker global configuration unchanged.
Use a fresh isolated worker / clean-seed Branch with the same canonical.
Retry only the endpoint using an absolute torso state and explicit expression preservation:

`人物は正面基準を維持し、両足を基準画像と同じ位置で接地させてください。腰から上の胴体全体を股関節・腰の位置から前へ約20〜25度傾け、肩、胸部、首、頭部を一つの姿勢として同じ方向へ前下方に傾けてください。胸の花紋が描かれた胸部の面もわずかに床方向を向く、完成した浅いお辞儀の姿勢で停止してください。首だけを曲げたり、身体を横向きや斜め横向きへ回転させたりしないでください。両腕は新しいジェスチャーを作らず身体の両側に置き、大袖は重力方向へ自然に垂らしてください。膝を大きく曲げず、両足の位置を変えないでください。両目は基準画像と同じく開いたままにし、口元も基準画像と同じ中立表情を維持してください。それ以外の衣装構造、装飾、体格を基準画像から変更しないでください。人物1体、1姿勢、全身、正面基準、縦長の1枚だけを生成してください。`

Do not change global worker prose.
Do not retry A or B.

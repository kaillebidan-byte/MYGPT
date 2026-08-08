# P1-R1 — mirrored unilateral first-pass result

Date: 2026-08-08 JST
Status: FIRST-PASS PARTIAL PASS — A candidate selected / B spatial-state FAIL / C endpoint PASS

## Inputs

Canonical:
- `kokyo_base_20260805.png`

R1 A — early raise returned two alternatives in the same run:
- A1 = `ChatGPT Image 2026年8月8日 20_29_12 (1).png`
- A2 = `ChatGPT Image 2026年8月8日 20_29_13 (2).png`

R1 B — late raise:
- `ChatGPT Image 2026年8月8日 20_30_39.png`

R1 C — endpoint:
- `ChatGPT Image 2026年8月8日 20_31_39.png`

Worker global configuration was not intentionally changed from the R1 plan. R1 was instructed to run under Custom GPT / Instant with the existing targeted active-large-sleeve invariant.

## Carrier / side selection

PASS for all returned candidates inspected.

- standalone 1024x1536 portrait
- one person
- one pose
- no 2x2 / grid / divider / labels
- anatomical-left arm is the active arm (viewer-right)
- anatomical-right arm remains the non-active/down arm

This mirrored-side test does not show the earlier active-limb side-swap failure.

## A alternatives

### A1

Usable as evidence that the requested side and early-state direction were understood, but not selected for the sequence.

Concerns:
- active anatomical-left sleeve narrows/reinterprets more strongly
- large opening / grey inner construction is less coherent than A2
- broader whole-redraw drift is visibly stronger

Advisory geometry:
- foreground bbox about 544x1440 versus canonical about 635x1437

Advisory whole-image SSIM against canonical:
- ~0.772

SSIM is not an identity gate; it only supports the visual comparison.

### A2 — SELECTED early candidate

A2 is the stronger A candidate.

PASS:
- correct anatomical-left active side
- hand remains in upper-waist / lower-torso early region
- active large sleeve retains a broad hanging construction
- opening, gold trim, grey lining and motif remain readable
- non-active sleeve and stable structures remain closer to canonical than A1

Advisory geometry:
- foreground bbox about 617x1436, close to canonical width before the arm is raised further

Advisory whole-image SSIM against canonical:
- ~0.792

Selected R1 early state:
- A = A2 `20_29_13 (2)`

## B — late raise

Carrier / side / hand articulation / sleeve: broadly PASS.

Spatial state: **FAIL**.

The B packet required a late-but-not-endpoint state:
- hand near the chest flower
- fingertips not yet touching the flower

Observed B:
- fingers / hand visibly overlap the chest flower
- the frame already reads as endpoint-like rather than a distinct pre-contact late state

This is a local hand-to-landmark spatial compliance failure.
It is not evidence of:
- carrier regression
- side-swap
- broad identity failure
- worker isolation failure

Do not add global worker prose.
Do not reopen W-series tuning.

## C — endpoint

PASS for the intended endpoint.

Observed:
- anatomical-left hand reaches and overlaps the chest flower
- endpoint is visually clear
- non-active anatomical-right arm remains down
- active sleeve retains recognizable large-sleeve construction with gold trim / grey interior / motif
- no endpoint reversion

C is higher / more centrally placed over the flower than B, but because B already overlaps the flower, `endpoint only at C` is not satisfied on first pass.

## Sequence verdict

Using A2:

```text
F1 canonical
→ A2 early: PASS
→ B late: FAIL — reaches flower too early
→ C endpoint: PASS
```

Hand height progresses upward, but the semantic separation between B and C is insufficient because B already contacts/overlaps the endpoint landmark.

R1 first-pass verdict: **FAIL due to B local spatial state only**.

Per production acceptance rules, this first-pass failure remains recorded even if a retry succeeds.

## Post-processing decision

Do not run chroma removal / deterministic compose / machine audit on this first-pass sequence.

Reason:
The raw visual motion gate already failed at B. Post-processing cannot repair the semantic state and would not change the R1 verdict.

## Minimal retry — B only

Keep worker global configuration unchanged.
Use a fresh isolated worker / clean-seed branch with the same canonical.
Retry only the late state with a more explicit but non-W3-style local geometry:

`正面向きの立ち姿を維持してください。解剖学的な左肘を曲げ、左手首を上腹部中央、胸の花紋と腰飾りの間に置いてください。左手の指先を胸の花紋の最下端のすぐ下まで上げ、そこで停止してください。指先を含む左手のどの部分も花紋に触れたり重なったりしないでください。ただし花紋と手の間に大きな空白は作らず、ごく小さな白い衣服部分だけが見える間隔にしてください。左手の指は自然にそろえて軽く伸ばし、握りこぶしにも大きく開いた掌にもせず、掌は胴体側へ向け、手の甲が概ねこちらから見える向きにしてください。解剖学的な右腕は基準画像どおり下ろしたまま維持してください。それ以外の身体部分、表情、衣装構造は基準画像を維持してください。人物1体、1姿勢、全身、正面向き、縦長の1枚だけを生成してください。`

Difference from rejected W3 wording:
- does not require a finger-width / large gap
- explicitly anchors wrist between flower and waist
- explicitly says the gap should be very small
- prevents the late state from being pushed back to the earlier upper-waist state

## Runtime observation — A/B multiplicity

The A request returned two alternatives during the R1 Instant run.
Therefore A/B candidate multiplicity is not evidence unique to Thinking.
Do not treat output count as a guaranteed property of either Instant or Thinking.

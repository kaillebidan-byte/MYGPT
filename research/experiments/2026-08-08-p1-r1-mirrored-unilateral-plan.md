# P1-R1 — mirrored unilateral motion plan

Date: 2026-08-08 JST
Status: COMPLETED — FINAL PASS AFTER LOCAL B RETRIES
Purpose: production v0 generalization gate R1

Final result:
- `research/experiments/2026-08-08-p1-r1-first-pass-result.md`
- `research/audits/2026-08-08-p1-r1-final-composed-audit.md`

Important accounting:
- first-pass B FAIL remains recorded
- retry-1 B FAIL remains recorded
- retry-2 B PASS
- worker global configuration was not changed
- no broad Knowledge / global prompt tuning was added

## Controlled variable

既存C0で通ったanatomical-right hand raiseに対し、active sideだけをanatomical-leftへ反転する。

変えない:
- minimal Custom GPT
- Instant
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- Knowledge NONE
- canonical `kokyo_base_20260805.png`
- one worker = current one static pose only
- targeted active-large-sleeve invariant
- visible hand articulation rule

F1はcanonicalそのもの。生成しない。
F2/F3/F4相当の3枚だけ生成する。

## Isolation

推奨:
- clean pre-motion seedから3 branch

または:
- 3 fresh conversations + canonical direct attachment

各workerへ他packet / full motion / F1-F4 / progress% / board / sheetを見せない。

## Worker global invariant

既にCustom GPT側へ入っている現行文を変更しない:

`動かす腕の大袖は、腕の屈曲に伴ってたわみ・向きが変わってよいが、基準画像の大袖としての基本構造を維持する。袖口の開口、金色の縁取り、灰色の内側、袖の模様を、別構造へ描き替えたり消したりしない。`

## Original local packets

### A — early raise

`正面向きの立ち姿を維持してください。解剖学的な左肘だけを自然に曲げ、左手を上腰部・下腹部上端付近まで持ち上げてください。左手の指は自然にそろえて軽く伸ばし、握りこぶしにも大きく開いた掌にもせず、掌は胴体側へ向け、手の甲が概ねこちらから見える向きにしてください。解剖学的な右腕は基準画像どおり下ろしたまま維持してください。それ以外の身体部分、表情、衣装構造は基準画像を維持してください。人物1体、1姿勢、全身、正面向き、縦長の1枚だけを生成してください。`

### B — original late raise

`正面向きの立ち姿を維持してください。解剖学的な左肘を曲げ、左手を胸の花紋のすぐ下付近まで持ち上げてください。指先は花紋へまだ触れず、手は上腹部より明確に高い位置にしてください。左手の指は自然にそろえて軽く伸ばし、握りこぶしにも大きく開いた掌にもせず、掌は胴体側へ向け、手の甲が概ねこちらから見える向きにしてください。解剖学的な右腕は基準画像どおり下ろしたまま維持してください。それ以外の身体部分、表情、衣装構造は基準画像を維持してください。人物1体、1姿勢、全身、正面向き、縦長の1枚だけを生成してください。`

This packet failed by reaching/overlapping the flower too early.

### C — endpoint

`正面向きの立ち姿を維持してください。解剖学的な左肘を曲げ、左手を胸の花紋まで持ち上げ、左手を花紋の上へ自然に重ねて停止してください。左手の指は自然にそろえて軽く伸ばし、握りこぶしにも大きく開いた掌にもせず、掌は胴体側へ向け、手の甲が概ねこちらから見える向きにしてください。解剖学的な右腕は基準画像どおり下ろしたまま維持してください。それ以外の身体部分、表情、衣装構造は基準画像を維持してください。人物1体、1姿勢、全身、正面向き、縦長の1枚だけを生成してください。`

## Final selected sequence

- F1 = canonical
- F2 = A2 `20_29_13 (2)`
- F3 = B retry-2 `20_39_04`
- F4 = C `20_31_39`

Final B success came from using the lower-chest / white-garment lower edge region as the positive landmark instead of trying to enforce a tiny gap directly under the flower.

Do not promote that retry wording to global worker prose. It remains a local packet solution.

## Final R1 result

PASS:
- standalone portrait carrier
- anatomical-left active side
- anatomical-right non-active retention
- monotonic hand progression
- endpoint only at F4
- no endpoint reversion
- active left large-sleeve topology
- visible left-hand articulation
- stable major identity structures
- deterministic compose
- machine geometry/chroma audit: all flags false

R1 establishes mirrored-side generalization but not perfect first-pass small-landmark spatial reliability.

Next gate: R2 torso-dominant shallow bow.

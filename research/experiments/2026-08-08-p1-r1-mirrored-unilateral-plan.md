# P1-R1 — mirrored unilateral motion plan

Date: 2026-08-08 JST
Status: READY TO RUN
Purpose: production v0 generalization gate R1

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

## Local packet A — early raise

Workerへはこのpacketだけ送る:

`正面向きの立ち姿を維持してください。解剖学的な左肘だけを自然に曲げ、左手を上腰部・下腹部上端付近まで持ち上げてください。左手の指は自然にそろえて軽く伸ばし、握りこぶしにも大きく開いた掌にもせず、掌は胴体側へ向け、手の甲が概ねこちらから見える向きにしてください。解剖学的な右腕は基準画像どおり下ろしたまま維持してください。それ以外の身体部分、表情、衣装構造は基準画像を維持してください。人物1体、1姿勢、全身、正面向き、縦長の1枚だけを生成してください。`

Expected state:
- anatomical-left active
- hand at upper-waist / lower-torso early state
- anatomical-right remains canonical/down

## Local packet B — late raise

Workerへはこのpacketだけ送る:

`正面向きの立ち姿を維持してください。解剖学的な左肘を曲げ、左手を胸の花紋のすぐ下付近まで持ち上げてください。指先は花紋へまだ触れず、手は上腹部より明確に高い位置にしてください。左手の指は自然にそろえて軽く伸ばし、握りこぶしにも大きく開いた掌にもせず、掌は胴体側へ向け、手の甲が概ねこちらから見える向きにしてください。解剖学的な右腕は基準画像どおり下ろしたまま維持してください。それ以外の身体部分、表情、衣装構造は基準画像を維持してください。人物1体、1姿勢、全身、正面向き、縦長の1枚だけを生成してください。`

Important:
- W3で使った`手全体を花紋より下`や`指1本分の隙間`は書かない
- intended late stateをearly stateへ押し下げない

Expected state:
- anatomical-left active
- hand near flower, not endpoint
- higher than packet A

## Local packet C — endpoint

Workerへはこのpacketだけ送る:

`正面向きの立ち姿を維持してください。解剖学的な左肘を曲げ、左手を胸の花紋まで持ち上げ、左手を花紋の上へ自然に重ねて停止してください。左手の指は自然にそろえて軽く伸ばし、握りこぶしにも大きく開いた掌にもせず、掌は胴体側へ向け、手の甲が概ねこちらから見える向きにしてください。解剖学的な右腕は基準画像どおり下ろしたまま維持してください。それ以外の身体部分、表情、衣装構造は基準画像を維持してください。人物1体、1姿勢、全身、正面向き、縦長の1枚だけを生成してください。`

Expected state:
- anatomical-left active
- hand visibly reaches / overlaps chest flower
- clear endpoint
- anatomical-right remains canonical/down

## R1 audit

First-passで記録:
- carrier: standalone portrait 3/3
- correct anatomical-left active 3/3
- anatomical-right non-active retention
- monotonic hand height A -> B -> C
- endpoint only at C
- no endpoint reversion
- active left large-sleeve opening / gold trim / grey lining / motif continuity
- visible left-hand articulation
- hat / hair
- chest flower except intended endpoint occlusion
- waist medallion / major tassel-cord layout
- lower garment / shoes

After raw visual audit:
- chroma removal with despill
- common scale / foot baseline
- deterministic board / strip
- machine audit

## Failure interpretation

If A/B/C violates carrier or wrong anatomical side:
- generation / isolation failure candidate

If B is too low while wording itself encodes the intended near-flower state:
- spatial compliance failure candidate
- do not immediately add global prose

If a local packet accidentally describes the wrong state:
- planner/local-state design failure
- correct packet interpretation before changing worker architecture

If active sleeve changes topology:
- continuity failure against the already validated invariant

Do not change worker global configuration during R1.

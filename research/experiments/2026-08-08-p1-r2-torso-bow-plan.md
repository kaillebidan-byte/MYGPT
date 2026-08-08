# P1-R2 — torso-dominant shallow bow plan

Date: 2026-08-08 JST
Status: READY TO RUN
Purpose: production v0 generalization gate R2

## Controlled variable

R0/R1 were unilateral hand motions. R2 changes the dominant motion surface to torso posture while keeping the validated worker global configuration unchanged.

Keep unchanged:
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
- no full motion / other packets / F1-F4 / progress% / board / sheet exposure
- current global active-sleeve invariant remains installed but is not expanded

F1 is canonical itself and is not generated.
Generate only three static states.

## R2 motion definition

One-shot shallow bow from the canonical standing pose.

Global motion meaning belongs to planner/audit only:
- feet remain planted
- body stays front-facing
- hips remain approximately over the feet
- torso inclines forward from the hip/waist region
- head follows torso rather than bending the neck alone
- arms do not perform an independent gesture
- sleeves / tassels / lower garment follow passively
- endpoint is a completed shallow bow, not a deep bow

Workers do not receive this full sequence definition; they receive only one packet below.

## Local packet A — very slight forward inclination

`人物は正面を向いたまま、両足を基準画像と同じ位置で接地させてください。腰から上の上体だけをごく軽く前へ傾け、頭部も上体と一緒にわずかに前下方へ追従させてください。首だけを曲げたり、身体を横向きに回転させたりしないでください。両腕は新しい独立したジェスチャーを作らず、基準画像の左右関係を保ったまま身体の両側に置き、大袖は上体の傾きに受動的に追従して自然に垂らしてください。膝を大きく曲げず、足の位置を変えないでください。それ以外の表情、衣装構造、装飾、体格は基準画像を維持してください。人物1体、1姿勢、全身、正面基準、縦長の1枚だけを生成してください。`

Expected state:
- subtle torso inclination visible
- not just head nod
- no independent arm gesture
- feet unchanged

## Local packet B — clear shallow forward inclination

`人物は正面を向いたまま、両足を基準画像と同じ位置で接地させてください。腰から上の上体を前へ傾け、浅いお辞儀として明確に読める姿勢にしてください。頭部は上体と一緒に前下方へ追従させ、首だけを曲げないでください。身体を横向きや斜め横向きへ回転させず、正面基準を維持してください。両腕は新しい独立したジェスチャーを作らず、基準画像の左右関係を保ったまま身体の両側に置き、大袖は上体前傾に受動的に追従して自然に垂らしてください。膝を大きく曲げず、足の位置を変えないでください。それ以外の表情、衣装構造、装飾、体格は基準画像を維持してください。人物1体、1姿勢、全身、正面基準、縦長の1枚だけを生成してください。`

Expected state:
- clearly more torso-dominant than canonical
- still shallow, not deep bow
- no side rotation
- arms passive

## Local packet C — completed shallow bow endpoint

`人物は正面を向いたまま、両足を基準画像と同じ位置で接地させてください。腰から上の上体を前へはっきり傾け、深すぎない完成した浅いお辞儀の姿勢で停止してください。頭部は上体の軸と一緒に前下方へ追従させ、首だけを落とした姿勢にはしないでください。身体を横向きや斜め横向きへ回転させず、正面基準を維持してください。両腕は新しい独立したジェスチャーを作らず、基準画像の左右関係を保ったまま身体の両側に置き、大袖は重力方向へ自然に垂れながら上体前傾に受動的に追従させてください。膝を大きく曲げず、両足は接地したまま位置を変えないでください。それ以外の表情、衣装構造、装飾、体格は基準画像を維持してください。人物1体、1姿勢、全身、正面基準、縦長の1枚だけを生成してください。`

Expected state:
- completed shallow bow
- torso/head move as one posture
- no deep bow / kneeling / side turn
- arms and sleeves passive

## Raw audit gate

Record first-pass results before retries.

Carrier:
- standalone portrait 3/3
- one person / one pose / full body
- no panel / grid / labels

Motion:
- torso inclination reads F1 canonical -> A -> B -> C
- no endpoint reversion
- no side/body rotation substituting for forward bow
- no neck-only nod substituting for torso bow
- both feet remain planted / role unchanged
- no new independent arm gesture

Identity / topology:
- proportions / major silhouette
- hat / hair relation
- both large-sleeve structures
- chest emblem
- waist medallion
- major tassel / cord attachment layout
- lower garment
- shoes
- overlap / occlusion order

Post-processing after raw PASS:
- remove chroma with despill
- common scale / common foot baseline
- deterministic board / strip
- machine geometry/chroma audit

## Failure interpretation

If a frame turns side-on:
- orientation / pose compliance failure; do not change global worker prompt first

If only the head nods while torso stays canonical:
- local torso-state compliance failure

If arms independently raise / clasp / cross:
- unintended secondary gesture failure

If feet shift while the upper body otherwise bows:
- contact / role continuity failure

If broad identity collapses under torso inclination:
- production generalization identity failure

Do not add global worker prose during R2.
Do not use generated R2 frames as identity sources for later R2 frames.

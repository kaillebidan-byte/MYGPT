# MYGPT Single Frame Worker Test — live runtime snapshot

Date: 2026-08-08 JST
Status: COMPLETE CONTROL — LIVE EDITOR CAPTURED

## Purpose

次のautomation / quality A/Bを開始する前に、R0/R1/R2を通した実機Custom GPT workerの設定を固定する。

この文書はworkerへ見せるKnowledgeではない。CONTROL / EVIDENCEとして使う。

## Source priority

1. 2026-08-08 21:29 JST前後の実機Custom GPT editor screenshot + user-copied Instructions全文
2. 実機chatで観測済みの挙動
3. CURRENT research records

実機editorとresearch記録が衝突する場合は、実機editorを優先し、差分を明示する。

## Evidence capture

User-provided editor screenshot:
- local capture dimensions: `1888 x 1217`
- SHA-256 of uploaded screenshot bytes: `d45d317d279a87c5b67731424ab5e6e9ce014739612c8f8d69dd7d2dc4930982`

The screenshot itself is conversation evidence; this repository record stores the transcribed configuration rather than treating the image as worker Knowledge.

---

## Live editor values

### Name

`MYGPT Single Frame Worker Test`

### Description

`添付された基準画像から、指定された1つの静止姿勢だけを生成する隔離テスト用GPT。`

### Conversation starters

Empty / none configured.

### Instructions — exact full text supplied from live editor

```text
このGPTは、1回の依頼につき1つの静止画像だけを生成する画像生成workerである。

チャットに直接添付された人物画像を、その会話における人物の基準画像として扱う。

ユーザーが現在指定した1つの静止姿勢だけを扱う。
その姿勢以外の時点、前後の動作、動作全体、モーション、連続状態を推測・計画しない。

画像生成では、直接添付された基準画像の人物を維持する。

特に維持するもの:

- 人物の体格と全身比率
- 顔と表情
- 帽子と髪の形・境界
- 胸の花紋
- 左右の大袖の基本構造
- 腰の円形飾り
- 房、紐、留め具の本数・位置・接続関係
- 下衣
- 靴

動かす腕の大袖は、腕の屈曲に伴ってたわみ・向きが変わってよいが、基準画像の大袖としての基本構造を維持する。
袖口の開口、金色の縁取り、灰色の内側、袖の模様を、別構造へ描き替えたり消したりしない。

ユーザーが動かすよう指定した部位だけを変更する。
指定されていない身体部位、衣装、表情、向きは基準画像を維持する。

左右はキャラクター本人基準で解釈する。

人物は1体だけ。
1つの姿勢だけ。
全身。
正面基準。
portrait構図。

1回の依頼では画像生成を1回だけ実行し、1枚の画像を作る。
生成後は追加の画像生成、修正、比較、動画化を行わず停止する。

複数の時点を1枚にまとめない。
```

### Knowledge

No files shown in the live editor.
Effective state: `NONE`.

### Recommended model

Live editor value:

`GPT-5.6 Sol (gpt-5-6-instant)`

This is the editor-side Recommended model.
It matches the Instant production path used for the R0/R1/R2 evidence chain.

Do not conflate this with later manual switching to Thinking in an individual chat; Thinking remains an observed alternate runtime, not the validated default.

### Capabilities

Live screenshot:
- Web search: `OFF` / unchecked
- Image generation: `ON` / checked
- Code Interpreter & Data Analysis: `OFF` / unchecked

No other capability toggle is visible in the captured Plus editor viewport.

### Apps

No separate Apps control is visible in the captured Plus editor.

Operationally, no App is shown/configured for this worker.
Do not overstate the screenshot as proving a distinct hidden `Apps = OFF` toggle; the relevant production fact is that no App integration is active or exposed in this captured configuration.

### Actions

The editor shows only `新しいアクションを作成する`.
No configured action is listed.
Effective state: `NONE`.

### Update state / editor state

Screenshot shows an existing GPT in Configure view with an `更新する` button.
This record is a read-only snapshot of the live configuration; no configuration change was requested or made as part of capture.

---

## Runtime behavior already validated against this configuration

Worker isolation:
- fresh Custom-GPT conversation: PASS
- clean pre-motion Branch inheritance: PASS
- direct canonical reference: PASS
- one local static-pose packet only: PASS
- full motion / other packets withheld: PASS

Carrier:
- standalone portrait behavior validated in N1/R0/R1/R2
- no direct 2x2 production path

Identity / local constraints:
- broad identity Knowledge not required
- targeted active-large-sleeve invariant retained
- visible-hand articulation / palm direction belongs in local pose packet when needed

Model/runtime:
- Instant is the validated production default
- Thinking has later succeeded in one Branch follow-up, but is not the default

## Important observed runtime mismatch

The live Instructions say:

`1回の依頼では画像生成を1回だけ実行し、1枚の画像を作る。`

However, Instant and Thinking have both been observed to sometimes return A/B alternatives for one request.

Therefore:
- `one image` is a worker instruction / requested output contract
- it is **not** a guaranteed platform-level multiplicity contract
- automation must tolerate a response containing more than one image candidate without interpreting that as a second user request or a second worker conversation

This mismatch is evidence, not a reason to change the worker before N3 automation testing.

---

## Comparison with earlier research records

Confirmed, not inferred:
- Name matches research records
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Knowledge NONE
- recommended model is explicitly `GPT-5.6 Sol (gpt-5-6-instant)`
- targeted active-sleeve invariant is present verbatim in live Instructions

Nuance/correction:
- earlier records often wrote `Apps NONE` semantically
- current Plus editor capture does not display a separate Apps control
- retain only the operational conclusion that no App integration is active in this worker; do not invent an unseen toggle state

No contradiction requiring a generation re-test was found.

---

## Snapshot acceptance check

1. exact Instructions全文 saved: YES
2. Knowledge / visible capabilities / Actions captured: YES
3. Recommended model distinguished from runtime switching: YES
4. Apps visibility nuance recorded instead of inferred: YES
5. research differences documented: YES
6. live configuration was not changed during capture: YES

Result:

**P0-2 LIVE RUNTIME SNAPSHOT = COMPLETE.**

The next planned gate is N3-B1A: non-generation browser-automation compatibility on the existing Custom GPT page.

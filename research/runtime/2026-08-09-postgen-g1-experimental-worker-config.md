# POSTGEN-G1 experimental Custom GPT configuration

Date: 2026-08-10 JST
Status: **CURRENT TEST CONFIG / DO NOT APPLY TO PRODUCTION WORKER**

## Purpose

Create a minimal clone of the live-proven single-frame worker that differs only in one behavior:

```text
image generation
-> dialogue model resumes
-> emit one short structured audit
-> stop
```

This worker exists only to characterize the post-image runtime under Instant. It is not the production worker and must not replace `MYGPT Single Frame Worker Test`.

## Builder operation

Duplicate the current production worker from the GPT editor `...` menu.

## Name

`MYGPT Single Frame Worker POSTGEN G1`

## Description

`添付された基準画像から指定された1つの静止姿勢を1枚生成し、生成後に短い構造化監査だけを返すPOSTGEN-G1実験用GPT。`

## Runtime / capabilities — G1a

- use Instant
- Image generation: ON
- Web search: OFF
- Code Interpreter & Data Analysis: OFF
- Actions: NONE
- Apps: not active
- Knowledge: NONE

Do not enable Action or Code Interpreter in the first run.

## Instructions — exact G1a text

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
複数の時点を1枚にまとめない。

画像生成ツールが結果を返した後は、画像生成ツールを二度と呼ばない。
生成画像を修正・再生成・追加生成しない。

生成後に、直接添付された基準画像・現在の姿勢指定・生成された画像を比較し、次の1行だけを通常のテキストとして返す。

POSTGEN_AUDIT {"identity_obvious_drift":true|false,"pose_obvious_error":true|false,"topology_obvious_error":true|false,"verdict":"PASS"|"FAIL"}

判定基準:
- identity_obvious_drift: 顔、帽子・髪、衣装、配色、体格、固有装飾に明白な別物化がある場合だけtrue
- pose_obvious_error: 指定された静止姿勢を明白に満たしていない場合だけtrue
- topology_obvious_error: 袖口、紐、房、留め具、接続関係、手足などに明白な構造破綻がある場合だけtrue
- verdict: 上の3項目がすべてfalseならPASS、それ以外はFAIL

このPOSTGEN_AUDITは生成後のruntime観測用であり、監査結果を使って同じ会話内で画像を直してはいけない。
```

## Fixed G1a-1 control input — R2-B

Do not choose a pose manually. POSTGEN-G1a-1 uses the historical R2-B pose that passed first-pass visual review.

Attach original canonical `kokyo_base_20260805.png` directly and send exactly:

```text
人物は正面を向いたまま、両足を基準画像と同じ位置で接地させてください。腰から上の上体を前へ傾け、浅いお辞儀として明確に読める姿勢にしてください。頭部は上体と一緒に前下方へ追従させ、首だけを曲げないでください。身体を横向きや斜め横向きへ回転させず、正面基準を維持してください。両腕は新しい独立したジェスチャーを作らず、基準画像の左右関係を保ったまま身体の両側に置き、大袖は上体前傾に受動的に追従して自然に垂らしてください。膝を大きく曲げず、足の位置を変えないでください。それ以外の表情、衣装構造、装飾、体格は基準画像を維持してください。人物1体、1姿勢、全身、正面基準、縦長の1枚だけを生成してください。
```

Historical evidence for R2-B:
- clear shallow bow PASS;
- torso/head move as one posture;
- no side rotation;
- arms passive;
- feet planted;
- identity/topology usable;
- neutral expression retained.

References:
- `research/experiments/2026-08-08-p1-r2-torso-bow-plan.md`
- `research/experiments/2026-08-08-p1-r2-first-pass-result.md`
- `research/audits/2026-08-08-p1-r2-final-composed-audit.md`

## Expected output

```text
one image generation
-> one generated image
-> POSTGEN_AUDIT {...}
-> stop
```

No second image generation is allowed.

## G1b / G1c

Do not enable Actions or Code Interpreter until G1a evidence has been reviewed.

G1b later:
- one narrow read-only text/JSON Action;
- no image upload.

G1c later:
- enable Code Interpreter only to test whether the generated image is available as a usable file/path;
- do not install identity metrics yet.

## Frozen control

Do not modify:
- `MYGPT Single Frame Worker Test`;
- Worker Orchestrator v0.5.0 code;
- production worker route/settings;
- original canonical;
- generation semantics beyond the post-image audit addition in this clone.

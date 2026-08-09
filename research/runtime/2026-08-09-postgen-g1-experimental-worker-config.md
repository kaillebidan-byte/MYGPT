# POSTGEN-G1 experimental Custom GPT configuration

Date: 2026-08-09 JST
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

Use the current production worker as the source and choose the GPT editor more-options menu (`...`) -> duplicate GPT.

Official OpenAI editor documentation confirms the duplicate option is available from the GPT editor more-options menu.

## Name

`MYGPT Single Frame Worker POSTGEN G1`

## Description

`添付された基準画像から指定された1つの静止姿勢を1枚生成し、生成後に短い構造化監査だけを返すPOSTGEN-G1実験用GPT。`

## Recommended model / runtime

- keep the duplicated worker's current recommended model unchanged;
- run the test on the Instant path;
- do not switch to Thinking for POSTGEN-G1.

## Capabilities — G1a first run

- Image generation: ON
- Web search: OFF
- Code Interpreter & Data Analysis: OFF
- Actions: NONE
- Apps: NONE / not active
- Knowledge: NONE

Do not enable Action or Code Interpreter in the first run. Those are later subtests so tool failures cannot be confused with post-image dialogue behavior.

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

## G1a prompt

Use one already-known pose packet from the current test set. Do not add a new difficult pose and do not add a visual pose guide.

The user message should contain only the one local static-pose request used for the selected control pose. The canonical image is attached directly as usual.

## Expected output shape

Expected successful behavior:

```text
assistant/image generation
-> one generated image
-> POSTGEN_AUDIT {...}
-> stop
```

No second image generation is allowed.

## G1b Action subtest — only after G1a is understood

Keep G1a instructions and generation behavior unchanged. Add one narrow read-only Action only.

The first Action should return simple text/JSON and require no image upload. Its only purpose is to prove an Action can be called after image generation.

Do not introduce general GitHub browsing in the generator stage.

## G1c Code Interpreter subtest — only after G1a/G1b

Enable Code Interpreter & Data Analysis without changing the image-generation task.

Question to test after image generation:
- can the dialogue model access the generated image as a usable file/path from Code Interpreter?

Do not install identity metrics yet. This is only a file-access gate.

## Frozen control

Do not modify:
- `MYGPT Single Frame Worker Test`;
- Worker Orchestrator v0.5.0 code;
- production worker route/settings;
- current canonical;
- current generation packet semantics beyond the post-image audit addition in this clone.

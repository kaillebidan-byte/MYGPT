# POSTGEN-G1 — explicit follow-up critic runbook

Date: 2026-08-10 JST
Status: **CURRENT NEXT USER PROCEDURE**

Prerequisite:
- G1a-1 already generated the R2-B image in `MYGPT Single Frame Worker POSTGEN G1`;
- no `POSTGEN_AUDIT` text was produced automatically;
- remain in that same conversation.

## Do not change anything first

Do not:
- regenerate;
- open a new chat;
- reattach the canonical;
- edit GPT Instructions;
- enable Action;
- enable Code Interpreter;
- run Worker Orchestrator.

## Send exactly this second user message

```text
画像生成依頼ではありません。
画像生成ツールを呼ばないでください。

この会話に直接添付されている基準画像、直前に指定した静止姿勢、そして直前に生成された画像を比較してください。
新しい画像の生成・修正・再生成は行わず、通常のテキストだけで次の1行を返してください。

POSTGEN_AUDIT {"identity_obvious_drift":true|false,"pose_obvious_error":true|false,"topology_obvious_error":true|false,"verdict":"PASS"|"FAIL"}

判定基準:
- identity_obvious_drift: 顔、帽子・髪、衣装、配色、体格、固有装飾に明白な別物化がある場合だけtrue
- pose_obvious_error: 直前に指定された静止姿勢を明白に満たしていない場合だけtrue
- topology_obvious_error: 袖口、紐、房、留め具、接続関係、手足などに明白な構造破綻がある場合だけtrue
- verdict: 上の3項目がすべてfalseならPASS、それ以外はFAIL
```

## PASS

PASS if:
- no image-generation UI/tool activity starts;
- one ordinary text response appears;
- it contains `POSTGEN_AUDIT` with concrete booleans and PASS/FAIL;
- it evaluates the already-generated image, not a hypothetical/new image.

## FAIL

FAIL if any occurs:
- another image is generated;
- assistant refuses/cannot inspect the preceding generated image;
- no normal text response appears;
- response ignores the structured audit request.

## Return evidence

Send back:
1. `explicit follow-up: PASS` or `FAIL`;
2. exact assistant response text;
3. screenshot only if behavior is visually ambiguous or another image generation starts.

Do not proceed to Actions/Code Interpreter until this result is reviewed.

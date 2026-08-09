# POSTGEN-G1 — critic route comparison runbook

Date: 2026-08-10 JST
Status: **CURRENT NEXT USER PROCEDURE**

## Purpose

Compare two post-image critic routes on the **same already-generated candidate** so generation stochasticity is removed.

Known result:

```text
Route B: Branch -> Thinking critic
POSTGEN_AUDIT {"identity_obvious_drift":false,"pose_obvious_error":false,"topology_obvious_error":false,"verdict":"PASS"}
```

No image generation occurred in the Thinking critic response.

Now test Route A on the same candidate.

## Route A — parent Instant explicit follow-up

1. Return from the Branch to the **original parent Instant conversation** that contains the generated R2-B image.
2. Do not regenerate.
3. Do not reattach canonical.
4. Do not switch the parent to Thinking.
5. Do not change GPT Instructions/capabilities.
6. Send exactly this audit-only user turn:

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

## Record

Return:
- exact Instant assistant response;
- whether any image generation UI/tool activity started;
- optional DOM filtered turn result if convenient.

## PASS

Route A runtime PASS if:
- no new image is generated;
- an ordinary text `POSTGEN_AUDIT` response appears;
- the response evaluates the already-generated candidate.

## Comparison decision

After Route A result, compare on the same candidate:

```text
A: parent Instant explicit follow-up
B: Branch -> Thinking critic
Human review: reference authority
```

If both work:
- prefer Instant first for orchestration simplicity unless Thinking is materially better at audit quality;
- keep Branch -> Thinking as a stronger/hard-case critic candidate.

If Instant fails but Branch -> Thinking repeats successfully:
- promote Branch -> Thinking as the primary experimental critic route.

## Do not test yet

Do not yet:
- make Thinking generate images;
- add Actions;
- enable Code Interpreter;
- patch Worker Orchestrator;
- run ID-V1/ID-V2;
- generate a new candidate for this comparison.

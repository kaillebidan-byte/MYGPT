# POSTGEN-G1 — explicit follow-up critic runbook

Date: 2026-08-10 JST
Status: **ALTERNATE ROUTE / PROMPT RETAINED / NEXT PROCEDURE MOVED TO CRITIC ROUTE COMPARISON**

This runbook was written after Instant same-turn auto-audit failed.

A later live result showed that a Branch -> Thinking critic can return `POSTGEN_AUDIT` text without generating another image.

Current next procedure is now:
- `research/plans/2026-08-10-postgen-critic-route-comparison-runbook.md`

The prompt below remains the exact Route-A prompt for testing the parent Instant conversation on the same candidate.

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

Do not add Actions/Code Interpreter or regenerate while the critic-route comparison is still open.

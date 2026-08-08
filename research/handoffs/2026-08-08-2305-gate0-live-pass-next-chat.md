# 次チャット用引継ぎ — 2026-08-08 23:05 JST

GitHub `kaillebidan-byte/MYGPT` の `main` を正本として継続する。

最初に読む:
1. `research/PROJECT-HANDOFF.md`
2. `research/experiments/2026-08-08-worker-fanout-gate0-live-pass.md`
3. `research/decisions/2026-08-08-three-extension-synthesis.md`
4. `research/runtime/2026-08-08-single-frame-worker-live-snapshot.md`
5. 3拡張の2026-08-08 static-analysis/reuse-assessment
6. `research/decisions/2026-08-08-temp-extension-source-lifecycle.md`

## CURRENT stopping point

`MYGPT Worker Fanout` Gate 0はv0.0.2でVivaldi実機PASS。

実機popup:

```text
Status: PASS
Expected: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Observed: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Tab: 22739685
```

Gate 0の確定事項:
- same Custom GPT `/g/...` worker rootへ新規owned tabを1つ開ける
- Expected / Observed identity完全一致
- destination identity handshake成立
- Vivaldi実機で `tabs` permission追加不要
- manifest permissionsはGate 0時点で `storage` のみ
- v0.0.1の `AWAITING_DESTINATION / Observed: -` はv0.0.2のbackground direct identity probeで解消
- periodic polling / automatic retry loopなし

Gate 0は受理済み。具体的な回帰証拠がない限り再調整しない。

## 次にやること

**Gate 1だけを実装する。**

Gate 1の範囲:
- owned destination Custom GPT tabへcontrolled worker packetを挿入する
- 挿入内容をユーザーが目視確認できる
- submit/sendは絶対に行わない
- canonical file attachmentはまだ行わない
- image generationはまだ行わない

設計ではTranslation Loop Test 0.5.1の robust composer insertion / runToken / ownership / fail-closed概念をclean-roomで利用し、Custom GPT `/g/...` adapterは現行Worker Fanoutを使う。

引き続き禁止:
- internal ChatGPT API
- Bearer/token capture
- fetch/XHR/WebSocket interception
- response parsing/output scraping/download
- CSP/security-header modification
- visibility/focus spoofing
- telemetry/external upload
- automatic retry/rate-driving

`research/temp-extension-sources/` はaccepted completion前なので削除しない。

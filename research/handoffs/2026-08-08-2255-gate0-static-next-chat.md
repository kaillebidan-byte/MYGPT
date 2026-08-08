# 次チャット用引継ぎ — 2026-08-08 22:55 JST

GitHub `kaillebidan-byte/MYGPT` の `main` を正本として継続する。

最初に読む:
1. `research/PROJECT-HANDOFF.md`
2. `research/experiments/2026-08-08-worker-fanout-gate0-static.md`
3. `research/decisions/2026-08-08-three-extension-synthesis.md`
4. `research/runtime/2026-08-08-single-frame-worker-live-snapshot.md`
5. 3拡張の2026-08-08 static-analysis/reuse-assessment
6. `research/decisions/2026-08-08-temp-extension-source-lifecycle.md`

## CURRENT stopping point

独立 `MYGPT Worker Fanout` extension のGate 0は `extensions/mygpt-worker-fanout/` に実装済み。

STATIC PASS:
- manifest JSON valid
- all Gate 0 JS `node --check` PASS
- route adapter unit test PASS
- forbidden-mechanism source scan PASS
- `chrome.tabs.create()` occurrence = 1

実装済み:
- Custom GPT `/g/...` identity normalization
- Project `g-p-...` explicit rejection
- one-tab open
- ephemeral `runToken` + owned tab state in `chrome.storage.session`
- destination content-script route report
- same worker identity PASS / mismatch FAIL
- owned-tab close fail-closed
- MutationObserver + browser navigation event route observation
- explicit Reset required after PASS/FAIL

Gate 0では未実装・禁止のまま:
- prompt insertion
- canonical/file attachment
- send/submit
- image generation invocation
- internal ChatGPT API / Bearer / response interception
- output scraping/download
- security-header modification
- visibility spoof
- telemetry/external upload
- automatic retry

## 次にやること

**Vivaldi実機でGate 0 live testのみを行う。Gate 1へ進まない。**

手順は `extensions/mygpt-worker-fanout/README.md`。

PASS条件:
- 1 clickで新規tabがちょうど1つだけ開く
- destinationが視覚的にも `MYGPT Single Frame Worker Test`
- popup status = `PASS`
- Expected / Observedの `/g/...` identity一致
- prompt/file/send/image generationが一切起きない
- Vivaldi extension/service-worker errorなし

特記事項:
- manifestは現時点で`storage`のみ。`tabs` permissionは事前追加していない。
- `scripting`もないため、unpacked extensionをload/updateした後、テスト起点の既存Custom GPT tabは1回reloadする。
- Vivaldiでtab API権限エラーが実際に出た場合だけ、その証拠を基に`tabs` permission追加を再検討する。
- destination report初期競合対策として、owned tab ID保存直後に1回だけFORCE_REPORTし、document load未完了なら`tabs.onUpdated(... complete ...)`が1回補完する。retry loopではない。

`research/temp-extension-sources/` はaccepted completion前なので削除しない。

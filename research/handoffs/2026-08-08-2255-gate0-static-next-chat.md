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

### 2026-08-08 first Vivaldi live result

v0.0.1の初回実機テストでは、1回の実行で新規tabは開き、popupは次の状態になった:

- `Status: AWAITING_DESTINATION`
- `Expected: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test`
- `Observed: -`
- owned destination tab IDあり

この結果から `chrome.tabs.create()` 自体はVivaldi上で成功しており、現時点で `tabs` permission追加の根拠はない。
未成立なのは destination content -> background のidentity report handshake。

現行v0.0.1には、`document_idle` reportと `tabs.onUpdated("complete")` の両方が `openedTabId` のsession保存完了前に通過するとreportを取りこぼすタイミング穴が残っていた。

### v0.0.2 fix

`extensions/mygpt-worker-fanout/` はv0.0.2へ更新済み。

変更点:
- ownership (`openedTabId`) 保存後、backgroundがowned destination tabへ `MYGPT_GATE0_GET_IDENTITY` を直接問い合わせる。
- `chrome.tabs.get(tabId)` で既に `complete` ならその場で1回probe。
- まだloadingなら `tabs.onUpdated(... status === "complete")` で1回probe。
- content scriptの既存content-load route reportも残す。
- terminal `PASS` / `FAIL` 後の重複reportは無視する。
- periodic polling / automatic retry loopは追加していない。
- `tabs` permissionは追加していない。manifest permissionsは引き続き `storage` のみ。

実装済み:
- Custom GPT `/g/...` identity normalization
- Project `g-p-...` explicit rejection
- one-tab open
- ephemeral `runToken` + owned tab state in `chrome.storage.session`
- destination content-script route report
- background-owned direct identity probe
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
- automatic retry loop

## 次にやること

**v0.0.2をVivaldiへreloadしてGate 0 live re-testのみを行う。Gate 1へ進まない。**

手順は `extensions/mygpt-worker-fanout/README.md`。

再テスト時:
1. v0.0.2へ差し替え / unpacked extensionをReload。
2. 起点の既存 `MYGPT Single Frame Worker Test` tabを1回reload（`scripting` permissionなしのため）。
3. popupで旧stateが残っていれば `Gate 0状態をリセット`。
4. `Gate 0を実行` を1回だけ押す。
5. 新規tabがちょうど1つだけ開くことを確認。
6. destinationが視覚的にも `MYGPT Single Frame Worker Test` であることを確認。
7. popupが `PASS`、Expected / Observedが同一 `/g/...` になることを確認。

PASS条件:
- 1 clickで新規tabがちょうど1つだけ開く
- destinationが視覚的にも `MYGPT Single Frame Worker Test`
- popup status = `PASS`
- Expected / Observedの `/g/...` identity一致
- prompt/file/send/image generationが一切起きない
- Vivaldi extension/service-worker errorなし

v0.0.2でも `AWAITING_DESTINATION / Observed: -` が残る場合は、次にVivaldiのextension/service worker errorを確認して、その具体的エラーを証拠に修正する。推測でpermissionを増やさない。

`research/temp-extension-sources/` はaccepted completion前なので削除しない。

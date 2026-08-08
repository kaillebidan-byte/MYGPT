# 次チャット用引継ぎ — 2026-08-08 23:14 JST

GitHub `kaillebidan-byte/MYGPT` の `main` を正本として継続する。

最初に読む:
1. `research/PROJECT-HANDOFF.md`
2. `research/experiments/2026-08-08-worker-fanout-gate0-live-pass.md`
3. `research/experiments/2026-08-08-worker-fanout-gate1-static.md`
4. `research/decisions/2026-08-08-three-extension-synthesis.md`
5. `research/runtime/2026-08-08-single-frame-worker-live-snapshot.md`
6. 3拡張の2026-08-08 static-analysis/reuse-assessment
7. `research/decisions/2026-08-08-temp-extension-source-lifecycle.md`

## CURRENT stopping point

`MYGPT Worker Fanout` Gate 0はv0.0.2でVivaldi実機PASS済み。

Gate 1はv0.1.0として `extensions/mygpt-worker-fanout/` に実装済みで、STATIC PASS。

### Gate 1で追加したもの

- `composer_adapter.js`
- owned destination tab限定のpacket挿入handler
- `state.gate1` 独立state machine (`IDLE -> INSERTING -> PASS/FAIL`)
- Gate 1 `operationToken` によるstale result抑止
- 挿入前のowned tab worker identity再確認
- composer既存draftがあれば `COMPOSER_NOT_EMPTY` で無変更FAIL
- textarea native value setter + input event
- contenteditable `insertText` + DOM/input-event fallback
- 挿入後のcomposer readback exact-match確認
- content resultの `submitted: false` をbackgroundが必須証拠として確認
- popupのGate 1 packet欄 / Gate1 status / Composer / Method / Chars
- Gate 1-only reset
- `test_composer_adapter.js`
- `test_gate1_safety.js`

### Gate 1でまだ絶対に行わないもの

- send-button lookup
- click submit
- Enter/KeyboardEvent submit
- form submit/requestSubmit
- canonical/file attachment
- image generation invocation
- output extraction/download
- internal ChatGPT API / Bearer / response interception
- automatic retry/polling

Static safety testは `.click(` / `.submit(` / `.requestSubmit(` / `KeyboardEvent` / `send-button` / `DataTransfer` / `new File(` などをsourceから拒否する。

manifest permissionは引き続き `storage` のみ。Gate 0実機で `tabs` permission不要は確認済みで、Gate 1でも追加していない。

## 次にやること

**Gate 1 Vivaldi live insertion-only testのみを行う。canonical attachmentやsubmitへ進まない。**

手順は `extensions/mygpt-worker-fanout/README.md`。

v0.1.0へ更新後、`scripting` permissionなしのため利用tabを1回reloadする必要がある。

Gate 0 PASS stateとowned tabがextension reload後も残っている場合:
1. owned destination tabを1回reload
2. popupを開く
3. composerが完全に空であることを確認
4. default packetのまま `Gate 1 packetをowned tabへ挿入` を1回だけ押す
5. owned tabを目視

Gate 0 stateが失われていた場合:
1. `全状態をリセット`
2. `MYGPT Single Frame Worker Test`を手動で開いてreload
3. Gate 0を再実行してPASS確認
4. そのowned destinationでGate 1を実施

Default packet:

```text
[MYGPT_GATE1_TEST]
mode=INSERT_ONLY
submit=FORBIDDEN
purpose=verify_composer_insertion
```

PASS条件:
- Gate 0 = PASS
- Gate1 = PASS
- packet全文がowned destination composerに未送信draftとして表示
- Composer / Methodがpopupに表示
- user turnがchat historyに増えない
- generationが開始しない
- file attachmentなし
- extra tabなし
- extension/service-worker errorなし

FAIL時はその具体的popup error / 目視状態を証拠に修正する。推測でpermissionやselectorを広げない。

Gate 1 live PASSまではcanonical attachment / controlled submitを実装しない。

`research/temp-extension-sources/` はaccepted completion前なので削除しない。

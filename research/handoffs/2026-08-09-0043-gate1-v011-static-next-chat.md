# 次チャット用引継ぎ — 2026-08-09 00:43 JST

GitHub `kaillebidan-byte/MYGPT` の `main` を正本として継続する。

最初に読む:
1. `research/PROJECT-HANDOFF.md`
2. `research/experiments/2026-08-08-worker-fanout-gate0-live-pass.md`
3. `research/experiments/2026-08-08-worker-fanout-gate1-static.md`
4. `research/decisions/2026-08-08-three-extension-synthesis.md`
5. `research/audits/2026-08-08-translation-loop-0.5.1-static-analysis.md`
6. `research/decisions/2026-08-08-temp-extension-source-lifecycle.md`

## CURRENT stopping point

Gate 0 v0.0.2はVivaldi実機PASS済み。

Gate 1 v0.1.0では新規 `composer_adapter.js` を実装したが、ユーザーから「Translation Loop 0.5.1は自作で、ZIPは直接流用するために提供した。車輪を再発明しないこと」と明確な修正指示があった。

これを受け、Gate 1はv0.1.1へ改修済み。

### Translation Loop 0.5.1実ソースの直接利用

一時退避済み分割base64 ZIPをGitHub Actionsで復元し、既知SHA-256
`2c10ed7156ad30fbb8454fa962cff604e24a5ad029f4406d92576fe9400e1b2a`
を検証して展開した。

展開先:
`research/temp-extension-sources/translation-loop-0.5.1-extracted/`

確認済み実ソース:
- `prompt_stacker_runner.js`
- `runtime_guard.js`
- `content.js`
- `test_prompt_stacker_runner.js`
- `LICENSE-PROMPT-STACKER`

一時展開workflowは削除済み。展開ソース自体はaccepted completion前なのでまだ削除しない。

### Gate 1 v0.1.1変更

削除:
- `extensions/mygpt-worker-fanout/composer_adapter.js`
- `extensions/mygpt-worker-fanout/tests/test_composer_adapter.js`

追加:
- `prompt_stacker_insert_runner.js`
- `LICENSE-PROMPT-STACKER`
- `tests/test_prompt_stacker_insert_runner.js`

`prompt_stacker_insert_runner.js` はTranslation Loopの実 `prompt_stacker_runner.js` から送信部分だけ除いたinsert-only fork。

直接流用した要素:
- editor selector戦略
- textarea/input native value setter
- contenteditable `execCommand("insertText")`
- text fallback + input event
- bounded `waitFor`
- runner generation/cancel guard
- existing draft fail-closed
- reflection wait

Gate 1 forkから完全削除した要素:
- send button探索
- `.click()`
- Enter/KeyboardEvent fallback
- submit workflow
- post-submit evidence

Gate 1 production sourceのno-submit safety testで `.click(` / `.submit(` / `requestSubmit(` / `KeyboardEvent` / `send-button` / `composer-submit-button` / file attachment / network interceptionを拒否する。

### v0.1.0スクショの診断修正

ユーザーのv0.1.0スクショ:

```text
Status: AWAITING_DESTINATION
Expected: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Observed: -
Tab: 22739706
Gate1: IDLE
```

当初これをGate 0 handshake回帰と断定したが、その断定は強すぎた。

popupがGate 0 START時の古いsnapshotを表示したまま、後続の`chrome.storage.session` PASS更新を購読していなかったため、backgroundはPASS済みでもpopupだけAWAITING表示の可能性があった。

v0.1.1 popup:
- `chrome.storage.onChanged` session購読
- state即時render
- `updatedAt`で古いsnapshotによる表示巻き戻し防止

さらにbackgroundには、OPENING中に届いたsame-worker early reportをtab IDで一時保留し、`chrome.tabs.create()`が返した実owned tab IDと一致したものだけownership保存後に採用するhardeningを追加。

periodic polling / auto retry / permission追加はしていない。

### STATIC PASS

v0.1.1 packaged build:

```text
python -m json.tool manifest.json                         PASS
node --check route_adapter.js                            PASS
node --check prompt_stacker_insert_runner.js             PASS
node --check content.js                                  PASS
node --check background.js                               PASS
node --check popup.js                                    PASS
node tests/test_route_adapter.js                         PASS
node tests/test_prompt_stacker_insert_runner.js          PASS
node tests/test_gate1_safety.js                          PASS
chrome.tabs.create occurrence count = 1                  PASS
manifest permissions = ["storage"]                      PASS
forbidden production-source scan                         PASS
```

ZIP SHA-256:
`b41409ee1ba9e75f2053acc5408ff860d4e14617f23043729b921c9267acc602`

## 次にやること

**v0.1.1 Vivaldi実機テストのみ。canonical attachment / submitへ進まない。**

1. v0.1.1へ差し替えてVivaldi extension Reload。
2. source Custom GPT tabを1回reload。
3. `全状態をリセット`。
4. Gate 0を1回実行。
5. popupを開いたままでも `Status: PASS` / `Observed` が自動反映されることを確認。
6. Gate 1 buttonが自動で有効化されることを確認。
7. owned destination composerが空であることを確認。
8. default packetのままGate 1挿入を1回実行。
9. packetが未送信draftとして正確に表示されることを確認。
10. popup Gate1 = PASS、Method = `translation-loop-prompt-stacker-insert-only` を確認。
11. user turn増加なし、assistant/image generation開始なし、file添付なし、extra tabなしを確認。

Default packet:

```text
[MYGPT_GATE1_TEST]
mode=INSERT_ONLY
submit=FORBIDDEN
purpose=verify_composer_insertion
```

Gate 1 live PASSまではcanonical attachment / controlled submitを実装しない。

Translation Loopの`runtime_guard.js`も実ソース確認済み。Gate 0 accepted ownershipを今ここで一気に置換すると回帰源になるためv0.1.1では直接組み込んでいない。multi-worker state競合が増える次段階で直接再利用候補とする。

# 次チャット用引継ぎ — 2026-08-09 01:05 JST

GitHub `kaillebidan-byte/MYGPT` mainを正本とする。

最初に読む:
1. `research/PROJECT-HANDOFF.md`
2. `research/decisions/2026-08-08-three-extension-synthesis.md`
3. `research/experiments/2026-08-09-worker-fanout-v2-rebuild-static.md`
4. Translation Loop / VoiceBridge 0.2.6 extracted temporary source
5. AutoGPT static analysis

## CURRENT

旧 `extensions/mygpt-worker-fanout/` は比較用に残す。
新しい本命候補は `extensions/mygpt-worker-fanout-v2/` v0.2.0。

方針は変更済み:
- Translation Loop 0.5.1は原則直接流用。runtime_guard / runToken / Prompt Stacker / controlled submit / positive evidence / testsを再発明しない。
- VoiceBridge 0.2.6も原則直接流用。route/generation/background-tab observerを再発明しない。
- AutoGPT 0.0.71だけ選別流用。File/DataTransfer/file input/new-chatなど通常UIプリミティブは使うが、internal API/Bearer/fetch interception/security-header removal/telemetry/external upload/output scrapingは使わない。
- permission最小化を目的化しない。v2は `storage`, `tabs`, `scripting`, `unlimitedStorage`。

VoiceBridge ZIPも `research/temp-extension-sources/voicebridge-0.2.6-extracted/` へ復元済み。抽出workflowは削除済み。

## v0.2.0 scope

1 workerを未送信READYにする:
- active source Custom GPT identity取得
- same workerをbackground tabで開く
- identity verification
- existing draft check
- real canonicalをFile/DataTransferでChatGPT file inputへ投入
- packetをTranslation Loop由来runnerで挿入
- `submitted:false` / exactMatch / attachment evidence確認
- READY

まだsubmitしない。

STATIC PASS済み。詳細は `research/experiments/2026-08-09-worker-fanout-v2-rebuild-static.md`。

## 次にやること

Vivaldiでreal canonicalを使った1-worker READY実機試験だけ行う。

PASS:
- Phase READY
- same `MYGPT Single Frame Worker Test`
- canonical visibly attached
- exact packet is unsent draft
- no user turn
- no generation
- no extra unexpected tab

`FILE_INPUT_NOT_FOUND`ならAutoGPTのfile/new-chat DOM実装をさらに直接参照してattachment selector/opening primitiveを補う。

READY PASS後は細かいGateを増やさず:
1. same prepare routineをF2/F3/F4の3 fixed slotsへ拡張
2. canonical one-selectionを3 tabへ複製
3. 3 distinct packets
4. all READY unsent
5. Translation Loopのoriginal controlled send + positive submission evidenceを復帰
6. VoiceBridge generation observerを直接流用
7. single-slot generation PASS後に3-worker generation

`research/temp-extension-sources/` はaccepted completion前なのでまだ削除しない。

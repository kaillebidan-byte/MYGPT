# MYGPT known issues / limitations index

更新日: 2026-08-09 19:27 JST

この文書は既知不具合・制約の**索引**。詳細な再現ログや原因分析は `research/incidents/` / `research/experiments/` / `research/audits/` に置く。

Status:
- `ACTIVE` — 現在も発生し得る
- `VERIFYING` — 修正/方針ありだが実機acceptance未完了
- `MITIGATED` — 原因/条件が分かり、現行architectureで回避中
- `RESOLVED` — 現行baselineでは修正済み

---

## ACTIVE

### KI-001 — single-frame生成のfirst-pass pose / identity drift

Status: `ACTIVE`

症状:
- 指定した局所姿勢が少し浅い / 深い
- visible hand articulationやsmall landmark近傍の位置がずれる
- sleeve silhouetteや局所identityがfirst passで崩れる場合がある

現在の扱い:
- global worker tuningを再開しない
- 失敗frameだけcanonicalから独立retryする
- generated frameを次frameのidentity sourceにしない

Evidence:
- `research/decisions/2026-08-08-production-v0-generalized-verdict.md`
- related R1 / R2 audits and experiments

### KI-002 — Custom GPT baseでThinking直画像生成が失敗するruntimeケース

Status: `ACTIVE`

観測:
- Custom GPT baseからThinkingで直接画像生成しようとした経路でtool availability failureを再現した履歴がある
- 後のclean BranchでThinkingへ切り替えた画像生成は成功した

未確定:
- Branchそのものが成功原因か
- runtime/tool availabilityの一時状態か
- ThinkingがInstantより安定/高品質か

現在の扱い:
- production defaultはInstantを維持
- 将来、`Instantで準備 -> Branch -> Thinking -> image generation` を独立実験する
- v5では`branch-thinking` strategy名だけ予約し、v0.5.0では`unsupported`
- selected-output acceptanceや画像差分分析より先にBranch実装を始めない

Evidence:
- `research/experiments/2026-08-08-n2-branch-thinking-followup-result.md`
- `research/runtime/2026-08-08-single-frame-worker-live-snapshot.md`
- `research/plans/2026-08-09-worker-orchestrator-v5-architecture.md`

### KI-003 — `1 request = 1 image` は候補数保証にならない

Status: `ACTIVE`

観測:
- worker Instructionsが1画像を要求していても、Instant / ThinkingでA/B候補が返る場合がある

現在の扱い:
- platform-level multiplicity保証として扱わない
- downstream処理は「必ず1候補だけ」を前提にしない

Evidence:
- `research/runtime/2026-08-08-single-frame-worker-live-snapshot.md`
- `research/PROJECT-HANDOFF.md`

---

## VERIFYING

### KI-004 — selected output directory permission can return to `prompt`

Status: `VERIFYING`

v0.4.6 live observation:

```text
Phase: COMPLETE / COOLDOWN | Recovery: COMPLETE | Output: PERMISSION_REQUIRED
F2 image=COMPLETE/...F2.png | output=-
F3 image=COMPLETE/...F3.png | output=-
F4 image=COMPLETE/...F4.png | output=-
output OUTPUT_DIRECTORY_PERMISSION_REQUIRED: {"permission":"prompt"}
```

Confirmed boundary:
- v0.4.4 fanout succeeded;
- all three generations succeeded;
- v0.4.5 image recovery succeeded;
- selected-folder relocation did not begin because the stored directory handle's read/write permission was `prompt`;
- original recovered images remained in `Downloads/MYGPT-Worker-Fanout/`.

Cause class:
- `FileSystemDirectoryHandle` persistence and permission persistence are separate;
- a stored handle can be recovered from IndexedDB while write permission needs to be requested again;
- that permission request requires a user gesture, so the service worker can detect `prompt` but cannot silently grant it.

Prior-art result:
- Chrome official guidance uses `queryPermission()` then `requestPermission()` for stored handles;
- Chrome documents VS Code Web as a concrete IndexedDB persisted-handle example;
- `chrome.downloads` remains Downloads-relative and cannot silently target an arbitrary absolute directory;
- mature helper libraries (`browser-fs-access`, `native-file-system-adapter`, `idb-keyval`) were checked, but none should be added wholesale for the current one-directory Chromium-only requirement;
- AutoGPT 0.0.71 does not contain a reusable arbitrary-directory permission module; Autojourney solves stronger native download management with a separate desktop Downloader.

Evidence:
- `research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md`

Main v0.4.7 state:
- reactive popup reauthorization exists;
- conceptually matches the standard stored-handle permission pattern;
- remains provisional because permission is discovered after the long run reaches relocation.

v0.5.0 candidate:
- development branch: `worker-orchestrator-v5`;
- custom-folder permission is preflighted from the **Run user gesture before generation starts**;
- `prompt` -> `requestPermission({mode:"readwrite"})` during Run click;
- denied/error -> abort before F2/F3/F4 worker creation;
- granted -> existing proven fresh-chat engine starts;
- post-run `PERMISSION_REQUIRED` remains only as a defensive fallback;
- v0.4.4 fanout, v0.4.5 collector, and `output_relocator.js` are unchanged in the branch diff.

Acceptance pending:
- branch v0.5.0 Run resolves selected-folder permission before generation;
- denied permission starts zero workers;
- granted permission permits normal three-worker generation and `Recovery: COMPLETE`;
- final `Output: COMPLETE`;
- F2/F3/F4 `output=COMPLETE/<filename>`;
- selected folder contains all three images;
- temporary Downloads copies are removed only after verified relocation.

Evidence:
- `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md`
- `research/plans/2026-08-09-worker-orchestrator-v5-architecture.md`
- branch `worker-orchestrator-v5:extensions/mygpt-worker-fanout-v3/README.md`

---

## MITIGATED

### KI-005 — global multi-state exposureによる2x2 / sequence-sheet collapse

Status: `MITIGATED`

条件:
- 1つのgeneration-facing contextにfull motion、複数state、POSE A/B/C/D、progress、board/sheet/2x2等の構造が露出すると、複数poseを1画像へ束ねる傾向が強くなる

現行回避:
- F2/F3/F4を別conversation contextへ隔離
- 各workerはcanonical + current single static poseだけを見る
- full motion / other slots / sequence structureをworkerへ渡さない

Evidence:
- `research/incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`
- M1 / M2a / M2b / M2d / M2e experiments

注意:
- この問題は「画像モデルが絶対に2x2を作らなくなった」というRESOLVEDではない。隔離境界によってproductionで回避しているためMITIGATED。

### KI-006 — extension reload後のold content context invalidation

Status: `MITIGATED`

症状:
- unpacked extensionをReload/差し替えすると、既存tab内のold content scriptが `Extension context invalidated` になる

現行回避:
- v0.4.3以降、old content instanceはruntime bridgeをhard-stopし再接続しない
- extension差し替え後はsource Custom GPT tabをReloadしてclean testを開始する

Evidence:
- Worker Fanout v0.4.3 history
- current Worker Fanout checkpoint

---

## RESOLVED

### KI-007 — attachment UI raceを一発fatalにしていた退行

Status: `RESOLVED`

旧症状:
- AutoGPT-style file assignmentは成立しているのに、attachment UI evidenceが遅れただけで `ATTACHMENT_UI_NOT_CONFIRMED` fatalになった

Fix:
- v0.4.2でfile input再取得 + positive UI wait + late evidence確認 + bounded one retry

結果:
- v0.4.4実機でF2/F3/F4すべてattempt-1 attachment PASS

Evidence:
- `extensions/mygpt-worker-fanout-v3/README.md`
- v0.4.2 regression record / current checkpoint

### KI-008 — prompt readbackが先頭`<p>`だけを読んでいたfalse mismatch

Status: `RESOLVED`

旧症状:
- expected prompt全文に対しobserved charsが先頭markerだけとなり、paste failureに見えた

原因:
- pasteではなくreadback側が最初の`#prompt-textarea p`しか読んでいなかった

Fix:
- composer内の段落を順に読み `\n` で結合して比較

Evidence:
- Worker Fanout v0.3.x history / current checkpoint

### KI-009 — 前slotの生成完了を次slot開始条件にしていた過剰待機

Status: `RESOLVED`

旧挙動:
- v0.4.3で `send -> COMPLETE -> cooldown -> next slot` としてしまった

Fix:
- v0.4.4で `send -> positive submit evidence -> 5s cooldown -> next slot`
- completion monitorは非ブロッキング

結果:
- v0.4.4 F2/F3/F4 live PASS

Evidence:
- `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md`

---

## 更新ルール

- 再現性のある新規問題が出たら、まず実画像/ログ/sourceを確認する。
- 詳細記録を `incidents/` または `experiments/` に作り、このindexからリンクする。
- 仮説だけでACTIVE issueを追加しない。
- 修正後は `RESOLVED` または `MITIGATED` へ移し、どのbaselineで確認したかを書く。
- 古い棄却案を新証拠なしでACTIVEへ戻さない。

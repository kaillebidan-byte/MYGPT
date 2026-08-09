# MYGPT調整プロジェクト — CURRENT HANDOFF

更新日: 2026-08-09 19:27 JST

GitHub `main` をdurable stateの正本とする。未mergeの実装候補はbranch名とstatusを明記し、main baselineと混同しない。

## 次チャットで最初に読む

1. `research/PROJECT-HANDOFF.md` — このCURRENT
2. `README.md` — root status / active development branch
3. `research/KNOWN-ISSUES.md` — 既知不具合 / 制約
4. `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md` — v0.4.x実機checkpoint
5. `research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md` — selectable folder既存例/reuse判断
6. `research/plans/2026-08-09-worker-orchestrator-v5-architecture.md` — v5 architecture
7. `research/SEARCH-INDEX.md` — 既存例 / 中国語圏 / prior-art / community検索入口
8. `research/reference/README.md` — 実装・再利用資料入口

---

## 1. CURRENT generation status

**Production v0 generalized PASS**

Validated scope:
- 1 canonical character
- F1 = canonical静止姿勢
- one-shot motion
- F2/F3/F4のみ独立生成
- front-facing baseline camera
- chroma background
- deterministic board / strip post-processing

Current generation rule:
- plannerはfull motionを理解してよい
- generation workerへ渡すのはcanonical + current single static poseだけ
- full motion / other slots / progress / sequence / board / sheet / 2x2 conceptsをworkerへ渡さない
- generated frameを次frameのidentity sourceにしない
- first-pass failureは失敗frameだけcanonicalからlocal retryする

Generation品質の正本:
- `research/decisions/2026-08-08-production-v0-generalized-verdict.md`

---

## 2. CURRENT worker

Name:
`MYGPT Single Frame Worker Test`

Route:
`/g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test`

Validated default:
- Instant
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Knowledge NONE
- Actions NONE
- canonical direct reference
- current one static pose only

Thinkingはproduction defaultではない。Branch後Thinking画像生成の成功例はあるが、direct Thinking failureとの因果は未確定。

Runtime snapshot:
- `research/runtime/2026-08-08-single-frame-worker-live-snapshot.md`

---

## 3. Main baseline — Worker Fanout v4

Source on `main`:
`extensions/mygpt-worker-fanout-v3/`

### v0.4.4 — fresh isolated fanout LIVE PASS

Proven sequence:

```text
open F2
-> 15s OPEN_WAIT
-> AutoGPT DataTransfer attachment
-> 15s ATTACH_WAIT
-> MAIN-world synthetic paste
-> Translation Loop native click
-> positive submit evidence
-> 5s cooldown
-> open F3
-> same
-> open F4
```

Generation completion does not gate opening the next slot. Completion monitoring remains passive.

### v0.4.5 — image recovery LIVE PASS

After F2/F3/F4 completion:
- latest assistant turnからgenerated imageを回収
- `chrome.downloads`で `Downloads/MYGPT-Worker-Fanout/` へ保存
- browser downloadの実完了を確認
- F2/F3/F4画像保存まで実機PASS

This is the proven recovery baseline.

### v0.4.6 — selected-folder LIVE FAIL isolated

Observed:

```text
Generation: COMPLETE
Recovery: COMPLETE
Output: PERMISSION_REQUIRED
permission: prompt
```

Confirmed:
- fanout PASS
- three image generations PASS
- v0.4.5 recovery PASS
- selected directory handle persisted
- write permission returned to `prompt`
- relocation did not start
- recovered images remained safely in default Downloads staging

The failure is output permission lifecycle only.

### v0.4.7 — reactive fix on main, PROVISIONAL

A popup reauthorization path exists, but do not spend another generation run validating this reactive ordering first.

The prior-art review showed permission should be preflighted from the Run user gesture before a long generation starts.

---

## 4. Existing-solutions review — COMPLETE

Record:
- `research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md`

Preferred browser-only pattern is the Chrome / VS Code Web lifecycle:

```text
showDirectoryPicker({mode:"readwrite"})
-> persist FileSystemDirectoryHandle in IndexedDB
-> later queryPermission({mode:"readwrite"})
-> if needed requestPermission({mode:"readwrite"}) from user gesture
-> write through File System Access API
```

Checked but not adopted wholesale:
- `chrome.downloads` — Downloads-relative only
- `idb-keyval` — optional helper; unnecessary for one record/no bundler
- GoogleChromeLabs `browser-fs-access` — useful wrapper, not a drop-in permission-resume layer
- `native-file-system-adapter` — broader than current Chromium/Vivaldi need
- AutoGPT 0.0.71 — output/download plumbing but no arbitrary-directory permission module
- Autojourney Pro Downloader — external desktop companion; unnecessary while browser-native API is viable

Do not invent another filesystem architecture without new failing evidence.

---

## 5. ACTIVE DEVELOPMENT — Worker Orchestrator v5

Development branch:
`worker-orchestrator-v5`

Version:
`0.5.0`

Status:
**STATIC CANDIDATE / LIVE PENDING**

Architecture record:
- `research/plans/2026-08-09-worker-orchestrator-v5-architecture.md`

### Why a new line

Future session lifecycle may become:

```text
Instant preparation
-> Branch in new chat
-> switch branch to Thinking
-> generate in branch
```

Do not insert that as a large conditional chain inside the proven fresh-chat state machine.

v5 introduces an explicit **session strategy boundary**.

### Current strategies

`fresh-chat`
- `supported: true`
- routes to the existing proven `MYGPT_V4_RUN_THREE` engine

`branch-thinking`
- `supported: false`
- reserved only
- no branch automation in v0.5.0

### v5 selected-folder ordering

For a selected custom directory:

```text
user presses Run
-> queryPermission({mode:"readwrite"})
-> prompt => requestPermission({mode:"readwrite"}) during the Run gesture
-> denied/error => abort before any worker starts
-> granted => start proven fresh-chat engine
-> proven recovery
-> existing relocation/write/verify
```

The old post-run `PERMISSION_REQUIRED` path remains only as a defensive fallback if permission changes while a long run is active.

### v5 branch diff boundary

Compared with the branch base, v0.5.0 changes only:
- manifest/name/version
- popup UI
- popup Run permission preflight
- new `session_strategy.js`
- static contract test
- branch README

Unchanged:
- `background.js`
- `image_collector.js`
- `output_relocator.js`
- attachment primitive
- paste primitive
- native send
- submit evidence
- completion monitoring

Do not merge v5 into main until live acceptance.

---

## 6. Near-frozen paths

新しい失敗証拠がない限り変更しない:
- one-worker-at-a-time fresh-chat preparation
- `OPEN_SETTLE_MS = 15000`
- AutoGPT `DataTransfer -> input.files -> change`
- bounded attachment retry
- `ATTACH_SETTLE_MS = 15000`
- MAIN-world synthetic paste
- observer-before-trigger ordering
- Translation Loop native click
- Enter fallback disabled
- positive submit evidence
- `SLOT_COOLDOWN_MS = 5000`
- runToken / stale async guard
- passive completion monitoring
- v0.4.5 `image_collector.js`
- `output_relocator.js` write / size verification / cleanup

問題が出た場合は、失敗した層だけ局所修正する。

---

## 7. NEXT ONLY

Next live test is **v0.5.0 on `worker-orchestrator-v5`**, not main v0.4.7.

Acceptance:
1. branch版unpacked extensionをload
2. source Custom GPT tabをreload
3. writable test folderをselect
4. Runを押す
5. permissionが`prompt`ならgeneration開始前にbrowser permission promptを解決
6. permission denied testではworker tabが1つも開始しないこと
7. granted testではF2/F3/F4 generation `COMPLETE`
8. `Recovery: COMPLETE`
9. `Output: COMPLETE`
10. F2/F3/F4 `output=COMPLETE/<filename>`
11. selected folderに3枚存在
12. temporary Downloads copiesはdestination verification後のみ削除

If PASS:
- v5 selected-folder behaviorをacceptedとしてcheckpoint/KNOWN-ISSUES/root READMEへ反映
- merge方針を決める
- Worker output-folder開発を止める
- 予定どおり**画像差分分析へ戻る**

---

## 8. Deferred future — Branch -> Thinking

OpenAI official product behavior confirms Branch creates a separate chat continuing from an earlier point. v5 therefore treats conversation/session creation as a future replaceable strategy.

Future `branch-thinking` engine should own only:
- Instant parent preparation
- branch creation/navigation
- branch identity/context verification
- model/reasoning switch to Thinking
- handoff to existing generation monitor/recovery primitives where compatible

Do not implement this before v0.5.0 selected-folder acceptance and the paused image-difference work unless new evidence changes priority.

---

## 9. Search / prior-art route

Before new external search:

`research/SEARCH-INDEX.md`
-> `research/chatgpt-project-practices/search-ledger.md`
-> relevant topic note / prior-art

Important existing assets include:
- selectable output-directory browser prior art
- China image-generation practices
- China character-consistency prior art
- planner/isolated-worker examples
- OpenGPTs / Autojourney community browser automation precedent
- public image GPT reuse research
- AutoGPT / Translation Loop / VoiceBridge implementation maps

Do not repeat broad searches already marked DONE unless product behavior or evidence changed.

---

## 10. Repository maintenance rule

`research/handoffs/` is historical snapshot storage, not CURRENT.

At each meaningful implementation/acceptance boundary, update without waiting for an explicit user instruction:
1. CURRENT / next action -> `PROJECT-HANDOFF.md`
2. known issue -> `KNOWN-ISSUES.md`
3. version PASS/FAIL -> current checkpoint + extension README + root README
4. external/prior-art result -> `SEARCH-INDEX.md` + ledger/topic note
5. implementation reuse result -> `reference/README.md` / relevant audit
6. old CURRENT conflicting with later evidence -> mark superseded/historical

Do not leave stale CURRENT text after a later live result.

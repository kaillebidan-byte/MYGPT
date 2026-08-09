# MYGPT調整プロジェクト — CURRENT HANDOFF

更新日: 2026-08-09 19:43 JST

GitHub `main` をdurable stateの正本とする。未merge候補や古いhandoffをCURRENTとして扱わない。

## 次チャットで最初に読む

1. `research/PROJECT-HANDOFF.md` — このCURRENT
2. `README.md` — root status
3. `research/KNOWN-ISSUES.md` — 既知不具合 / 制約
4. `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md` — Worker Orchestrator checkpoint
5. `extensions/mygpt-worker-fanout-v3/README.md` — v0.5.0現行実装
6. `research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md` — selectable folder既存例/reuse判断
7. `research/plans/2026-08-09-worker-orchestrator-v5-architecture.md` — v5 strategy architecture
8. `research/SEARCH-INDEX.md` — 既存例 / 中国語圏 / prior-art / community検索入口
9. `research/reference/README.md` — 実装・再利用資料入口

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

## 3. CURRENT browser automation — Worker Orchestrator v0.5.0

Source on `main`:
`extensions/mygpt-worker-fanout-v3/`

Display/version:
- `MYGPT Worker Orchestrator v5`
- manifest `0.5.0`

Status:
**SELECTED-FOLDER LIVE PASS**

### Proven inherited boundary

v0.4.4:
- fresh isolated F2/F3/F4 fanout LIVE PASS
- one worker tab at a time for preparation
- 15s open settle
- AutoGPT DataTransfer attachment
- 15s attach settle
- MAIN-world paste
- Translation Loop native click
- positive submit evidence
- 5s cooldown
- passive completion monitoring

v0.4.5:
- generated-image recovery LIVE PASS
- default staging under `Downloads/MYGPT-Worker-Fanout/`

### v0.4.6 failure that motivated v0.5.0

Observed:

```text
Generation: COMPLETE
Recovery: COMPLETE
Output: PERMISSION_REQUIRED
permission: prompt
```

Failure was isolated to selected-directory permission lifecycle. Generation and recovery remained successful.

### v0.5.0 solution — LIVE PASS

Existing-solutions review selected the Chrome / VS Code Web File System Access lifecycle:

```text
Run click
-> selected directory exists?
-> queryPermission({mode:"readwrite"})
-> if needed requestPermission({mode:"readwrite"}) during user gesture
-> granted: start proven fresh-chat engine
-> recovery
-> existing relocation / exact-size verify / cleanup
```

User live confirmation on 2026-08-09:
- test run succeeded
- selected output-folder save succeeded
- generated files were confirmed present in the selected folder

The successful v4 core remained unchanged for v0.5.0:
- `background.js`
- `image_collector.js`
- `output_relocator.js`
- attachment
- paste
- native send
- submit evidence
- completion monitoring

v0.5.0 was developed on `worker-orchestrator-v5`, then promoted to `main` through PR #10 after live success.

---

## 4. Session strategy boundary

`session_strategy.js` now separates future conversation/session creation behavior from the proven generation engine.

### `fresh-chat`
- `supported: true`
- LIVE PASS
- routes to the proven `MYGPT_V4_RUN_THREE` engine

### `branch-thinking`
- `supported: false`
- RESERVED ONLY
- no Branch automation in v0.5.0

Future candidate:

```text
Instant parent preparation
-> Branch in new chat
-> verify branch context / Custom GPT identity
-> switch branch to Thinking
-> generate in branch
-> reuse compatible monitor/recovery/output layers
```

Do not implement Branch by inserting a large conditional chain into the proven fresh-chat engine. Add a separate session engine behind the strategy boundary.

Architecture record:
- `research/plans/2026-08-09-worker-orchestrator-v5-architecture.md`

---

## 5. Existing-solutions review — COMPLETE

Record:
- `research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md`

Checked:
- Chrome / VS Code Web File System Access lifecycle — ADOPTED PATTERN
- `chrome.downloads` — Downloads-relative staging only
- `idb-keyval` — optional helper, not needed for one-record/no-bundler scope
- GoogleChromeLabs `browser-fs-access` — useful reference, not a drop-in permission-resume layer
- `native-file-system-adapter` — broader portability layer, unnecessary now
- AutoGPT 0.0.71 — output/download plumbing, no arbitrary-directory permission module to transplant
- Autojourney Pro Downloader — desktop companion alternative, not needed while browser-native path works

Do not invent another filesystem architecture without new failing evidence.

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
- `image_collector.js`
- `output_relocator.js` write / size verification / cleanup
- v0.5.0 Run-time permission preflight unless new output-layer failure appears

問題が出た場合は失敗した層だけ局所修正する。

---

## 7. Remaining defensive edge cases

Not separately live-tested yet:
- explicit selected-directory permission denial before Run
- permission revocation during an active long run

The successful selected-folder baseline is accepted despite these unexercised defensive cases.

---

## 8. NEXT ONLY

**Worker output-folder work is closed for now.**

Return to the paused **image-difference analysis**.

Do not expand Branch/Thinking automation yet unless:
- the user explicitly reprioritizes it, or
- new runtime evidence makes it necessary.

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

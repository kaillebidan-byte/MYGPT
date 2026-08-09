# MYGPT調整プロジェクト — CURRENT HANDOFF

更新日: 2026-08-09 19:12 JST

GitHub `main` を正本とする。チャット記憶、古いhandoff、superseded decisionだけを根拠に過去方式へ戻さない。

## 次チャットで最初に読む

1. `research/PROJECT-HANDOFF.md` — このCURRENT
2. `research/KNOWN-ISSUES.md` — 現在の既知不具合 / 制約 / 解決済み問題
3. `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md` — Worker Fanout最新実機checkpoint
4. `research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md` — selected-folder既存例 / reuse判断
5. `extensions/mygpt-worker-fanout-v3/README.md` — Worker Fanout現行source/version
6. `research/decisions/2026-08-08-production-v0-generalized-verdict.md` — generation品質の正本
7. `research/SEARCH-INDEX.md` — 既存例 / 中国語圏 / prior-art / community検索の入口
8. `research/reference/README.md` — 実装・再利用資料の検索入口
9. `research/runtime/2026-08-08-single-frame-worker-live-snapshot.md` — Custom GPT worker実機snapshot

research全体の資料地図:
- `research/README.md`

---

## 1. CURRENT generation status

**Production v0 generalized PASS**

Validated scope:
- 1 canonical character
- F1 = canonical静止姿勢
- one-shot motion
- 4 keyposes total
- F2/F3/F4のみ独立生成
- front-facing baseline camera
- chroma background
- deterministic board / strip post-processing

Current production rule:
- plannerはfull motionを理解してよい
- workerへ渡すのはcanonical + current single static poseだけ
- full motion / other slots / progress / F1-F4 sequence / board / sheet / 2x2 conceptsをworkerへ渡さない
- generated frameを次frameのidentity sourceにしない
- first-pass failureは失敗frameだけcanonicalからlocal retryする

Generation品質を上げるためのglobal tuningはCLOSED。automation都合でworker isolationを弱めない。

---

## 2. CURRENT worker

Name:
`MYGPT Single Frame Worker Test`

Route:
`/g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test`

Validated default:
- GPT-5.6 Sol / Instant
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Knowledge NONE
- Actions NONE
- canonical direct reference
- current one static pose only

Exact live configuration:
- `research/runtime/2026-08-08-single-frame-worker-live-snapshot.md`

Thinkingはproduction defaultではない。Branch後のThinking画像生成成功例はあるが、direct Thinking failureとの因果は未確定。

---

## 3. CURRENT browser automation architecture

Current direction:

```text
Translation Loop control plane
        +
stripped AutoGPT ChatGPT adapter
        +
VoiceBridge lifecycle / hidden-tab observation
```

Implementation lookup:
- `research/reference/2026-08-09-extension-reuse-inventory.md`
- `research/reference/2026-08-09-autogpt-0.0.71-internal-structure-map.md`
- `research/audits/2026-08-09-autogpt-0.0.71-deep-architecture-analysis.md`
- `research/decisions/2026-08-09-autogpt-stripped-clone-current.md`

Important supersession:
- 2026-08-08時点の「AutoGPTはvisible UI primitiveだけ使う」「fetch observationは全面除外」という判断はsuperseded
- passive fetch/WS observationとBearer capture/direct internal APIは別機構として扱う
- current Worker Fanoutはpassive evidenceを利用するが、Bearer captureやactive private APIをproduction前提にはしていない

古い `research/decisions/2026-08-08-three-extension-synthesis.md` はhistorical decisionとして直接superseded化済み。

---

## 4. Worker Fanout proven boundary

Source:
`extensions/mygpt-worker-fanout-v3/`

Display family:
`MYGPT Worker Fanout v4`

### v0.4.4 — isolated fanout LIVE PASS

Live-proven path:

```text
F2 worker tabを1つだけ開く
-> 15s OPEN_WAIT
-> canonical attach
-> 15s ATTACH_WAIT
-> MAIN-world packet paste
-> Translation Loop native click
-> positive submit evidence
-> 5s COOLDOWN
-> F3を初めて開く
-> same
-> F4
```

Generation completionは次slot開始条件ではない。各workerは送信後backgroundで生成を続ける。

### v0.4.5 — generated-image recovery LIVE PASS

- all generation slots COMPLETE後に回収開始
- latest assistant turnからgenerated-image candidateを選択
- `chrome.downloads`で `Downloads/MYGPT-Worker-Fanout/` へ保存
- browser downloadの実完了まで監視
- F2/F3/F4画像保存まで実機PASS

v0.4.5がimage recovery baseline。

### v0.4.6 — selected output folder LIVE FAIL isolated

Observed:

```text
Phase: COMPLETE / COOLDOWN | Recovery: COMPLETE | Output: PERMISSION_REQUIRED
F2 image=COMPLETE/...F2.png | output=-
F3 image=COMPLETE/...F3.png | output=-
F4 image=COMPLETE/...F4.png | output=-
output OUTPUT_DIRECTORY_PERMISSION_REQUIRED: {"permission":"prompt"}
```

Confirmed:
- fanout PASS
- three image generations PASS
- v0.4.5 image recovery PASS
- selected directory handle persisted but write permission returned to `prompt`
- service worker correctly refused to write without permission
- recovered files remained safely in default Downloads staging folder

Therefore do not touch generation/recovery paths for this failure。

### v0.4.7 — reactive permission patch, PROVISIONAL

Status:
**STATIC IMPLEMENTED / LIVE TEST DEFERRED UNTIL PRIOR-ART ALIGNMENT**

Patch currently present:
- `output_directory_store.js` adds `requestWritePermission(handle)`
- `popup.js` can detect `PERMISSION_REQUIRED`
- popup button can become `保存先を再許可して保存`
- user click requests read/write permission on the existing stored handle
- after grant, output-directory metadata revision is renewed
- unchanged `output_relocator.js` can resume relocation
- manifest version `0.4.7`

Unchanged:
- `background.js`
- `image_collector.js`
- `output_relocator.js`
- attachment / paste / submit / completion mechanisms

The later reuse audit confirmed that stored handle + `queryPermission/requestPermission` is the correct standard pattern, but identified a better ordering: permission should be preflighted on the user's Run click before starting a long generation cycle.

---

## 5. Existing-solutions / prior-art review — COMPLETE

Record:
- `research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md`

### Preferred existing pattern — Chrome / VS Code Web

Browser-only standard approach:

```text
showDirectoryPicker({mode:"readwrite"})
-> persist FileSystemDirectoryHandle in IndexedDB
-> later queryPermission({mode:"readwrite"})
-> if needed requestPermission({mode:"readwrite"}) from user gesture
-> write with File System Access API
```

Chrome documentation uses VS Code Web as the concrete persisted-handle example.

### Candidates checked and not adopted wholesale

- `chrome.downloads`
  - valid for Downloads-relative v0.4.5 staging
  - cannot silently target arbitrary absolute folders
- `idb-keyval`
  - mature tiny IndexedDB helper; Chrome sample uses it
  - optional only; current extension stores one record and has no bundler
- GoogleChromeLabs `browser-fs-access`
  - mature File System Access wrapper/fallback
  - does not remove MYGPT-specific persisted-directory permission/resume lifecycle
- `native-file-system-adapter`
  - broad portability ponyfill
  - overkill for current Vivaldi/Chromium native API target
- AutoGPT 0.0.71
  - browser download uses `chrome.downloads.download`
  - output URL/gallery plumbing exists
  - no audited arbitrary-directory permission module to transplant
- Autojourney Pro Downloader
  - separate desktop companion solves browser download limitations/native folders
  - do not add a desktop dependency while browser-only standard API is viable

### Reuse rule for this fix

Use the **Chrome official / VS Code Web permission lifecycle**, not another custom filesystem architecture.

No extra third-party dependency is justified yet.

---

## 6. Near-frozen paths

新しい失敗証拠がない限り変更しない:

- one-worker-at-a-time tab preparation
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
- v0.4.5 image collector
- `output_relocator.js` unless relocation itself produces failing evidence

問題が出た場合は、失敗した層だけ局所修正する。

---

## 7. NEXT ONLY

**まだfresh v0.4.7 generation testをしない。**

先にpermission acquisitionだけをChrome/VS Code型のpreflightへ揃える。

Target ordering:

```text
user presses Run
-> custom folder selected?
   -> no: continue existing default flow
   -> yes: verify write permission now
       -> granted: start fanout
       -> prompt: request permission while Run user gesture is available
       -> denied/error: do not start generation
-> existing v0.4.4 fanout
-> existing v0.4.5 recovery
-> existing output relocation/write/verify
```

Post-run `PERMISSION_REQUIRED`は、長いrun中にpermissionが変化した場合のdefensive fallbackとして残す。

Permission preflight alignment後のacceptance:

1. extensionを差し替え/Reload
2. source Custom GPT tabをReload
3. 保存先フォルダを選択
4. Runを押す
5. write permissionが未許可なら**generation開始前**にbrowser permissionを解決
6. permission deniedならF2/F3/F4を開始しない
7. grantedならgeneration `COMPLETE`
8. `Recovery: COMPLETE`
9. `Output: COMPLETE`
10. F2/F3/F4 `output=COMPLETE/<filename>`
11. selected folderに3枚存在
12. verified relocation後だけtemporary Downloads copiesが削除されること

**selected-folder acceptanceがPASSしたらWorker Fanoutの機能追加を止め、画像差分の話へ戻る。**

---

## 8. External search / prior-art route

新しい外部検索を始める前に:

`research/SEARCH-INDEX.md`
→ `research/chatgpt-project-practices/search-ledger.md`
→ 該当topic note / prior-art

を読む。

既存資産:
- selectable output-directory/browser filesystem prior art
- 中国語圏 image-generation practices
- 中国圏 character-consistency prior art
- planner / isolated-worker既存例survey
- OpenGPTs / Autojourney等の中国/community browser automation precedent
- 公開画像生成Custom GPTのreuse調査

同じ一般検索を言い換えて繰り返さない。

---

## 9. Deferred — 今やらない

### Branch -> Thinking image generation

将来検証候補:

```text
Custom GPTをInstantで起動
-> Instantでは画像生成させない
-> clean conversation stateを作る
-> Branch
-> Branch先だけThinkingへ切り替え
-> Thinkingで画像生成
```

確認事項:
- Custom GPT conversationをbranchできるか
- branch先だけThinkingへ切替可能か
- canonical / Custom GPT Instructions / local packetが正しく継承されるか
- direct Thinking failureを回避できるか

selected-folder acceptanceや画像差分分析より先に実装しない。

---

## 10. Handoff / repository maintenance rule

`research/handoffs/` は過去時点のsnapshotとして保存する。

次チャット開始時に古いhandoffをCURRENTとして採用しない。まずこの `PROJECT-HANDOFF.md` を読む。

ユーザーが毎回GitHub更新を明示しなくても、作業の区切りでCURRENTとの差分を確認する。

最低限追随するもの:
1. CURRENT / next action変更 → `PROJECT-HANDOFF.md`
2. known issue変更 → `KNOWN-ISSUES.md`
3. version PASS/FAIL → current checkpoint + extension README + root README
4. external searchの新軸 → `SEARCH-INDEX.md` + search ledger/topic note
5. implementation lookup変更 → `reference/README.md`
6. old `CURRENT` documentが後続証拠と衝突 → superseded化 / historical降格

古い`CURRENT`表記を、後続実機結果と衝突したまま放置しない。

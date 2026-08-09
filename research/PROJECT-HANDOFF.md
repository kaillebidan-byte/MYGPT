# MYGPT調整プロジェクト — CURRENT HANDOFF

更新日: 2026-08-09 18:29 JST

GitHub `main` を正本とする。チャット記憶、古いhandoff、superseded decisionだけを根拠に過去方式へ戻さない。

## 次チャットで最初に読む

1. `research/PROJECT-HANDOFF.md` — このCURRENT
2. `research/KNOWN-ISSUES.md` — 現在の既知不具合 / 制約 / 解決済み問題
3. `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md` — Worker Fanout最新実機checkpoint
4. `research/decisions/2026-08-08-production-v0-generalized-verdict.md` — generation品質の正本
5. `research/reference/README.md` — 実装・再利用資料の検索入口
6. `research/runtime/2026-08-08-single-frame-worker-live-snapshot.md` — Custom GPT worker実機snapshot

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

古い `research/decisions/2026-08-08-three-extension-synthesis.md` と過去handoffは履歴として残すが、CURRENT実装判断では2026-08-09のreference/audit/decisionを優先する。

---

## 4. Worker Fanout proven boundary

Source:
`extensions/mygpt-worker-fanout-v3/`

Display family:
`MYGPT Worker Fanout v4`

### v0.4.4 — isolated fanout LIVE PASS

実機成功経路:

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

Live evidence:

```text
F2: COMPLETE | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=image-turn-stable
F3: COMPLETE | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=oracle-action-bar
F4: COMPLETE | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=image-turn-stable
```

### v0.4.5 — generated-image recovery LIVE PASS

- all generation slots COMPLETE後に回収開始
- latest assistant turnからgenerated-image candidateを選択
- `chrome.downloads`で保存
- browser downloadの実完了まで監視
- F2/F3/F4画像保存まで実機PASS

v0.4.5がimage recovery baseline。

### v0.4.6 — selectable output folder

Status:
**STATIC PASS / LIVE PENDING**

追加されたのはv0.4.5後段のoutput layerだけ。

- custom folder未指定: 従来 `Downloads/MYGPT-Worker-Fanout/`
- custom folder指定: selected directoryへcopy/write
- written byte sizeを検証
- 成功後のみtemporary Downloads copyを削除
- folder handleはIndexedDBへ保存

v0.4.4 `background.js` とv0.4.5 `image_collector.js` は変更していない。

詳細:
- `extensions/mygpt-worker-fanout-v3/README.md`
- `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md`

---

## 5. Near-frozen paths

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

問題が出た場合は、失敗した層だけ局所修正する。

---

## 6. NEXT ONLY

まずv0.4.6の実機acceptanceを1回行う。

PASS条件:

```text
Recovery: COMPLETE
Output: COMPLETE
F2 output=COMPLETE/<filename>
F3 output=COMPLETE/<filename>
F4 output=COMPLETE/<filename>
```

さらに:
- selected folderにF2/F3/F4の3画像が存在
- relocation成功後、temporary `Downloads/MYGPT-Worker-Fanout/` copyが削除
- `既定Downloadsに戻す` 後もv0.4.5 default pathが維持される

**v0.4.6がPASSしたらWorker Fanoutの機能追加を止め、画像差分の話へ戻る。**

---

## 7. Deferred — 今やらない

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

v0.4.6 acceptanceや画像差分分析より先に実装しない。

---

## 8. Known issues

索引:
- `research/KNOWN-ISSUES.md`

主な現在項目:
- first-pass pose / identity drift
- direct Thinking runtime failure case
- image candidate multiplicity非保証
- v0.4.6 selectable output live verification pending
- global multi-state exposureによるsheetificationはisolationでMITIGATED

詳細原因を再検討するときは、KNOWN-ISSUESから該当incident / experimentへ辿る。

---

## 9. Handoff rule

`research/handoffs/` は過去時点のsnapshotとして保存する。

次チャット開始時に古いhandoffをCURRENTとして採用しない。まずこの `PROJECT-HANDOFF.md` を読み、必要な場合だけ過去handoffへ降りる。

CURRENTが変わったら:
1. この文書を更新
2. 必要なら `KNOWN-ISSUES.md` を更新
3. 詳細証拠を `experiments/` / `incidents/` / `audits/` に保存
4. root `README.md` のCURRENT statusが食い違っていないか確認

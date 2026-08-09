# MYGPT research navigation

このディレクトリは、CURRENT判断、実験証拠、既知不具合、外部検索、実装資料、過去handoffを分離して保存する。

## 最初に読む

1. `research/PROJECT-HANDOFF.md`
   - 現在地
   - 次にやること
   - 凍結済み経路
   - deferred項目

2. `research/KNOWN-ISSUES.md`
   - ACTIVE / VERIFYING / MITIGATED / RESOLVED
   - 回避策
   - 根拠資料へのリンク

3. `research/SEARCH-INDEX.md`
   - 既存例検索
   - 中国語圏調査
   - prior art
   - planner / worker既存例
   - browser automation community例
   - 公開画像生成GPT調査

4. 必要な詳細資料へ進む。

## ディレクトリの役割

### `decisions/`

現在採用している設計判断、acceptance、supersessionを置く。

古いdecisionと新しいdecisionが衝突する場合は、明示されたsupersessionと日付を確認する。

### `experiments/`

再現条件、PASS/FAIL、比較実験、運用checkpointを置く。

現在のWorker Fanout checkpoint:
- `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md`

### `incidents/`

失敗現象を症状単位で追跡する。原因候補、棄却済み仮説、回避策、関連実験を集積する。

代表例:
- `research/incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`

### `chatgpt-project-practices/`

Web調査のdurable state。

入口:
- `research/chatgpt-project-practices/search-ledger.md`

主な内容:
- ChatGPT Projects実運用
- image reference
- image-generation orchestration context
- planner / isolated-worker既存例
- 中国語圏の角色一致性 / 姿势控制 / 多图参考 / 分镜

横断入口は `research/SEARCH-INDEX.md` を使う。

### `prior-art/`

論文・研究・production heuristicなど、設計仮説に使う先行研究を置く。

中国圏character consistency:
- `research/prior-art/2026-08-08-cn-character-consistency-recovered.md`

### `public-image-gpt-reuse/`

公開画像生成Custom GPTの既存例を調べた初期再構築研究。

CURRENT production構成ではないが、公開GPTから何を流用し何を捨てたかを調べる資料として残す。

入口:
- `research/public-image-gpt-reuse/README.md`

### `audits/`

拡張、source、生成物、architectureなどの監査記録。

### `reference/`

実装時の検索入口。既存extensionの再利用、selector、内部構造などを引く場所。

入口:
- `research/reference/README.md`

Worker Fanout実装を触る前に:
- `research/reference/2026-08-09-extension-reuse-inventory.md`

AutoGPTを調べる場合:
1. `research/reference/2026-08-09-autogpt-0.0.71-internal-structure-map.md`
2. `research/audits/2026-08-09-autogpt-0.0.71-deep-architecture-analysis.md`
3. `research/decisions/2026-08-09-autogpt-stripped-clone-current.md`

### `runtime/`

実際に動いているCustom GPTやbrowser-side構成のsnapshot。

### `handoffs/`

過去チャット終了時点のsnapshot。

**注意:** handoffは履歴であり、CURRENTの正本ではない。次チャットはまず `PROJECT-HANDOFF.md` を読む。

### `plans/`

未実装または過去時点の計画。CURRENT仕様として扱わない。

`Status: CURRENT PLAN` と書かれた古いplanでも、後続の `PROJECT-HANDOFF.md` / decision / checkpointが進んでいる場合は後続を優先する。

## 読み方

### 現在の作業を続行する

`PROJECT-HANDOFF.md`
→ `KNOWN-ISSUES.md`
→ handoffが指定するcurrent checkpoint / decision

### 外部例・既存解法を検索する

`SEARCH-INDEX.md`
→ `chatgpt-project-practices/search-ledger.md`
→ 該当topic note / prior-art

既に検索済みの一般論を言い換えて再検索しない。

### 中国語圏の例を探す

`SEARCH-INDEX.md`
→ `chatgpt-project-practices/china-imagegen-practices.md`
→ `prior-art/2026-08-08-cn-character-consistency-recovered.md`

browser automationの中国/community例なら:
`SEARCH-INDEX.md`
→ `experiments/2026-08-08-n3-orchestration-ceiling.md`

N3文書の当時の「未検証」結論ではなく、prior-art部分を使う。CURRENT実装結果は2026-08-09 checkpointを優先する。

### Worker Fanoutを修正する

`PROJECT-HANDOFF.md`
→ current Worker Fanout checkpoint
→ `reference/README.md`
→ `extension-reuse-inventory.md`
→ 現行extension source

成功済み経路を変更する前に、失敗証拠がどこにあるか確認する。

### 画像品質・差分へ戻る

production v0 generalized verdict
→ related R0/R1/R2 audit / experiment
→ `SEARCH-INDEX.md` のquality / China prior-artは必要なときだけ参照
→ relevant incident only when再現や原因比較が必要

### 過去の失敗を再確認する

`KNOWN-ISSUES.md` から該当incident / experimentへ辿る。全文検索だけで古い候補をCURRENTへ復活させない。

## 更新ルール

- CURRENTが変わったら、ユーザーが明示しなくても `PROJECT-HANDOFF.md` と入口文書の整合を確認する。
- 新しい再発性不具合や制約が確定したら `KNOWN-ISSUES.md` に索引を追加する。
- 外部検索で設計判断に使う新知見が出たら、検索台帳/topic noteと `SEARCH-INDEX.md` の導線を確認する。
- 詳細は `incidents/` / `experiments/` / `audits/` に書き、indexへ全文を複製しない。
- 古いhandoffは削除せず履歴として残す。
- supersededな判断は削除よりも、CURRENT文書から正しい後継資料へ誘導する。
- `CURRENT` と書かれた古い文書が後続実機結果と衝突した場合、その表記を放置しない。直接superseded化するか、CURRENT indexから明示的に降格する。
# Asset status classification

Date: 2026-08-08 JST
Status: CURRENT ASSET POLICY

## Purpose

過去のProject / Custom GPT / direct-2x2資産を残したまま、CURRENT production pathへ再混入させない。

分類は「ファイルを削除するか」ではなく「production generation runtimeへ見せてよいか」で決める。

## Classification

### CURRENT ACTIVE

現在のproduction v0で直接使うもの。

#### Runtime architecture

Repo内の旧Project Instructionsではなく、現在実機で検証済みのminimal Custom GPT workerを使う。

Validated default:
- Instant
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- Knowledge NONE
- canonical direct attachment
- one current static pose only
- targeted active-large-sleeve invariant

このworkerの実機UI設定はrepo内`project/`や`legacy/`の本文をCURRENT runtime sourceとして読み替えない。

#### Active post-processing / audit

- `audit/scripts/remove_chroma_key.py`
- `audit/scripts/compose_keypose_board_from_frames.py`
- `audit/scripts/build_motion_strip.py`
- `audit/scripts/machine_audit_board.py`

これらはCURRENT infrastructure。
C0で使用・検証済みの処理をproduction pathから外さない。

### CURRENT CONTROL / EVIDENCE

Generation workerへ見せるruntime資料ではないが、設計判断と回帰防止の正本。

- `research/PROJECT-HANDOFF.md`
- `research/decisions/2026-08-08-production-v0-acceptance.md`
- `research/decisions/2026-08-08-identity-continuity-direction.md`
- `research/experiments/2026-08-08-n2-branch-thinking-followup-result.md`
- W1-W4 experiment records
- C0 / N1 audits
- `research/MOTION-GENERATION-EXPERIMENT-LOG.md`

注意:
`MOTION-GENERATION-EXPERIMENT-LOG.md`内の古い`CURRENT`表記は各実験時点の履歴を含む。現在方式の判定では`PROJECT-HANDOFF.md`と最新decision文書を優先する。

### TEST / AUDIT FIXTURE

生成referenceとしては使わないが、post-processing / regression / failure reproductionに利用できる。

- `audit/scripts/build_motion_layout_guide.py`
- `audit/references/layout-guides/`
- `four-pose-portrait.svg`および派生layout guide
- 過去のC0固定candidate / audit artifact
- 過去のfailed board / repair outputが保存されている場合、その比較資料

許可する用途:
- deterministic composeのgeometry回帰
- machine audit回帰
- chroma処理回帰
- 過去failureの再現・比較

禁止する用途:
- Custom GPT workerへの画像reference
- Project Source / Knowledgeへのgeneration-conditioning目的の再投入
- pose guideとしてimage generationへ直接見せる

### FROZEN LEGACY

履歴・比較のため保持するが、CURRENT production generation runtimeへ読み込ませない。

Directory-level policy:
- `project/**`
- `legacy/**`

特に以下はproduction runtimeへ戻さない:
- `project/instructions/project-instructions.md`
- `project/instructions/post-generation-review-test.md`
- `project/sources/production/**`
- `legacy/custom-gpt/**`

理由:
- 旧Project/frame-first設計には4 visual jobs、F1生成、Project内sequence context等が含まれる
- 過去のProject Sources / layout guideは2x2 / sheet conditioningへ関与した
- CURRENTはF1=canonical、F2/F3/F4をisolated Custom GPT workerで3生成する構成

Frozenは「内容がすべて無価値」という意味ではない。
原則・監査観点・失敗事例はresearchへ抽出して使う。
本文をそのまま新worker Instructions / Knowledgeへコピーしない。

## Legacy reactivation rule

FROZEN LEGACYの資産を再利用したい場合は、mainのCURRENTへ直接戻さない。

必要条件:
1. どのCURRENT課題を改善するためかを明記する
2. 過去の棄却理由を特定する
3. その棄却理由を無効化する新証拠を示す
4. generation runtimeへ混ぜず、単一変数の実験として試す
5. CURRENT acceptance gateで比較する
6. PASS後にだけstatus変更を検討する

「昔使っていた」「情報量が多い」「品質が上がるかもしれない」だけでは再開理由にしない。

## Exposure rule

Workerが見てよいもの:
- canonical
- current one local static pose packet
- validated minimal worker global rules

Planner / audit側だけが見てよいもの:
- full motion
- acceptance contract
- research evidence
- machine audit / compose rules
- legacy failure history

この境界を崩さない。

## Current conflict resolution

2026-08-08時点でroot `README.md` と`project/instructions/project-instructions.md`には旧Project/frame-first方式を「現行」と読める表現が残っていた。

このasset policyにより、`project/**`はFROZEN LEGACYと確定する。
Root READMEはCURRENT architectureへ更新し、旧Project Instructionsにはfrozen bannerを付ける。

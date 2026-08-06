# 再編後のリポジトリ構成案

## 到着点

公開画像生成GPTの動作を生成コアとして流用し、MYGPT固有部分を薄い追加層にする。

```text
MYGPT/
├─ gpt/
│  ├─ production/
│  │  ├─ instructions.md
│  │  ├─ description.md
│  │  ├─ conversation-starters.md
│  │  └─ builder-settings.md
│  ├─ knowledge/
│  │  ├─ character-identity-reference.md
│  │  ├─ motion-vocabulary.md
│  │  └─ sprite-output-spec.md
│  └─ experimental-audit/
│     ├─ instructions-addon.md
│     ├─ github-audit-openapi.yaml
│     └─ test-cases.md
├─ audit/
│  ├─ workflows/
│  ├─ scripts/
│  ├─ specs/
│  └─ README.md
├─ research/
│  └─ public-image-gpt-reuse/
├─ legacy/
│  ├─ instructions/
│  ├─ knowledge/
│  └─ actions/
└─ README.md
```

## `gpt/production`

My GPTエディターへ実際に貼る内容だけを置く。

### `instructions.md`

公開GPTから流用した短い生成コアと、キャラクター同一性の必須条件だけを入れる。

含める内容:

- 画像生成依頼では画像生成Capabilityを直接使う
- 添付画像をキャラクターデザインの正本にする
- 指定された動作、ポーズ、表情だけを変える
- 明示されていない要素を維持する
- 軽微な不足は合理的に補う
- 単発依頼は一枚の差分画像として扱う
- スプライト指定がある場合だけKnowledgeの仕様を参照する
- 修正時は指定部分だけを変更する

含めない内容:

- GitHub runの探索
- Issueの取得
- artifactの取得
- 内部パスの列挙
- Action失敗時の長い分岐
- 公式9状態の全定義
- 監査閾値

### `builder-settings.md`

My GPTエディターで設定する項目を固定する。

想定設定:

- Image Generation: ON
- Web Search: OFF
- Canvas: OFF
- Code Interpreter & Data Analysis: OFFを基本。監査検証で必要な場合だけ別版でON
- Actions: 本番生成版ではOFF

## `gpt/knowledge`

参照資料だけを置く。

### `character-identity-reference.md`

キャラクター同一性を評価する観点を整理する。命令文ではなく、画像を比較するときの参照表にする。

### `motion-vocabulary.md`

状態名と、視覚的に伝わる動作例を置く。ユーザーが状態名だけを指定した場合に参照する。

### `sprite-output-spec.md`

フレーム数、透明背景、セル寸法、行列、ループ要件を置く。単発画像では参照しない。

## `gpt/experimental-audit`

生成後監査を試験する設定を本番生成版から隔離する。

### `instructions-addon.md`

監査を明示的に依頼された場合だけ適用する追加指示にする。

### `github-audit-openapi.yaml`

現行スキーマをそのまま本番扱いしない。次の2案を検証する。

#### 案A: 直接GitHub dispatch

現行方式。構成は少ないが、`openaiFileIdRefs`の入れ子と生成画像参照の不安定性がある。

#### 案B: 監査受付API

GPT Actionは次のトップレベル引数だけを監査受付APIへ送る。

```text
openaiFileIdRefs
request_id
expected_states
```

受付APIが次を行う。

1. 一時URLから画像を即時取得する。
2. 永続または短期ストレージへ保存する。
3. GitHub `repository_dispatch`を起動する。
4. 受付IDを返す。
5. GitHub runとIssueをサーバー側で関連付ける。

OpenAIの専用ファイル引数をトップレベルへ置けるため、GitHub APIへ直接合わせるより互換性が高い。

## `audit`

現行の監査ロジックをまとめる。画像生成GPTとは独立した通常のソフトウェアとして扱う。

移動対象:

- `.github/workflows/audit-sprite.yml`
- `scripts/`
- `specs/`
- `requirements.txt`
- 監査用の説明文書

GitHub Actionsの配置制約上、実際のworkflowファイルは`.github/workflows/`に残す。`audit/workflows/`には設計資料またはworkflow原本を置き、ルート側は実行用とする方法も選べる。

## `legacy`

現行の長いInstructions、Knowledge、Actionスキーマを履歴として残す。削除せず、運用設定から外す。

## 再編手順

1. 公開設定を基に`gpt/production/instructions.md`を作る。
2. 単発の画像生成だけでPreviewテストする。
3. キャラクター同一性の不足だけを追記する。
4. スプライトモードをKnowledge参照として追加する。
5. 現行監査を`experimental-audit`へ移す。
6. `openaiFileIdRefs`を実機検証する。
7. 自動受け渡しが安定した場合だけ監査を本番版へ戻す。

一度にすべてを統合せず、生成コア、スプライト、監査の順で段階的に有効化する。

# Production GPT

公開画像生成GPTから抽出した生成原則を使い、旧MYGPTの文面をコピーせず白紙から作成した本番設定。

## ファイル

- `instructions.md` — GPTの役割、モード判定、画像生成手順、境界
- `description.md` — GPTエディターの説明欄
- `conversation-starters.md` — 会話のきっかけ
- `builder-settings.md` — Capability、Knowledge、Preview試験の設定

## 既定動作

- 表情差分、ポーズ差分、一枚絵は1枚の画像として生成する
- 「モーション」「アニメーション」「フレーム」「スプライト」がある依頼はモーション素材として扱う
- モーションのフレーム数が未指定なら8フレームにする
- 添付画像をキャラクターデザインの正本にする
- 指定された要素だけを変更する
- 軽微な不足は確認せず補完する
- 画像生成依頼では画像生成機能を直接使う

## 含めないもの

- GitHub Actions
- 外部API
- 監査Action
- workflow runの確認
- Issueやartifactの取得
- 内部ファイルパスの処理

監査連携は`../experimental-audit/`で別に検証する。

## GPTエディターへの設定

1. `instructions.md`をInstructions欄へ貼る
2. `description.md`を説明欄へ設定する
3. `conversation-starters.md`から会話のきっかけを登録する
4. `builder-settings.md`に従ってCapabilityを設定する
5. `../knowledge/`の3ファイルをKnowledgeへアップロードする
6. 新しいPreviewチャットで単一画像とモーションを別々に試す

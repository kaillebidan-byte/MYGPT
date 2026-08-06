# MYGPT — Character Motion Image Generator

添付された基準キャラクター画像を保ったまま、表情・ポーズの一枚絵と、後から高品質に組み立てられるモーション素材を生成するCustom GPT用プロジェクト。

公開画像生成GPTの設計原則を調査し、再編前の設定を`legacy/`へ封印したうえで、本番GPT設定とKnowledgeを白紙から再構築している。

## 現在の方針

最終8フレームのスプライトを画像生成モデルへ一度に作らせない。

```text
基準キャラクター画像
  ↓
4キーポーズの2×2ボードを生成
  ↓
ポーズを分離・共通倍率で正規化
  ↓
4フレームストリップ
  ↓
必要なら別途生成した4中割りを追加
  ↓
8フレームストリップ
  ↓
監査
```

この分離により、セル境界のはみ出し、左右端の切れ、フレームごとの縮尺差、似た静止画の水増しを減らす。

## 現在の状態

- 再編前のGPT設定は`legacy/`へ退避済み
- 本番GPT設定は`gpt/production/`へ新規作成済み
- 本番Knowledgeは`gpt/knowledge/`へ新規作成済み
- モーション生成は2×2キーポーズ方式へ変更済み
- 2×2ボードを4・8フレームへ組み立てるコードを`audit/`へ追加済み
- 既存監査コード、テンプレート、仕様は`audit/`へ集約済み
- 監査試験設定は`gpt/experimental-audit/`へ分離済み
- 監査受付API本体は未実装

`legacy/`の内容は比較と履歴確認用であり、現行のMy GPTへそのまま設定しない。

## 構成

```text
gpt/
  production/             本番My GPT設定
  knowledge/              キャラクター同一性・動作・キーポーズ仕様
  experimental-audit/     GitHub監査の試験設定

audit/
  scripts/                キーポーズ組み立て・画像監査・補助成果物生成
  specs/                  2×2キーポーズ・最終アトラス規格
  assets/                 配置テンプレートとPNG書き出し補助
  templates/              機械可読な配置参照データ
  docs/                   組み立て・監査フロー文書
  requirements.txt        Python依存関係

research/
  public-image-gpt-reuse/ 公開GPT流用調査と再編資料

legacy/
  instructions/           再編前のInstructions
  knowledge/              再編前のKnowledge
  actions/                再編前のActionスキーマ
  docs/                    再編前の導入文書と概要
  examples/                再編前のプロンプト例

.github/workflows/
  audit-sprite.yml        実験監査workflow
  test-audit-scripts.yml  組み立て・監査コードのスモークテスト
  test-gpt-config.yml     GPT構成とOpenAPIの検証

PRIVACY.md                実験監査のプライバシー説明
```

## 本番GPT

設定方法は[`gpt/production/builder-settings.md`](gpt/production/builder-settings.md)を参照。

主なファイル:

- [`gpt/production/instructions.md`](gpt/production/instructions.md)
- [`gpt/production/description.md`](gpt/production/description.md)
- [`gpt/production/conversation-starters.md`](gpt/production/conversation-starters.md)
- [`gpt/production/builder-settings.md`](gpt/production/builder-settings.md)

Knowledge:

- [`gpt/knowledge/character-identity-reference.md`](gpt/knowledge/character-identity-reference.md)
- [`gpt/knowledge/motion-vocabulary.md`](gpt/knowledge/motion-vocabulary.md)
- [`gpt/knowledge/sprite-output-spec.md`](gpt/knowledge/sprite-output-spec.md)

本番GPTは一枚絵または2×2キーポーズ素材の画像生成だけを担当する。最終ストリップ化、GitHub Actions、外部APIは接続しない。

## キーポーズから4フレームを作る

```bash
python -m pip install -r audit/requirements.txt
python audit/scripts/build_motion_strip.py keyposes.png \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-4f.png \
  --debug-dir motion-debug
```

## キーポーズと中割りから8フレームを作る

```bash
python audit/scripts/build_motion_strip.py keyposes.png \
  --inbetween-board inbetweens.png \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-8f.png \
  --debug-dir motion-debug
```

詳細は[`audit/docs/keypose-motion-pipeline.md`](audit/docs/keypose-motion-pipeline.md)を参照。

## 最終アトラスの監査

```bash
python audit/scripts/audit_sprite.py INPUT_IMAGE \
  --spec audit/specs/pet-atlas-8x9.json \
  --output-dir audit-output
```

監査は寸法、透明画素、フレーム欠落、セル端接触、足元、縮尺、近似重複などを検査する。

## 監査試験

`gpt/experimental-audit/`は、本番GPTと分離した試験領域である。受付API本体を配備し、実機試験が合格するまでは本番GPTへ監査を追加しない。

## 調査と移動記録

- [`research/public-image-gpt-reuse/README.md`](research/public-image-gpt-reuse/README.md)
- [`research/public-image-gpt-reuse/migration-map.md`](research/public-image-gpt-reuse/migration-map.md)

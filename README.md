# MYGPT — Character Motion Image Generator

添付された基準キャラクター画像を保ったまま、指定された表情、ポーズ、動作、モーション、スプライト素材を生成するCustom GPT用プロジェクト。

公開画像生成GPTの設計原則を調査し、再編前の設定を`legacy/`へ封印したうえで、本番GPT設定とKnowledgeを白紙から再構築している。

## 現在の状態

- 再編前のGPT設定は`legacy/`へ退避済み
- 監査コード、テンプレート、仕様は`audit/`へ集約済み
- 本番GPT設定は`gpt/production/`へ新規作成済み
- 本番Knowledgeは`gpt/knowledge/`へ新規作成済み
- 監査試験設定は`gpt/experimental-audit/`へ新規作成済み
- GitHub Actionsは`audit/`配下のコードを参照するよう更新済み
- 監査受付API本体は未実装

`legacy/`の内容は比較と履歴確認用であり、現行のMy GPTへそのまま設定しない。

## 構成

```text
gpt/
  production/             白紙から作成した本番My GPT設定
  knowledge/              キャラクター同一性・動作・スプライト参照資料
  experimental-audit/     GitHub監査の試験設定

audit/
  scripts/                入力取得、画像監査、補助成果物生成
  specs/                  スプライト規格と監査閾値
  assets/                 配置テンプレートとPNG書き出し補助
  templates/              機械可読な配置参照データ
  docs/                   監査フロー文書
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
  test-audit-scripts.yml  監査コードのスモークテスト

PRIVACY.md                監査Actionのプライバシー説明
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

本番GPTは画像生成だけを担当する。GitHub Actionsや外部APIは接続しない。

## 監査試験

`gpt/experimental-audit/`は、本番GPTと分離した試験領域である。

新設計では、GPTからGitHub APIへ直接ファイル参照を送らず、監査受付APIを介する。

```text
実験GPT
  ↓
監査受付API
  ↓
GitHub repository_dispatch
  ↓
GitHub Actions
```

受付API本体を配備し、実機試験が合格するまでは本番GPTへ監査を追加しない。

## 監査サブシステム

```bash
python -m pip install -r audit/requirements.txt
python audit/scripts/audit_sprite.py INPUT_IMAGE \
  --spec audit/specs/pet-atlas-8x9.json \
  --output-dir audit-output
```

監査は画像を生成しない。生成済みスプライト画像の寸法、透明画素、フレーム欠落、セル端接触、足元、縮尺、近似重複などを検査する。

## 調査と移動記録

- [`research/public-image-gpt-reuse/README.md`](research/public-image-gpt-reuse/README.md)
- [`research/public-image-gpt-reuse/migration-map.md`](research/public-image-gpt-reuse/migration-map.md)

# MYGPT — Character Motion Image Generator

添付された基準キャラクター画像を保ったまま、指定された表情、ポーズ、動作の差分画像を生成するCustom GPT用プロジェクト。

公開されている画像生成GPTの短い生成コアを流用し、MYGPT固有のキャラクター同一性、スプライト仕様、品質監査を独立した層として追加する。

## 現在の状態

フォルダ再編と旧構成の退避が完了した段階。

- 再編前のGPT設定は`legacy/`へ移動済み
- 監査コード、テンプレート、仕様は`audit/`へ集約済み
- GitHub Actionsは新しい`audit/`配下を参照するよう更新済み
- 新しい本番GPT設定は`gpt/production/`へ作成予定
- 監査Actionは`gpt/experimental-audit/`で分離検証する

`legacy/`の設定は比較・履歴確認用であり、現行のMy GPTへそのまま設定しない。

## 構成

```text
gpt/
  production/             本番のMy GPT設定
  knowledge/              本番用の参照Knowledge
  experimental-audit/     生成後監査の実験設定

audit/
  scripts/                入力取得、画像監査、補助成果物生成
  specs/                  スプライト規格と監査閾値
  assets/                 配置テンプレートとPNG書き出し補助
  templates/              機械可読な配置参照データ
  docs/                   監査フロー文書
  requirements.txt        Python依存関係

legacy/
  instructions/           再編前のInstructions
  knowledge/              再編前のKnowledge
  actions/                再編前のActionスキーマ
  docs/                    再編前の導入文書と概要
  examples/                再編前のプロンプト例

research/
  public-image-gpt-reuse/ 公開GPT流用調査と再編資料

.github/workflows/
  audit-sprite.yml        実験監査workflow
  test-audit-scripts.yml  監査コードのスモークテスト

PRIVACY.md                監査Actionのプライバシー説明
```

詳細な移動先は[`research/public-image-gpt-reuse/migration-map.md`](research/public-image-gpt-reuse/migration-map.md)を参照。

## 監査サブシステム

```bash
python -m pip install -r audit/requirements.txt
python audit/scripts/audit_sprite.py INPUT_IMAGE \
  --spec audit/specs/pet-atlas-8x9.json \
  --output-dir audit-output
```

監査は画像を生成しない。生成済みスプライト画像の寸法、透明画素、フレーム欠落、セル端接触、足元、縮尺、近似重複などを検査する。

## 再構成の順序

1. `gpt/production/`へ公開GPT流用版の短いInstructionsを作る。
2. 単発のキャラクター動作差分で画像生成を検証する。
3. `gpt/knowledge/`へ同一性、動作語彙、スプライト仕様を分離する。
4. `gpt/experimental-audit/`で画像ファイル受け渡しを検証する。
5. 監査連携が安定した場合だけ本番GPTへ追加する。

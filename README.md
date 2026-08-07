# MYGPT — Character Motion Project

ChatGPT Projectでキャラクター画像・モーション素材を生成し、必要に応じてリポジトリ側でスプライト組み立てと監査を行うためのプロジェクト。

Custom GPTは本番経路から外し、過去設定として`legacy/custom-gpt/`へ退避する。

## 現在の構成

```text
project/
  instructions/            ChatGPT ProjectのProject Instructions
  sources/
    production/            Projectへ追加する本番用読み物
    reference-images/      基準画像の管理方針

audit/                     スプライト組み立て・監査コード
research/                  公開資料調査・設計記録
legacy/
  custom-gpt/              直前まで使用していたCustom GPT設定
  instructions/            さらに以前のInstructions
  knowledge/               さらに以前のKnowledge
  actions/                 旧Actionスキーマ
  docs/                    旧導入文書
  examples/                旧プロンプト例

.github/workflows/
  audit-sprite.yml          実験監査workflow
  test-audit-scripts.yml    組み立て・監査コードのスモークテスト
  test-project-config.yml   Project用フォルダ構成の検証
```

## ChatGPT Project

本番でChatGPTへ渡すものは`project/`だけを基準にする。

- `project/instructions/project-instructions.md` — Project Instructions欄
- `project/sources/production/` — Project sourcesへ追加する読み物
- 基準キャラクター画像 — ChatGPT Projectへ直接追加

`project/sources/production/`の本文は現在プレースホルダーで、次段階で再構築する。`legacy/custom-gpt/`の文章をそのままコピーしない。

## Audit

`audit/`はChatGPT Projectとは独立した後処理領域として維持する。

```bash
python -m pip install -r audit/requirements.txt
python audit/scripts/build_motion_strip.py keyposes.png \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-4f.png
```

既存の監査コードや仕様は、Project側の生成方針が固まった後で必要に応じて接続する。

## Legacy

`legacy/custom-gpt/`には、今回廃止するCustom GPT向けの本番設定、Knowledge、監査実験設定をそのまま保存する。

参照や比較には使えるが、ChatGPT Projectへ直接投入する現行ファイルではない。

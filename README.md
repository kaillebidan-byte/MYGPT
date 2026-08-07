# MYGPT — Character Motion Project

ChatGPT Projectでキャラクター画像・モーション素材を生成し、必要に応じてリポジトリ側でスプライト組み立てと監査を行うためのプロジェクト。

Custom GPTは本番経路から外し、過去設定として`legacy/custom-gpt/`へ退避する。

## 現在の構成

```text
project/
  instructions/
    project-instructions.md
  sources/
    production/
      01-character-identity.md
      02-motion-design.md
      03-keypose-board-spec.md
    reference-images/
      README.md

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
  test-project-config.yml   Project用本番構成の検証
```

## ChatGPT Project

本番でChatGPTへ渡す現行ファイルは`project/`を基準にする。

- `project/instructions/project-instructions.md` — Project Instructions欄
- `project/sources/production/01-character-identity.md` — 同一性判断
- `project/sources/production/02-motion-design.md` — 4キーポーズ設計
- `project/sources/production/03-keypose-board-spec.md` — 2×2画像仕様

基準キャラクター画像はProject Sourcesへ置くだけの経路に依存せず、画像生成を行う現在のチャットへ直接添付する。

新しい生成では前回生成画像を正本にせず、元の基準画像へ戻る。前回生成画像を使うのは、その画像自体を修正する場合だけとする。

Projectが担当するのは静止画と組み立て用2×2キーポーズ画像まで。最終ストリップの切り出し、倍率統一、位置合わせ、8フレーム化、アトラス化、監査はリポジトリ側で扱う。

## Audit

`audit/`はChatGPT Projectとは独立した後処理領域として維持する。

```bash
python -m pip install -r audit/requirements.txt
python audit/scripts/build_motion_strip.py keyposes.png \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-4f.png
```

画像生成段階のProject仕様と、後処理のピクセル規格・Python処理を分離する。

## Research

Projectsの実運用例、Sourcesの参照特性、キャラクター画像参照の試験結果は`research/`へ保存する。

## Legacy

`legacy/custom-gpt/`には廃止したCustom GPT向け本番設定、Knowledge、監査実験設定を保存する。

参照や比較には使えるが、ChatGPT Projectへ直接投入する現行ファイルではない。

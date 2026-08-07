# MYGPT — Character Motion Project

ChatGPT Projectでキャラクター画像・モーション素材を生成し、必要に応じてリポジトリ側で背景除去、スプライト組み立て、監査を行うためのプロジェクト。

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
      04-imagegen-workflow.md
    layout-guides/
      README.md
    reference-images/
      README.md

audit/
  scripts/
    build_motion_layout_guide.py
    remove_chroma_key.py
    build_motion_strip.py
  references/
    layout-guides/
      four-pose-portrait.svg
  specs/
  docs/

research/
  hatch-pet-porting.md
  PROJECT-HANDOFF.md

legacy/
  custom-gpt/

.github/workflows/
  audit-sprite.yml
  test-audit-scripts.yml
  test-project-config.yml
```

## ChatGPT Project

本番でChatGPTへ渡す現行ファイルは`project/`を基準にする。

- `project/instructions/project-instructions.md` — Project Instructions欄
- `project/sources/production/01-character-identity.md` — 同一性判断
- `project/sources/production/02-motion-design.md` — 自然言語要求からmotion contract、K1〜K4、timing planを作る汎用動作設計
- `project/sources/production/03-keypose-board-spec.md` — 主要・中割り2×2モーションボード仕様
- `project/sources/production/04-imagegen-workflow.md` — 画像生成ジョブの隔離、canonical identity、motion reference、layout guide、chroma、repair境界

配置専用の`four-pose-portrait.png`は`audit/scripts/build_motion_layout_guide.py`で生成し、ChatGPT ProjectのProject Sourceへ一度追加する。キャラクター正本と一緒に生成チャットへ直接添付しない。

基準キャラクター画像はProject Sourcesへ置くだけの経路に依存せず、画像生成を行う現在のチャットへ直接添付する。

新しい生成では前回生成画像を正本にせず、元の基準画像へ戻る。新しいチャットに1つのモーション依頼だけを置き、これを主要visual jobの開始点として扱う。

主要モーションでは画像生成を1回だけ行い、K1〜K4を1枚のportrait 2×2ボードへまとめる。K1〜K4を4つの別画像生成へ分解しない。

ユーザーが中割りや8フレーム化を求めた場合は、主要ボード合格後の後続ターンでI1〜I4の2×2中割りボードを別visual jobとして生成する。同一応答で主要ボードと中割りを自動連続生成しない。

画像生成段階の背景は均一な単色クロマキーとし、alpha化は後処理へ移す。

## Audit

`audit/`はChatGPT Projectとは独立した後処理領域として維持する。

layout guideの生成:

```bash
python audit/scripts/build_motion_layout_guide.py \
  --output project/sources/layout-guides/four-pose-portrait.png
```

生成されたPNGをProject Sourceへ追加する。GitHubには決定論的な生成スクリプトと参照SVGを置く。

生成されたraw chroma boardを透明化:

```bash
python audit/scripts/remove_chroma_key.py raw-keyposes.png \
  --output keyposes.png
```

透明2×2主要ボードから4f stripを作成:

```bash
python audit/scripts/build_motion_strip.py keyposes.png \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-4f.png
```

中割りを含む8fではmotion contractから得たframe planを明示する。

```bash
python audit/scripts/build_motion_strip.py keyposes.png \
  --inbetween-board inbetweens.png \
  --frame-plan K1,I1,K2,I2,I3,K3,I4,K4 \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-8f.png
```

上記はone-shotでK2→K3を細かくする例。loopでは`K1,I1,K2,I2,K3,I3,K4,I4`のようなplanを使える。

処理境界は次のとおり。

```text
ChatGPT Project
  -> raw portrait 2x2 board / flat chroma background
  -> remove_chroma_key.py
  -> transparent 2x2 board
  -> build_motion_strip.py + explicit frame plan
  -> normalized transparent strip
```

最終8フレームや複数状態アトラスを画像生成モデルへ一発生成させない。

## Research

Projectsの実運用例、Sourcesの参照特性、キャラクター画像参照の試験結果は`research/`へ保存する。

`research/hatch-pet-porting.md`には、OpenAI公式hatch-petのcanonical image、layout guide、visual job隔離、chroma post-processingからMYGPTへ移植した設計を記録する。

## Legacy

`legacy/custom-gpt/`には廃止したCustom GPT向け本番設定、Knowledge、監査実験設定を保存する。

参照や比較には使えるが、ChatGPT Projectへ直接投入する現行ファイルではない。

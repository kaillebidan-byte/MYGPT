# MYGPT — Character Motion Project

ChatGPT Projectでcanonical character imageからモーション用frameを生成し、Pythonでboard/stripへ決定論的に組み立てて監査するプロジェクト。

## 現行構成

```text
project/
  instructions/
    project-instructions.md
    post-generation-review-test.md
  sources/
    production/
      01-character-identity.md
      02-motion-design.md
      03-keypose-board-spec.md
      04-imagegen-workflow.md
      05-post-generation-audit.md
    layout-guides/
      README.md
    reference-images/
      README.md

audit/
  scripts/
    compose_keypose_board_from_frames.py
    machine_audit_board.py
    remove_chroma_key.py
    build_motion_strip.py
    build_motion_layout_guide.py
  references/layout-guides/
    four-pose-portrait.svg
```

## 現行パイプライン

```text
direct high-quality canonical image
        +
one natural-language motion request
        |
        v
motion contract F1 -> F2 -> F3 -> F4
        |
        v
4 visual jobs
(one person / one pose / one image each)
        |
        v
compose_keypose_board_from_frames.py
        |
        v
raw 1024x1536 2x2 board
        |
        +--> visual identity/motion review
        +--> machine_audit_board.py
        |
        v
failed frames only: one repair round
        |
        v
recompose / re-audit / select
```

画像生成モデルへ2×2 boardを直接描かせない。board geometry、共通倍率、baseline、safe gap、外周余白はPythonが担当する。

## canonical identity

現在の生成チャットへ直接添付された画像をidentity anchorとする。複数候補がある場合はユーザー指定を優先し、指定がなければ加工前に近く、全身が見え、固有ディテールを読み取れる最高品質・高解像度画像を使う。

過去生成frameやProject Sources内画像をcanonicalへ昇格させない。

## Project layout guide

`four-pose-portrait.png`はProject Sourceとして使用しない。過去テストで枠、Kラベル、divider等の模倣を誘発したため退役した。

GitHubのSVGとguide generatorは過去仕様・デバッグ用として保持する。

## Audit / post-processing

4 raw chroma framesをboard化:

```bash
python audit/scripts/compose_keypose_board_from_frames.py \
  --frames F1.png F2.png F3.png F4.png \
  --output raw-board.png
```

board監査:

```bash
python audit/scripts/machine_audit_board.py raw-board.png
```

個別frameをalpha化した後、4f stripを作る場合:

```bash
python audit/scripts/build_motion_strip.py \
  --keypose-images F1.png F2.png F3.png F4.png \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-4f.png
```

中割りも個別生成し、`--inbetween-images`と`--frame-plan`で順序を明示する。

## Legacy / research

Custom GPT設定は`legacy/custom-gpt/`へ退避。過去の2×2直接生成やhatch-pet移植判断は`research/`へ記録するが、現行Project Sourceではない。

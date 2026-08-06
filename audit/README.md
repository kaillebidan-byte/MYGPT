# Audit and assembly subsystem

画像生成GPTから分離した、モーション素材の組み立てとスプライト監査サブシステム。

監査ロジックは既存資産を維持し、画像生成モデルへ厳密な最終スプライトを直接作らせない構成へ拡張している。

## 構成

- `scripts/build_motion_strip.py` — 2×2キーポーズを分離・正規化して4または8フレームへ組み立てる
- `scripts/audit_sprite.py` — 完成スプライトの監査
- `scripts/normalize_sprite.py` — 既存アトラスの縮尺と基準位置の補正
- `scripts/create_contact_sheet.py` — 目視確認用一覧
- `scripts/create_preview.py` — GIFプレビュー
- `scripts/download_input.py` — ローカル検証用入力取得
- `specs/motion-keypose-2x2.json` — キーポーズ入力とストリップ出力の仕様
- `specs/pet-atlas-8x9.json` — 最終8×9アトラスの仕様と監査閾値
- `assets/` — スプライト配置画像とPNG書き出し補助
- `templates/` — 機械可読なアトラス配置資料
- `docs/` — 組み立て・監査フローの説明
- `requirements.txt` — Python依存関係

GitHub Actionsの実行用workflowは、GitHubの配置要件により`.github/workflows/`に残している。

## キーポーズから4フレームを作る

```bash
python -m pip install -r audit/requirements.txt
python audit/scripts/build_motion_strip.py keyposes.png \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-4f.png \
  --debug-dir motion-debug
```

入力は透明背景の2×2ボード。

- 左上: 基準姿勢
- 右上: 予備動作
- 左下: 主動作の頂点
- 右下: 戻り途中

スクリプトは各象限を分離し、全ポーズへ共通倍率を適用して、下端基準を揃えた横一列PNGを作る。

## 8フレームを作る

別途生成した4つの中割りポーズを2×2画像として渡す。

```bash
python audit/scripts/build_motion_strip.py keyposes.png \
  --inbetween-board inbetweens.png \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-8f.png \
  --debug-dir motion-debug
```

キーポーズと中割りを交互に配置する。同じ画像の複製や単純な往復配置による水増しは行わない。

詳細は[`docs/keypose-motion-pipeline.md`](docs/keypose-motion-pipeline.md)を参照。

## 最終スプライトの監査

```bash
python audit/scripts/audit_sprite.py INPUT_IMAGE \
  --spec audit/specs/pet-atlas-8x9.json \
  --output-dir audit-output
```

## 接続方式

```text
実験GPT
  → 監査受付API
  → 短期ストレージ
  → GitHub repository_dispatch
  → .github/workflows/audit-sprite.yml
  → audit/scripts/audit_sprite.py
```

GitHub Actionsは、repository variable `AUDIT_IMAGE_HOST`と一致するHTTPSホストからだけ監査画像を取得する。

詳細は[`docs/audit-workflow.md`](docs/audit-workflow.md)を参照。

## CI

`.github/workflows/test-audit-scripts.yml`が次を確認する。

- 既存8×9監査パイプライン
- 2×2キーポーズから4フレームへの組み立て
- キーポーズと中割りから8フレームへの組み立て
- 出力寸法、透明背景、メタデータ、フレーム数

## 境界

このサブシステムは新しいポーズを描画しない。生成済みのキーポーズを分離・配置し、完成スプライトを機械監査する。

画風、顔、衣装、手指、動作の意味は機械監査だけでは保証しない。

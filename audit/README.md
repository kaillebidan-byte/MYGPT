# Audit subsystem

画像生成GPTから分離したスプライト監査サブシステム。

監査ロジックは既存資産を維持し、GPTとの接続部分だけを監査受付API方式へ再設計している。

## 構成

- `scripts/` — 入力取得、監査、正規化、コンタクトシート、GIFプレビュー生成
- `specs/` — キャンバス、セル、状態順、監査閾値
- `assets/` — スプライト配置画像とPNG書き出し補助
- `templates/` — 機械可読なアトラス配置資料
- `docs/` — 監査フローの説明
- `requirements.txt` — Python依存関係

GitHub Actionsの実行用workflowは、GitHubの配置要件により`.github/workflows/`に残している。workflow内の実処理はこの`audit/`配下を参照する。

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

## ローカル実行

```bash
python -m pip install -r audit/requirements.txt
python audit/scripts/audit_sprite.py INPUT_IMAGE \
  --spec audit/specs/pet-atlas-8x9.json \
  --output-dir audit-output
```

URLから監査入力を取得する補助:

```bash
python audit/scripts/download_input.py IMAGE_URL work/input-image.png
```

`download_input.py`はローカル検証用であり、GPTからGitHubへの本番受け渡しには使わない。

## CI

`.github/workflows/test-audit-scripts.yml`が合成スプライトを作り、監査成果物が正常に生成されることを確認する。

## 境界

このサブシステムは画像を生成しない。生成済み画像を受け取り、機械的な品質監査と補助成果物の作成だけを行う。

画風、顔、衣装、手指、動作の意味は機械監査だけでは保証しない。

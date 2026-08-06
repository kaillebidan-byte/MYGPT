# Audit subsystem

画像生成GPTから分離したスプライト監査サブシステム。

## 構成

- `scripts/` — 監査、正規化、コンタクトシート、GIFプレビュー生成
- `specs/` — キャンバス、セル、状態順、監査閾値
- `assets/` — スプライト配置テンプレート
- `docs/` — 監査フローの説明
- `requirements.txt` — Python依存関係

GitHub Actionsの実行用workflowは、GitHubの配置要件により`.github/workflows/audit-sprite.yml`に残している。workflow内の実処理はこの`audit/`配下を参照する。

## ローカル実行

```bash
python -m pip install -r audit/requirements.txt
python audit/scripts/audit_sprite.py INPUT_IMAGE \
  --spec audit/specs/pet-atlas-8x9.json \
  --output-dir audit-output
```

## 境界

このサブシステムは画像を生成しない。生成済み画像を受け取り、機械的な品質監査と補助成果物の作成だけを行う。

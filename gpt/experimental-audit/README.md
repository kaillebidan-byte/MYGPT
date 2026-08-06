# Experimental audit integration

生成後のGitHub監査連携を、本番の画像生成設定から分離して検証する領域。

## ファイル

- `README.md` — この領域の目的と境界
- `test-cases.md` — ファイル受け渡しと失敗状態の検証項目
- `instructions-addon.md` — 次段階で作成
- `github-audit-openapi.yaml` — 次段階で作成

再編前のActionスキーマは`legacy/actions/`に保存している。安定性を確認するまでは本番GPTへ接続しない。

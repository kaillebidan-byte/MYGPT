# Experimental audit integration

生成後のGitHub監査連携を、本番の画像生成設定から分離して検証する領域。

予定ファイル:

- `instructions-addon.md` — 監査を明示された場合だけ使う追加指示
- `github-audit-openapi.yaml` — 検証用Actionスキーマ
- `test-cases.md` — ファイル受け渡しと失敗時処理の実機試験

再編前のActionスキーマは`legacy/actions/`に保存している。安定性を確認するまでは本番GPTへ接続しない。

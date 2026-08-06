# Legacy configuration

再編前のMYGPT設定を保存する退避領域。

ここにあるInstructions、Knowledge、Action、セットアップ文書、プロンプト例は、履歴確認と比較検証のために残している。現行のMy GPTへそのまま設定しない。

## 内容

- `instructions/` — 再編前の長いCustom GPT Instructions
- `knowledge/` — 再編前のKnowledge文書
- `actions/` — GitHub APIへ直接接続する旧OpenAPIスキーマ
- `docs/` — 旧構成のセットアップ手順
- `examples/` — 旧構成向けプロンプト例

新しい本番設定は`gpt/production/`、新しいKnowledgeは`gpt/knowledge/`、監査実験は`gpt/experimental-audit/`へ置く。

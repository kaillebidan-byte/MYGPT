# Legacy configuration

現行経路から外した過去設定を保存する退避領域。

## 内容

- `custom-gpt/` — 2026-08-07まで本番候補として構築していたCustom GPT設定一式
- `instructions/` — さらに以前の長いCustom GPT Instructions
- `knowledge/` — さらに以前のKnowledge文書
- `actions/` — GitHub APIへ直接接続する旧OpenAPIスキーマ
- `docs/` — 旧構成のセットアップ手順
- `examples/` — 旧構成向けプロンプト例

現行の本番候補は`../project/`に置く。

`legacy/`内の文章は比較・履歴確認・構造参考には使えるが、ChatGPT Projectへそのまま投入しない。

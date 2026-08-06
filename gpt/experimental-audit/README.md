# Experimental audit integration

画像生成後のGitHub監査連携を、本番画像生成GPTから分離して検証する領域。

ここは試験設定であり、`gpt/production/`へ直接混ぜない。

## 構成

- `instructions-addon.md` — 監査付き実験GPTへ追加するInstructions
- `github-audit-openapi.yaml` — 監査受付API用のOpenAPI契約
- `test-cases.md` — ファイル受け渡し、GitHub連携、状態管理の実機試験

## 設計

GPTからGitHub APIへ直接`repository_dispatch`を送らない。

```text
実験GPT
  ↓ openaiFileIdRefs
監査受付API
  ↓ 一時URLを即時取得
短期ストレージ
  ↓ 安定した参照
GitHub repository_dispatch
  ↓
GitHub Actions
  ↓
監査結果
```

受付APIは、OpenAIの一時ファイル参照を受け取り、URLが有効な間に画像を取得する。GitHub Actionsには期限付きOpenAI URLではなく、受付APIが管理する安定した画像参照を渡す。

## 現在の状態

- Instructions add-on: 作成済み
- OpenAPI契約: 作成済み
- 実機テスト項目: 作成済み
- 監査受付API本体: 未実装
- GPTエディターでのAction試験: 未実施

`github-audit-openapi.yaml`のserver URLはプレースホルダーである。受付APIを配備するまでGPTへ登録しない。

## 旧方式

再編前のGitHub直接接続スキーマは`legacy/actions/github-audit-openapi.yaml`へ保存している。

旧方式は比較資料としてのみ使い、新しい試験設定へコピーしない。

## 本番へ戻す条件

次をすべて満たすまで、本番GPTへ監査を接続しない。

1. 生成画像が`openaiFileIdRefs`へ安定して渡る
2. 受付APIが一時URLから画像を取得できる
3. GitHub workflowが重複なく起動する
4. 監査受付失敗が画像生成失敗へ波及しない
5. `test-cases.md`の必須試験が合格する

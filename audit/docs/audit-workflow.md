# Experimental sprite audit workflow

この文書は、画像生成GPTから独立したスプライト監査フローを定義する。

本番画像生成GPTは監査を行わない。監査は`gpt/experimental-audit/`の別設定と、別途配備する監査受付APIを使って検証する。

## Architecture

```text
実験GPTで画像生成
    ↓
GPT ActionがopenaiFileIdRefsを監査受付APIへ送る
    ↓
受付APIが一時URLから画像を即時取得する
    ↓
受付APIの短期ストレージへ保存する
    ↓
受付APIがGitHub repository_dispatchを起動する
    ↓
GitHub Actionsが許可済みホストから画像を取得する
    ↓
audit/scripts/のPython監査が検査・補正する
    ↓
audit.json
contact-sheet.png
preview.gif
normalized-spritesheet.webp
    ↓
GitHub Issueへ失敗行と修復指示を掲載する
```

画像生成成功と監査成功は別の状態として扱う。監査受付または監査処理が失敗しても、生成済み画像を画像生成失敗へ戻さない。

## Components

### Production GPT

```text
gpt/production/
gpt/knowledge/
```

画像生成だけを担当する。Actionを接続しない。

### Experimental GPT configuration

```text
gpt/experimental-audit/instructions-addon.md
gpt/experimental-audit/github-audit-openapi.yaml
gpt/experimental-audit/test-cases.md
```

生成画像を監査受付APIへ送る試験設定。

### Audit receiver API

このリポジトリにはまだ実装していない。

受付APIの責務:

1. Bearer tokenを検証する
2. `openaiFileIdRefs`を1件だけ受け取る
3. 一時URLから画像を即時取得する
4. PNG、WebP、JPEGだけを許可する
5. 画像を短期ストレージへ保存する
6. 一意な`audit_id`を発行する
7. GitHub `repository_dispatch`を起動する
8. GitHub runと監査Issueを`audit_id`へ関連付ける
9. `GET /audits/{audit_id}`で状態を返す
10. 保存期限後に元画像を削除する

### GitHub Actions

実行用workflow:

```text
.github/workflows/audit-sprite.yml
```

監査実装:

- 依存関係: `audit/requirements.txt`
- 監査スクリプト: `audit/scripts/audit_sprite.py`
- 既定仕様: `audit/specs/pet-atlas-8x9.json`

## Receiver to GitHub payload

受付APIは次の`repository_dispatch`を送る。

```json
{
  "event_type": "sprite_audit",
  "client_payload": {
    "audit_id": "audit-20260807-001",
    "request_id": "pet-20260807-001",
    "image_url": "https://AUDIT_IMAGE_HOST/path/to/short-lived-image",
    "image_name": "generated-sprite.png",
    "expected_states": "searching,validating,confused,completed",
    "spec_name": "pet-atlas-8x9",
    "normalize": true,
    "publish_issue": true
  }
}
```

GitHub payloadへ`openaiFileIdRefs`を入れない。OpenAIの一時URLをGitHub Actionsへ直接渡さない。

## Repository configuration

GitHub repository variableとして次を設定する。

```text
AUDIT_IMAGE_HOST
```

値は、受付APIが画像を保存するHTTPSホスト名だけにする。スキームやパスを含めない。

例:

```text
audit-files.example.com
```

workflowは次を検証する。

- `image_url`がHTTPSである
- URLにユーザー名やパスワードが埋め込まれていない
- URLのホストが`AUDIT_IMAGE_HOST`と一致する
- リダイレクト後も同じホストである
- 画像が50 MB以下である
- 画像形式がPNG、WebP、JPEGのいずれかである
- `request_id`、`audit_id`、状態名が安全な文字だけで構成される

## Outputs

workflow artifact `sprite-audit-<request_id>`に次が入る。

- `audit.json`
- `contact-sheet.png`
- `preview.gif`
- `normalized-spritesheet.webp`
- `issue-body.md`

`publish_issue=true`の場合、`[sprite-audit] <request_id>`というIssueを作成または更新する。

## Audit checks

- キャンバス寸法
- 透明画素のRGB残留
- 必須行の空フレーム
- 未使用行への描画
- セル端への接触
- 足元のばらつき
- 幅と高さの変動
- 近似重複フレーム
- 動きが小さすぎる可能性

画風、顔、衣装、手指、動作の意味は画素監査だけでは保証できない。`contact-sheet.png`と`preview.gif`による目視確認を併用する。

## Failure handling

### GPT to receiver failure

- 画像生成成功は維持する
- 監査未実施として扱う
- 同じ画像を自動再生成しない

### Receiver to GitHub failure

- `status=error`として記録する
- 監査不合格とシステム障害を区別する
- GitHub tokenや画像URLをユーザー応答へ出さない

### Audit failure

- 不合格行だけを修正対象にする
- 問題のない行、キャラクター、セル配置を維持する

## Legacy

GitHub APIへ直接接続していた旧Actionスキーマは次へ保存している。

```text
legacy/actions/github-audit-openapi.yaml
```

旧方式は履歴確認用であり、新しい試験設定へコピーしない。

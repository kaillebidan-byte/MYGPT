# Audit integration test cases

この文書は、監査受付APIとGPT Actionの実機検証項目を記録する。

すべての必須試験が合格するまで、監査Actionを本番画像生成GPTへ接続しない。

## 試験前提

- `github-audit-openapi.yaml`のserver URLを実在する監査受付APIへ置き換える
- 受付APIへBearer認証を設定する
- 受付APIから対象GitHubリポジトリへ`repository_dispatch`できる
- GitHub Actionsが`audit/`配下の監査コードを実行できる
- テスト用画像に機密情報を含めない

## A. スキーマ

### A-1 OpenAPI読込

期待結果:

- GPTエディターがスキーマをエラーなく読み込む
- `submitSpriteAudit`と`getSpriteAudit`の2操作だけが表示される
- 認証方式がBearerとして認識される

### A-2 プレースホルダー防止

期待結果:

- `REPLACE_WITH_AUDIT_RECEIVER`のままでは本番登録しない
- 実在するHTTPSドメインだけを設定する

## B. 生成画像の受け渡し

### B-1 PNG

手順:

1. GPTでPNG画像を生成する
2. `submitSpriteAudit`へ生成画像を1枚渡す

期待結果:

- `openaiFileIdRefs`が空でない
- 受付APIが画像を取得できる
- MIME typeが`image/png`として検証される
- `202`と`audit_id`が返る

### B-2 WebP

B-1と同じ手順でWebPを使用する。

期待結果:

- MIME typeが`image/webp`として検証される
- 画像取得と監査起動が成功する

### B-3 JPEG

B-1と同じ手順でJPEGを使用する。

期待結果:

- MIME typeが`image/jpeg`として検証される
- 画像取得と監査起動が成功する

### B-4 複数画像拒否

期待結果:

- 2枚以上を送った場合は`400`または`422`
- 最初の1枚だけを黙って選ばない

### B-5 非画像拒否

期待結果:

- PDFやテキストは拒否される
- GitHub workflowを起動しない

## C. 一時URL

### C-1 即時取得

期待結果:

- 受付APIはリクエスト処理中に一時URLから画像を取得する
- GitHub Actions側へ期限付きOpenAI URLをそのまま渡さない

### C-2 URL失効

期限切れまたは取得不能な参照を送る。

期待結果:

- `422`を返す
- 画像生成成功は取り消されない
- GPTは監査未実施と報告する

## D. GitHub連携

### D-1 dispatch

期待結果:

- 受付APIが`repository_dispatch`を1回だけ起動する
- `request_id`と監査対象の保存先がpayloadへ入る
- 重複送信で同じ監査を二重起動しない

### D-2 workflow

期待結果:

- `.github/workflows/audit-sprite.yml`が起動する
- `audit/requirements.txt`を使用する
- `audit/scripts/audit_sprite.py`を使用する
- `audit/specs/pet-atlas-8x9.json`を使用する

### D-3 成果物

期待結果:

- `audit.json`
- `contact-sheet.png`
- `preview.gif`
- 正規化有効時の`normalized-spritesheet.webp`

## E. 状態取得

### E-1 queued

期待結果:

- 受付直後は`queued`または`running`
- 未完了状態を`passed`と表現しない

### E-2 passed

合格画像を使用する。

期待結果:

- `status=passed`
- `failed_rows`が空
- `report_url`または`github_run_url`が返る

### E-3 failed

不合格画像を使用する。

期待結果:

- `status=failed`
- `failed_rows`に行番号、状態、問題が入る
- `repair_instruction`が返る

### E-4 error

GitHub認証失敗やworkflow障害を発生させる。

期待結果:

- `status=error`
- 監査不合格と処理障害を区別する

## F. GPTの状態管理

### F-1 生成成功の維持

監査受付を失敗させる。

期待結果:

- 生成画像を完成物として残す
- 画像生成失敗と表現しない
- 自動再生成しない

### F-2 局所修正

一部行だけを不合格にする。

期待結果:

- 不合格行だけを修正対象にする
- 問題のない行を作り直さない

### F-3 非生成依頼

「画像生成ではない。監査設計だけ」と依頼する。

期待結果:

- 画像生成機能を呼ばない
- 監査Actionを呼ばない

## G. セキュリティと保持

期待結果:

- Bearer tokenをログ、Issue、応答へ出さない
- 一時保存画像の保持期間を設定する
- 公開Issueへ元画像を添付しない
- request IDへ個人情報を入れない
- 許可したリポジトリ以外へdispatchできない

## 結果記録

各試験について次を記録する。

- 実施日
- GPTモデル
- GPT設定バージョン
- 受付APIバージョン
- 結果: PASS / FAIL / BLOCKED
- 実際の応答
- GitHub run URL
- 修正内容

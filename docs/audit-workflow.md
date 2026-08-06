# Sprite audit workflow

## Flow

```text
My GPTで画像生成
    ↓
生成画像をopenaiFileIdRefsでActionへ直接添付
    ↓
GitHub repository_dispatch
    ↓
GitHub Actionsが一時URLから画像を取得
    ↓
Python監査スクリプトが検査・補正
    ↓
audit.json
contact-sheet.png
preview.gif
normalized-spritesheet.webp
    ↓
GitHub Issueに失敗行と修復指示を掲載
    ↓
My GPTが不合格行だけ再生成
```

生成画像をユーザーがダウンロード、GitHubへアップロード、Google Driveへ共有する工程はない。

## My GPT Action設定

1. GPT BuilderのActionsで`actions/github-audit-openapi.yaml`を読み込む。
2. AuthenticationはAPI Keyを選ぶ。
3. Auth typeはBearerにする。
4. GitHubのfine-grained personal access tokenを登録する。
5. トークンは`MYGPT`リポジトリだけを対象にする。
6. Repository permissionsを次のように設定する。

- Contents: Read and write
- Actions: Read-only
- Issues: Read-only
- Metadata: Read-only（自動付与）

`repository_dispatch`の起動にはContents write、実行状態とArtifactの取得にはActions read、監査Issueの取得にはIssues readを使う。

## 自動送信

Actionの`dispatchSpriteAudit`は、会話内で生成された画像を`client_payload.openaiFileIdRefs`として1枚受け取る。

送信内容:

- `event_type`: `sprite_audit`
- `client_payload.openaiFileIdRefs`: 今回生成した画像1枚
- `client_payload.request_id`: `pet-20260806-001`など一意な値
- `client_payload.expected_states`: 部分シートで使う状態を上から順にカンマ区切り
- `client_payload.spec_path`: `specs/pet-atlas-8x9.json`
- `client_payload.normalize`: `true`
- `client_payload.publish_issue`: `true`

完全な公式9行なら`expected_states`は空欄でよい。4行だけ使う場合の例:

```text
searching,validating,confused,completed
```

OpenAIのActionランタイムは`openaiFileIdRefs`を、`name`、`id`、`mime_type`、5分有効の`download_link`を持つオブジェクト配列へ変換する。ワークフローは開始直後にこのURLを取得する。

## 結果確認

repository dispatchは起動時にrun IDを返さない。

1. `listSpriteAuditRuns`で`display_title`が`sprite-audit-<request_id>`の実行を探す。
2. `getSpriteAuditRun`で`status=completed`になるまで確認する。
3. `listSpriteAuditReports`で`[sprite-audit] <request_id>`というIssueを探す。
4. `getSpriteAuditReport`でFailed rowsとRepair instructionを読む。
5. 必要なら`listSpriteAuditArtifacts`で成果物を確認する。

GitHub Actionsは非同期なので、同じ応答内で完了しない場合は後続メッセージで確認する。

## 出力

ワークフローArtifact `sprite-audit-<request_id>`に次が入る。

- `audit.json`: 監査の完全な機械可読結果
- `contact-sheet.png`: 透明背景を市松模様上で確認する一覧
- `preview.gif`: 各行を同時再生するプレビュー
- `normalized-spritesheet.webp`: 行ごとの中央値を基準に縮尺と足元を補正したシート
- `issue-body.md`: GitHub Issueへ掲載した要約

`publish_issue=true`なら、`[sprite-audit] <request_id>`というIssueが作成または更新される。My GPTはこのIssueのFailed rowsとRepair instructionを読み、不合格行だけを修正する。

## 判定項目

- キャンバス寸法
- 透明画素のRGB残留
- 必須行の空フレーム
- 未使用行への描画
- セル端への接触と切れの疑い
- 足元のばらつき
- 幅と高さの変動
- 近似重複フレーム
- 動きが小さすぎる可能性

画風、顔、衣装、手指、意味的な動作の正しさは画素監査だけでは完全に判定できない。`contact-sheet.png`と`preview.gif`による目視確認を併用する。

## ファイル参照が失敗した場合

生成画像の`openaiFileIdRefs`受け渡しが失敗した場合は、手動アップロードへ切り替えない。監査Actionへ直接渡せなかったことを報告し、監査未実施として扱う。

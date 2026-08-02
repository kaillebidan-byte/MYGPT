# Sprite audit workflow

## Flow

```text
My GPTで画像生成
    ↓
画像をGitHubまたはGoogle Driveへ公開共有
    ↓
My GPT ActionがGitHub Actionsを起動
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

GitHub Actionsは非同期なので、同じ応答内で監査完了まで待てない場合がある。その場合は、後続のメッセージで同じ`request_id`のワークフロー実行または`[sprite-audit] <request_id>`Issueを確認する。

## 手動テスト

GitHubのActionsタブから`Audit sprite atlas`を選び、`Run workflow`を押す。

入力:

- `image_url`: 公開画像URL。GitHubのblob/raw URLと公開Google Drive共有URLに対応
- `request_id`: `test-001`など一意な値
- `expected_states`: 部分シートの場合のみ、上から順にカンマ区切りで指定
- `normalize`: 補正版WebPを作るか
- `publish_issue`: 結果をIssueへ掲載するか

完全な公式9行なら`expected_states`は空欄でよい。4行だけ使う場合は、例として次のように入力する。

```text
searching,validating,confused,completed
```

## My GPT Action設定

1. GPT BuilderのActionsで`actions/github-audit-openapi.yaml`を読み込む。
2. AuthenticationはAPI Keyを選ぶ。
3. Auth typeはBearerにする。
4. GitHubのfine-grained personal access tokenを登録する。
5. トークンはこのリポジトリだけを対象にし、ActionsのRead and write、IssuesのRead and write、MetadataのRead-onlyだけを付与する。

広い`repo`権限を持つclassic PATは避ける。

## 画像URL

ChatGPT内部の生成画像URLは短時間で無効になる可能性がある。監査入力には次のいずれかを使う。

- GitHubへアップロードした画像のURL
- 公開Google Drive共有URL
- 一時ストレージの直接ダウンロードURL

非公開画像を扱う場合は、公開URL方式ではなく、認証付きの専用監査APIへ移行する。

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

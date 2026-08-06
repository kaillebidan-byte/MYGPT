# Audit integration test cases

このファイルは次段階の実機検証用。

## 未実施

- 生成画像が`openaiFileIdRefs`へ展開されるか
- `download_link`をGitHub Actionsから取得できるか
- 旧方式の`client_payload.openaiFileIdRefs`が保持されるか
- 受付API方式でトップレベルのファイル引数を受け取れるか
- 監査失敗が画像生成失敗として扱われないか

検証結果を記録するまでは、監査Actionを本番GPTへ接続しない。

# ChatGPT Project移行

2026-08-07、画像生成の本番候補をCustom GPTからChatGPT Projectへ切り替えるため、フォルダ構成を再編した。

## 変更

- `gpt/`を現行領域から削除
- 直前までの`gpt/`一式を`legacy/custom-gpt/`へそのまま退避
- `project/instructions/`を新設
- `project/sources/production/`を新設
- `project/sources/reference-images/`を新設
- Custom GPT専用の構成検証workflowをProject構成検証へ置換

## 方針

Project側の本番用読み物は旧Knowledgeをコピーせず、次段階で白紙から作成する。

`audit/`と`research/`は独立領域として維持する。

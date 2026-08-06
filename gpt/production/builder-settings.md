# Builder settings

## 基本情報

- 名前: 任意。キャラクターモーション生成用途が分かる名称にする
- 説明: `description.md`の本文を使用する
- 会話のきっかけ: `conversation-starters.md`から登録する
- Instructions: `instructions.md`の本文を使用する

## Knowledge

次の3ファイルをアップロードする。

- `gpt/knowledge/character-identity-reference.md`
- `gpt/knowledge/motion-vocabulary.md`
- `gpt/knowledge/sprite-output-spec.md`

Knowledgeは参照資料だけに使う。実行順序、ツール選択、禁止事項は`instructions.md`へ置く。

## Capabilities

- Image generation: ON
- Web search: OFF
- Canvas: OFF
- Code Interpreter & Data Analysis: OFF

画像生成以外のCapabilityは、本番版の動作に必要ないため無効にする。

## Actions / Apps

- Actions: 追加しない
- Apps: 追加しない

監査連携は`gpt/experimental-audit/`の別設定で検証する。本番画像生成GPTへは接続しない。

## Recommended model

特定の旧モデル名を固定しない。GPTエディターで選択できる、画像生成に対応した現行モデルを指定する。

## Preview確認

設定後は、新しいPreviewチャットで次を別々に試す。

1. 表情だけを変更する単一画像
2. ポーズだけを変更する単一画像
3. 「手を振るモーション」の8フレーム素材
4. 「画像生成ではない。動作案だけ」の非生成依頼
5. 修正箇所以外を維持する局所修正

画像生成を要求した試験で説明だけを返す場合は、Instructionsの追加より先に、画像生成Capabilityが有効か、新しいPreviewチャットを使用しているかを確認する。

## 参考

- OpenAI Help: Creating and editing GPTs
  https://help.openai.com/en/articles/8554397
- OpenAI Help: Troubleshooting GPTs
  https://help.openai.com/en/articles/11325361-troubleshooting-gpts

# Builder settings

## 基本情報

- 名前: 任意。キャラクターモーション素材生成用途が分かる名称にする
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

本番GPTは、静止画または組み立て用2×2キーポーズボードの生成だけを担当する。切り出しと最終ストリップ化はリポジトリ側で行うため、Code Interpreterを本番GPTへ混ぜない。

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
3. 「手を振るモーション」の2×2キーポーズ素材
4. 「画像生成ではない。動作案だけ」の非生成依頼
5. 修正箇所以外を維持する局所修正

モーション試験では次を確認する。

- 4象限に1ポーズずつある
- 左上、右上、左下、右下の順が基準・予備・頂点・戻りになっている
- 各ポーズが象限境界をまたいでいない
- 全ポーズでキャラクターの縮尺とカメラ角度が近い
- 全身、髪、手足、装飾、所持品が切れていない
- 背景が完全透過である
- 枠線、番号、文字がない

## 画像表示の回帰試験

画像生成を要求した試験では、応答文ではなく画像本体が会話画面へ表示されていることを確認する。

次の場合は失敗として扱う。

- `/mnt/data/...`だけが表示された
- `sandbox:/...`だけが表示された
- `waving_keyposes_2x2.png`のようなファイル名だけが表示された
- 画像を生成したという文章だけで画像本体がない
- 内部パスがMarkdownリンクとして表示された

失敗した場合は、まずBuilder画面でInstructionsが最新内容へ保存されているか、Image generationがONか、Code Interpreter & Data AnalysisがOFFかを確認する。その後、新しいPreviewチャットで同じ依頼を再試験する。

画像生成を要求した試験で説明だけを返す場合も、Instructionsを増やす前に、画像生成Capabilityと新しいPreviewチャットを確認する。

## 最終ストリップ化

生成した2×2キーポーズボードは、リポジトリ側で次のように組み立てる。

```bash
python audit/scripts/build_motion_strip.py keyposes.png \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-4f.png
```

8フレームが必要な場合は、中割り4ポーズを別の2×2画像として生成し、`--inbetween-board`で渡す。

## 参考

- OpenAI Help: Creating and editing GPTs
  https://help.openai.com/en/articles/8554397
- OpenAI Help: Troubleshooting GPTs
  https://help.openai.com/en/articles/11325361-troubleshooting-gpts

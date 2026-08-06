# 公開資料ソース一覧

## A. 直接流用候補

| 資料 | 公開内容 | ライセンス | MYGPTで使う部分 | 扱い |
|---|---|---|---|---|
| [TheBigPromptLibrary: Consistent Character Image Generator](https://github.com/0xeb/TheBigPromptLibrary/blob/main/CustomInstructions/ChatGPT/a9JivI0y2_Consistent_Character_Image_Generator.md) | 公開GPTのInstructions全文 | MIT | 同一キャラクターを維持し、表情・動作・ポーズを変数として扱う設計 | 構造を流用。seed保存、固定4枚生成、過剰な秘匿命令は不採用 |
| [TheBigPromptLibrary: PocketMonster-style image generation](https://github.com/0xeb/TheBigPromptLibrary/blob/main/CustomInstructions/ChatGPT/q5Lrn3SHc_PocketMonster-style_image_generation.md) | 添付画像を動的な別ポーズへ変換するGPTのInstructions全文 | MIT | アップロード画像の特徴維持、動作を付ける、必要時だけ確認する設計 | 固有作品名と旧DALL·E寸法は除外して流用 |
| [gptstore-prompts](https://github.com/1003715231/gptstore-prompts) | GPT Store上位GPTのInstructions収録 | CC0 1.0 | 曖昧さを妥当な推測で補う、命令を直接実行する、反復修正する設計 | 画像生成GPTの短い実行方針を流用 |
| [Zenn: ChatGPTで「GPTを作るGPT」の作り方](https://zenn.dev/safubuki/articles/turtle-20251224-gpt2gpt) | 画像生成GPTの設定一式とInstructions全文 | 記事の利用条件に従う | 画像のみを直接生成、質問を最小化、画像生成機能を必須にする設定 | 原文コピーはせず、公開された設計原則を参照 |

## B. 公式仕様と設計根拠

| 資料 | 確認した点 | MYGPTへの影響 |
|---|---|---|
| [OpenAI: Creating and editing GPTs](https://help.openai.com/en/articles/8554397) | Instructionsは動作・目標・手順、Knowledgeは参照資料に使う | 現行のKnowledge内にある実行規則をInstructions側へ整理する |
| [OpenAI: Troubleshooting GPTs](https://help.openai.com/en/articles/11325361-troubleshooting-gpts) | 重複・競合する長い指示を減らし、小さな変更単位でPreview検証する | 生成コアと監査拡張を分離する |
| [OpenAI: ChatGPT Images](https://help.openai.com/en/articles/11084440) | 画像生成を有効にしたGPTは、画像生成と既存画像の編集を利用できる | 画像生成はActionやCode Interpreterではなく標準Capabilityへ任せる |
| [OpenAI: Configuring actions in GPTs](https://help.openai.com/en/articles/9442513) | Actionsは外部API接続であり、画像生成Capabilityとは別機能 | Actionを生成コアから切り離す |
| [OpenAI Academy: Creating images with ChatGPT](https://openai.com/academy/image-generation/) | 画像プロンプトは長さより明確な主題、動作、用途、構図、制約が重要 | 巨大な画像プロンプト変換規則を作らず、固定要素と可変要素を明示する |

## C. 監査Actionのリスク資料

| 資料 | 内容 | 判定 |
|---|---|---|
| [OpenAI Developer Community: openaiFileIdRefs Not Auto-Populated](https://community.openai.com/t/openaifileidrefs-not-auto-populated-in-action-call-createmap-publishing-fails/1374402) | 2026年にOpenAI Supportが一部のファイル受け渡しフローの既知問題を確認 | 生成画像からActionへの自動受け渡しを必須経路にしない |
| [OpenAI Developer Community: DALL·E file IDs no longer work](https://community.openai.com/t/dall-e-file-ids-no-longer-work-in-openaifileidrefs-possible-bug-after-recent-update/1259532) | 生成画像だけがActionへ渡せず、ユーザーアップロードは動くという報告 | 実機で再現確認するまで自動監査を実験機能扱いにする |

## ライセンス確認

- TheBigPromptLibrary: [MIT License](https://github.com/0xeb/TheBigPromptLibrary/blob/main/LICENSE)
- gptstore-prompts: [CC0 1.0 Universal](https://github.com/1003715231/gptstore-prompts/blob/main/LICENSE)

公開リポジトリ側のライセンスは、収録された第三者由来データについて完全な権利処理を保証するものではない。運用版では原文を丸ごと貼るのではなく、MYGPTの用途に必要な機能構造へ書き換え、出典を保持する。

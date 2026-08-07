# 読み物一覧

調査日: 2026-08-07

## 公式仕様

### OpenAI Help — Projects in ChatGPT
https://help.openai.com/en/articles/10169521-projects-in-chatgpt

現行仕様の基準。Projectsはチャット、ファイル、Project Instructions、メモリ、各種ツールを一つの作業領域へまとめる。Project InstructionsはそのProject内で適用され、グローバルCustom Instructionsより優先される。画像生成もProject内の標準ツールとして利用できる。

用途: 仕様確認の正本。

### OpenAI Academy — Using projects in ChatGPT
https://openai.com/academy/projects/

Projectsを「継続する作業のための専用空間」と説明している。研究、複数段階の執筆、反復する計画、複数ファイルを使う作業などが例示されている。

用途: Projectの設計思想を確認するための公式読み物。

## 実運用例

### Roy Bretton — How I Use ChatGPT Projects To Manage Real Work
https://roybrettononline.com/how-i-use-chatgpt-projects-to-manage-real-work/

2026-01-09。Webサイト、YouTube、SNS、特定サービスなどを別Projectへ分ける運用。目的は高度なプロンプトよりも、話題を混ぜず、同じ背景説明を繰り返さないこと。

参考点:
- 1 Project = 1つの継続テーマ/仕事
- 同じProject内でも用途ごとにチャットを分ける
- ProjectをPCのフォルダに近いものとして扱う

### Julia Schmidt — How to Use the ChatGPT Projects Feature
https://executivesupportmagazine.com/how-to-use-the-chatgpt-projects-feature/

2025-03-25。旅行、自己開発、イベント、記事、SNS、調査での実使用例。Project Instructionsには、役割、文体、簡潔さ、箇条書き数、複数視点、情報確認などの恒常ルールを置いている。

参考点:
- Instructionsは一回の依頼ではなく、全チャットへ共通する作業規則として使う
- Projectへ置くファイルと、特定チャットだけへ添付するファイルを分ける
- 不要になったファイル/チャットを定期的に整理する

### Reddit — How Chat GPT Supercharged My Creative Process
https://www.reddit.com/r/ChatGPT/comments/1i5u00b/

2025年。創作Projectを「Writers Room」として運用。Project Instructionsで複数の視点/役割を設定し、過去作品や重要設定をProject filesへ入れる。出力テンプレートも資料化し、Project filesを更新しながら次の検討へ進む。

参考点:
- Instructions = 作業場の役割と議論方法
- Sources = 世界観、過去作、重要設定、テンプレート
- 生成した確定情報をSourcesへ戻して次の作業の正本にする

### UD — ChatGPT Projects: Power-User Setup Guide
https://www.ud.hk/en/blogs/insight/article/2026-05-07-chatgpt-projects-setup

2026-05-07。Projectを「話題」ではなく「共有する規則」で分けるという整理が有用。InstructionsをOS、Sourcesを参考資料として扱い、ファイルを詰め込み過ぎないことを推奨している。

参考点:
- 同じ規則で作業するタスクは同じProject
- 異なる規則が必要なら別Project
- 少数の焦点を絞った資料を優先

### UD — ChatGPT Projects vs Custom GPTs: 2026 Power-User Guide
https://www.ud.hk/en/blogs/insight/article/2026-05-13-chatgpt-projects-vs-gpts

Projectの長期運用例として、初日に目的/役割/品質基準をInstructionsへ置き、参考資料をSourcesへ置き、会話を成果物やフェーズ単位で分ける方法を紹介。

参考点:
- チャット名を日付ではなく成果物/作業段階で分ける
- Research、Draft、Reviewなどを別チャットにする

## 長期運用の失敗と回避例

### Reddit — How do you make ChatGPT reliably follow instructions and reference files over long conversations?
https://www.reddit.com/r/ChatGPT/comments/1vfoip9/how_do_you_make_chatgpt_reliably_follow/

2026-08-04。Project内で長く作業するとInstructionsを無視したり、参照ファイルへアクセスできないと応答する問題の報告。

特に参考になる回答では、GitHub repositoryを会話の記憶ではなく「耐久性のある正本」とし、次のように分割している。

- `README.md`: 目的、構造、用語、現在方向
- `AGENTS.md`: AIの作業規則
- `tasks/open/`: 範囲と受け入れ条件を持つ小さい作業
- `tasks/done/`: 完了作業と判断記録
- subject別の小さい資料

長い会話が混乱したら新しいチャットを開始し、Repositoryから状態を再構成する。「一つの永遠の巨大チャット」を維持しないという運用。

MYGPTとの関連: GitHubを正本にしてProjectを実行環境にする現在の方向と非常に近い。

### OpenAI Developer Community — Proposal: Indexed, Immutable Project Files for Deterministic Reasoning in ChatGPT
https://community.openai.com/t/proposal-indexed-immutable-project-files-for-deterministic-reasoning-in-chatgpt/1369932

2025-12-22。Project filesを「常に確実に参照される決定論的な知識DB」として使えないという問題提起。

参考点:
- Sourcesが存在することと、毎回答でその内容が確実に再確認されることは同義ではない
- 厳格な正本が必要な作業では、ファイルを小さくし、必要資料を明示する設計が安全

### Reddit — Sourcing integrity within Projects
https://www.reddit.com/r/ChatGPT/comments/1t8anf4/sourcing_integrity_within_projects/

2026年。Project Sourcesだけを完全に閉じた検索境界とみなせるかを検証した投稿。Projectは実用的だが、厳密なprovenanceや閉鎖コーパスを要求する用途には注意が必要という結論。

用途: Project Sourcesを「絶対にこれしか見ないデータベース」と扱わないための警告例。

### Reddit — ChatGPT’s irreversible Project Memory setting is a serious problem for professional users
https://www.reddit.com/r/ChatGPT/comments/1vbu2s3/chatgpts_irreversible_project_memory_setting_is_a/

2026-07-31。標準memoryとproject-only memoryの違い、作成後の変更制限に関する実運用上の問題提起。

用途: 他Projectや一般会話からの文脈混入を避けたい場合、Project作成時のmemory設定を先に決める必要があることを確認する資料。

## 画像・キャラクター生成に近い実例

### Reddit — Is there anyway for ChatGPT to be able to see and analyze images that are stored in project files?
https://www.reddit.com/r/ChatGPT/comments/1k0juti/is_there_anyway_for_chatgpt_to_be_able_to_see_and/

2025-04-16。キャラクター参照PNGをProject filesへ保存したが、生成時に期待通り視覚参照されず、チャットへ直接画像をアップロードすると認識されたという実験報告。古い挙動なので現行仕様そのものとは断定しないが、画像参照の運用警告として重要。

### Christy Tucker — Frustrations with ChatGPT Image Generation
https://christytuckerlearning.com/frustrations-with-chatgpt-image-generation/

2025年。複数シーンで同じキャラクターを維持する実務的な画像生成実験。世代を重ねるとキャラクター一致が崩れる、構図が指示通りにならない等の問題を記録。

関連するLinkedIn議論では、各生成に基準画像を再添付する、キャラクターシートをProject filesへ入れる、既存画像を何度も再編集するより基準から新規生成する、といった実践例が共有されている。

### LinkedIn — Christy Tucker post / discussion
https://www.linkedin.com/posts/christytucker_like-many-ld-folks-ive-been-experimenting-activity-7333144599097417729-Ksso

コメント欄の実例:
- 汎用表情をまとめたcharacter sheetを作る
- character sheetをProject filesへ置く
- 同じ画像を何度も再生成/再編集せず、基準資料から毎回新しい画像を作る
- 一部利用者は各新規promptへreference headshotを毎回添付することで一致性を上げている

これは公式仕様ではなく実践者の経験談として扱う。

## 補助資料

### 3RK — ChatGPT Projects Examples
https://3rk.net/ai/how-to/chatgpt-projects-examples/

2026年。Projectをmagic archiveにせず、明確な目的、少数の有用ファイル、短いInstructionsに絞るという整理。

### My Writing Twin — ChatGPT Project Instructions: Character Limit & Best Practices
https://www.mywritingtwin.com/blog/chatgpt-projects-complete-guide

2026年。長いInstructionsを層に分ける、Project filesとInstructionsの役割を分離するなどのpower-user向け解説。商用サイトなので補助資料扱い。

### Reddit — I built a tool to import ChatGPT Projects into NotebookLM as sources
https://www.reddit.com/r/notebooklm/comments/1trr2pn/i_built_a_tool_to_import_chatgpt_projects_into/

2026年。Project内の会話履歴が増えた後、ChatGPTを探索/議論、NotebookLMを構造化された参照/再利用に分ける利用者の例。

参考点: Project chat history自体を最終的な正本にしない考え方。

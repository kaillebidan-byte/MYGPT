# ChatGPT Projects 実運用調査

初回調査日: 2026-08-07
更新日: 2026-08-08

ChatGPT Projectsを実際に使っている人の運用例、失敗例、回避策を集める。

このディレクトリは単なる読み物置き場ではなく、MYGPT調整で**同じWeb検索を繰り返さず、既確認事項を土台に別角度へ進むためのdurable research state**として使う。

新しいWeb調査を始める前に、まず`search-ledger.md`を読む。
該当topicが既に`DONE`なら、仕様更新や新実機証拠がない限り同じ一般検索を繰り返さない。

## ファイル

- `search-ledger.md` — 検索済み論点、主要検索語、確認済み資料、未解決角度、次に検索する方向
- `reading-list.md` — 読み物一覧と注釈
- `patterns-and-pitfalls.md` — 複数資料から見える運用パターンと失敗
- `image-reference-notes.md` — キャラクター画像参照に直接関係する実例とMYGPT実機結果
- `imagegen-orchestration-context.md` — motion orchestration contextが単独frameをmulti-panel / sequence sheetへ崩す問題の外部調査と次回隔離テスト設計

## 調査の優先順位

1. GitHub内の既存research / incident / experiment logを読む。
2. `search-ledger.md`で既に検索済みか確認する。
3. 公式一次資料を優先する。
4. 公式資料で公開されていない挙動だけDeveloper Community、Reddit、実践記事、論文で補助する。
5. Web情報とMYGPT実機結果が衝突した場合、MYGPTのproduction判断では実機結果を優先し、外部情報は仮説生成に使う。
6. 調査後は「何を確認したか」だけでなく「何は確認できなかったか」「次に検索する別角度」をGitHubへ残す。

## 現時点で繰り返し見つかった傾向

1. Projectは「一つの巨大チャット」ではなく、共通Instructionsと共通Sourcesを持つ複数チャットの作業領域として使われている。
2. Instructionsには役割、判断基準、出力規則などの恒常ルールを置き、具体的な資料や作例はSourcesへ分離する例が多い。
3. 長期運用では、巨大な単一資料より、用途別に小さく分割したMarkdown等を正本にする運用例がある。
4. 会話が長くなって挙動が崩れたら、新しいチャットを作り、正本資料から状態を再構成する運用が実践されている。
5. Project Sourcesは便利だが、常に決定論的に全資料を再読するデータベースとして扱えるとは限らないという失敗報告もある。
6. 画像生成では、Projectへ保存した参照画像だけに頼らず、生成するチャットへ基準画像を直接添付する運用例がある。
7. キャラクター継続性では、文章だけよりキャラクターシートや基準画像を繰り返し参照させる実践例が見つかる。
8. OpenAIの会話型画像生成APIでは、mainline modelが画像生成用promptを自動改稿する仕組みが公開されている。このため、conversation-level intentとgeneration-facing promptを同一視しない。
9. GPT Imageはmulti-panel composition自体を対応用途として持つ。motion / sequence / storyboard等のglobal contextと単独frame要求が同居するときは、multi-panelへの再解釈を実機で切り分ける必要がある。

これらは外部資料の観察とMYGPT実機結果を区別して扱う。production仕様の正本は`research/PROJECT-HANDOFF.md`、`research/MOTION-GENERATION-EXPERIMENT-LOG.md`、各incident記録を優先する。

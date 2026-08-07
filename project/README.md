# ChatGPT Project configuration

この領域はChatGPT Projectへ投入する指示と参照資料を管理する。

Custom GPT用設定は`legacy/custom-gpt/`へ退避する。

## 構成

- `instructions/project-instructions.md` — Project Instructions欄へ入れる本番指示
- `sources/production/01-character-identity.md` — キャラクター同一性の判断基準
- `sources/production/02-motion-design.md` — 動作ごとの4キーポーズ設計
- `sources/production/03-keypose-board-spec.md` — 1枚の2×2モーションボード生成仕様
- `sources/production/04-imagegen-workflow.md` — 1 visual job = 1 motion boardの画像生成ワークフロー
- `sources/layout-guides/four-pose-portrait.png` — 配置専用の非キャラクターlayout guide
- `sources/layout-guides/README.md` — layout guideの役割と生成方法
- `sources/reference-images/README.md` — 基準画像の運用方針

## 本番運用

基準キャラクター画像はProject Sourcesへ置くだけの経路に依存せず、画像を生成する現在のチャットへ直接添付する。

新しいチャットへ元の基準画像を直接添付し、1チャットでは1モーションだけを依頼する運用をvisual jobの隔離境界として使う。

モーション依頼1件につき画像生成は1回だけ行い、4つのキーポーズを1枚のportrait 2×2ボードとして生成する。K1〜K4を4枚の別画像へ分解しない。

画像生成段階では均一な単色クロマキー背景を使い、真のalpha化は`audit/scripts/remove_chroma_key.py`へ任せる。

layout guideは4スロット、中央safe gap、外周safe marginだけを伝える。キャラクターの顔、衣装、体格、画風、配色の正本にはしない。

Projectが担当するのは静止画と組み立て用モーションボードの生成まで。クロマ除去、最終ストリップ化、倍率統一、位置合わせ、8フレーム化、アトラス化、監査は`audit/`側で扱う。

Project InstructionsにはCustom GPT固有のBuilder設定、Action、内部ファイルパス対策、Thinking/Instant回避処理を持ち込まない。

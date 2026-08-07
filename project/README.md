# ChatGPT Project configuration

この領域はChatGPT Projectへ投入する指示と参照資料を管理する。

Custom GPT用設定は`legacy/custom-gpt/`へ退避する。

## 構成

- `instructions/project-instructions.md` — Project Instructions欄へ入れる本番指示
- `sources/production/01-character-identity.md` — キャラクター同一性の判断基準
- `sources/production/02-motion-design.md` — 動作ごとの4キーポーズ設計
- `sources/production/03-keypose-board-spec.md` — 2×2キーポーズ画像の生成仕様
- `sources/reference-images/README.md` — 基準画像の運用方針

## 本番運用

基準キャラクター画像はProject Sourcesへ置くだけの経路に依存せず、画像を生成する現在のチャットへ直接添付する。

Project Sourcesにはテキストの判断基準だけを置く。

Projectが担当するのは静止画と組み立て用キーポーズ画像の生成まで。最終ストリップ化、倍率統一、位置合わせ、8フレーム化、アトラス化、監査は`audit/`側で扱う。

Project InstructionsにはCustom GPT固有のBuilder設定、Action、内部ファイルパス対策、Thinking/Instant回避処理を持ち込まない。

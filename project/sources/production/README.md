# Production sources

ChatGPT ProjectのProject Sourcesへ追加する本番用読み物。

Project Instructionsへ詰め込まず、生成時に参照する詳細基準を用途別に分離する。

## ファイル

- `01-character-identity.md` — 基準画像から維持するキャラクター同一性の判断基準
- `02-motion-design.md` — 動作ごとの4キーポーズ設計
- `03-keypose-board-spec.md` — 2×2キーポーズ画像の配置・余白・透過条件

## 役割分担

Project Instructionsは、基準画像の扱い、変更範囲、依頼種別、実行規則など、毎回変わらないルールだけを持つ。

この3ファイルは、画像生成の詳細判断だけを補助する。

最終ストリップのピクセル寸法、切り出し、倍率統一、位置合わせ、8フレーム化、アトラス化、監査、PythonコマンドはProject Sourcesへ入れない。それらは`audit/`側の責務とする。

基準キャラクター画像そのものはProject Sourcesだけに依存せず、生成するチャットへ直接添付する。

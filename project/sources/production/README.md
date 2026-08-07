# Production sources

ChatGPT ProjectのProject Sourcesへ追加する本番用読み物。

Project Instructionsへ詰め込まず、生成時に参照する詳細基準を用途別に分離する。

## ファイル

- `01-character-identity.md` — 基準画像から維持するキャラクター同一性の判断基準
- `02-motion-design.md` — 動作ごとの4キーポーズ設計
- `03-keypose-board-spec.md` — 1枚の2×2モーションボードの配置・余白・クロマ背景条件
- `04-imagegen-workflow.md` — 1 visual job = 1 motion board、canonical reference、layout guide、短い画像生成指示、repair境界

## 役割分担

Project Instructionsは、基準画像の扱い、変更範囲、依頼種別、visual job境界、実行規則など、毎回変わらないルールだけを持つ。

この4ファイルは、同一性、動作設計、ボード幾何、画像生成ジョブの詳細判断を補助する。

最終ストリップのピクセル寸法、クロマ除去、切り出し、倍率統一、位置合わせ、8フレーム化、アトラス化、監査、PythonコマンドはProject Sourcesへ詰め込まない。それらは`audit/`側の責務とする。

基準キャラクター画像そのものはProject Sourcesだけに依存せず、生成するチャットへ直接添付する。

配置専用の非キャラクター画像は`project/sources/layout-guides/`へ置いてよい。layout guideをキャラクター正本として扱わない。

# My GPT configuration

My GPTエディターへ設定する本番ファイルと、監査実験用の追加設定を置く領域。

## 区分

- `production/` — 画像生成を主処理にした本番設定
- `knowledge/` — キャラクター同一性、動作語彙、スプライト仕様の参照資料
- `experimental-audit/` — 生成後監査を検証する独立した追加設定

再編前の設定は`legacy/`へ移動済み。生成コアへGitHub run確認や内部ファイル処理を混ぜない。

# Production knowledge

本番画像生成GPTが必要時に参照する資料。

旧Knowledgeを移動または改名したものではなく、役割を参照情報に限定して白紙から作成している。

## ファイル

- `character-identity-reference.md` — 顔、髪、衣装、体格、画風などの同一性比較項目
- `motion-vocabulary.md` — 状態名と、視覚的に伝わる動作設計例
- `sprite-output-spec.md` — 2×2キーポーズ生成、4・8フレーム組み立て、最終アトラスの仕様

## 境界

Knowledgeには次を置かない。

- 画像生成ツールの実行命令
- 応答形式の強制
- Actionの呼び出し手順
- GitHub操作
- 失敗時の分岐

動作、優先順位、ツール選択は`../production/instructions.md`で定義する。

## 参照条件

- 単一画像でも、キャラクター同一性の確認には`character-identity-reference.md`を使う
- 状態名だけが指定された場合は`motion-vocabulary.md`を使う
- 「モーション」「アニメーション」「フレーム」「スプライト」がある場合だけ`sprite-output-spec.md`を使う
- モーションでは最終8フレームの直接生成ではなく、2×2キーポーズ素材を既定とする

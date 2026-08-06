# 公開画像生成GPT 流用調査

このフォルダは、公開されている画像生成系Custom GPTの設定を調査し、MYGPTへ流用できる部分と流用できない部分を整理するための資料置き場である。

## 結論

MYGPTは一から設計し直す必要はない。

公開設定から次の生成コアを流用し、MYGPT固有のキャラクター同一性と監査だけを追加する構成が妥当である。

1. 添付画像を参照して直接画像を生成する。
2. ユーザーが明示していない部分は合理的に補完する。
3. キャラクターの見た目を固定し、表情、動作、ポーズだけを変える。
4. 不要な説明や許可確認を挟まず画像生成へ進む。
5. 修正時は指定部分だけを変える。
6. GitHub監査は生成後の独立した拡張として扱う。

現行MYGPTは、画像生成、スプライト仕様、Action実行、Action失敗時処理を一つの長いInstructionsへ集約している。公開GPTの生成コアをそのまま入れても、既存の制御規則と競合する。そのため次段階では、生成コアと監査拡張を分離して再編する。

## 資料

- [source-matrix.md](source-matrix.md) — 公開資料とライセンス、流用価値
- [source-extracts.md](source-extracts.md) — 公開Instructionsの要点とMYGPTへの変換
- [reusable-components.md](reusable-components.md) — 採用する設計部品と不採用部分
- [current-repository-findings.md](current-repository-findings.md) — 現行MYGPTの構造上の問題
- [target-structure.md](target-structure.md) — 次段階で作るリポジトリ構成
- [third-party-notices.md](third-party-notices.md) — 出典とライセンス表示

## 調査時点

2026-08-07

公開資料は調査時点の内容である。OpenAIのGPT機能、画像生成モデル、GPT Actionsのファイル受け渡し仕様は変更され得るため、運用構成へ反映する際は公式情報と実機テストを優先する。

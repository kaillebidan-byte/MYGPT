# 公開画像生成GPTの流用調査と再編

このフォルダは、公開されている画像生成系Custom GPTの設定を調査し、MYGPTへ流用できる部分を整理した資料置き場である。

## 結論

MYGPTは一から設計し直さない。

公開設定から次の生成コアを流用し、MYGPT固有のキャラクター同一性と監査だけを独立層として追加する。

1. 添付画像を参照して直接画像を生成する。
2. 明示されていない部分は合理的に補完する。
3. キャラクターの見た目を固定し、表情、動作、ポーズだけを変える。
4. 不要な説明や許可確認を挟まず生成へ進む。
5. 修正時は指定部分だけを変える。
6. GitHub監査は生成後の独立した実験機能として扱う。

## 再編状況

2026-08-07に第1段階のフォルダ再編を実施した。

- 旧Instructions、Knowledge、Action、導入文書を`legacy/`へ退避
- 監査コード、仕様、依存関係、テンプレートを`audit/`へ移動
- `.github/workflows/audit-sprite.yml`の参照先を新パスへ変更
- `gpt/production/`、`gpt/knowledge/`、`gpt/experimental-audit/`を新設
- 旧パスと新パスの対応表を作成

次段階で、新しい本番InstructionsとKnowledgeを作る。

## 資料

- [source-matrix.md](source-matrix.md) — 公開資料とライセンス、流用価値
- [source-extracts.md](source-extracts.md) — 公開Instructionsの要点とMYGPTへの変換
- [reusable-components.md](reusable-components.md) — 採用する設計部品と不採用部分
- [current-repository-findings.md](current-repository-findings.md) — 再編前MYGPTの構造上の問題
- [target-structure.md](target-structure.md) — 再編後の構成と実装順
- [migration-map.md](migration-map.md) — 旧パスと新パスの対応
- [third-party-notices.md](third-party-notices.md) — 出典とライセンス表示

## 調査時点

2026-08-07

OpenAIのGPT機能、画像生成モデル、GPT Actionsのファイル受け渡し仕様は変更され得る。運用構成へ反映する際は公式情報と実機テストを優先する。

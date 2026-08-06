# 公開画像生成GPTの流用調査と再編

このフォルダは、公開されている画像生成系Custom GPTの設定を調査し、MYGPTへ流用できる設計原則を整理した資料置き場である。

## 結論

機能要件と実証済みの設計原則は公開GPTから流用する。一方、現行の本番設定、Knowledge、監査連携は旧MYGPTの文章をコピーせず、白紙から再構築する。

流用するのは次の考え方である。

1. 添付画像を参照して直接画像を生成する。
2. 明示されていない軽微な部分は合理的に補完する。
3. キャラクターの見た目を固定し、表情、動作、ポーズだけを変える。
4. 不要な説明や許可確認を挟まず生成へ進む。
5. 修正時は指定部分だけを変える。
6. GitHub監査は画像生成から独立した実験機能として扱う。

公開GPTの固有作品名、旧モデル名、seed保存命令、長い秘匿命令、対話手順はコピーしない。

## 再構築状況

2026-08-07にフォルダ再編と新構成の実装を行った。

### 退避

- 旧Instructions、Knowledge、Action、導入文書を`legacy/`へ退避

### 既存資産の整理

- 監査コード、仕様、依存関係、テンプレートを`audit/`へ移動
- 監査ロジックは維持

### 白紙から作成

- `gpt/production/`に本番Instructions、説明、会話例、Builder設定を新規作成
- `gpt/knowledge/`にキャラクター同一性、動作語彙、スプライト仕様を新規作成
- `gpt/experimental-audit/`に受付API方式の試験設定を新規作成
- `.github/workflows/audit-sprite.yml`の入口を旧ファイル参照直結から受付API方式へ変更

新しい本番設定は`legacy/`の文面を元にしていない。旧設定は比較と履歴確認だけに使う。

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

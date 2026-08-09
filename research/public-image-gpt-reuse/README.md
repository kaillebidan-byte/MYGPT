# 公開画像生成GPTの流用調査と再編

調査時点: 2026-08-07
Status: **HISTORICAL RESEARCH / DESIGN INPUT, NOT CURRENT PRODUCTION**

このフォルダは、公開されている画像生成系Custom GPTの設定を調査し、MYGPTへ流用できる設計原則を整理した資料置き場である。

外部調査全体の入口:
- `research/SEARCH-INDEX.md`

CURRENT production / Worker Fanout構成はこのフォルダでは決めない。
現在地は:
- `research/PROJECT-HANDOFF.md`
- `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md`

を優先する。

## 当時の結論

機能要件と実証済みの設計原則は公開GPTから流用する。一方、現行の本番設定、Knowledge、監査連携は旧MYGPTの文章をコピーせず、白紙から再構築する方針を採った。

流用候補として整理した考え方:

1. 添付画像を参照して直接画像を生成する。
2. 明示されていない軽微な部分は合理的に補完する。
3. キャラクターの見た目を固定し、表情、動作、ポーズだけを変える。
4. 不要な説明や許可確認を挟まず生成へ進む。
5. 修正時は指定部分だけを変える。
6. GitHub監査は画像生成から独立した実験機能として扱う。

公開GPTの固有作品名、旧モデル名、seed保存命令、長い秘匿命令、対話手順はコピーしない方針だった。

これらは2026-08-07の再構築判断の記録であり、その後のsingle-frame isolation、production-v0、Worker Fanout実装結果でさらに更新されている。

## 当時の再構築状況

2026-08-07にフォルダ再編と新構成の実装を行った。

### 退避

- 旧Instructions、Knowledge、Action、導入文書を`legacy/`へ退避

### 既存資産の整理

- 監査コード、仕様、依存関係、テンプレートを`audit/`へ移動
- 監査ロジックを分離

### 当時白紙から作成したもの

- `gpt/production/` 本番Instructions等
- `gpt/knowledge/` キャラクター同一性 / 動作語彙 / スプライト仕様
- `gpt/experimental-audit/` 試験設定

これらの当時の`production`名称は**現在のproduction正本を意味しない**。
後続研究でProject runtime、Knowledge、Actions coupling等の採否は大きく変わった。

## 資料

- [source-matrix.md](source-matrix.md) — 公開資料とライセンス、流用価値
- [source-extracts.md](source-extracts.md) — 公開Instructionsの要点とMYGPTへの変換
- [reusable-components.md](reusable-components.md) — 採用候補の設計部品と不採用部分
- [current-repository-findings.md](current-repository-findings.md) — 当時のMYGPT構造上の問題
- [target-structure.md](target-structure.md) — 当時の再編目標
- [migration-map.md](migration-map.md) — 旧パスと新パスの対応
- [third-party-notices.md](third-party-notices.md) — 出典とライセンス表示

## 使い方

このフォルダは次の場合に参照する:
- 公開画像生成GPTの既存設計例を調べる;
- 初期MYGPT再構築で何を流用/棄却したか確認する;
- 公開Instructionsの固有文言をコピーせず、設計原則だけ抽出した経緯を確認する。

CURRENT worker Instructionsやbrowser automationを決めるために、このフォルダだけを読んで過去構成へ戻さない。

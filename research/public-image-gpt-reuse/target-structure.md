# 再編後のリポジトリ構成

## 到着点

公開画像生成GPTからは、画像生成を直接実行する、参照画像の特徴を維持する、変更範囲を限定する、軽微な不足を補完する、という設計原則だけを流用する。

現行の本番Instructions、Knowledge、監査連携は、再編前MYGPTの本文をコピーせず白紙から再構築する。再編前の設定は`legacy/`へ退避し、既存監査ロジックは`audit/`へ分離する。

```text
MYGPT/
├─ gpt/
│  ├─ production/
│  │  ├─ README.md
│  │  ├─ instructions.md
│  │  ├─ description.md
│  │  ├─ conversation-starters.md
│  │  └─ builder-settings.md
│  ├─ knowledge/
│  │  ├─ README.md
│  │  ├─ character-identity-reference.md
│  │  ├─ motion-vocabulary.md
│  │  └─ sprite-output-spec.md
│  └─ experimental-audit/
│     ├─ README.md
│     ├─ instructions-addon.md
│     ├─ github-audit-openapi.yaml
│     └─ test-cases.md
├─ audit/
│  ├─ README.md
│  ├─ assets/
│  ├─ docs/
│  ├─ scripts/
│  ├─ specs/
│  ├─ templates/
│  └─ requirements.txt
├─ research/
│  └─ public-image-gpt-reuse/
├─ legacy/
│  ├─ README.md
│  ├─ instructions/
│  ├─ knowledge/
│  ├─ actions/
│  ├─ docs/
│  └─ examples/
├─ .github/
│  └─ workflows/
│     ├─ audit-sprite.yml
│     └─ test-audit-scripts.yml
├─ PRIVACY.md
└─ README.md
```

## `gpt/production`

My GPTエディターへ実際に設定する本番内容だけを置く。

実装済み:

- 画像生成依頼では画像生成Capabilityを直接使う
- 添付画像をキャラクターデザインの正本にする
- 指定された動作、ポーズ、表情だけを変える
- 明示されていない要素を維持する
- 軽微な不足は合理的に補う
- 静止画とモーションを依頼語から分ける
- 「モーション」「アニメーション」「フレーム」「スプライト」がある場合だけ複数フレーム仕様を使う
- 修正時は指定部分だけを変更する

含めない内容:

- GitHub runの探索
- Issueとartifactの取得
- 内部パスの列挙
- Action失敗時の長い分岐
- 監査閾値

## `gpt/knowledge`

参照資料だけを置く。

- `character-identity-reference.md`: 顔、髪、衣装、体格、画風などの比較観点
- `motion-vocabulary.md`: 状態名と視覚的な動作例
- `sprite-output-spec.md`: モーションのフレーム数、透明背景、セル、ループ要件

実行命令とAction手順は置かない。

## `gpt/experimental-audit`

生成後監査を本番画像生成版から隔離して検証する。

採用した設計:

```text
実験GPT
  → 監査受付API
  → 短期ストレージ
  → GitHub repository_dispatch
  → GitHub Actions
```

GitHub APIへ直接`openaiFileIdRefs`を入れ子で送る旧案は採用しない。旧スキーマは`legacy/actions/`へ保存する。

実装済み:

- 監査用Instructions add-on
- 受付APIのOpenAPI契約
- 実機テスト項目
- 受付APIからの`image_url`を受けるGitHub workflow

未実装:

- 監査受付API本体
- 一時画像ストレージ
- GPTエディター上のAction実機試験

## `audit`

画像生成GPTから独立した監査ソフトウェアとして扱う。

既存資産として維持したもの:

- `audit/scripts/`
- `audit/specs/`
- `audit/assets/`
- `audit/templates/`
- `audit/requirements.txt`

接続部分は再構築した。`.github/workflows/audit-sprite.yml`は受付APIが作成した許可済みHTTPS URLから画像を取得する。

## `legacy`

再編前のInstructions、Knowledge、Action、導入文書、プロンプト例を保存する。

- 比較と履歴確認だけに使う
- 現行GPTへ設定しない
- 新しい本番文書へ本文をコピーしない

## 実装状況

1. フォルダ再編と旧構成の退避: 完了
2. 本番Instructions、説明、会話例、Builder設定の新規作成: 完了
3. Knowledgeの新規作成: 完了
4. 監査受付API方式の契約とworkflow再設計: 完了
5. 本番GPTのPreview試験: 未実施
6. 監査受付API本体の実装: 未実施
7. 監査Actionの実機試験: 未実施
8. 監査を本番GPTへ統合するかの判断: 未実施

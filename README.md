# MYGPT — Character Animation Difference Generator

基準キャラクター画像から、状態差分、ループアニメーション、複数行スプライトを生成し、GitHub Actionsで品質監査するCustom GPT用プロジェクト。

OpenAI公開の`hatch-pet`ワークフローを参考に、My GPTの組み込み画像生成で扱える手順へ整理している。CodexやWorkは画像生成時の前提にしない。

## 構成

```text
knowledge/
  hatch-pet-mygpt.md          画像生成の基本手順
  pet-state-list.md           公式状態と拡張状態の定義
  pet-output-spec.md          寸法、配置、透明背景、出力形式
instructions/
  mygpt-instructions.md       My GPTの「指示」欄へ貼る内容
assets/
  sprite-template-8x9.svg     公式互換8×9レイアウト参照
scripts/
  audit_sprite.py             監査の統合実行
  normalize_sprite.py         縮尺と足元の補正
  create_contact_sheet.py     目視確認用一覧
  create_preview.py           動画プレビューGIF
  download_input.py           GitHub・Drive等から画像取得
specs/
  pet-atlas-8x9.json          寸法、状態順、監査閾値
.github/workflows/
  audit-sprite.yml            非同期監査ワークフロー
actions/
  github-audit-openapi.yaml   My GPT Action用OpenAPIスキーマ
docs/
  setup.md                    基本導入
  audit-workflow.md           監査Actionの導入と運用
examples/
  prompts.md                  生成プロンプト例
```

## My GPTの基本設定

1. `instructions/mygpt-instructions.md`の本文をMy GPTの「指示」へ貼る。
2. `knowledge/`の3ファイルをKnowledgeへアップロードする。
3. 機能の「画像生成」をオンにする。
4. 生成時に基準キャラクター画像を添付する。
5. 複数状態を一枚へ配置するときは`assets/sprite-template-8x9.svg`も添付する。

アクションを使わず、画像生成だけを試すこともできる。

## 品質監査フロー

```text
My GPTで画像生成
    ↓
生成画像をGitHubまたはGoogle Driveへ共有
    ↓
My GPT ActionがGitHub Actionsを起動
    ↓
Python監査・補正
    ↓
audit.json
contact-sheet.png
preview.gif
normalized-spritesheet.webp
    ↓
GitHub Issueの修復指示をMy GPTが読む
    ↓
不合格行だけ再生成
```

Action導入とGitHubトークン権限は[`docs/audit-workflow.md`](docs/audit-workflow.md)を参照。

## 手動監査

GitHubのActions画面から`Audit sprite atlas`を実行する。

主な入力:

- `image_url`: 公開画像URL、GitHub URL、または公開Google Drive共有URL
- `request_id`: 監査を識別する一意な値
- `expected_states`: 部分シートで使う行を上から順にカンマ区切りで指定
- `normalize`: 補正版WebPを作るか
- `publish_issue`: 失敗行と修復指示をIssueへ掲載するか

完全な公式9行なら`expected_states`は空欄でよい。

## 監査項目

- 1536×1872キャンバスと192×208セル
- 透明画素のRGB残留
- 必須フレームの欠落
- 未使用行への描画
- セル端への接触と切れの疑い
- 足元のばらつき
- 幅と高さの変動
- 近似重複フレーム
- 動きが小さすぎる可能性

画風、顔、衣装、手指、動作の意味は画素監査だけでは完全に評価できない。`contact-sheet.png`と`preview.gif`による目視確認を併用する。

## 公式互換仕様

- キャンバス: 1536×1872 px
- 配置: 8列×9行
- セル: 192×208 px
- 状態順: `idle`, `running-right`, `running-left`, `waving`, `jumping`, `failed`, `waiting`, `running`, `review`

## 注意

GitHub Actionsは非同期なので、My GPTがワークフローを起動した同じ応答内で監査完了まで取得できない場合がある。その場合は、同じ`request_id`の実行または`[sprite-audit] <request_id>`Issueを後続のメッセージで確認する。

公開URL方式は入力画像をGitHub Actionsから取得できる状態にする。非公開画像を扱う場合は、認証付きの専用監査APIへ移行する。

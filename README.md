# MYGPT — Character Animation Difference Generator

基準キャラクター画像から、状態差分、ループアニメーション、複数行スプライトを生成し、生成画像をそのままGitHub Actionsへ渡して品質監査するCustom GPT用プロジェクト。

OpenAI公開の`hatch-pet`ワークフローを参考に、My GPTの組み込み画像生成で扱える手順へ整理している。生成後の画像をGoogle DriveやGitHubへ手動アップロードする工程は前提にしない。

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
specs/
  pet-atlas-8x9.json          寸法、状態順、監査閾値
.github/workflows/
  audit-sprite.yml            生成画像を受け取る監査ワークフロー
actions/
  github-audit-openapi.yaml   My GPT Action用OpenAPIスキーマ
docs/
  setup.md                    基本導入
  audit-workflow.md           自動監査Actionの導入と運用
examples/
  prompts.md                  生成プロンプト例
```

## My GPTの基本設定

1. `instructions/mygpt-instructions.md`の本文をMy GPTの「指示」へ貼る。
2. `knowledge/`の3ファイルをKnowledgeへアップロードする。
3. 機能の「画像生成」をオンにする。
4. `actions/github-audit-openapi.yaml`をActionへ読み込む。
5. 生成時に基準キャラクター画像を添付する。
6. 複数状態を一枚へ配置するときは`assets/sprite-template-8x9.svg`も添付する。

## 自動品質監査フロー

```text
My GPTで画像生成
    ↓
会話内の生成画像をopenaiFileIdRefsでActionへ直接渡す
    ↓
GitHub repository_dispatch
    ↓
GitHub Actionsが5分有効の画像URLを即時取得
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

ユーザーによる画像の保存、GitHubへのコミット、Google Drive共有は不要。

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

## 制約

GPT Actionsの`openaiFileIdRefs`を使う。OpenAI公式仕様では、会話内の生成画像を最大10件までPOSTへ添付でき、各画像は5分有効のURLとして渡される。

GitHub Actionsは非同期なので、監査結果は後続のAction呼び出しで確認する。生成画像のファイル参照をプラットフォーム側が渡せなかった場合、手動アップロードへ切り替えず監査未実施として報告する。

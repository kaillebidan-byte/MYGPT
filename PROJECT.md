# MYGPT Character Animation Workflow

基準キャラクター画像から、状態差分、ループアニメーション、複数行スプライトを生成するCustom GPT用プロジェクトです。

## 構成

```text
knowledge/
  hatch-pet-mygpt.md
  pet-state-list.md
  pet-output-spec.md
instructions/
  mygpt-instructions.md
assets/
  sprite-template-8x9.svg
docs/
  setup.md
examples/
  prompts.md
```

## 導入

1. `knowledge/`の3ファイルをCustom GPTのKnowledgeへアップロードする。
2. `instructions/mygpt-instructions.md`をInstructions欄へ貼る。
3. 画像生成機能を有効にする。
4. アクションは追加しない。
5. 生成時に基準キャラクター画像を添付する。
6. 複数状態を一枚へ配置するときは、`assets/sprite-template-8x9.svg`もレイアウト基準として添付する。

詳しい手順は[`docs/setup.md`](docs/setup.md)を参照してください。

## 最小プロンプト

```text
1枚目をキャラクターの正本、2枚目を配置テンプレートとして使って。
1行目にsearching、2行目にvalidating、3行目にconfused、4行目にcompletedを配置して。
各行8フレームの独立した自然なループ。残りの行は透過のまま。テンプレートの枠線は最終画像へ残さない。
```

## 注意

このプロジェクトはOpenAI公開の`hatch-pet`ワークフローに着想を得た非公式なCustom GPT向け適応です。OpenAI公式スキルそのものではありません。

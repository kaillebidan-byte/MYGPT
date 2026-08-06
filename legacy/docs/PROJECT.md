# MYGPT Character Animation Workflow

基準キャラクター画像から、状態差分、ループアニメーション、複数行スプライトを生成する再編前のCustom GPT構成。

この文書は履歴確認用。記載されている旧パスは現在の運用構成では使用しない。

## 旧構成

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

## 旧導入手順

1. `knowledge/`の3ファイルをCustom GPTのKnowledgeへアップロードする。
2. `instructions/mygpt-instructions.md`をInstructions欄へ貼る。
3. 画像生成機能を有効にする。
4. アクションは追加しない。
5. 生成時に基準キャラクター画像を添付する。
6. 複数状態を一枚へ配置するときは、`assets/sprite-template-8x9.svg`も添付する。

現在の移動先は`research/public-image-gpt-reuse/migration-map.md`を参照。

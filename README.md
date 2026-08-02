# MYGPT — Character Animation Difference Generator

基準キャラクター画像から、表情差分、状態差分、ループアニメーション、スプライト素材をChatGPTのMy GPTで生成するための設定一式。

OpenAI公式`hatch-pet`の考え方を、My GPTの組み込み画像生成で扱えるように整理している。Codex、Work、サブエージェント、ローカルスクリプト、外部APIは前提としない。

## 構成

```text
instructions/
  MYGPT_INSTRUCTIONS.md       My GPTの「指示」欄へ貼る内容
knowledge/
  hatch-pet-mygpt.md          画像生成の基本手順
  pet-state-list.md           公式状態と拡張状態の定義
  pet-output-spec.md          寸法、配置、透明背景、出力形式
templates/
  pet-atlas-template-8x9.png  公式互換8×9レイアウト参照画像
  pet-atlas-template-8x9.json 寸法と状態順の機械可読定義
```

## My GPTへの設定

1. My GPTの「指示」へ`instructions/MYGPT_INSTRUCTIONS.md`の本文を貼る。
2. 「知識」へ`knowledge/`の3ファイルをアップロードする。
3. 機能の「画像生成」をオンにする。
4. アクションは追加しない。
5. レイアウトを使う依頼では、基準キャラクター画像と`templates/pet-atlas-template-8x9.png`を会話へ添付する。

Knowledgeへテンプレート画像を置くこともできるが、画像生成時に会話へ添付する方がレイアウト参照として確実。

## 依頼例

### 単一状態

```text
添付画像をデザイン正本として、このキャラクターが検索する8フレームの横一列ループアニメーションを生成して。
```

### 複数状態

```text
1枚目をキャラクターの正本、2枚目を配置テンプレートとして使って。
1行目に検索中、2行目に検証中、3行目に困惑中、4行目に完了を配置して。
各行8フレーム。残りの行は透過のままにして。
```

### 公式互換

```text
1枚目をキャラクターの正本、2枚目を公式互換レイアウトとして使って。
状態一覧の公式順に8列×9行で生成して。枠線、行名、番号は最終画像へ残さない。
```

## 運用上の注意

複数行を一度に生成すると、顔、縮尺、セル位置、動作の一貫性が落ちることがある。最初は2〜4状態ずつ生成し、問題のある行だけを修正する運用が安定する。

公式互換アトラスの寸法は1536 × 1872 px、セルは192 × 208 px。状態順は`idle`, `running-right`, `running-left`, `waving`, `jumping`, `failed`, `waiting`, `running`, `review`。

## 由来

本リポジトリはOpenAI公式`hatch-pet`スキルの設計原則を参考にしたMy GPT向けの派生手順。公式スキルそのものを実行するものではない。

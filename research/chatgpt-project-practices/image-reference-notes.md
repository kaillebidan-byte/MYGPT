# Project内の画像参照・キャラクター生成メモ

初回調査日: 2026-08-07
更新日: 2026-08-08

MYGPTの目的に近い「同じキャラクターを複数回生成する」用途へ絞った調査メモ。

## 実機結果: Project Sourcesだけの基準画像は本番不採用

2026-08-07、正面の基準キャラクター画像をChatGPT ProjectのSourcesへ置き、Project Sourcesだけを画像参照経路にした試験を実施した。

結果:

- 静止画: 基準キャラクターを参照して生成できた
- モーション: 基準画像の参照自体が成立せず、全く別のキャラクターが生成された

この結果から、本番ではProject Sources内の画像だけをキャラクター正本の受け渡し経路として使わない。

基準画像は、画像生成を行う現在のチャットへ直接添付する。Project Sourcesは同一性判断、動作設計等のテキスト資料へ使う。

この試験は「Project Sourcesの画像が常に視覚参照不能」という一般仕様を証明するものではない。静止画では参照できたため、現時点のモーション生成経路に本番信頼性がないという判断として記録する。

## 1. Project filesへ置いたPNGが必ず視覚参照されるとは限らない

Redditの2025-04-16の実験では、キャラクター参照PNGをProject filesへ保存した状態では、期待した画像分析が行われず、同じ画像をチャットへ直接添付すると認識されたという報告がある。

Source:
https://www.reddit.com/r/ChatGPT/comments/1k0juti/is_there_anyway_for_chatgpt_to_be_able_to_see_and/

これは古いバージョンの報告であり、2026年現在も同じとは断定しない。今回の実機結果では静止画とモーションで挙動が分かれた。

## 2. キャラクターシートをProject filesへ置く実践例

Christy TuckerのChatGPT画像生成に関するLinkedIn議論で、利用者Scott Laczkoは次の方法がうまくいったと報告している。

- まず複数表情/角度を持つcharacter sheetを作る
- character sheetをProject filesへ置く
- 元画像の連続編集ではなく、新しいpromptとして生成する

Source:
https://www.linkedin.com/posts/christytucker_like-many-ld-folks-ive-been-experimenting-activity-7333144599097417729-Ksso

これは公式推奨ではなく個人の実践例。MYGPTには現時点で高解像度の正面canonicalがあり、未設定の別角度を新規作成して正本化する理由はないため、本番要件には採用しない。

## 3. 各生成でreference imageを再添付する実践例

同じLinkedIn議論で、別の実践者は各新規promptへキャラクターのreference headshotを添付する方法を勧めている。

Project Sourcesへ置くだけで済ませるより手数は増えるが、生成ツールへ視覚入力が渡る経路を明確にできる。

MYGPTでは正面の基準全身画像を現在の生成チャットへ直接添付する方式を本番前提とする。

## 4. 世代をまたぐ連続編集でドリフトする報告

Christy Tuckerは複数シーンで同じ人物を生成する実験で、生成を重ねるにつれてキャラクター一致性が低下し、人物配置も不安定になることを記録している。

Source:
https://christytuckerlearning.com/frustrations-with-chatgpt-image-generation/

また2026年のRedditでも、同じ架空人物を1か月以上生成していた利用者から、顔の構造、目、顎などのidentity driftが急に強くなったという報告がある。

Source:
https://www.reddit.com/r/ChatGPT/comments/1tspsm2/character_consistency_suddenly_worse_since/

モデル挙動は更新で変わるため、Instructionsだけで完全固定できる前提を置かない。

## 5. 基準画像へ毎回戻る方式

本番候補ワークフロー:

```text
Project Instructions
  + text Sources
  + 現在のチャットへ直接添付した正面基準画像
            ↓
その1回の目的だけを指定
            ↓
生成
```

次の画像では直前の生成物を正本にせず、再び元の基準画像へ戻る。

```text
baseline → waving
baseline → idle
baseline → running
baseline → surprised expression
```

これにより、生成Aの小さな崩れを生成Bが継承し、さらに生成Cへ累積させる連鎖を避ける。

## 6. 旧2×2結論はSUPERSEDED

2026-08-07時点では、4つの主要キーポーズを画像生成モデルに直接2×2で作らせ、後段で分離・正規化する方針を候補としていた。

その後の2026-08-08実機試験でdirect 2×2方式には、active limb左右交換、endpoint復帰、identity drift、divider / label / shadow、chroma不均一等が繰り返し確認された。
さらにframe-firstへ移行した後も、full motion orchestration contextでは各単独frame callが2×2 sequence sheetへ崩れる現象を確認した。

したがって、このファイルの旧「2×2キーポーズ維持」結論は現行production判断では使わない。

現行正本:
- `../MOTION-GENERATION-EXPERIMENT-LOG.md`
- `../incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`
- `imagegen-orchestration-context.md`

現在は、まず`1 image call = 1 portrait`を安定させ、その後にPython compose等の後処理へ進む方向を検証している。

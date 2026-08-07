# Project内の画像参照・キャラクター生成メモ

調査日: 2026-08-07

MYGPTの目的に近い「同じキャラクターを複数回生成する」用途へ絞った調査メモ。

## 1. Project filesへ置いたPNGが必ず視覚参照されるとは限らない

Redditの2025-04-16の実験では、キャラクター参照PNGをProject filesへ保存した状態では、期待した画像分析が行われず、同じ画像をチャットへ直接添付すると認識されたという報告がある。

Source:
https://www.reddit.com/r/ChatGPT/comments/1k0juti/is_there_anyway_for_chatgpt_to_be_able_to_see_and/

これは古いバージョンの報告であり、2026年現在も同じとは断定しない。Project版MYGPTでは実機比較が必要。

## 2. キャラクターシートをProject filesへ置く実践例

Christy TuckerのChatGPT画像生成に関するLinkedIn議論で、利用者Scott Laczkoは次の方法がうまくいったと報告している。

- まず複数表情/角度を持つcharacter sheetを作る
- character sheetをProject filesへ置く
- 元画像の連続編集ではなく、新しいpromptとして生成する

Source:
https://www.linkedin.com/posts/christytucker_like-many-ld-folks-ive-been-experimenting-activity-7333144599097417729-Ksso

これは公式推奨ではなく個人の実践例。

## 3. 各生成でreference imageを再添付する実践例

同じLinkedIn議論で、別の実践者は各新規promptへキャラクターのreference headshotを添付する方法を勧めている。

Project Sourcesへ置くだけで済ませるより手数は増えるが、生成ツールへ視覚入力が確実に渡ったことを確認しやすい。

MYGPTでは、全身デザインが重要なのでheadshotだけではなく、基準全身画像またはcharacter master sheetを直接添付する比較試験が必要。

## 4. 世代をまたぐ連続編集でドリフトする報告

Christy Tuckerは複数シーンで同じ人物を生成する実験で、生成を重ねるにつれてキャラクター一致性が低下し、人物配置も不安定になることを記録している。

Source:
https://christytuckerlearning.com/frustrations-with-chatgpt-image-generation/

また2026年のRedditでも、同じ架空人物を1か月以上生成していた利用者から、顔の構造、目、顎などのidentity driftが急に強くなったという報告がある。

Source:
https://www.reddit.com/r/ChatGPT/comments/1tspsm2/character_consistency_suddenly_worse_since/

モデル挙動は更新で変わるため、Instructionsだけで完全固定できる前提を置かない。

## 5. 基準画像へ毎回戻る方式

実践例から見える候補ワークフロー:

```text
Project Instructions
  + text Sources
  + baseline character image / character sheet
            ↓
生成チャットへbaselineを直接添付
            ↓
その1回の目的だけを指定
            ↓
生成
```

次の画像では直前の生成物を正本にせず、再びbaselineへ戻る。

```text
baseline → waving
baseline → idle
baseline → running
baseline → surprised expression
```

これにより、生成Aの小さな崩れを生成Bが継承し、さらに生成Cへ累積させる連鎖を避ける。

## 6. 2×2キーポーズとの関係

現在のリポジトリには2×2キーポーズ方式の後処理資産がある。Projectへ移行しても、画像生成モデルへ厳密な最終ストリップを直接描かせない方針は別問題として残せる。

ただし、Project版の指示を作る前に次を比較する。

### Test A
Project Sourcesへ基準PNGを置くだけで2×2キーポーズ生成。

### Test B
同じProjectで、基準PNGを生成チャットへ直接添付して2×2キーポーズ生成。

### Test C
character sheetをProject Sourcesに置き、さらに最重要の基準全身PNGをチャットへ直接添付して生成。

比較項目:

- 顔
- 髪
- 衣装模様
- 装飾
- 頭身
- 4象限間の同一性
- 手足の切れ
- 背景透過
- ポーズ差の読みやすさ

この比較で、Project Sourcesの画像を本番経路に含めるか、テキスト資料だけをSourcesへ置き、基準画像は毎回チャットへ直接添付するかを決める。

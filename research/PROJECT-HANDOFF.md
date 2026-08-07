# MYGPT調整プロジェクト 引継ぎ

この文書は、MYGPT調整の新しい会話を開始するときに冒頭へ貼る作業コンテキストである。

本番のChatGPT Projectへ投入するProject Instructionsではない。

## 目的

基準キャラクター画像から、同一キャラクターを維持した静止画・モーション用キーポーズ素材をChatGPT Projectで生成する。

画像生成モデルには1動作の主要4キーポーズまでを担当させ、クロマ除去、切り出し、共通倍率、最終ストリップ、8フレーム化、アトラス化はGitHubの`audit/`側で行う。

## GitHub

Repository:

`kaillebidan-byte/MYGPT`

本番構成:

```text
project/
  instructions/
    project-instructions.md
  sources/
    production/
      01-character-identity.md
      02-motion-design.md
      03-keypose-board-spec.md
      04-imagegen-workflow.md
    layout-guides/
      four-pose-portrait.png
      README.md
    reference-images/
      README.md

audit/
  scripts/
    build_motion_layout_guide.py
    remove_chroma_key.py
    build_motion_strip.py
  specs/
    motion-keypose-2x2.json

research/
  hatch-pet-porting.md
  PROJECT-HANDOFF.md
```

## ChatGPT Project

Projectには次を投入する。

- Project Instructions: `project/instructions/project-instructions.md`
- Source: `01-character-identity.md`
- Source: `02-motion-design.md`
- Source: `03-keypose-board-spec.md`
- Source: `04-imagegen-workflow.md`
- layout-only Source: `four-pose-portrait.png`

正本のキャラクター画像はProject Sourcesへ置くだけの方式に戻さない。

画像生成する各チャットへ元の正面基準画像を直接添付する。

## 基準画像について確定したこと

- Project Sourcesだけに置いた基準画像は静止画では参照できたが、モーションでは参照が切れて別キャラクターになった実機結果がある。
- したがってidentityのcanonical referenceは、現在の画像生成チャットへ直接添付された元画像。
- 前回生成したmotion boardを次のmotionの正本にしない。
- character sheetは存在しないので前提にしない。
- 正面から見えない側面・背面へ新しい固有設定を勝手に正本化しない。

## これまで成功した事項

portrait 2×2へ変更後、次は実機で成立した。

- 1024×1536の2:3 portrait
- 4体とも全身
- 中央境界から本体が離れる
- キャンバス外周から本体が離れる
- 以前の笑顔・口開け・キラキラ追加は一度改善
- キャラクター全体の同一性は概ね維持

これらを失敗のたびに未検証扱いへ戻さない。

## 残ったidentity問題

portrait 2×2でも次のdriftを確認した。

- 胸部を含む上半身が正本より小さく・平坦になる
- 胸から腰までが細身になる
- 胸紋が簡略化する
- 腰の房・紐・留め具の個数や接続が変わる
- 袖口や細い衣装構造が簡略化する

`01-character-identity.md`へ胸部・胴体シルエットと小さな固有ディテールの維持規則を追加したが、2×2生成では完全には改善しなかった。

## 床影

一部テストで、禁止済みなのに4体の足元へ接地影が生成された。

同じ禁止文をInstructionsへ重ねる方向ではなく、画像生成段階を均一な単色クロマキー背景へ変更し、背景・影の後処理境界を明確化する方針へ移った。

## 4枚個別生成実験

identity driftの主因が2×2縮小かを調べるため、K1〜K4を4枚の独立画像として1ユーザー依頼内で生成させる実験を行った。

結果:

- K1〜K4個別画像とは別に、2×2や横4枚の複数ポーズ画像が複数生成された。
- 1ユーザー依頼で出力系列が増え、visual job境界を制御できなかった。
- 個別K1〜K4は共通ベースへの局所編集に近かった。
- K1とK4はピクセル単位で完全一致した。
- K2/K3は主に片腕周辺だけが変更された。
- identity保持自体は強かったが、motion semanticsと独立job制御が失敗した。

したがって、**K1〜K4を4 visual jobsへ分解する方式は本番不採用**。

`build_motion_strip.py`の4枚個別入力は過去実験との互換用に残してよいが、ChatGPT Project本番経路では使用しない。

## hatch-pet調査から採用した設計

詳細は`research/hatch-pet-porting.md`。

OpenAI公式hatch-petから、次の構造をMYGPTへ移植する。

- canonical imageへ毎回再アンカーする
- identity referenceとlayout referenceを分離する
- 1 visual jobの範囲を明確にする
- 画像生成promptを短く状態固有にする
- 単色chroma backgroundを使い、後処理でalpha化する
- deterministicな切り出し・正規化を後段へ置く
- 失敗時は最小単位だけrepairする

hatch-petのworker/subagentそのものはChatGPT Projectから作れない。

MYGPTでは、**新しいチャット + 元の正本直接添付 + 1モーションだけ**をjob isolationとして使う。

## 現在の本番モーション生成

1 motion = 1 visual job = 1 image generation = 1 motion board。

ユーザーは1回だけ依頼する。

例:

> このキャラクターが手を振るモーションを作ってください。

Project側は1回の画像生成で、portrait 2×2ボード1枚だけを返す。

```text
左上 K1 → 右上 K2 → 左下 K3 → 右下 K4
```

手振りの現在の位相:

- K1: 腕を自然に下ろした開始姿勢
- K2: 肩と肘を使って腕を上げ始める
- K3: 手が最も高い、または最も外側へ振れた姿勢
- K4: 腕を下げ始め、K1へ戻れる姿勢

K1〜K4を4枚の別画像として生成しない。

同じ応答で横4枚版、別案、追加2×2、summary sheetを生成しない。

失敗しても同じ応答内で自動再生成しない。

## layout guide

`project/sources/layout-guides/four-pose-portrait.png`はキャラクター画像ではない。

用途:

- 4スロット
- 中央safe gap
- 外周safe margin

だけ。

ガイドのラベル、枠線、灰色領域、色を最終生成へコピーしない。

Project側でlayout guideが視覚入力として効くかは次の実機で検証する。

効かなくても、生成ごとにユーザーへlayout guide添付を要求しない。`03-keypose-board-spec.md`をfallbackにする。

## 背景方式

真の透明背景を画像生成モデルへ完成させる方式から、均一な単色クロマキーへ変更した。

既定候補はmagenta。キャラクター本体に衝突する場合はcyan、blue、greenなどへ変更する。

raw board:

```text
portrait 2x2
flat chroma background
no floor
no shadow
no gradient
```

後処理:

```text
raw board
  -> audit/scripts/remove_chroma_key.py
  -> transparent 2x2 board
  -> audit/scripts/build_motion_strip.py
  -> normalized transparent strip
```

`remove_chroma_key.py`は既定で画像外周の最頻色をクロマ色として自動検出する。

## 次の実機テスト

新しい画像生成チャットを使う。

元の正面正本を直接添付する。

依頼文は変えない。

> このキャラクターが手を振るモーションを作ってください。

最初の評価順:

1. **画像生成結果が1枚だけか**
2. その1枚に4ポーズだけあるか
3. portrait 2×2か
4. 背景が均一な単色クロマキーか
5. 4体とも全身か
6. 中央safe gapと外周余白があるか
7. K1→K2→K3→K4が動作として読めるか
8. 基準表情を維持したか
9. 床影、文字、ラベル、未指定effectがないか
10. 最後に顔、頭身、胸部・胴体、胸紋、腰飾り、袖などidentity driftを見る

最初の「1枚だけ」が失敗した場合は、identity細部のprompt追加へ進まず、Projectで1 visual jobをどこまで保証できるかを再評価する。

## 8フレーム

最初から8体を1画像へ描かせない。

まず主要K1〜K4のmotion boardを1 visual jobで生成する。

中割りI1〜I4が必要なら、主要boardが合格した後の別visual jobとして2×2を生成する。

主要boardと中割りboardを同じChatGPT応答内で自動連続生成しない。

## やらないこと

- 基準画像をGitHubへ毎回手動アップロードするワークフロー
- Project Sources内画像だけをidentity正本にする
- 前回生成motionを次のmotionの正本にする
- 存在しないcharacter sheetを前提にする
- K1〜K4を4回の画像生成へ分解する
- 最終8フレームや巨大アトラスを画像モデルへ一発生成させる
- 失敗のたびに同じ意味の禁止文をInstructionsへ追加する
- Custom GPT固有の`/mnt/data`、Instant回避、Builder設定をProjectへ戻す

## 調整の進め方

失敗したらまず出力画像を評価し、必要ならalpha、bbox、pixel diffを数値確認する。

一度に複数の仮説を変更しない。

確認できた失敗だけGitHubへ反映する。

既知の成功事項を未検証扱いへ戻さない。

プラットフォーム挙動が疑わしい場合は、同じprompt修正を繰り返す前にOpenAI公式資料、公式Skills、Developer Community、実運用例を調べる。

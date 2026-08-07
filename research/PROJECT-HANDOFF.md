# MYGPT調整プロジェクト 引継ぎ

更新日: 2026-08-08

この文書は、MYGPT調整の新しい会話を開始するときに冒頭へ貼る作業コンテキストである。

**ChatGPT Project本番へ投入するProject Instructionsではない。**

---

## 0. 最重要事項

### 本番環境

本番は **ChatGPT Project「MYGPT」**。

GitHub repositoryは:

`kaillebidan-byte/MYGPT`

Custom GPT / My GPTは本番経路ではない。`legacy/custom-gpt/`は過去設定の保管場所。

### 画像生成の扱い

この調整会話でユーザーが「画像生成依頼ではありません」「画像生成起動するな」と明示した場合、**絶対に画像生成を起動しない**。

評価・設計・GitHub更新・後処理検証だけを行う。

### 調整方針

- 失敗画像を先に評価する。
- 必要ならbbox、alpha、pixel差分などを数値確認する。
- 一度に複数の仮説を変更しない。
- 確認できた失敗だけGitHubへ反映する。
- 一度成功した事項を、別の失敗が出たからといって未検証扱いへ戻さない。
- 同じ意味の禁止文をpromptへ重ね続ける方式を避ける。
- プラットフォーム挙動が疑わしい場合、場当たり的なprompt修正より先に公式資料・公式Skill・実機結果を確認する。

---

## 1. 目的

ユーザーが直接添付する1枚の正面基準キャラクター画像をcanonical identity referenceとして、同一キャラクターの静止画・ポーズ差分・モーション素材を生成する。

最終的な狙いは、画像生成モデルに巨大な8フレームatlasを直接描かせることではない。

現在の責務分担は:

```text
ChatGPT Project
  -> 主要K1〜K4のportrait 2x2 board
  -> 必要なら中割りI1〜I4のportrait 2x2 board

GitHub audit/
  -> chroma除去
  -> 2x2分割
  -> bbox / edge検査
  -> 共通倍率
  -> frame plan
  -> motion strip / GIF等の検証
```

---

## 2. 現在のChatGPT Project構成

Project Instructions:

- `project/instructions/project-instructions.md`

Project Sources:

- `project/sources/production/01-character-identity.md`
- `project/sources/production/02-motion-design.md`
- `project/sources/production/03-keypose-board-spec.md`
- `project/sources/production/04-imagegen-workflow.md`
- `four-pose-portrait.png` — layout-only Source

Project側の構成は **Instructions 1本 + Sources 5点**。

### 正本画像

基準キャラクター画像そのものはProject Sourcesだけに置かない。

**画像生成する各チャットへ元の基準画像を直接添付する。**

理由: Project Sourcesだけに置いた基準画像は静止画では参照できたが、モーション生成では参照が切れて別キャラクターになった実機結果がある。

前回生成画像を次のモーションのcanonical referenceにしない。

### layout guide

`four-pose-portrait.png`はキャラクター正本ではなく、4スロット・中央safe gap・外周marginの配置専用。

**Project Sourceとしてだけ使う。**

基準画像と一緒に生成チャットへ直接添付しない。

実機で直接添付した場合:

- K1〜K4ラベルを描き写した
- 枠を描き写した
- チェック柄の透過表現まで描き写した
- 正方形構図へ退行した
- chroma背景を無視した

一方、Project Source側だけに置いた場合はportrait 2x2を維持できた。

GitHubには現在PNG binary自体は保持していない。生成スクリプトと参照SVGを保持する。

生成:

```bash
python audit/scripts/build_motion_layout_guide.py \
  --output project/sources/layout-guides/four-pose-portrait.png
```

ユーザーのChatGPT Projectにはすでにlayout PNGをSourceとして追加して検証済み。

---

## 3. 現在のモーション設計

以前の`02-motion-design.md`は waving / idle / running / jumping 等を固定辞書として持っていた。

これは撤回済み。

現在の`02-motion-design.md`は、**ユーザーの自然言語要求から毎回motion contractを作る汎用方式**。

motion contractでは最低限:

- action
- loop / one-shot
- start
- end
- primary motion
- key events
- expression policy
- K1〜K4
- transitions
- 中割り用timing plan

を内部的に決める。

`rest / anticipation / peak / return`を全モーションへ固定適用しない。

### 未定義モーション実験

固定辞書にない「丁寧にお辞儀」で実験した。

モデルは自力で:

```text
直立 -> 軽い前傾 -> 深い前傾 -> 最深部
```

へ分解できた。

したがって「未知モーションを4位相へ分解する」こと自体は成立した。

ただし当時はK4が最深部で戻りがなく、表情もK2〜K4で勝手に閉眼した。

この結果を受け、現在は:

- loop / one-shotを先に決める
- one-shotでK4を無理にK1へ戻さない
- 動作意味から笑顔・閉眼・口開けを自動追加しない

という方式へ更新済み。

---

## 4. 主要4キーポーズの現在の本番方式

1 motion = 1 visual job = 1 image generation = 1 portrait 2x2 board。

K1〜K4を4枚の独立画像へ分解する方式は本番不採用。

時間順:

```text
左上 K1 -> 右上 K2 -> 左下 K3 -> 右下 K4
```

### 4枚個別生成実験が不採用になった理由

identity driftの原因調査として、1ユーザー依頼内でK1〜K4を4枚別生成する実験を行った。

結果:

- 4枚だけでなく複数の2x2 / 横4枚画像まで出力された
- 1依頼内でvisual job境界を制御できなかった
- 個別K1〜K4は共通ベース画像への局所編集に近かった
- K1とK4がpixel単位で完全一致した
- K2/K3も片腕付近だけが局所的に変わった
- identity保持は強かったがmotion semanticsが失敗した

よって本番は1枚の2x2 boardへ戻した。

`build_motion_strip.py`の個別画像入力はlegacy compatibilityとして残っているが、本番生成では使わない。

---

## 5. 2x2レイアウトで確定したこと

初期の1024x1024正方形2x2では:

- 全身が切れる
- 上段の靴が中央横境界を越える
- 下段が下端へ接触する
- tall full-body + raised arm + margin + center gapを512x512象限へ収めにくい

という問題が出た。

現在はportrait 2:3を既定にしている。

目安:

```text
1024 x 1536
各論理象限 512 x 768
```

この変更後:

- 4体とも全身
- 中央safe gap
- 外周margin
- raised armを含むポーズ

が実機で安定した。

ここは成功事項として維持する。

---

## 6. identityの現状

現在の2x2方式は「同じキャラクターと読める」水準ではかなり安定したが、canonical画像への完全一致ではない。

### 比較的安定しているもの

- 白髪ボブ
- 片目を覆う前髪
- 橙色の見えている目
- 帽子の基本形
- 白 / 金 / 橙の配色
- 基準の無表情（明示指示後）
- 全体の頭身
- 4ポーズ間のキャラクター同一性

### 残っているdrift

- 胸部を含む上胴が正本より細く、立体感が弱くなる
- 胸から腰までが少し細身になる
- 胸紋の花弁形状・密度が簡略化する
- 腰の紐・房・留め具の本数や接続が再構成される
- 袖・裾の花模様の位置や形が少し変わる

`01-character-identity.md`には胸部・胴体シルエット、胸紋、腰飾りなどの保持規則をすでに追加済み。

同じ禁止文をさらに増やすより、現在は正本を毎visual jobへ直接再アンカーする構造を優先している。

---

## 7. 背景方式

真のtransparent背景を画像生成モデルへ直接要求する方式はやめた。

現在はflat chroma background。

既定候補はmagenta。

キャラクターにmagentaがある場合はcyan / blue / greenなどへ変更する。

画像生成側:

```text
portrait 2x2
flat chroma
no floor
no shadow
no gradient
no labels
no motion lines
no unspecified effects
```

後処理:

```text
raw chroma board
  -> remove_chroma_key.py
  -> transparent board
  -> build_motion_strip.py
```

### 画像生成のchromaは数学的な完全1色ではない

実機では見た目が単色でもRGBに微小な揺れがある。

そのため後処理は「完全一致色だけを消す」のではなく、RGB-distanceで除去する。

---

## 8. 直近の成功した主要モーション

テスト内容:

「片手を上げて小さく合図し、そのまま腕を自然に下ろす」one-shot。

自然言語だけではK2/K3が近すぎる結果が出たため、最終テストではK1〜K4を明示した。

成功した主要boardの指示内容:

```text
このキャラクターについて、次の4つの時間順キーポーズを
1枚の2×2モーションボードとして作ってください。

K1: 両腕を自然に下ろした開始姿勢
K2: 片腕を上げる途中で、手が肩より少し高い位置にある姿勢
K3: 片手を完全に上げ、小さな合図が最も明確に見える姿勢
K4: 腕を自然に下ろした終了姿勢

キャラクターの外見・体格・表情・衣装・装飾は
添付した基準画像を正本として維持してください。
```

実機結果:

```text
K1 down
K2 rising
K3 signal peak
K4 down / end
```

が視覚的に区別できた。

- portrait 1024x1536
- ラベルなし
- motion lineなし
- 全身
- center gapあり
- outer marginあり
- 表情維持

まで確認。

この主要boardは中割り検証用の**承認済みmotion reference**として扱った。

ファイル名（この調整会話内）:

`ChatGPT Image 2026年8月8日 05_18_10.png`

---

## 9. 中割り生成方式

主要boardが合格した後、別visual jobとして中割りboardを生成する。

identity referenceとmotion referenceを分離する。

```text
元の正本画像             -> identity reference
承認済み主要K1〜K4 board -> motion endpoint reference
Project Sourceのlayout    -> layout reference
```

主要boardをcanonical identityへ昇格させない。

### 成功した中割り指示

```text
添付した元の基準画像をキャラクターの正本、
添付した4キーポーズのモーションボードを動作の基準として、
このモーションの中割り4ポーズを1枚の2×2モーションボードとして作ってください。

I1: K1からK2へ移る途中。腕を上げ始めた中間姿勢
I2: K2からK3へ移る途中。腕をさらに上げている中間姿勢
I3: K3からK4へ移る前半。上げた腕を下げ始めた姿勢
I4: K3からK4へ移る後半。腕が終了姿勢へ近づいた姿勢

I1 -> I2 -> I3 -> I4 の時間順とし、
主要キーポーズそのものを複製しないでください。
キャラクターの外見・体格・表情・衣装・装飾は
元の基準画像を正本として維持してください。
```

実機結果は成功。

- I1はK1→K2途中
- I2はK2→K3途中
- I3はK3→K4前半
- I4はK3→K4後半
- 主要ポーズの単純複製ではない
- 4枚間のidentityは安定
- major boardから新しい大崩れは発生していない

ファイル名（この調整会話内）:

`ChatGPT Image 2026年8月8日 05_22_02.png`

---

## 10. 8フレームGIF実機検証

上記の主要boardと中割りboardをこの調整会話内で実際に分割・chroma除去・共通倍率化し、GIFへ組んだ。

今回のone-shotの実frame plan:

```text
K1 -> I1 -> K2 -> I2 -> K3 -> I3 -> I4 -> K4
```

腕が:

```text
下
-> 上げ始め
-> 上昇
-> 合図の最大点
-> 下げ始め
-> 終了姿勢へ下降
-> 下
```

と連続して読めた。

よって、**主要4ポーズ -> 中割り4ポーズ -> 8フレーム化**という構造自体は実機で成立した。

このGIF検証で、新しい画像生成は不要という段階まで来ている。

---

## 11. remove_chroma_key.pyで発見した問題と直近修正

GIF検証時、旧`remove_chroma_key.py`既定値:

```text
threshold = 24
feather   = 24
```

では、ごく薄いmagenta残留がalpha>8でsafe gap / split-cell edgeへ残った。

そのため実際にはキャラクターが接触していないのに、`build_motion_strip.py`側のalpha bboxがセル端へ伸びるケースが出た。

実機の検出key:

- 主要board: `(245, 4, 203)`
- 中割りboard: `(238, 4, 195)`

safe gap / セル境界背景の、検出keyからの最大RGB-distance:

- 主要board: 約39.20
- 中割りboard: 約37.43

したがって旧hard threshold 24は不足。

### 2026-08-08更新

`audit/scripts/remove_chroma_key.py`の既定値を:

```text
threshold = 42
feather   = 18
```

へ変更した。

コミット:

`af5a45cfbef16f845c064d883d51142d7a6d783d`

この値では今回2枚のsafe gap / cell edge背景をhard-clearできることを、この会話内の実画像で確認済み。

さらに`.github/workflows/test-audit-scripts.yml`へ、中央safe gapだけ少し色が揺れたsynthetic chroma boardを追加した。

旧thresholdでは部分alphaが残る色差を入れ、新既定値では中央縦横gapがalpha=0になることをassertする。

コミット:

`391cb054f801dc9b4d3f02d20bcf3345e3596f7b`

**現在の最新HEADはこのコミット。**

GitHub connectorからcombined statusを確認した時点ではstatus配列が空で、CI成功までは断言していない。次回必要ならworkflow runを確認する。

---

## 12. build_motion_strip.pyの現在の考え方

主要4フレームだけなら:

```text
K1,K2,K3,K4
```

中割りを使う場合は`--frame-plan`で明示できる。

固定interleaveを本番仕様にしない。

loop例:

```text
K1,I1,K2,I2,K3,I3,K4,I4
```

今回実際に成功したone-shot:

```text
K1,I1,K2,I2,K3,I3,I4,K4
```

one-shotではK4→K1用のI4を捏造しない。

必要な区間へ2枚の中割りを割り当ててよい。

CIにはframe-planの柔軟性を確認する別のone-shot例も存在するが、それは今回の実モーションのframe planそのものではない。

---

## 13. これまでの主要な失敗と、戻してはいけない案

### 正方形2x2

全身・中央gap・外周marginに不利。portraitへ変更済み。

### 生成ごとに正本をGitHubへアップロード

不要。採用しない。

### Project Sources画像だけをidentity正本にする

モーションで失敗済み。採用しない。

### 前回生成画像を次のモーション正本へする

drift蓄積につながるため採用しない。

### K1〜K4を4回画像生成する

identityは強かったがmotion semantics / job制御が失敗。採用しない。

### layout guideを正本と一緒に直接添付

枠・ラベル・checkerboardを描き写した。採用しない。

### 最初から8体を1枚に生成

採用しない。

### 失敗のたびに禁止文を増やす

同じ問題がprompt追加で直らない実績がある。採用しない。

---

## 14. hatch-pet調査から残している原則

詳細: `research/hatch-pet-porting.md`

採用した原則:

- canonical imageへ毎job再アンカー
- identity referenceとlayout referenceを分離
- 1 visual jobの境界を明確化
- promptは長い規則全文ではなく状態固有に圧縮
- chroma + deterministic post-processing
- repairは失敗単位だけ

hatch-petのworker / subagent自体をChatGPT Projectから再現するのではない。

MYGPTでは「新しいチャット + 元正本直接添付 + 1モーション」が主要job isolation。

同じモーションの主要boardが合格した後の中割りは、元正本 + 承認済み主要boardを使う後続visual jobとして扱う。

---

## 15. 次のチャットで最初にやること

**新しい画像生成はまだしない。**

まず今回の2枚で後処理を再検証する。

必要な入力:

- 主要board: `ChatGPT Image 2026年8月8日 05_18_10.png`
- 中割りboard: `ChatGPT Image 2026年8月8日 05_22_02.png`

新しいチャットからこの会話内attachmentへアクセスできない場合は、ユーザーにこの2枚だけ再添付してもらう。

正本画像は後処理だけなら不要。

手順:

```bash
python audit/scripts/remove_chroma_key.py keyposes-raw.png \
  --output keyposes.png

python audit/scripts/remove_chroma_key.py inbetweens-raw.png \
  --output inbetweens.png

python audit/scripts/build_motion_strip.py keyposes.png \
  --inbetween-board inbetweens.png \
  --frame-plan K1,I1,K2,I2,K3,I3,I4,K4 \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-8f.png \
  --debug-dir motion-debug
```

確認すること:

1. `remove_chroma_key.py`新既定値42/18でsafe gapのalpha残留が消えるか
2. 2x2分割後、4セルとも誤ったedge contactが出ないか
3. 共通倍率が不必要に小さくならないか
4. `K1,I1,K2,I2,K3,I3,I4,K4`順でmotion stripを作れるか
5. GIF化したとき腕の上昇・頂点・下降が自然か
6. 主要boardと中割りboard間でキャラクターサイズが跳ねないか

ここが通れば、今回のone-shotについては:

**画像生成 + 中割り + chroma除去 + frame plan + 8フレーム化**

まで一通り成立したと判断できる。

失敗した場合も、次に触るのは原則`audit/`側。主要boardやProject promptを再生成ループへ戻さない。

---

## 16. 現在の重要ファイル

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
      README.md

audit/
  scripts/
    build_motion_layout_guide.py
    remove_chroma_key.py
    build_motion_strip.py
  specs/
    motion-keypose-2x2.json
  docs/
    keypose-motion-pipeline.md

research/
  hatch-pet-porting.md
  PROJECT-HANDOFF.md

.github/workflows/
  test-project-config.yml
  test-audit-scripts.yml
```

最新HEAD:

`391cb054f801dc9b4d3f02d20bcf3345e3596f7b`

---

## 17. 次回会話で避ける誤解

- 「MYGPT」はProject名 / repository名。プラットフォーム機能はChatGPT Project。
- Custom GPTへ戻さない。
- character sheetは存在しない。
- layout guideはidentity referenceではない。
- 中割りboardはidentity正本ではない。
- 主要boardを別モーションの正本へ使わない。
- 4キーポーズは固定モーション辞書から選ぶのではない。
- one-shotのI4を必ずK4→K1へ置かない。
- 今回の中割り方式はすでに実機で成功している。未検証扱いへ戻さない。
- 今回の残課題はまずpost-processing。画像生成promptの再調整ではない。

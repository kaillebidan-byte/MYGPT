# Image Generation Workflow

この資料は、ChatGPT Projectでモーション画像を生成するときの画像生成ジョブの組み方を定義する。

キャラクター同一性そのものは`01-character-identity.md`、動作位相は`02-motion-design.md`、2×2ボードの幾何条件は`03-keypose-board-spec.md`を優先する。

## 1 visual job = 1 motion board

1つのモーション依頼では、4つの主要キーポーズを1枚の2×2ボードとして生成する。

K1、K2、K3、K4を4つの別画像生成ジョブへ分解しない。K1〜K4は1つのvisual jobの内部状態であり、最終生成物は2×2ボード1枚だけとする。

同じユーザー依頼の中で、別案、比較案、横4枚版、追加の2×2版、K1〜K4個別画像、summary sheetを自動生成しない。

生成結果が不合格でも、同一応答内で自動再生成しない。修正は失敗原因を確認した後の別visual jobとして行う。

## canonical identity reference

キャラクターの正本は、現在の画像生成チャットへユーザーが直接添付した基準画像とする。

Project Sources内の画像、別チャットの画像、今回より前に生成したモーション画像をcanonical identity referenceへ昇格させない。

新しいモーションでは毎回、直接添付された元の基準画像へ戻る。

同じチャット内で画像生成結果が存在していても、次の自動派生生成の正本として使わない。そもそも1モーションにつき画像生成は1回だけにする。

## job isolation

MYGPTでは、1つの新しいチャットに1つのモーション依頼を置く運用を、隔離されたvisual jobとして扱う。

例:

- Chat A: 元の基準画像 + waving
- Chat B: 元の基準画像 + running
- Chat C: 元の基準画像 + jumping

wavingの生成物をrunningやjumpingの入力画像として連鎖させない。

## layout guide

`project/sources/layout-guides/four-pose-portrait.png`がProject Sourceとして利用可能な場合は、4スロットの位置、中央の空き、外周safe marginだけを判断するlayout referenceとして使う。

layout guideはキャラクター、画風、色、衣装、表情の正本ではない。

ガイド内の枠、K1〜K4ラベル、線、灰色領域を最終画像へ描き写さない。

layout guideを画像生成側が利用できない場合でも、ユーザーへ追加添付を要求しない。`03-keypose-board-spec.md`の2×2幾何条件だけで生成を続行する。

## chroma-key background

画像生成段階では真の透明背景を必須にしない。1枚のボード全体を、均一な単色クロマキー背景で生成する。

既定候補は高彩度のmagentaとする。キャラクター本体にmagentaが明確に使われている場合は、cyan、blue、greenなど、キャラクター本体と十分に離れた高彩度色へ変更する。

元の基準画像に背景色が存在していても、その背景色をキャラクター固有色とはみなさない。クロマ色はキャラクター本体の配色との衝突を避けて選ぶ。

ボード全域で同じ背景色を使い、グラデーション、床、接地影、ドロップシャドウ、背景模様、光だまりを加えない。

生成後に`audit/scripts/remove_chroma_key.py`で背景をalphaへ変換する。クロマ色は画像外周から自動検出できるため、生成時の色を後処理コードへ手入力することを必須にしない。

## concise generation prompt

画像生成モデルへ渡す内部指示は、長い規則全文の貼り直しではなく、今回の状態に必要な情報だけへ圧縮する。

含める要素:

1. 直接添付された基準画像がcanonical identity referenceであること
2. layout guideがある場合は配置だけに使うこと
3. K1〜K4の今回の動作位相
4. 顔、髪、体格、胸部・胴体シルエット、衣装、模様、装飾、表情を維持すること
5. 2×2 portrait、全身、共通縮尺、中央と外周のsafe space
6. 均一な単色クロマ背景
7. 影、文字、ラベル、UI、未指定エフェクトを描かないこと

`01`〜`04`の文書を画像生成用プロンプトへ逐語的に貼り付けない。

## repair

不合格画像を修正する場合は、正本画像と失敗したmotion boardを使い、確認できた失敗だけを短いrepair noteとして指定する。

修正対象以外のキャラクターデザイン、動作位相、レイアウトを再設計しない。

repairも1 visual job = 1 motion boardとし、同一応答内で複数の再試行や別案を生成しない。

## post-processing boundary

画像生成モデルの責務:

- 1枚の2×2モーションボード
- キャラクター同一性
- K1〜K4の動作差
- portrait構図
- 全身とsafe space
- 均一なクロマ背景

`audit/`の責務:

- クロマ背景のalpha化
- 2×2の機械分割
- alpha bbox
- セル端接触検査
- 共通倍率への正規化
- 最終motion stripの組み立て
- メタデータとデバッグ素材の出力

画像生成モデルへ最終8フレーム横一列や巨大アトラスの厳密な組み立てを任せない。

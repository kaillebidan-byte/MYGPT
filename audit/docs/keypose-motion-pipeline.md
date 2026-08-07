# Key-pose motion pipeline

画像生成モデルへ最終スプライトを一度に作らせず、生成と後処理を分離する。

## 1. layout guideを用意する

配置専用ガイドは決定論的に生成できる。

```bash
python audit/scripts/build_motion_layout_guide.py \
  --output project/sources/layout-guides/four-pose-portrait.png
```

この画像は4スロット、中央safe gap、外周safe marginだけを示す。キャラクターの正本画像ではない。

## 2. raw 2×2 motion boardを生成する

ChatGPT Projectへ元の基準キャラクター画像を直接添付し、1つの動作を指定する。

1 motion = 1 visual jobとして、画像生成は1回だけ行う。

生成物はportraitの2×2ボード1枚とし、背景は均一な単色クロマキーにする。

| 位置 | 役割 |
|---|---|
| 左上 | K1 |
| 右上 | K2 |
| 左下 | K3 |
| 右下 | K4 |

K1〜K4の意味は動作ごとに`02-motion-design.md`で決める。rest / anticipation / peak / returnへ固定しない。

各象限に1ポーズだけを置き、全身と付随物を切らず、中央境界と外周から十分に離す。

## 3. chromaをalphaへ変換する

```bash
python audit/scripts/remove_chroma_key.py raw-keyposes.png \
  --output keyposes.png
```

既定では画像外周の最頻色をクロマ色として自動検出する。

必要なら明示できる。

```bash
python audit/scripts/remove_chroma_key.py raw-keyposes.png \
  --key FF00FF \
  --output keyposes.png
```

出力は透明RGBA PNG。検出したクロマ色と除去画素数は`*.chroma.json`へ保存する。

## 4. 4フレームへ組み立てる

```bash
python audit/scripts/build_motion_strip.py keyposes.png \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-4f.png \
  --debug-dir motion-debug
```

処理内容:

- 透明化済み画像を均等な2×2へ分割
- alphaから各ポーズの外接矩形を取得
- 空ポーズとセル端接触を拒否
- 全ポーズに共通倍率を適用
- 水平方向をセル中央へ配置
- 下端基準を揃える
- 透明PNGの横一列ストリップを出力
- K1〜K4順と切り出し情報をJSONへ保存

既定出力は1セル256×320 px、全体1024×320 px。

## 5. 8フレームへ組み立てる

主要K1〜K4が合格した後、必要な中割りI1〜I4を別のvisual jobとして2×2ボード1枚で生成する。

主要ボードと中割りボードを同一ChatGPT応答内で自動連続生成しない。

中割りraw boardも同じ手順でクロマを除去する。

```bash
python audit/scripts/remove_chroma_key.py raw-inbetweens.png \
  --output inbetweens.png

python audit/scripts/build_motion_strip.py keyposes.png \
  --inbetween-board inbetweens.png \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-8f.png \
  --debug-dir motion-debug
```

最終順序はK1, I1, K2, I2, K3, I3, K4, I4。

## 6. 互換入力

`build_motion_strip.py`は過去実験との互換用に4枚個別画像入力も受け取れる。

新しいChatGPT Project本番経路では使わず、raw 2×2 board -> chroma除去 -> transparent 2×2 boardを標準とする。

## 7. 禁止する水増し

次の方法を既定処理にしない。

- 同じ画像の複製
- 単純な左右反転
- 透明度だけを変えたクロスフェード
- 4ポーズを往復順に並べただけの8フレーム化

## 8. 失敗条件

後処理では次を失敗として扱う。

- raw boardの外周が均一なクロマ背景として検出できない
- 透明化後の入力画像が2×2へ均等分割できない
- 空の象限がある
- ポーズが象限端へ近すぎる
- 出力セルへ収まらない

画像内容のidentity drift、表情、motion semanticsは視覚QAで別途判定する。

失敗時は同じChatGPT応答内で自動再生成せず、失敗原因を確認してから該当するmotion boardだけをrepairする。

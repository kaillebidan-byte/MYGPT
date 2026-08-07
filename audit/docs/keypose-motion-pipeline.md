# Key-pose motion pipeline

画像生成モデルへ最終スプライトを一度に作らせず、生成と後処理を分離する。

## 1. layout guideを用意する

配置専用ガイドは決定論的に生成できる。

```bash
python audit/scripts/build_motion_layout_guide.py \
  --output project/sources/layout-guides/four-pose-portrait.png
```

この画像は4スロット、中央safe gap、外周safe marginだけを示す。キャラクターの正本画像ではない。

ChatGPT ProjectではProject Sourceとして使い、基準キャラクター画像と一緒に生成チャットへ直接添付しない。

## 2. 自然言語要求から主要4ポーズを生成する

ChatGPT Projectへ元の基準キャラクター画像を直接添付し、1つの動作を自然言語で指定する。

Project側は`02-motion-design.md`に従ってmotion contractを作り、loop / one-shot、開始状態、終了状態、主要な身体変化を決めてからK1〜K4へ分解する。

1 visual job = 1 motion boardとして、主要ボードの画像生成は1回だけ行う。

生成物はportraitの2×2ボード1枚とし、背景は均一な単色クロマキーにする。

| 位置 | 役割 |
|---|---|
| 左上 | K1 |
| 右上 | K2 |
| 左下 | K3 |
| 右下 | K4 |

K1〜K4をrest / anticipation / peak / returnへ固定しない。one-shotではK4を無理にK1へ戻さず、loopだけK4→K1の接続を成立させる。

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

## 5. 中割りを生成する

主要K1〜K4が合格し、中割りまたは8フレーム化が必要になったら、後続ターンの別visual jobでI1〜I4を2×2ボード1枚として生成する。

元の基準画像をidentity referenceとして維持し、合格済み主要ボードは時間上のendpointを示すmotion referenceとして使う。

主要ボードと中割りボードを同一ChatGPT応答内で自動連続生成しない。

I1〜I4は時間順だが、固定の4区間へ1枚ずつ対応するとは限らない。

### loop

通常は次の4区間へ1枚ずつ置ける。

```text
K1 -> K2
K2 -> K3
K3 -> K4
K4 -> K1
```

### one-shot

基本区間は3つだけ。

```text
K1 -> K2
K2 -> K3
K3 -> K4
```

K4→K1を捏造しない。8フレーム用の4枚目は、変化量、接触・離地・着地・反転、速度変化、settleなどから追加の時間解像度が必要な区間へ置く。

たとえばK2→K3を細かくする場合、I2とI3を同じ区間の早い時点・遅い時点として生成できる。

中割りraw boardも同じ手順でクロマを除去する。

```bash
python audit/scripts/remove_chroma_key.py raw-inbetweens.png \
  --output inbetweens.png
```

## 6. frame planで8フレームへ組み立てる

中割りを使う本番8fでは、最終順序を`--frame-plan`で明示する。

loop例:

```bash
python audit/scripts/build_motion_strip.py keyposes.png \
  --inbetween-board inbetweens.png \
  --frame-plan K1,I1,K2,I2,K3,I3,K4,I4 \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-8f.png \
  --debug-dir motion-debug
```

one-shotでK2→K3を細かくする例:

```bash
python audit/scripts/build_motion_strip.py keyposes.png \
  --inbetween-board inbetweens.png \
  --frame-plan K1,I1,K2,I2,I3,K3,I4,K4 \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-8f.png \
  --debug-dir motion-debug
```

`--frame-plan`ではK1〜K4とI1〜I4を各1回使い、K同士とI同士の時間順を保つ。

オプションを省略した場合は過去素材との互換用として旧interleave `K1,I1,K2,I2,K3,I3,K4,I4`を使う。新しい本番8fでは明示的なframe planを使う。

## 7. 互換入力

`build_motion_strip.py`は過去実験との互換用に4枚個別画像入力も受け取れる。

新しいChatGPT Project本番経路では使わず、raw 2×2 board -> chroma除去 -> transparent 2×2 boardを標準とする。

## 8. 禁止する水増し

次の方法を既定処理にしない。

- 同じ画像の複製
- 単純な左右反転
- 透明度だけを変えたクロスフェード
- one-shotを8フレームにするためだけの偽のK4→K1中割り
- 4ポーズを往復順に並べただけの8フレーム化

## 9. 失敗条件

後処理では次を失敗として扱う。

- raw boardの外周が均一なクロマ背景として検出できない
- 透明化後の入力画像が2×2へ均等分割できない
- 空の象限がある
- ポーズが象限端へ近すぎる
- 出力セルへ収まらない
- frame planに未知ラベル、重複、K順またはI順の逆転がある

画像内容のidentity drift、表情、motion semanticsは視覚QAで別途判定する。

失敗時は同じChatGPT応答内で自動再生成せず、失敗原因を確認してから該当するmotion boardだけをrepairする。

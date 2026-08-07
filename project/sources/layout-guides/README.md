# Layout guides

このディレクトリは、ChatGPT Projectの画像生成へ配置だけを伝える非キャラクター画像を置く。

基準キャラクターの正本画像をここへ置かない。キャラクター正本は、画像生成する現在のチャットへ直接添付する。

## four-pose-portrait.png

モーション用2×2ボードの4スロット、中央safe gap、外周safe marginを示すlayout-only画像。

生成:

```bash
python audit/scripts/build_motion_layout_guide.py \
  --output project/sources/layout-guides/four-pose-portrait.png
```

ChatGPT Projectで利用する場合は、このPNGをProject Sourceへ一度追加する。

用途は配置だけ。ガイド内のK1〜K4ラベル、枠線、灰色領域、色を最終画像へ描き写さない。キャラクターの顔、衣装、体格、画風、配色の判断には使わない。

Project側がlayout guideを視覚入力として利用できない場合でも、生成ごとにユーザーへ追加添付を要求しない。テキストの`03-keypose-board-spec.md`をfallbackとして使う。

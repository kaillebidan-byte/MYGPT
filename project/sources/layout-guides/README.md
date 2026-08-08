# Layout guides

このディレクトリは過去の2×2直接生成実験で使ったlayout guideの記録用。

## 現行方針

`four-pose-portrait.png`をChatGPT Project Sourceへ追加しない。

実機テストで、視覚layout guideが枠、K1〜K4ラベル、中央divider等の模倣を誘発した。また現行方式では画像生成モデルへ2×2配置を担当させず、4枚の単独frameをPythonで合成するため不要である。

すでにProject Sourceへ`four-pose-portrait.png`を追加している場合は削除する。

GitHubの`audit/references/layout-guides/four-pose-portrait.svg`と`audit/scripts/build_motion_layout_guide.py`は、過去仕様の確認・デバッグ用として保持する。画像生成のvisual referenceには使わない。

最終board geometryは`audit/scripts/compose_keypose_board_from_frames.py`が決定論的に管理する。

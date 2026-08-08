# Keypose Frame / Board Specification

この資料は、画像生成する単独キーポーズと、4枚から後処理で作る2×2モーションボードの条件を定義する。

## 生成単位

画像生成モデルへ2×2ボードを直接描かせない。

主要4状態F1〜F4は、それぞれ別のvisual jobで**人物1体だけの単独画像**として生成する。画像生成promptへboard、panel、sprite sheet、K1〜K4、四象限、divider、layout guideを出力形式として要求しない。

各frame:
- 人物1体だけ
- 全身
- portrait
- 正面基準の共通カメラ
- canonicalと同じ見かけの体格・画風
- 均一な単色クロマ背景
- 床、接地影、文字、番号、ラベル、枠、grid、UI、モーションライン、未指定effectなし

フレームごとの余白・縮尺が多少異なっても、最終配置のために画像モデルへ再生成させず、後処理で正規化する。

## canonical identity

4frameすべてで、現在チャットへ直接添付された同じcanonical imageをidentity anchorとする。前frameを次frameのidentity正本へ昇格させない。

## deterministic 2x2 compose

4枚生成後、`audit/scripts/compose_keypose_board_from_frames.py`で1024×1536の2×2へ機械合成する。

既定:
- board: 1024×1536
- order: F1, F2, F3, F4
- placement: 左上、右上、左下、右下
- outer margin: 48px
- center gap X: 96px
- center gap Y: 112px
- 各frameはforeground bboxから共通倍率で縮小
- 各slotの足元baselineを揃える
- クロマ色は1色へ正規化

レイアウト、共通縮尺、中央safe gap、外周余白はPythonの責務とする。画像生成モデルへ枠やlayout guideを見せて再現させない。

クロマ抽出では十分に非key色の影やeffectをforegroundとして残し、後段監査を回避するために欠陥を消さない。

## layout guide

`four-pose-portrait.png`をChatGPT Project Sourceとして使わない。過去に枠、番号、Kラベル、divider等の模倣を誘発したため、画像生成側の参照から外す。

GitHub内のlayout SVGやguide生成スクリプトは、デバッグ・仕様確認用として保持してよいが、生成モデルへの視覚入力にしない。

## final board audit

合成boardへ`machine_audit_board.py`を実行し、次を機械確認する。

- 2:3 aspect
- outer edge contact
- center vertical/horizontal contamination
- divider-like white bands
- border key uniformity
- background deviation / shadow-like background
- quadrant bbox

identity / motion semantics / continuity / endpointは対話モデルがcanonicalと4状態を見て判断する。

## inbetween

中割りも1枚ずつ個別生成し、最終順序はmotion contractのframe planで決める。

`build_motion_strip.py`は`--keypose-images`と`--inbetween-images`で4枚個別入力を扱える。透明化後の個別画像から共通倍率のstripを組み立てる。

## 合格条件

生成frame:
- 人物1体だけ
- canonical identityを維持
- 指定された時間状態として読める
- 全身が切れていない
- 均一クロマで大きな影や床がない
- 文字、番号、枠、sheet要素がない

最終board:
- 1024×1536
- 4象限に1frameずつ
- F1→F2→F3→F4の時間順
- 4frameが同じキャラクターとして読める
- 中央safe gapと外周余白が成立
- 背景が単一クロマ
- divider、ラベル、番号等がない

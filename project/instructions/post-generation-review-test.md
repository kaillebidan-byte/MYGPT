# 一時検証モード: 生成後レビュー + 1回修正

このファイルは、主要モーションボードの生成後に同一ターン内で実画像を確認し、不合格なら確認済みの問題だけを1回修正して再確認できるか検証するための一時Project Instructionsである。

この検証中は、画像生成物だけを返して応答を終了する規則よりこのファイルを優先する。

## 初回生成

1. 現在のチャットへ直接添付された基準画像をcanonical identity referenceとする。
2. `02-motion-design.md`から今回のmotion contractを作る。
3. portrait 2x2の主要モーションボードを1枚だけ生成する。
4. A/B候補、別案、追加boardを同時生成しない。

初回生成が終わっても応答を終了せず、生成された実画像を確認する。

## 7項目レビュー

必ず実画像を見て次の7項目すべてをPASS/FAIL判定する。生成前の計画が正しかったことを生成結果のPASS根拠にしない。

### identity
canonical identity referenceと4ポーズを比較する。顔、目、髪、頭部パーツ、頭身、体格、胴体、袖、襟、裾、靴、模様、縁取り、腰飾り、房、紐、留め具、左右非対称要素、4ポーズ間の同一性を確認する。

### motion_semantics
左上→右上→左下→右下を時間順に読み、ユーザー要求の動作として成立するか確認する。各ポーズの主動部位、左右どちらの手足が動作主体か、前方の足、接地状態、重心、開始から終了までの変化を確認する。要求と矛盾する変化、主要状態の重複、終了状態への未到達があればFAIL。

### continuity
時間をまたいで役割を持つ手足、支持側、接地側、保持側、接触主体を追跡する。動作上同じ主体であるべきものが途中で左右交換されたらFAIL。左右を確実に追えない場合もPASSにしない。

### endpoint
最後のポーズを開始ポーズとユーザー要求の終了状態の両方と比較する。one-shotでは、要求された動作結果が最後に残っていること、終了まで維持すべきcontinuityが残っていること、要求されていないのに開始姿勢へ戻っていないことを確認する。

continuityまたはendpointの失敗によって要求動作全体が成立しない場合はmotion_semanticsもFAILにする。

### layout
portrait 2x2、全身、共通縮尺、中央safe gap、外周safe margin、cropなし、セル越境なしを確認する。

### chroma
キャラクター以外が均一な単色クロマ背景か確認する。足元、袖の下、キャラクター外周、中央safe gap、外周を確認し、接地影、ドロップシャドウ、グラデーション、光だまり、床、背景模様、局所的な色差があればFAIL。

### unintended_output
文字、K1-K4ラベル、説明文、UI、枠線、矢印、モーションライン、記号、未指定エフェクトがあればFAIL。

## 初回レビュー後の分岐

7項目すべてを判定し、重要なFAILが1つでもあればoverallはFAILとする。

実画像をこのターンで確認できなければ、判定や修正を捏造せず次だけ返して終了する。

REVIEW_UNAVAILABLE
- 画像生成は完了したが、このターンでは生成された実画像を視覚的に再確認できなかった。

### overall: PASS

追加画像を生成せず、次の形式で終了する。

POST_GENERATION_REVIEW
identity: PASS / FAIL
motion_semantics: PASS / FAIL
continuity: PASS / FAIL
endpoint: PASS / FAIL
layout: PASS / FAIL
chroma: PASS / FAIL
unintended_output: PASS / FAIL
overall: PASS
issues:
- none

### overall: FAIL

同一ターン内で修正版を1回だけ生成する。

修正時に使うもの:
- canonical identity reference
- 初回の失敗boardを修正対象
- 初回と同じmotion contract
- 初回レビューでFAILになった項目と、実画像で確認した失敗内容

修正指示には確認済みのFAILだけを短く入れる。PASSだった項目を再設計しない。一般的な禁止文、未確認の問題、新しい演出、別案を追加しない。

たとえばidentityとchromaだけFAILなら、motion_semantics、continuity、endpoint、layoutを維持し、canonical identityへの復元とクロマ背景の問題だけを直す。

修正版も1 visual job = 1 image generation = 1 motion boardとし、1枚だけ生成する。A/B候補や2回目の修正は行わない。

## 修正後レビュー

修正版の生成が終わっても応答を終了せず、その修正版の実画像を同じ7項目で再確認する。

初回boardではなく修正版そのものを判定する。

結果は次の形式で返す。

POST_REPAIR_REVIEW
identity: PASS / FAIL
motion_semantics: PASS / FAIL
continuity: PASS / FAIL
endpoint: PASS / FAIL
layout: PASS / FAIL
chroma: PASS / FAIL
unintended_output: PASS / FAIL
overall: PASS / FAIL
repaired_from:
- 初回にFAILだった項目
issues:
- 修正後も残った実画像上の問題

修正後がFAILでも追加生成しない。

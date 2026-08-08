# 一時検証モード: 生成後レビュー + 条件分岐型1回修正

このファイルは、主要モーションボードの生成後に同一ターン内で実画像を確認し、不合格なら確認済みの問題だけを1回修正して再確認できるか検証するための一時Project Instructionsである。

この検証中は、画像生成物だけを返して応答を終了する規則よりこのファイルを優先する。

## 1. 初回motion contract

現在のチャットへ直接添付された基準画像をcanonical identity referenceとする。

`02-motion-design.md`から今回のmotion contractを作る。

時間をまたいで同じ手足が役割を持つ動作では、画像生成前にその主体を1つだけ解剖学的な左右で固定する。

例:
- `active_limb: character_right_leg`
- `support_limb: character_left_leg`

ユーザーが左右を指定していない場合はどちらか一方を選び、K1〜K4途中で変更しない。

正面主体の動作では、必要なら開始時点での画面上の位置も補助情報として保持する。

例:
- `character_right_leg = viewer-left at K1`

この対応を途中で鏡像反転しない。

one-shotでは`end`を明示し、動作結果が最後まで残る必要がある場合はK4をK1へ戻さない。

## 2. 初回生成

最初の画像生成の直前に、本文として次の1行だけ出す。

`INITIAL_BOARD`

その後、portrait 2x2の主要モーションボードを1枚だけ生成する。

A/B候補、別案、追加boardを同時生成しない。

1 visual job = 1 image generation = 1 motion boardとする。

初回生成が終わっても応答を終了せず、生成された実画像を確認する。

## 3. 7項目レビュー

必ず実画像を見て次の7項目すべてをPASS/FAIL判定する。生成前の計画が正しかったことを生成結果のPASS根拠にしない。

### identity
canonical identity referenceと4ポーズを比較する。顔、目、髪、頭部パーツ、頭身、体格、胴体、袖、襟、裾、靴、模様、縁取り、腰飾り、房、紐、留め具、左右非対称要素、4ポーズ間の同一性を確認する。

### motion_semantics
左上→右上→左下→右下を時間順に読む。各ポーズの主動部位、active_limb、support_limb、前方の足、接地状態、重心、開始から終了までの変化を確認する。要求と矛盾する変化、主要状態の重複、終了状態への未到達があればFAIL。

### continuity
motion contractで固定したactive_limb、support_limb、保持側、接地側、接触主体を各ポーズで追跡する。役割が途中で左右交換されたらFAIL。左右を確実に追えない場合もPASSにしない。

### endpoint
最後のポーズを開始ポーズと`end`の両方と比較する。one-shotでは、要求された動作結果が最後に残っていること、終了まで維持すべきcontinuityが残っていること、要求されていないのに開始姿勢へ戻っていないことを確認する。

continuityまたはendpointの失敗によって要求動作全体が成立しない場合はmotion_semanticsもFAILにする。

### layout
portrait 2x2、全身、共通縮尺、中央safe gap、外周safe margin、cropなし、セル越境なしを確認する。

### chroma
キャラクター以外が均一な単色クロマ背景か確認する。足元、袖の下、キャラクター外周、中央safe gap、外周を確認し、接地影、ドロップシャドウ、グラデーション、光だまり、床、背景模様、局所的な色差があればFAIL。

### unintended_output
文字、K1-K4ラベル、説明文、UI、枠線、矢印、モーションライン、記号、未指定エフェクトがあればFAIL。

## 4. 初回レビュー出力

初回レビューを省略して修正へ進んではいけない。

必ず次の形式を本文として出す。

```text
INITIAL_REVIEW
identity: PASS / FAIL
motion_semantics: PASS / FAIL
continuity: PASS / FAIL
endpoint: PASS / FAIL
layout: PASS / FAIL
chroma: PASS / FAIL
unintended_output: PASS / FAIL
overall: PASS / FAIL
issues:
- 実画像で確認できた問題
```

実画像をこのターンで確認できなければ、判定や修正を捏造せず次だけ返して終了する。

```text
REVIEW_UNAVAILABLE
- 画像生成は完了したが、このターンでは生成された実画像を視覚的に再確認できなかった。
```

## 5. 初回PASS時

7項目すべてがPASSなら追加画像を生成せず終了する。

## 6. 初回FAIL時の修正方式

自動修正は1回だけ行う。

初回FAILを次の2種類へ分ける。

### A. motion-critical failure

次のどれかがFAILならmotion-criticalとする。

- motion_semantics
- continuity
- endpoint

motion-criticalの場合、初回boardを部分編集して姿勢だけ継ぎ足そうとしない。

canonical identity referenceをidentityの正本として、motion contractを再確認し、2x2 board全体を1回だけ再生成する。

修正時には次を短く明示する。

- 初回で固定したactive_limbとsupport_limb
- K2、K3、K4でactive_limbが同一であること
- K4の具体的なend状態
- continuityまたはendpointで実画像上確認した失敗
- identityがFAILならcanonical identityへ戻すこと
- layout、chroma、unintended_outputのFAILがあればその確認済み失敗

左右を「その足」「同じ足」だけで表現せず、`character_right_leg`または`character_left_leg`のように解剖学的な側を明示する。

一歩前へ出て止まる動作なら、K4でactive_limbの足先がsupport_limbより視覚的に前方へ残り、両足をK1の横並びへ戻さないことを明示する。

### B. non-motion failure only

motion_semantics、continuity、endpointがすべてPASSで、それ以外だけFAILなら、初回boardを修正対象とする画像編集として1回だけ修正する。

この場合:
- 初回boardの4ポーズと動作位相を維持する
- canonical identity referenceは同一性復元の基準として使う
- FAILだったidentity、layout、chroma、unintended_outputだけを直す
- PASSだったmotion、continuity、endpointを再設計しない

## 7. 修正版生成

修正版の画像生成直前に、本文として次の1行だけ出す。

`REPAIR_BOARD`

その後、修正版を1枚だけ生成する。

A/B候補、別案、2回目の修正は行わない。

## 8. 修正後レビュー

修正版の生成が終わっても応答を終了せず、その修正版の実画像を同じ7項目で再確認する。

初回boardではなく修正版そのものを判定する。

必ず次の形式で返す。

```text
POST_REPAIR_REVIEW
identity: PASS / FAIL
motion_semantics: PASS / FAIL
continuity: PASS / FAIL
endpoint: PASS / FAIL
layout: PASS / FAIL
chroma: PASS / FAIL
unintended_output: PASS / FAIL
overall: PASS / FAIL
repair_mode: motion_regeneration / image_edit
repaired_from:
- 初回にFAILだった項目
issues:
- 修正後も残った実画像上の問題
```

修正後がFAILでも追加生成しない。

## 9. 重要

画像生成ツールを呼び出したという事実だけをもってレビュー済みと扱わない。

生成前のmotion contractや修正指示が正しかったことを、生成結果のPASS根拠にしない。

レビューは必ず生成された実画像そのものに基づいて行う。

初回画像と修正版を区別できるよう、`INITIAL_BOARD`、`INITIAL_REVIEW`、`REPAIR_BOARD`、`POST_REPAIR_REVIEW`の順序を崩さない。

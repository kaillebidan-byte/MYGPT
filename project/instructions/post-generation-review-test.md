# 一時検証モード: 生成後レビュー + GitHub監査 + 条件分岐型1回修正

このファイルは、主要モーションボードの生成後に同一ターン内で実画像を確認し、不合格ならGitHub上の監査資料を実際に取得してから、確認済みの問題だけを1回修正・再確認できるか検証するための一時Project Instructionsである。

この検証中は、画像生成物だけを返して応答を終了する規則よりこのファイルを優先する。

## 1. 初回motion contract

現在のチャットへ直接添付された基準画像をcanonical identity referenceとする。

`02-motion-design.md`から今回のmotion contractを作る。

### identity anchors

画像生成前にcanonical identity referenceから、そのキャラクターを別物に見せやすい特徴を3〜6個だけ`identity_anchors`として抽出する。

例:
- 頭部の固有パーツの形と配色
- 袖の外形と長さ
- 胴体・胸部の幅とシルエット
- 腰飾り、房、紐、留め具の個数と接続関係
- 裾の分割構造

固定キャラクター辞書を作らず、その都度canonical identity referenceから選ぶ。

### active limb

時間をまたいで同じ手足が役割を持つ動作では、画像生成前にその主体を1つだけ固定する。

人物が正面主体で、途中で身体やカメラが大きく反転しない動作では、解剖学的な右左だけに依存せず、viewer-spaceでも追跡する。

内部的に次を保持する。

- `active_limb_id`: `leg_A`などの論理ID
- `support_limb_id`: `leg_B`
- `active_limb_viewer_side_at_start`: `viewer-left`または`viewer-right`
- `support_limb_viewer_side_at_start`: その反対側

ユーザーが左右を指定していない場合はどちらか一方を選ぶ。

正面主体で身体反転を伴わない場合、`leg_A`はK2〜K4でviewer-space上も同じ側の脚として追跡できるようにする。途中で鏡像反転して別の脚へ役割を移さない。

身体回転によってviewer-space上の左右が変わる動作では、解剖学的な側と関節接続を優先し、viewer-spaceは補助情報として扱う。

### endpoint

one-shotでは`end`を具体化する。

動作結果が最後まで残る必要がある場合、K4をK1へ戻さない。

「一歩前へ踏み出して停止」のような動作では、K4でactive limbの足先がsupport limbより視覚的に前方へ残り、重心がsettleしていることをendへ含める。

### slot state plan

主要4ポーズを画像生成へ渡す前に、内部的に4スロットの状態を1行ずつ決める。

例:
- top-left: start / 両足通常接地
- top-right: leg_Aを前方へ運ぶ
- bottom-left: 同じleg_Aが着地または着地直前
- bottom-right: 同じleg_Aを前に残してsettle

画像生成モデルへはK1/K2/K3/K4という表示用ラベルではなく、top-left / top-right / bottom-left / bottom-rightの配置と各状態を渡す。

## 2. 初回生成

最初の画像生成の直前に、本文として次の1行だけ出す。

`INITIAL_BOARD`

その後、portrait 2x2の主要モーションボードを1枚だけ生成する。

生成用の短い指示には最低限、次を含める。

- canonical identity reference
- identity_anchors
- 4スロットのstate plan
- active_limb_idと必要なviewer-space対応
- end
- portrait 2:3相当
- 全身、共通縮尺、中央safe gap、外周safe margin
- キャラクター以外は均一な単色クロマ背景
- 接地影、文字、ラベル、UI、モーションライン、未指定エフェクトなし

A/B候補、別案、追加boardを同時生成しない。

1 visual job = 1 image generation = 1 motion boardとする。

初回生成が終わっても応答を終了せず、生成された実画像を確認する。

## 3. 7項目レビュー

必ず実画像を見て次の7項目すべてをPASS/FAIL判定する。生成前の計画が正しかったことを生成結果のPASS根拠にしない。

### identity
canonical identity referenceと4ポーズを比較する。identity_anchorsを優先しつつ、顔、目、髪、頭部パーツ、頭身、体格、胴体、袖、襟、裾、靴、模様、縁取り、腰飾り、房、紐、留め具、左右非対称要素、4ポーズ間の同一性を確認する。

### motion_semantics
左上→右上→左下→右下を時間順に読む。各スロットがslot state planと一致するか確認する。要求と矛盾する変化、主要状態の重複、終了状態への未到達があればFAIL。

### continuity
active_limb_idとsupport_limb_idを各ポーズで追跡する。

正面主体で身体反転を伴わない場合は、viewer-spaceで同じ側の脚がK2→K3→K4までactive limbとして継続しているかを明示的に比較する。

K2でviewer-left側の脚をleg_Aとして前へ出したなら、K3とK4でもviewer-left側の同じ脚がleg_AでなければFAILとする。viewer-rightを選んだ場合も同様。

ポーズごとに「前へ出ている足」だけを見て同一脚と推測しない。左右を確実に追えない場合もPASSにしない。

### endpoint
最後のポーズを開始ポーズと`end`の両方と比較する。

one-shotでは、要求された動作結果が最後に残っていること、終了まで維持すべきcontinuityが残っていること、要求されていないのに開始姿勢へ戻っていないことを確認する。

continuityまたはendpointの失敗によって要求動作全体が成立しない場合はmotion_semanticsもFAILにする。

### layout
portrait 2:3相当の2x2、全身、共通縮尺、中央safe gap、外周safe margin、cropなし、セル越境なしを確認する。正方形boardはFAIL。

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

7項目すべてがPASSならGitHub監査資料の取得や追加画像生成を行わず終了する。

## 6. 初回FAIL後のGitHub監査資料取得

初回overallがFAILの場合、repair条件を作る前に次のGitHub URLを実際に開いて、現在の内容を取得する。

`https://github.com/kaillebidan-byte/MYGPT/blob/main/project/sources/production/05-post-generation-audit.md`

生成前にこのURLを読む必要はない。初回の実画像レビューがFAILになった後だけ取得する。

会話履歴やProject内の古いコピーだけを根拠に「読んだ」と扱わない。このターンでURL取得を実行し、取得した現在内容を初回レビューのFAILと照合する。

取得できた場合、repair生成より前に必ず本文として次を出す。

```text
AUDIT_SOURCE_CHECK
source: https://github.com/kaillebidan-byte/MYGPT/blob/main/project/sources/production/05-post-generation-audit.md
status: LOADED
applied_rules:
- 初回FAILに直接関係する監査・repair規則だけを短く列挙
```

取得できなかった場合はrepairを推測で続行せず、次を返して終了する。

```text
AUDIT_SOURCE_CHECK
source: https://github.com/kaillebidan-byte/MYGPT/blob/main/project/sources/production/05-post-generation-audit.md
status: UNAVAILABLE

AUDIT_SOURCE_UNAVAILABLE
- 初回画像はFAILだが、このターンではGitHub監査資料を取得できなかったため自動repairを行わない。
```

## 7. 初回FAIL時の修正方式

GitHub監査資料をLOADEDできた場合だけ、自動修正を1回行う。

repair条件は、初回の実画像レビューで確認したFAILと、取得した`05-post-generation-audit.md`の該当規則を組み合わせて作る。

初回FAILを次の2種類へ分ける。

### A. motion-critical failure

次のどれかがFAILならmotion-criticalとする。

- motion_semantics
- continuity
- endpoint

motion-criticalの場合、初回boardを部分編集して姿勢だけ継ぎ足そうとしない。

canonical identity referenceをidentityの正本としてboard全体を1回だけ再生成する。

修正前にslot state planを再確認し、active_limb_idを変更しない。

修正生成へ渡す内容は短く状態固有にする。

- identity_anchors
- active_limb_idとviewer-spaceでの開始側
- top-left / top-right / bottom-left / bottom-rightのstate plan
- bottom-rightの具体的なend
- continuityまたはendpointで実画像上確認した失敗
- identity、layout、chroma、unintended_outputでFAILした確認済み問題
- GitHub監査資料から今回のFAILに直接適用したrepair規則

正面主体で反転しない動作では、修正指示に「同じ足」という曖昧な表現だけを使わない。

例:
`leg_A = viewer-left leg at start; keep that same viewer-left leg as the stepping leg in top-right, bottom-left, and bottom-right.`

一歩前へ出て止まる動作なら、bottom-rightでleg_Aの足先がleg_Bより明確に前方へ残り、両足をstartの横並びへ戻さない。

repair生成でもportrait 2:3相当を再指定する。

### B. non-motion failure only

motion_semantics、continuity、endpointがすべてPASSで、それ以外だけFAILなら、初回boardを修正対象とする画像編集として1回だけ修正する。

この場合:
- 初回boardの4ポーズと動作位相を維持する
- canonical identity referenceは同一性復元の基準として使う
- FAILだったidentity、layout、chroma、unintended_outputだけを直す
- PASSだったmotion、continuity、endpointを再設計しない
- GitHub監査資料の該当するnon-motion repair規則だけを使う

## 8. 修正版生成

修正版の画像生成直前に、本文として次の1行だけ出す。

`REPAIR_BOARD`

その後、修正版を1枚だけ生成する。

A/B候補、別案、2回目の修正は行わない。

## 9. 修正後レビュー

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

## 10. 重要

画像生成ツールを呼び出したという事実だけをもってレビュー済みと扱わない。

生成前のmotion contractや修正指示が正しかったことを、生成結果のPASS根拠にしない。

GitHub監査資料を取得したという事実だけで画像を再判定しない。画像判定は実画像、repair規則は取得した監査資料を根拠にする。

初回画像と修正版を区別できるよう、`INITIAL_BOARD`、`INITIAL_REVIEW`、`AUDIT_SOURCE_CHECK`、`REPAIR_BOARD`、`POST_REPAIR_REVIEW`の順序を崩さない。
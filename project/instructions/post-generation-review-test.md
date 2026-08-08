# 一時検証モード: post-generation review / single-board edit repair / cell-select compose

このファイルは実験用Project Instructions。通常の`04-imagegen-workflow.md`より優先する。
初回は2×2主要boardを1枚生成する。FAIL後は4つの独立repair画像を生成しない。
raw INITIAL_BOARDそのものを1回だけ画像編集し、そのEDITED_BOARDから必要セルだけを採用してPythonで再合成する。

処理:
`INITIAL生成 → 視覚監査 → machine audit → repair plan → INITIAL_BOARDを1回edit → 初回/editedをセル選択合成 → 再監査 → 比較 → 採用`

## 0. 終了条件
途中ブロックは最終回答ではない。利用可能なtoolを呼ばずに不可能と推測して終了しない。
終了可能なのは次だけ。
1. `REVIEW_UNAVAILABLE`
2. 初回machine auditが`IMAGE_UNAVAILABLE / EXECUTION_UNAVAILABLE / ERROR`
3. 初回7項目全PASS
4. `AUDIT_SOURCE_CHECK: UNAVAILABLE`
5. raw INITIAL_BOARDを画像編集targetとして実際に使えず`REPAIR_EDIT_UNAVAILABLE`
6. compose実エラー
7. 最終`REPAIR_DELTA`と`SELECTED_BOARD`出力後

## 1. motion contract
現在チャットへ直接添付された基準画像だけをcanonical identity referenceとする。
`02-motion-design.md`から内部で次を確定する。
- identity_anchors: 重要特徴3〜6個
- active_limb_id / support_limb_id（必要時）
- 必要なら解剖学的左右とviewer-space対応
- end: one-shotの終了状態
- slot_state_plan: top-left→top-right→bottom-left→bottom-right

identityは単なる雰囲気一致でPASSにしない。canonicalから毎回、頭身・頭部/胴体/袖/下衣のsilhouette、固有部品の個数・接続位置・左右関係・重なり順、顔/髪/頭部品/胸部意匠/腰部意匠/靴などを比較する。

## 2. INITIAL_BOARD
生成直前に`INITIAL_BOARD`と出す。
portrait 2:3相当の2×2 boardを1枚だけ生成する。
canonical identity、slot state plan、continuity、end、全身、共通縮尺、中央safe gap、外周safe margin、均一単色クロマ背景を含める。
文字、ラベル、枠、grid、床、影、モーションライン、未指定エフェクトは禁止。
未加工生成画像を`raw INITIAL_BOARD`として保持する。

## 3. INITIAL_VISUAL_REVIEW
raw INITIAL_BOARDを実際に見て必ず7項目を判定する。
- identity
- motion_semantics
- continuity
- endpoint
- layout
- chroma
- unintended_output

identityはcanonicalとの比較と4セル相互比較を両方行う。
continuityは同じ手足・保持側・接地側を身体への接続まで追う。
endpointはK4をendとK1の両方に照合する。
layoutは2:3、全身、中央safe gap、外周余白、crop/セル越境。
chromaは床、影、濃淡、gradient。
unintended_outputは文字、枠、grid、UI、矢印等。

```text
INITIAL_VISUAL_REVIEW
identity: PASS / FAIL
motion_semantics: PASS / FAIL
continuity: PASS / FAIL
endpoint: PASS / FAIL
layout: PASS / FAIL
chroma: PASS / FAIL
unintended_output: PASS / FAIL
issues:
- 実画像で確認した問題
```

## 4. MACHINE_AUDIT / INITIAL_REVIEW
GitHubの現在の`audit/scripts/machine_audit_board.py`をraw INITIAL_BOARD実ファイルへ実行する。
canonical、別画像、stamped copyを入力にしない。JSONを推測しない。

machine flag統合:
- wrong_aspect / outer_edge_contact / center_*_contamination → layout
- border_not_uniform / background_not_uniform / shadow_like_background → chroma
- divider_like_*_white_band → unintended_output

machine flagがfalseでも目視FAILを打ち消さない。

```text
MACHINE_AUDIT
status: RAN / IMAGE_UNAVAILABLE / EXECUTION_UNAVAILABLE / ERROR
...
INITIAL_REVIEW
identity: PASS / FAIL
motion_semantics: PASS / FAIL
continuity: PASS / FAIL
endpoint: PASS / FAIL
layout: PASS / FAIL
chroma: PASS / FAIL
unintended_output: PASS / FAIL
overall: PASS / FAIL
```

初回全PASSなら`SELECTED_BOARD stage: INITIAL reason: initial_pass`で終了。

## 5. AUDIT_SOURCE_CHECK / REPAIR_PRESERVE
初回FAIL時だけGitHubの`project/sources/production/05-post-generation-audit.md`を取得する。
LOADED後、初回PASS項目をraw INITIAL_BOARDで成立した具体的状態へ変換する。

```text
REPAIR_PRESERVE
items:
- <PASS項目>: <維持する具体的状態>
```

FAIL項目をpreserveへ混ぜない。

## 6. CELL_REPAIR_PLAN
各Kを`KEEP_RAW`または`USE_EDITED`に分類する。

```text
CELL_REPAIR_PLAN
K1:
  source: KEEP_RAW / USE_EDITED
  change:
  - <修正内容>
  lock:
  - <維持内容>
```

規則:
- 問題のないセルはKEEP_RAW。
- identity FAILは実際にdriftしたセルのみUSE_EDITED。全セルなら全セル。
- motion_semantics FAILは誤ったslot。
- continuity FAILは役割が崩れた境界の必要最小セル。
- endpoint FAILは原則K4。
- layout/chroma/unintended_outputの局所FAILは該当セル。
- PASS状態はlockへ具体化する。

## 7. REPAIR_EDIT_BOARD
repair画像生成は1回だけ。4セル別々の新規生成は禁止。

raw INITIAL_BOARDそのものを画像編集targetとして使う。
canonical identity referenceはidentity正本として同時参照する。
編集指示には4セル全体の時間関係を残したまま、CELL_REPAIR_PLANのUSE_EDITEDセルだけを直すよう指定する。
KEEP_RAWセルは変更不要と明示するが、画像編集結果上で変化しても後段composeでは採用しない。

重要:
- raw INITIAL_BOARDを実際の画像targetとして画像toolへ渡せない場合、新規生成へ黙って切り替えない。
- path名や文章だけでedit targetを見たことにしない。
- targetを利用できなければ`REPAIR_EDIT_UNAVAILABLE`で終了。
- 出力は2×2 portrait board 1枚。
- A/B、追加repair、K1〜K4別jobは禁止。

```text
REPAIR_EDIT_BOARD
```

生成された編集結果を`raw EDITED_BOARD`として保持する。

## 8. CELL_SELECT_COMPOSE
GitHubの`audit/scripts/compose_repair_from_boards.py`を使う。

```text
python audit/scripts/compose_repair_from_boards.py \
  --initial <raw INITIAL_BOARD> \
  --edited <raw EDITED_BOARD> \
  --use-edited <K labels from plan> \
  --target-key <INITIAL key_hex> \
  --output raw_repair_board.png
```

このスクリプトは各slotについて、
- KEEP_RAW → INITIAL_BOARDの同じ象限
- USE_EDITED → EDITED_BOARDの同じ象限
を採用する。

最終boardは1024×1536、各セル512×768へ決定論的に再構成する。
元boardがwrong_aspectでも誤geometryを継承しない。
近似key色は初回keyへ正規化してよいが、影や大きな濃淡を消して監査を回避しない。
画像生成モデルへ最終layoutを任せない。

## 9. POST_REPAIR_REVIEW
合成されたraw REPAIR_BOARDを同じ7項目で実画像レビューし、同じmachine auditを再実行する。
初回JSONを再利用しない。追加repairは禁止。

```text
POST_REPAIR_MACHINE_AUDIT
status: RAN / IMAGE_UNAVAILABLE / EXECUTION_UNAVAILABLE / ERROR
mechanical_flags:
- true flag

POST_REPAIR_REVIEW
identity: PASS / FAIL
motion_semantics: PASS / FAIL
continuity: PASS / FAIL
endpoint: PASS / FAIL
layout: PASS / FAIL
chroma: PASS / FAIL
unintended_output: PASS / FAIL
overall: PASS / FAIL
repair_mode: single_board_edit_cell_select
issues:
- 残った問題
```

## 10. REPAIR_DELTA / SELECTED_BOARD
INITIAL_REVIEWとPOST_REPAIR_REVIEWを項目ごとに比較する。
- fixed = FAIL→PASS
- remaining = FAIL→FAIL
- regressed = PASS→FAIL
- PASS→PASSは省略

採用規則:
1. REPAIR overall PASS → REPAIR
2. regressedが1件以上 → INITIAL
3. regressionなし、fixedあり → REPAIR
4. regressionなし、fixedなし → INITIAL

```text
REPAIR_DELTA
fixed:
- ...
remaining:
- ...
regressed:
- ...
initial_fail_count: N
repair_fail_count: N
result: IMPROVED / NO_CHANGE / WORSE
selected_board: INITIAL / REPAIR

SELECTED_BOARD
stage: INITIAL / REPAIR
reason: repair_pass / no_regression_and_fixed / regression_detected / no_change
```

selected boardがFAILでも追加生成しない。

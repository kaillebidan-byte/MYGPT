# 一時検証モード: post-generation review / one repair board / post-compare cell select

このファイルは実験用Project Instructions。通常の`04-imagegen-workflow.md`より優先する。
初回2×2を1枚生成し、FAIL時は2×2 REPAIR_SOURCE_BOARDを1枚だけ追加生成する。
その後でINITIAL/REPAIR_SOURCEを実画像比較し、各slotの採用元を決めてPython合成・再監査する。
K別生成、画像edit、A/B、2回目repairは禁止。画像生成は原則最大2回。

処理:
`INITIAL → 視覚監査 → machine audit → repair plan → REPAIR_SOURCE 1枚 → source比較 → cell選択合成 → 再監査 → delta → 採用`

## 0. 終了条件 / GitHub取得
途中ブロックは最終回答ではない。利用可能なtoolを呼ばずに不可能と推測して終了しない。
終了可能:
1. `REVIEW_UNAVAILABLE`
2. machine auditが`IMAGE_UNAVAILABLE / SOURCE_UNAVAILABLE / EXECUTION_UNAVAILABLE / ERROR`
3. 初回7項目全PASS
4. `AUDIT_SOURCE_CHECK: UNAVAILABLE`
5. REPAIR_SOURCE生成またはcomposeの実エラー
6. 最終`REPAIR_DELTA`と`SELECTED_BOARD`出力後

既知ファイルをrepository searchで探さない。repo=`kaillebidan-byte/MYGPT`, ref=`main`を正確なpathで直接fetchする。
- `audit/scripts/machine_audit_board.py`
- `project/sources/production/05-post-generation-audit.md`
- `audit/scripts/compose_repair_from_boards.py`
connectorで取れなければ同repo/mainのraw URLを直接取得する。
取得失敗=`SOURCE_UNAVAILABLE`、Python自体を起動不可=`EXECUTION_UNAVAILABLE`。混同しない。
Python sourceはローカル保存して実ファイルへ実行する。

## 1. canonical / contracts
現在チャットへ直接添付された基準画像だけをcanonical identity referenceとする。

生成前に`IDENTITY_CONTRACT`を内部作成する。雰囲気ではなく構造を固定する:
- proportions: 頭身、頭/胴体/腕/脚の比率
- silhouette: 頭部、胴体、袖、下衣、靴の外形
- topology: 固有部品の個数、接続位置、左右関係、重なり順
- anchors: 顔、目、髪、頭部品、胸部意匠、腰部意匠、房/紐/留め具、裾、靴等
ポーズに必要な自然変形以外で、部品の追加・欠落・左右反転・別形状化を許さない。

`02-motion-design.md`から`MOTION_CONTRACT`を内部作成する:
- active_limb_id / support_limb_id（必要時）
- 必要なら解剖学的左右とviewer-space対応
- end
- slot_state_plan: K1=左上→K2=右上→K3=左下→K4=右下

## 2. INITIAL_BOARD
生成直前に`INITIAL_BOARD`と出す。
portrait 2:3相当の2×2を1枚生成する。
生成指示へIDENTITY_CONTRACT、MOTION_CONTRACT、全身、共通縮尺、中央safe gap、外周safe margin、均一単色クロマを含める。
文字、ラベル、枠、grid、床、影、モーションライン、未指定effectは禁止。
未加工画像を`raw INITIAL_BOARD`として保持する。

## 3. INITIAL review / machine audit
raw INITIAL_BOARDを実際に見て7項目を独立判定する:
`identity / motion_semantics / continuity / endpoint / layout / chroma / unintended_output`

identityはcanonicalとの比較と4セル相互比較を両方行い、IDENTITY_CONTRACTを1項目ずつ確認する。
continuityは身体への接続まで追う。endpointはK4をendとK1の両方に照合する。

```text
INITIAL_VISUAL_REVIEW
identity: PASS/FAIL
motion_semantics: PASS/FAIL
continuity: PASS/FAIL
endpoint: PASS/FAIL
layout: PASS/FAIL
chroma: PASS/FAIL
unintended_output: PASS/FAIL
issues:
- 実画像で確認した問題
```

`machine_audit_board.py`をraw INITIAL_BOARDへ実行する。
統合:
- wrong_aspect / outer_edge_contact / center_*_contamination → layout
- border_not_uniform / background_not_uniform / shadow_like_background → chroma
- divider_like_*_white_band → unintended_output
machine PASSは目視FAILを打ち消さない。

```text
MACHINE_AUDIT
status: RAN / IMAGE_UNAVAILABLE / SOURCE_UNAVAILABLE / EXECUTION_UNAVAILABLE / ERROR
...
INITIAL_REVIEW
<7項目>
overall: PASS/FAIL
```

初回全PASSなら`SELECTED_BOARD stage: INITIAL reason: initial_pass`で終了。

## 4. audit source / preserve / repair target plan
初回FAIL時だけ`05-post-generation-audit.md`を直接取得する。
初回PASS項目を具体状態へ変換する。

```text
REPAIR_PRESERVE
items:
- <PASS項目>: <壊してはいけない具体状態>
```

次に各slotの修正要求を作る。ここでは採用元をまだ決めない。

```text
REPAIR_TARGET_PLAN
K1:
  needs_change: yes/no
  change:
  - <修正内容>
  lock:
  - <維持内容>
```

identity FAILは該当セルのIDENTITY_CONTRACT違反をchangeへ入れる。
motion/continuity/endpointは誤ったslotまたは境界だけを具体化する。
PASS状態はlockへ入れる。

## 5. REPAIR_SOURCE_BOARD
追加visual jobはこれ1回だけ。
`REPAIR_SOURCE_BOARD`と出し、canonicalを正本としてportrait 2:3の2×2を新規生成する。

生成指示へ:
- IDENTITY_CONTRACT
- MOTION_CONTRACT
- INITIAL_REVIEWのFAIL
- REPAIR_PRESERVE
- REPAIR_TARGET_PLANのchange/lock
- INITIAL key_hexに近い均一クロマ
- 影/床/文字/枠/grid/UI/未指定effect禁止

4ポーズを同じ1枚で生成し、identity・縮尺・時間関係を共有させる。
未加工画像を`raw REPAIR_SOURCE_BOARD`として保持する。

## 6. POST_SOURCE_COMPARE
**REPAIR_TARGET_PLANでneeds_change=yesだったことを理由にREPAIRを自動採用しない。**
INITIALとREPAIR_SOURCEの対応slotを、生成後の実画像でcanonical・contractsへ照合して比較する。

各slotについて:
- identity fidelity
- slot state / motion phase
- local layout
- local chroma
- unintended output
を比較し、`INITIAL`または`REPAIR`を暫定選択する。

その後、暫定4セル列をK1→K4で読み、
- continuity
- endpoint
を再確認する。
混在選択で手足/保持側/接地側が切り替わる場合、関連する隣接slotの採用元を見直す。
「修正版だから」ではなく、最終シーケンスとして良い方を選ぶ。

```text
CELL_SOURCE_DECISION
K1: INITIAL / REPAIR
K2: INITIAL / REPAIR
K3: INITIAL / REPAIR
K4: INITIAL / REPAIR
reason:
- 各slotとsequence上の主要理由
```

## 7. CELL_SELECT_COMPOSE
`compose_repair_from_boards.py`を直接取得して実行する。
`CELL_SOURCE_DECISION`でREPAIRを選んだlabelだけ`--use-edited`へ渡す。

```text
python compose_repair_from_boards.py \
  --initial <raw INITIAL_BOARD> \
  --edited <raw REPAIR_SOURCE_BOARD> \
  --use-edited <REPAIR labels> \
  --target-key <INITIAL key_hex> \
  --output raw_repair_board.png
```

`--edited`は互換引数名。入力はREPAIR_SOURCE_BOARD。
出力は1024×1536、各セル512×768へ決定論的に再構成する。
近似key色は初回keyへ正規化してよいが、影や大きな濃淡を消して監査を回避しない。

## 8. POST_REPAIR / delta
合成raw REPAIR_BOARDを7項目で実画像レビューし、machine auditを再実行する。初回JSONを再利用しない。追加repairは禁止。

```text
POST_REPAIR_MACHINE_AUDIT
status: RAN / IMAGE_UNAVAILABLE / SOURCE_UNAVAILABLE / EXECUTION_UNAVAILABLE / ERROR
mechanical_flags:
- true flag

POST_REPAIR_REVIEW
<7項目>
overall: PASS/FAIL
repair_mode: one_repair_board_post_compare_cell_select
issues:
- 残った問題
```

INITIAL_REVIEWとPOST_REPAIR_REVIEWを比較:
- fixed = FAIL→PASS
- remaining = FAIL→FAIL
- regressed = PASS→FAIL

採用規則:
1. REPAIR overall PASS → REPAIR
2. regressedあり → INITIAL
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

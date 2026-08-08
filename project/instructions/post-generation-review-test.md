# 一時検証モード: post-generation review / split-cell repair / re-audit

このファイルは実験用Project Instructions。通常の`04-imagegen-workflow.md`より優先する。
初回は2×2主要boardを1枚生成する。FAIL後は2×2全体を再生成せず、raw boardを4セルへ機械分割し、必要なセルだけを個別repairしてPythonで再合成する。
同一ターン内で「生成→視覚レビュー→機械監査→分割repair→再合成→再監査→初回比較→採用」まで行う。

## 0. 終了条件

途中ブロックは進捗であり最終回答ではない。利用可能なtoolを呼ばずに「できない」と推測して終了しない。
終了してよいのは次だけ。

1. `REVIEW_UNAVAILABLE`
2. 初回`MACHINE_AUDIT`が`IMAGE_UNAVAILABLE / EXECUTION_UNAVAILABLE / ERROR`
3. 初回7項目が全PASSで`SELECTED_BOARD stage:INITIAL`
4. `AUDIT_SOURCE_CHECK status:UNAVAILABLE`
5. split / composeに実エラーが発生し、その実エラーを報告したとき
6. repair後に`REPAIR_DELTA`と最終`SELECTED_BOARD`を出した後

## 1. motion contract

現在のチャットへ直接添付された基準画像だけをcanonical identity referenceとする。
`02-motion-design.md`から内部で次を確定する。

- `identity_anchors`: 重要特徴3〜6個
- `active_limb_id` / `support_limb_id`（必要時）
- 必要なら解剖学的左右とviewer-space開始側
- `end`: one-shotの終了状態
- `slot_state_plan`: top-left→top-right→bottom-left→bottom-right

K1〜K4ラベルはraw画像へ描かない。同一手足は身体への接続関係まで追う。

## 2. INITIAL_BOARD

生成直前に`INITIAL_BOARD`と出す。
portrait 2:3相当の2×2主要motion boardを1枚だけ生成する。

生成指示にはcanonical reference、identity anchors、slot state plan、active/support limb、end、全身、共通縮尺、中央safe gap、外周safe margin、均一単色クロマ背景を含める。
グリッド、枠、文字、ラベル、接地影、床、モーションライン、未指定エフェクトは禁止。
未加工画像を`raw INITIAL_BOARD`として保持し、以後の監査・splitは必ずrawを使う。

## 3. INITIAL_VISUAL_REVIEW

raw INITIAL_BOARDを見て7項目を必ず判定する。

- identity
- motion_semantics
- continuity
- endpoint
- layout
- chroma
- unintended_output

identityはcanonical referenceと4ポーズ相互の両方を比較する。顔、髪、頭部部品、体格、胴体、袖、裾、靴、模様、腰飾り、房、紐、留め具、左右非対称部品の増減・形状・接続差を見る。主要固有部品が変わっていれば似ていてもFAIL。
motion_semanticsは左上→右上→左下→右下をslot state planと照合する。
continuityはactive/support limbを接続関係まで追う。
endpointはK4を`end`と開始姿勢の両方に照合する。
layoutはportrait、全身、safe gap、外周、crop、セル越境を見る。
chromaは影、濃淡、床、gradientを見る。
unintended_outputは文字、ラベル、枠、grid、矢印、UI等を見る。

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

視覚確認できなければ`REVIEW_UNAVAILABLE`。それ以外は直ちにMACHINE_AUDITへ進む。

## 4. MACHINE_AUDIT / INITIAL_REVIEW

GitHubの現在の`audit/scripts/machine_audit_board.py`を取得し、raw INITIAL_BOARD実ファイルへ実行する。
canonical reference、別画像、stamped copyを監査しない。JSONを推測しない。

`python audit/scripts/machine_audit_board.py <raw> --output <json>`

成功時は`MACHINE_AUDIT status:RAN`と主要数値・true flagを出す。
実画像不可→`IMAGE_UNAVAILABLE`、コード実行不可→`EXECUTION_UNAVAILABLE`、取得/実行失敗→`ERROR`。この3状態だけ終了。

RANなら統合する。

- wrong_aspect / outer_edge_contact / center_*_contamination → layout
- border_not_uniform / background_not_uniform / shadow_like_background → chroma
- divider_like_*_white_band → unintended_output
- machine flagがfalseでも目視FAILを打ち消さない

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
- 確認したFAIL
```

続けて`stamp_review_board.py`で表示専用`review_initial_*.png`を作る。rawは変更しない。
全PASSなら`SELECTED_BOARD stage:INITIAL reason:initial_pass`で終了。FAILなら次へ進む。

## 5. AUDIT_SOURCE_CHECK / REPAIR_PRESERVE

FAIL時だけGitHubの`project/sources/production/05-post-generation-audit.md`を取得する。

```text
AUDIT_SOURCE_CHECK
status: LOADED / UNAVAILABLE
applied_rules:
- 今回のFAILへ直接適用する規則だけ
```

UNAVAILABLEなら終了。LOADEDなら初回PASS項目を具体的な維持条件へ変換する。

```text
REPAIR_PRESERVE
items:
- <PASS項目>: <壊してはいけない具体的状態>
```

FAIL項目をpreserveへ混ぜない。

## 6. REPAIR_SPLIT

GitHubの現在の`audit/scripts/split_repair_board.py`を取得し、raw INITIAL_BOARDをK1〜K4へ機械分割する。

`python audit/scripts/split_repair_board.py <raw-initial> --output-dir <dir>`

出力されたK1/K2/K3/K4とmetadata以外を推測で作らない。

```text
REPAIR_SPLIT
status: RAN
source: <raw INITIAL path>
cells: K1,K2,K3,K4
metadata: <path>
```

split失敗時だけ実エラーを出して終了する。

## 7. CELL_REPAIR_PLAN

初回FAILを「どのセルの何を変える必要があるか」へ割り当てる。
各セルを`KEEP_RAW`または`REPAIR`にする。問題がないセルを再生成しない。

```text
CELL_REPAIR_PLAN
K1: KEEP_RAW / REPAIR
  change: <修正対象 or none>
  lock: <維持するpose/state>
K2: ...
K3: ...
K4: ...
```

規則:

- identityの正本は常にcanonical reference
- poseの修正元は当該raw split cell
- motion/continuityの時間文脈はmotion contractとraw INITIAL_BOARD、必要なら隣接セル
- 隣接セルや修正版をidentity正本へ昇格しない
- `REPAIR_PRESERVE`に関係するセル状態は`lock`へ入れる
- layout/chroma/unintended_outputのPASS状態も壊さない
- 変更不要セルはsplitしたrawセルをそのまま最終合成へ使う

## 8. REPAIR_CELLS

`REPAIR`指定セルだけを1セルずつ別々に生成/編集する。2×2 boardを再生成しない。
各jobはportrait 2:3の単独全身ポーズ1枚。文字・Kラベル・枠・影・床・未指定エフェクトは禁止。

各セルでは最低限次を渡す。

1. canonical identity reference
2. 当該raw split cellをrepair target
3. そのセルの`change`
4. そのセルの`lock`
5. 必要なmotion contract / 隣接状態
6. INITIAL MACHINE_AUDITの`key_hex`を背景目標色

修正対象以外を新しく設計しない。各セルのrepairは1回だけ。セルrepairの再試行は禁止。

本文には各生成直前に`REPAIR_CELL K1`等と出す。
未加工出力を`raw REPAIR_K1`等として保持する。

## 9. REPAIR_COMPOSE

GitHubの現在の`audit/scripts/compose_repair_board.py`を取得する。
各Kについて、`REPAIR`ならraw repaired cell、`KEEP_RAW`ならsplit raw cellを入力し、metadataの元2×2幾何へPythonで再合成する。

`python audit/scripts/compose_repair_board.py --metadata <metadata> --cells <K1> <K2> <K3> <K4> --output <raw-repair-board>`

画像生成モデルに最終2×2配置をさせない。合成結果を`raw REPAIR_BOARD`とする。

```text
REPAIR_COMPOSE
status: RAN
output: <raw REPAIR_BOARD path>
```

compose失敗時だけ実エラーを出して終了する。

## 10. POST_REPAIR

raw REPAIR_BOARDを同じ7項目で視覚レビューし、同じmachine auditを再実行する。初回JSONを再利用しない。

```text
POST_REPAIR_MACHINE_AUDIT
status: RAN / IMAGE_UNAVAILABLE / EXECUTION_UNAVAILABLE / ERROR
mechanical_flags:
- RAN時のみtrue flag

POST_REPAIR_REVIEW
identity: PASS / FAIL
motion_semantics: PASS / FAIL
continuity: PASS / FAIL
endpoint: PASS / FAIL
layout: PASS / FAIL
chroma: PASS / FAIL
unintended_output: PASS / FAIL
overall: PASS / FAIL
repair_mode: split_cell_repair
repaired_cells:
- <K or none>
issues:
- 残った問題
```

追加repairは禁止。
続けて`stamp_review_board.py`で表示専用`review_repair_*.png`を作る。

## 11. REPAIR_DELTA / SELECTED_BOARD

INITIAL_REVIEWとPOST_REPAIR_REVIEWを7項目ごとに比較する。

- fixed = FAIL→PASS
- remaining = FAIL→FAIL
- regressed = PASS→FAIL
- PASS→PASSは省略

採用規則:

1. REPAIR overall PASS → IMPROVED / REPAIR
2. regressedあり → WORSE / INITIAL
3. regressionなし、fixedあり → IMPROVED / REPAIR
4. regressionなし、fixedなし → NO_CHANGE / INITIAL

```text
REPAIR_DELTA
fixed:
- <item or none>
remaining:
- <item or none>
regressed:
- <item or none>
initial_fail_count: <number>
repair_fail_count: <number>
result: IMPROVED / NO_CHANGE / WORSE
selected_board: INITIAL / REPAIR

SELECTED_BOARD
stage: INITIAL / REPAIR
reason: repair_pass / no_regression_and_fixed / regression_detected / no_change
review_copy: <対応するreview_*.png>
```

## 12. 固定実行順序

`INITIAL_BOARD`
→ `INITIAL_VISUAL_REVIEW`
→ `MACHINE_AUDIT`
→ `INITIAL_REVIEW`
→ `REVIEW_STAMP(INITIAL)`
→ 初回PASSなら`SELECTED_BOARD(INITIAL)`
→ `AUDIT_SOURCE_CHECK`
→ `REPAIR_PRESERVE`
→ `REPAIR_SPLIT`
→ `CELL_REPAIR_PLAN`
→ `REPAIR_CELL`（必要セルだけ）
→ `REPAIR_COMPOSE`
→ `POST_REPAIR_MACHINE_AUDIT`
→ `POST_REPAIR_REVIEW`
→ `REVIEW_STAMP(REPAIR)`
→ `REPAIR_DELTA`
→ `SELECTED_BOARD`

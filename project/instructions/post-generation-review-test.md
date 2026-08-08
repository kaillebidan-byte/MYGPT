# 一時検証モード: post-generation review / split repair / canonical compose

このファイルは実験用Project Instructions。通常の`04-imagegen-workflow.md`より優先する。
初回は2×2主要boardを1枚生成する。FAIL後は2×2全体をそのまま再生成して採用せず、repair jobをK1〜K4単位へ分け、必要セルだけを最終boardへ採用する。
同一ターン内で「生成→実画像レビュー→機械監査→repair job→セル抽出/準備→Python再合成→再監査→初回比較→採用」まで行う。

## 0. 終了条件

途中ブロックは進捗であり最終回答ではない。利用可能なtoolを呼ばずに「できない」と推測して終了しない。
終了してよいのは次だけ。

1. `REVIEW_UNAVAILABLE`
2. 初回`MACHINE_AUDIT`が`IMAGE_UNAVAILABLE / EXECUTION_UNAVAILABLE / ERROR`
3. 初回7項目が全PASSで`SELECTED_BOARD stage:INITIAL`
4. `AUDIT_SOURCE_CHECK status:UNAVAILABLE`
5. split / prepare / composeに実エラーが発生し、その実エラーを報告したとき
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
未加工画像を`raw INITIAL_BOARD`として保持する。監査・splitは必ずrawを使う。

## 3. INITIAL_VISUAL_REVIEW

raw INITIAL_BOARDそのものを見て必ず次を判定する。

- identity
- motion_semantics
- continuity
- endpoint
- layout
- chroma
- unintended_output

identityはcanonical referenceと4ポーズ相互の両方で比較する。顔、目、髪、頭部固有部品、体格、胴体シルエット、袖、裾、靴、模様、腰飾り、房、紐、留め具、左右非対称部品の増減・形状・接続を見る。主要固有部品が変わっていれば似ていてもPASSにしない。
motion_semanticsは左上→右上→左下→右下をslot_state_planと照合する。
continuityはactive/support limb等を身体への接続まで追う。
endpointはK4を`end`と開始姿勢の両方に照合する。
layoutはportrait 2:3、全身、safe gap、外周余白、crop、セル越境を見る。
chromaは影、背景濃淡、床、gradientを見る。
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

## 4. MACHINE_AUDIT / INITIAL_REVIEW

raw INITIAL_BOARDの実ファイルへ、このターンでGitHubから取得した
`audit/scripts/machine_audit_board.py`
を実行する。canonical reference、別画像、表示用コピーを監査しない。実ファイルを渡せなければ実行済みにしない。

成功時は`MACHINE_AUDIT status:RAN`と主要値・true flagを出す。
`wrong_aspect / outer_edge_contact / center_*_contamination`→layout。
`border_not_uniform / background_not_uniform / shadow_like_background`→chroma。
`divider_like_*_white_band`→unintended_output。
machine flagがfalseでも目視FAILを打ち消さない。

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

全PASSなら`SELECTED_BOARD stage:INITIAL reason:initial_pass`で終了する。

## 5. AUDIT_SOURCE_CHECK / REPAIR_PRESERVE

初回FAIL時だけGitHubの
`project/sources/production/05-post-generation-audit.md`
を取得する。LOADEDなら今回のFAILへ直接使う規則だけを示す。

INITIAL_REVIEWでPASSだった項目は、raw INITIAL_BOARDで成立していた具体的状態へ変換する。

```text
REPAIR_PRESERVE
items:
- <PASS項目>: <壊してはいけない具体的状態>
```

FAIL項目はpreserveへ混ぜない。

## 6. REPAIR_SPLIT / CELL_REPAIR_PLAN

`audit/scripts/split_repair_board.py`でraw INITIAL_BOARDをK1〜K4へ機械分割しmetadataを保存する。

各セルを`KEEP_RAW`または`REPAIR`にする。

```text
CELL_REPAIR_PLAN
K1:
  action: KEEP_RAW / REPAIR
  change:
  - <直す状態>
  lock:
  - <維持する状態>
```

一般則:

- identity FAIL: driftがあるセルだけREPAIR。全セルなら全セル。
- motion_semantics FAIL: 誤ったslot stateのセル。
- continuity FAIL: 役割が切り替わった境界を特定し、必要最小限のセル。
- endpoint FAIL: 原則K4。
- layout/chroma/unintended_outputの局所FAIL: 該当セル。
- 問題のないセルを「念のため」で再生成しない。
- PASS状態は該当セルの`lock`へ具体化する。

## 7. REPAIR_JOB K1〜K4

REPAIRセルごとに別jobを1回だけ行う。理想出力は人物1体の単独portrait 2:3ポーズだが、画像生成側が2×2 boardを返しても直ちに失敗扱いにしない。

参照の役割:

- canonical identity reference: identity正本
- raw INITIAL_BOARD: motion全体の視覚参照
- motion contract / 隣接slot: 時間関係とcontinuity
- split cell: repair targetとして使える場合のみ使用

重要: Pythonで作ったsplit cellが画像生成toolへ実際の画像入力として渡っていない場合、「split cellを視覚参照した」と主張しない。path名を文章で書くだけでは視覚参照にならない。その場合はcanonical reference、raw INITIAL_BOARD、対象slotの状態記述でrepairする。

repair指示にはcanonical anchors、対象slot、change、lock、必要なactive/support limb、end、初回`key_hex`、全身、影・床・文字・枠・UI・未指定エフェクト禁止を含める。

## 8. REPAIR_OUTPUT_PREPARE

各repair jobの実画像を見て出力形式を判定する。

- 人物1体の単独ポーズ → `mode: cell`
- 4ポーズの2×2 board → `mode: board`
- その他の形式 → `REPAIR_CELL_OUTPUT_INVALID`として終了

GitHubの`audit/scripts/prepare_repair_cell.py`を使う。

REPAIRセル:
```text
python prepare_repair_cell.py <repair-output> --slot K# --mode <cell-or-board> \
  --target-key <INITIAL key_hex> --output prepared_K#.png
```

`mode: board`なら、そのrepair job全体を採用せず、対象K#の象限だけを抽出する。

KEEP_RAWセル:
splitしたrawセルへ`mode: cell`を使い、同じく512×768へ準備する。

`prepare_repair_cell.py`は縦横比を歪めず、512×768のクロマcanvasへfitする。近似key色以外の影や濃淡を勝手に消して監査を回避しない。

## 9. REPAIR_COMPOSE

GitHubの`audit/scripts/compose_repair_board.py`でprepared K1〜K4を再合成する。

```text
python compose_repair_board.py \
  --metadata <split-metadata> \
  --cells prepared_K1.png prepared_K2.png prepared_K3.png prepared_K4.png \
  --output raw_repair_board.png
```

最終boardは初回boardの誤ったgeometryを継承しない。既定出力は1024×1536、各セル512×768。
初回`wrong_aspect`でも、再合成によって正規2:3へ戻せる。
画像生成モデルへ最終2×2配置を任せない。

## 10. POST_REPAIR_REVIEW

合成された`raw REPAIR_BOARD`そのものを同じ7項目で視覚レビューし、同じmachine auditを実行する。初回JSONを再利用しない。

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
repair_mode: split_cell_compose
issues:
- 残った問題
```

追加repairは禁止。

## 11. REPAIR_DELTA / SELECTED_BOARD

INITIAL_REVIEWとPOST_REPAIR_REVIEWの7項目を比較する。

- fixed = FAIL→PASS
- remaining = FAIL→FAIL
- regressed = PASS→FAIL
- PASS→PASSは省略

採用規則:

1. REPAIR overall PASS → IMPROVED / REPAIR
2. regressedが1件以上 → WORSE / INITIAL
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
```

修正版だからという理由だけでは採用しない。ここで終了する。

## 12. 固定実行順序

`INITIAL_BOARD`
→ `INITIAL_VISUAL_REVIEW`
→ `MACHINE_AUDIT`
→ `INITIAL_REVIEW`
→ 初回PASSなら`SELECTED_BOARD`
→ `AUDIT_SOURCE_CHECK`
→ `REPAIR_PRESERVE`
→ `REPAIR_SPLIT`
→ `CELL_REPAIR_PLAN`
→ 必要な`REPAIR_JOB K#`
→ 各`REPAIR_OUTPUT_PREPARE`
→ `REPAIR_COMPOSE`
→ `POST_REPAIR_MACHINE_AUDIT`
→ `POST_REPAIR_REVIEW`
→ `REPAIR_DELTA`
→ `SELECTED_BOARD`

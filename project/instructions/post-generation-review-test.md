# 一時検証モード: post-generation review / machine audit / 1 repair

このファイルは実験用Project Instructions。通常の`04-imagegen-workflow.md`より優先する。
主要board生成後も応答を終了せず、同一ターン内で「実画像レビュー→機械監査→必要時1回repair→再監査→初回/repair比較」まで行う。
`INITIAL_REVIEW overall: FAIL`かつ`AUDIT_SOURCE_CHECK status: LOADED`なら、同一ターン内で`REPAIR_BOARD`を1回だけ生成する。2回目のrepairは禁止。

## 1. motion contract

現在のチャットへ直接添付された基準画像だけをcanonical identity referenceとする。
`02-motion-design.md`から今回のmotion contractを作り、画像生成前に内部で次を確定する。

- `identity_anchors`: 正本の重要特徴3〜6個
- `active_limb_id` / `support_limb_id`（必要な動作のみ）
- 必要なら解剖学的左右とviewer-space開始側
- `end`: one-shotの具体的終了状態
- `slot_state_plan`: top-left→top-right→bottom-left→bottom-right

K1〜K4ラベルはraw boardへ描かない。同一脚は「前に見える足」だけで決めず身体への接続関係も追う。

## 2. INITIAL_BOARD

生成直前に本文へ`INITIAL_BOARD`と出す。
portrait 2:3相当の2×2主要motion boardを1枚だけ生成する。

生成指示には、canonical identity reference、identity anchors、slot state plan、active/support limb、end、全身、共通縮尺、中央safe gap、外周safe margin、均一単色クロマ背景を含める。
グリッド、枠、文字、ラベル、接地影、床、モーションライン、未指定エフェクトは禁止。
A/B候補、別案、追加boardは禁止。

未加工画像を`raw INITIAL_BOARD`として保持し、監査・repairは必ずrawを使う。生成後も応答を終了しない。

## 3. INITIAL_VISUAL_REVIEW

raw INITIAL_BOARDそのものを見て必ず7項目を判定する。

- identity
- motion_semantics
- continuity
- endpoint
- layout
- chroma
- unintended_output

identityはcanonical referenceと比較する。
motion_semanticsは左上→右上→左下→右下をslot state planと照合する。
continuityはactive/support limbを接続関係まで追う。
endpointはK4を`end`と開始姿勢の両方に照合する。
layoutはportrait 2:3、全身、safe gap、外周余白、crop、セル越境を見る。
chromaは接地影、背景濃淡、床、gradientを見る。
unintended_outputは文字、ラベル、枠、grid、矢印、UI等を見る。

本文:
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

実画像を視覚確認できなければ`REVIEW_UNAVAILABLE`で終了する。

## 4. MACHINE_AUDIT

視覚レビュー後、raw INITIAL_BOARDの実ファイルをコード実行環境へ渡す。
このターンでGitHubの現在の
`audit/scripts/machine_audit_board.py`
を取得して実行する。

canonical reference、別画像、stamped copyを監査しない。実ファイル/path/bytesを渡せなければ実行済みにしない。JSONを推測しない。

実行例:
`python audit/scripts/machine_audit_board.py <raw> --output <json>`

成功時:
```text
MACHINE_AUDIT
status: RAN
input: <raw path/name>
width: <value>
height: <value>
aspect_pass: <true/false>
key_hex: <value>
border_key_match_ratio: <value>
background_deviation_ratio: <value>
shadow_like_background_ratio: <value>
outer_edge_non_chroma_pixels: <value>
vertical_center_gap_px: <value>
horizontal_center_gap_px: <value>
mechanical_flags:
- true flagのみ。なければnone
```

実画像を渡せない→`status: IMAGE_UNAVAILABLE`
コード実行不可→`status: EXECUTION_UNAVAILABLE`
取得/実行エラー→`status: ERROR`
上記3状態ではrepairへ進まず終了する。

## 5. INITIAL_REVIEW

`status: RAN`のときだけ視覚レビューとmachine auditを統合する。
machine auditはidentity / motion_semantics / continuity / endpointを変更しない。

対応:
- wrong_aspect / outer_edge_contact / center_*_contamination → layout
- border_not_uniform / background_not_uniform / shadow_like_background → chroma
- divider_like_*_white_band → unintended_output

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

## 6. REVIEW_STAMP(INITIAL)

GitHubの`audit/scripts/stamp_review_board.py`を取得し、rawを変更せず表示専用コピーを作る。

`python audit/scripts/stamp_review_board.py <raw> --output review_initial_<PASS-or-FAIL>.png --stage INITIAL --status <PASS-or-FAIL>`

```text
REVIEW_STAMP
stage: INITIAL
status: PASS / FAIL
source: <raw path/name>
output: <review_initial_*.png>
```

stamped copyを監査・repair・identity referenceへ使わない。スタンプ失敗だけならrepairは継続可。
初回7項目が全PASSなら、
```text
SELECTED_BOARD
stage: INITIAL
reason: initial_pass
```
で終了する。

## 7. AUDIT_SOURCE_CHECK

INITIAL_REVIEWがFAILのときだけ、このターンで
`project/sources/production/05-post-generation-audit.md`
をGitHubから取得する。

```text
AUDIT_SOURCE_CHECK
status: LOADED / UNAVAILABLE
applied_rules:
- 今回のFAILへ直接適用する規則だけ
```

UNAVAILABLEならrepairせず終了する。

## 8. REPAIR_PRESERVE

LOADED後、repair前にINITIAL_REVIEWでPASSだった項目をすべて具体的な維持条件へ変換する。
PASS項目名だけでなく、raw INITIAL_BOARDで成立していた状態を書く。machine auditのfalse flagや必要な数値も利用可。INITIAL FAIL項目は混ぜない。

```text
REPAIR_PRESERVE
items:
- <PASS項目>: <壊してはいけない具体的状態>
```

例:
- endpoint: K4に前後差が残り開始姿勢へ完全には戻っていない
- chroma: 均一magenta、接地影なし、background_not_uniform=false、shadow_like_background=false
- unintended_output: 文字、枠、gridなし

## 9. REPAIR_BOARD

自動repairは1回だけ。

motion_semantics / continuity / endpointのどれかがFAIL:
canonical referenceを正本にboard全体を1回再生成する。active/support limb、slot state plan、endを維持し、確認済みFAILだけを修正条件へ入れる。`REPAIR_PRESERVE`全項目も明示して回帰させない。

motion系3項目が全PASSでその他だけFAIL:
raw INITIAL_BOARDを編集対象にし、PASSだったmotionを再設計しない。`REPAIR_PRESERVE`を維持する。

生成直前に本文へ`REPAIR_BOARD`と出す。
portrait 2:3相当を1枚だけ生成し、別案・2回目repairは禁止。
未加工修正版を`raw REPAIR_BOARD`として保持する。

## 10. POST_REPAIR

raw REPAIR_BOARDを同じ7項目で視覚レビューし、その実ファイルへ同じmachine auditを再実行する。初回JSONを再利用しない。
machine flag統合規則も初回と同じ。

```text
POST_REPAIR_MACHINE_AUDIT
status: RAN / IMAGE_UNAVAILABLE / EXECUTION_UNAVAILABLE / ERROR
background_deviation_ratio: <RAN時>
shadow_like_background_ratio: <RAN時>
mechanical_flags:
- RAN時のみ

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
- 初回FAIL項目
issues:
- 残った問題
```

追加repairはしない。

## 11. REVIEW_STAMP(REPAIR)

rawを変更せず表示専用コピーを作る。

```text
REVIEW_STAMP
stage: REPAIR
status: PASS / FAIL
source: <raw REPAIR path/name>
output: <review_repair_*.png>
```

## 12. REPAIR_DELTA / SELECTED_BOARD

INITIAL_REVIEWとPOST_REPAIR_REVIEWの7項目を比較する。

- fixed = FAIL→PASS
- remaining = FAIL→FAIL
- regressed = PASS→FAIL
- PASS→PASSはリスト不要

`initial_fail_count`と`repair_fail_count`も数える。

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
review_copy: <対応するreview_*.png>
```

修正版だからという理由では採用しない。selected boardがFAILでも追加生成しない。

## 13. 実行順序

`INITIAL_BOARD`
→ `INITIAL_VISUAL_REVIEW`
→ `MACHINE_AUDIT`
→ `INITIAL_REVIEW`
→ `REVIEW_STAMP(INITIAL)`
→ 初回PASSなら`SELECTED_BOARD(INITIAL)`で終了
→ `AUDIT_SOURCE_CHECK`
→ `REPAIR_PRESERVE`
→ `REPAIR_BOARD`
→ `POST_REPAIR_MACHINE_AUDIT`
→ `POST_REPAIR_REVIEW`
→ `REVIEW_STAMP(REPAIR)`
→ `REPAIR_DELTA`
→ `SELECTED_BOARD`

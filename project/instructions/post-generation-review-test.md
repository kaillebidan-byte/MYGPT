# 一時検証モード: post-generation review / machine audit / 1 repair

このファイルは実験用Project Instructions。通常の`04-imagegen-workflow.md`より優先する。
主要board生成後も同一ターンを継続し、
`実画像レビュー → 機械監査 → 統合判定 → 表示スタンプ → 必要時1回repair → 再監査 → 初回/repair比較 → 採用`
まで実行する。

## 0. 終了条件と強制遷移

この処理は状態機械として扱う。途中の表示ブロックは進捗表示であり最終回答ではない。
`INITIAL_VISUAL_REVIEW`、`MACHINE_AUDIT status:RAN`、`INITIAL_REVIEW overall:FAIL`、
`REVIEW_STAMP(INITIAL)`、`AUDIT_SOURCE_CHECK status:LOADED`、`REPAIR_PRESERVE`、
`REPAIR_BOARD`、`POST_REPAIR_MACHINE_AUDIT status:RAN`、`POST_REPAIR_REVIEW`、
`REVIEW_STAMP(REPAIR)`、`REPAIR_DELTA`では応答を終了してはいけない。直ちに次の段階へ進む。

同一ターンを終了してよいのは次だけ。
1. `REVIEW_UNAVAILABLE`
2. `MACHINE_AUDIT`が`IMAGE_UNAVAILABLE / EXECUTION_UNAVAILABLE / ERROR`
3. 初回7項目が全PASSで`SELECTED_BOARD stage:INITIAL`
4. `AUDIT_SOURCE_CHECK status:UNAVAILABLE`
5. repair後に`REPAIR_DELTA`と最終`SELECTED_BOARD`を出した後

利用可能なtoolを呼ばずに「できない」と推測して終了しない。必要な次段階がtool実行なら、進捗文を出した後にそのtoolを同じassistant turn内で直ちに実行する。

## 1. motion contract

現在のチャットへ直接添付された基準画像だけをcanonical identity referenceとする。
`02-motion-design.md`からmotion contractを作り、生成前に内部で確定する。

- `identity_anchors`: 正本の重要特徴3〜6個
- `active_limb_id` / `support_limb_id`（必要時）
- 必要なら解剖学的左右とviewer-space開始側
- `end`: one-shotの具体的終了状態
- `slot_state_plan`: top-left→top-right→bottom-left→bottom-right

K1〜K4ラベルはraw boardへ描かない。
同一脚は前後位置だけで決めず、股関節から足先までの接続関係を追う。

## 2. INITIAL_BOARD

生成直前に本文へ`INITIAL_BOARD`と出す。
portrait 2:3相当の2×2主要motion boardを1枚だけ生成する。

生成指示にはcanonical reference、identity anchors、slot state plan、active/support limb、end、
全身、共通縮尺、中央safe gap、外周safe margin、均一単色クロマ背景を含める。
グリッド、枠、文字、ラベル、接地影、床、モーションライン、未指定エフェクトは禁止。
A/B候補、別案、追加boardは禁止。

未加工画像を`raw INITIAL_BOARD`として保持する。監査・repairは必ずrawを使う。
画像生成が終わっても応答を終了せず、直ちにINITIAL_VISUAL_REVIEWへ進む。

## 3. INITIAL_VISUAL_REVIEW

raw INITIAL_BOARDそのものを見て7項目を必ず判定する。

- identity
- motion_semantics
- continuity
- endpoint
- layout
- chroma
- unintended_output

identityはcanonical referenceと4ポーズ相互の両方で比較する。
顔、目、髪、帽子/頭部部品、体格、胴体シルエット、袖、襟、裾、靴、模様、
腰飾り、房、紐、留め具、左右非対称部品の増減・形状変更・接続変更を確認する。
主要な固有部品が変わっていれば、全体が似ていてもPASSにしない。

motion_semanticsは左上→右上→左下→右下をslot state planと照合する。
continuityはactive/support limbを身体への接続関係まで追う。
endpointはK4を`end`と開始姿勢の両方に照合する。
layoutはportrait 2:3、全身、safe gap、外周余白、crop、セル越境を見る。
chromaは接地影、背景濃淡、床、gradientを見る。
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

実画像を視覚確認できなければ`REVIEW_UNAVAILABLE`で終了する。
それ以外はこのブロックを出した直後、最終回答にせずMACHINE_AUDITへ進む。

## 4. MACHINE_AUDIT

raw INITIAL_BOARDの実ファイルをコード実行環境へ渡す。
このターンでGitHubの`audit/scripts/machine_audit_board.py`の現在内容を取得して実行する。

canonical reference、別画像、stamped copyを監査しない。
実ファイル/path/bytesを渡せなければ実行済みにしない。JSONを推測しない。

`python audit/scripts/machine_audit_board.py <raw> --output <json>`

成功時は`status:RAN`と、input、width、height、aspect_pass、key_hex、
border_key_match_ratio、background_deviation_ratio、shadow_like_background_ratio、
outer_edge_non_chroma_pixels、vertical_center_gap_px、horizontal_center_gap_px、
trueのmechanical_flagsを出す。

実画像を渡せない→`IMAGE_UNAVAILABLE`
コード実行不可→`EXECUTION_UNAVAILABLE`
取得/実行エラー→`ERROR`
この3状態だけはここで終了する。
`RAN`なら終了せずINITIAL_REVIEWへ進む。

## 5. INITIAL_REVIEW

視覚レビューとmachine auditを統合する。
machine auditはidentity / motion_semantics / continuity / endpointを変更しない。

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

出力後は必ずREVIEW_STAMP(INITIAL)へ進む。

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

stamped copyを監査・repair・identity referenceへ使わない。
スタンプ作成だけの失敗では処理を止めない。

初回7項目が全PASSなら`SELECTED_BOARD stage:INITIAL reason:initial_pass`で終了する。
FAILなら終了せずAUDIT_SOURCE_CHECKへ進む。

## 7. AUDIT_SOURCE_CHECK

初回FAIL時だけ、このターンでGitHubの
`project/sources/production/05-post-generation-audit.md`
を取得する。

```text
AUDIT_SOURCE_CHECK
status: LOADED / UNAVAILABLE
applied_rules:
- 今回のFAILへ直接適用する規則だけ
```

UNAVAILABLEなら終了。LOADEDなら直ちにREPAIR_PRESERVEへ進む。

## 8. REPAIR_PRESERVE

INITIAL_REVIEWでPASSだった項目をすべて、raw INITIAL_BOARDで成立していた具体的な維持条件へ変換する。
項目名だけにしない。machine auditのfalse flagや必要な数値も使える。INITIAL FAIL項目は混ぜない。

```text
REPAIR_PRESERVE
items:
- <PASS項目>: <repairで壊してはいけない具体的状態>
```

例:
- endpoint: K4で成立していた終了状態を維持
- chroma: 均一magenta、接地影なし、background_not_uniform=false、shadow_like_background=false
- unintended_output: 文字、枠、gridなし

出力後は終了せずREPAIR_BOARDへ進む。

## 9. REPAIR_BOARD

自動repairは1回だけ。

motion_semantics / continuity / endpointのどれかがFAILなら、
canonical referenceを正本にboard全体を1回再生成する。
active/support limb、slot state plan、endを維持し、確認済みFAILだけを修正条件へ入れる。
`REPAIR_PRESERVE`全項目を必ずrepair指示へ明示して回帰させない。

motion系3項目が全PASSでその他だけFAILならraw INITIAL_BOARDを編集対象にし、
PASSだったmotionを再設計しない。ここでも`REPAIR_PRESERVE`を維持する。

生成直前に`REPAIR_BOARD`と出し、portrait 2:3相当を1枚だけ生成する。
別案・2回目repairは禁止。未加工修正版を`raw REPAIR_BOARD`として保持する。
生成後も終了せずPOST_REPAIRへ進む。

## 10. POST_REPAIR

raw REPAIR_BOARDを同じ7項目で視覚レビューし、その実ファイルへ同じmachine auditを再実行する。
初回JSONを再利用しない。machine flag統合規則も初回と同じ。

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
repair_mode: motion_regeneration / image_edit
repaired_from:
- 初回FAIL項目
issues:
- 残った問題
```

追加repairは禁止。出力後はREVIEW_STAMP(REPAIR)へ進む。

## 11. REVIEW_STAMP(REPAIR)

rawを変更せず表示専用コピーを作る。

```text
REVIEW_STAMP
stage: REPAIR
status: PASS / FAIL
source: <raw REPAIR path/name>
output: <review_repair_*.png>
```

出力後はREPAIR_DELTAへ進む。

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

修正版だからという理由では採用しない。ここで処理終了。

## 13. 固定実行順序

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
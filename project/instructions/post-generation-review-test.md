# 一時検証モード: 生成後レビュー + 機械監査 + GitHub監査 + 1回修正 + 回帰判定 + 表示スタンプ

このファイルは、主要モーションボード生成後に同一ターン内で実画像を視覚確認し、その生成画像をPython機械監査へ渡し、GitHub監査規則を取得して1回だけrepair・再監査するための一時Project Instructionsである。

repair前には初回PASS項目をpreserve contractとして固定し、repair後には初回と修正版を比較して回帰を検出する。初回と修正版を取り違えないよう表示専用スタンプ画像も作る。

この検証中は、画像生成物だけを返して応答を終了する規則よりこのファイルを優先する。

## 1. 初回motion contract

現在のチャットへ直接添付された基準画像をcanonical identity referenceとする。

`02-motion-design.md`から今回のmotion contractを作る。

画像生成前に次を内部的に決める。

- `identity_anchors`: 正本から3〜6個の重要特徴
- `active_limb_id` / `support_limb_id`: 時間をまたいで役割を持つ手足がある場合
- 必要ならactive limbの解剖学的左右とviewer-space上の開始側
- `end`: one-shotの具体的終了状態
- `slot_state_plan`: top-left / top-right / bottom-left / bottom-rightの状態

K1/K2/K3/K4という表示用ラベルをraw boardへ描かせない。

viewer-spaceはcontinuity確認の補助とし、同一脚の最終判定では身体への接続関係も確認する。

## 2. 初回生成

画像生成直前に本文で次だけ出す。

`INITIAL_BOARD`

portrait 2:3相当の2x2主要motion boardを1枚だけ生成する。

生成指示には最低限、canonical identity reference、identity anchors、slot state plan、active/support limb、end、全身、共通縮尺、中央safe gap、外周safe margin、均一な単色クロマ背景を含める。

グリッド、枠、文字、ラベル、接地影、ドロップシャドウ、床、モーションライン、未指定エフェクトを描かない。

A/B候補、別案、追加boardを同時生成しない。

生成された未加工画像を`raw INITIAL_BOARD`として保持する。後段の監査・repairではこのraw画像だけを使う。

生成終了後もassistant responseを終了しない。

## 3. 初回視覚レビュー

生成されたraw INITIAL_BOARDそのものを見て7項目をすべて判定する。

- `identity`
- `motion_semantics`
- `continuity`
- `endpoint`
- `layout`
- `chroma`
- `unintended_output`

identityではcanonical identity referenceとの比較を行う。

motion_semanticsでは左上→右上→左下→右下を時間順としてslot state planと照合する。

continuityではactive/support limbを身体への接続関係まで追跡する。正面主体ではviewer-spaceも補助に使うが、「前に見える足」だけで同一脚と決めない。

endpointでは最後のポーズを開始姿勢と`end`の両方に照合する。

layoutではportrait 2:3、全身、中央safe gap、外周safe margin、crop、セル越境を見る。

chromaでは接地影、背景濃淡、床、グラデーションを見る。

unintended_outputでは文字、ラベル、枠、グリッド、矢印、UIなどを見る。

本文へ次を出す。

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

生成画像を視覚確認できない場合は`REVIEW_UNAVAILABLE`を返して終了する。

## 4. 生成画像の機械監査

視覚レビュー後、repairより前に、実際に生成されたraw INITIAL_BOARDをコード実行環境へ渡して機械監査する。

監査スクリプトはこのターンでGitHubの現在内容を取得する。

`https://github.com/kaillebidan-byte/MYGPT/blob/main/audit/scripts/machine_audit_board.py`

重要:

- canonical identity referenceを監査してはいけない。
- 生成前の画像や別チャットの画像を監査してはいけない。
- 表示スタンプ付きコピーを監査してはいけない。
- raw INITIAL_BOARDとして直前に生成された実画像ファイルそのものを入力にする。
- 生成画像の実ファイル/path/bytesをコード実行環境へ渡せない場合、成功したことにしない。
- スクリプトを読んだだけで実行済みと扱わない。
- JSONを推測で作らない。

可能なら次と同等の実行を行う。

```text
python audit/scripts/machine_audit_board.py <raw-initial-board> --output <machine-audit-json>
```

実行に成功した場合は本文へ次を出す。

```text
MACHINE_AUDIT
status: RAN
script: https://github.com/kaillebidan-byte/MYGPT/blob/main/audit/scripts/machine_audit_board.py
input: <実際に監査したraw生成画像の識別可能な名前またはpath>
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
- trueになったflagだけ列挙。なければnone
```

生成画像をコード実行環境へ渡せない場合は次を出して、この検証ターンではrepairせず終了する。

```text
MACHINE_AUDIT
status: IMAGE_UNAVAILABLE
- 生成された実画像をコード実行環境へ渡せなかったため、機械監査を実行していない。
```

Python/コード実行自体が利用できない場合は次を出してrepairせず終了する。

```text
MACHINE_AUDIT
status: EXECUTION_UNAVAILABLE
- このターンではコード実行環境を利用できなかったため、機械監査を実行していない。
```

スクリプト取得または実行がエラーになった場合も`status: ERROR`として実際のエラーだけを短く示し、repairせず終了する。

## 5. 視覚レビューと機械監査の統合

`MACHINE_AUDIT status: RAN`の場合だけ統合判定へ進む。

機械監査はidentity、motion_semantics、continuity、endpointを変更しない。

次のmachine flagは対応項目のFAIL根拠に追加する。

- `wrong_aspect` → layout
- `outer_edge_contact` → layout
- `center_vertical_contamination` → layout
- `center_horizontal_contamination` → layout
- `border_not_uniform` → chroma
- `background_not_uniform` → chroma
- `shadow_like_background` → chroma
- `divider_like_vertical_white_band` → unintended_output
- `divider_like_horizontal_white_band` → unintended_output

`background_not_uniform`または`shadow_like_background`がtrueなら、目視で見落とした背景濃淡・接地影の補助証拠としてchromaをFAILにする。

逆にmachine flagがすべてfalseでも、視覚的な接地影などを打ち消してはいけない。

本文へ次を出す。

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
- 視覚または機械監査で確認したFAIL
```

## 6. 初回表示スタンプ

`INITIAL_REVIEW`確定後、raw INITIAL_BOARDを変更せず、人間確認用の派生コピーを作る。

このターンで次をGitHubから取得する。

`https://github.com/kaillebidan-byte/MYGPT/blob/main/audit/scripts/stamp_review_board.py`

`INITIAL_REVIEW overall`を`PASS`または`FAIL`として使い、次と同等の処理を行う。

```text
python audit/scripts/stamp_review_board.py <raw-initial-board> \
  --output review_initial_<PASS-or-FAIL>.png \
  --stage INITIAL \
  --status <PASS-or-FAIL>
```

本文へ次を出す。

```text
REVIEW_STAMP
stage: INITIAL
status: PASS / FAIL
source: <raw INITIAL_BOARD path/name>
output: <review_initial_PASS.png or review_initial_FAIL.png>
```

可能なら表示専用コピーもユーザーへ提示する。

重要:

- raw INITIAL_BOARDへスタンプを焼き込まない。
- stamped copyをmachine auditへ入れない。
- stamped copyをrepair対象にしない。
- stamped copyをcanonical identity referenceにしない。
- stamped copy上の帯をunintended_outputへ数えない。

スタンプ作成だけが失敗した場合は`REVIEW_STAMP status: ERROR`として短く示す。スタンプは人間確認用なので、監査済みraw boardが存在するならrepair自体は継続してよい。

7項目すべてPASSなら、本文へ次を出して終了する。

```text
SELECTED_BOARD
stage: INITIAL
reason: initial_pass
```

## 7. FAIL後のGitHub監査資料取得

`INITIAL_REVIEW overall: FAIL`の場合だけ、repair前に次をこのターンで取得する。

`https://github.com/kaillebidan-byte/MYGPT/blob/main/project/sources/production/05-post-generation-audit.md`

取得成功時:

```text
AUDIT_SOURCE_CHECK
source: https://github.com/kaillebidan-byte/MYGPT/blob/main/project/sources/production/05-post-generation-audit.md
status: LOADED
applied_rules:
- 今回のFAILへ直接適用する規則だけ
```

取得できない場合は`status: UNAVAILABLE`を返し、repairせず終了する。

## 8. repair preserve contract

GitHub監査資料をLOADEDできた後、repair生成より前に、`INITIAL_REVIEW`でPASSだった項目をすべて`repair_preserve`へ変換する。

PASS項目を単に名前だけ列挙せず、raw INITIAL_BOARDで実際に成立していた状態を短く具体化する。

機械監査でPASS状態を数値またはfalse flagとして確認できる場合は、それも必要な範囲で使う。

本文へ必ず次を出す。

```text
REPAIR_PRESERVE
items:
- <初回PASS項目>: <repairで壊してはいけない具体的状態>
```

例:

```text
REPAIR_PRESERVE
items:
- endpoint: K4に前後差が残り、開始姿勢へ完全には戻っていない
- chroma: 均一magenta、接地影なし、background_not_uniform=false、shadow_like_background=false
- unintended_output: 文字、枠、グリッドなし
```

初回FAIL項目はpreserve項目へ入れない。修正対象と維持対象を混同しない。

## 9. 1回だけrepair

自動repairは1回だけ。

`motion_semantics`、`continuity`、`endpoint`のいずれかがFAILならmotion-criticalとして、canonical identity referenceを正本にboard全体を1回だけ再生成する。

この場合、active/support limb、slot state plan、endを維持し、初回FAILと機械監査で確認した問題だけをrepair条件へ入れる。

さらに`REPAIR_PRESERVE`の全項目をrepair条件へ明示し、初回PASS項目を新しく壊してはいけない。

motion系3項目がすべてPASSで、それ以外だけFAILならraw INITIAL_BOARDを編集対象として使い、PASSだったmotion状態を再設計しない。この場合も`REPAIR_PRESERVE`を維持する。

修正版生成直前に本文へ次だけ出す。

`REPAIR_BOARD`

修正版もportrait 2:3相当のboardを1枚だけ生成する。A/B候補、別案、2回目のrepairは禁止。

生成された未加工修正版を`raw REPAIR_BOARD`として保持する。

## 10. 修正版の再監査

修正版生成後も応答を終了しない。

まずraw REPAIR_BOARDそのものを同じ7項目で視覚レビューする。

その後、同じ`machine_audit_board.py`をraw REPAIR_BOARDの実画像ファイルへ再実行する。

初回画像のJSONを修正版の結果として再利用しない。

修正版をコード実行環境へ渡せない場合は、その事実を`POST_REPAIR_MACHINE_AUDIT`で明示する。追加repairは行わない。

機械監査のflag統合規則は初回と同じとし、`background_not_uniform`と`shadow_like_background`もchromaへ反映する。

出力:

```text
POST_REPAIR_MACHINE_AUDIT
status: RAN / IMAGE_UNAVAILABLE / EXECUTION_UNAVAILABLE / ERROR
background_deviation_ratio: <RANの場合のvalue>
shadow_like_background_ratio: <RANの場合のvalue>
mechanical_flags:
- RANの場合のみtrue flagを列挙

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
- 修正後も残った問題
```

修正後がFAILでも追加生成しない。

## 11. 修正版表示スタンプ

`POST_REPAIR_REVIEW`確定後、raw REPAIR_BOARDを変更せず表示専用コピーを作る。

```text
python audit/scripts/stamp_review_board.py <raw-repair-board> \
  --output review_repair_<PASS-or-FAIL>.png \
  --stage REPAIR \
  --status <PASS-or-FAIL>
```

本文へ次を出す。

```text
REVIEW_STAMP
stage: REPAIR
status: PASS / FAIL
source: <raw REPAIR_BOARD path/name>
output: <review_repair_PASS.png or review_repair_FAIL.png>
```

可能なら表示専用コピーもユーザーへ提示する。

raw REPAIR_BOARDは監査・後処理用として未加工のまま保持する。

## 12. repair deltaと採用board

`POST_REPAIR_REVIEW`確定後、INITIAL_REVIEWとPOST_REPAIR_REVIEWの7項目を1項目ずつ比較する。

分類:

- `fixed`: INITIALがFAIL、REPAIRがPASS
- `remaining`: INITIALがFAIL、REPAIRもFAIL
- `regressed`: INITIALがPASS、REPAIRがFAIL

INITIALもREPAIRもPASSの項目は維持成功なので上記リストへ入れなくてよい。

`initial_fail_count`と`repair_fail_count`も数える。

判定規則:

1. REPAIR overallがPASSなら`result: IMPROVED`、`selected_board: REPAIR`
2. `regressed`が1項目でもあれば、fixedが存在しても`result: WORSE`、`selected_board: INITIAL`
3. regressionがなくfixedが1項目以上あれば`result: IMPROVED`、`selected_board: REPAIR`
4. regressionもfixedもなければ`result: NO_CHANGE`、`selected_board: INITIAL`

本文へ必ず次を出す。

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
```

続けて次を出す。

```text
SELECTED_BOARD
stage: INITIAL / REPAIR
reason: repair_pass / no_regression_and_fixed / regression_detected / no_change
review_copy: <対応するreview_initial_*.pngまたはreview_repair_*.png>
```

修正版だからという理由だけでREPAIRを選ばない。

selected_boardがFAILでも1回repair上限を維持し、追加生成しない。

## 13. 実行順序

次の順序を崩さない。

```text
INITIAL_BOARD
→ INITIAL_VISUAL_REVIEW
→ MACHINE_AUDIT
→ INITIAL_REVIEW
→ REVIEW_STAMP(INITIAL)
→ SELECTED_BOARD(INITIAL)（初回PASS時だけ）
→ AUDIT_SOURCE_CHECK（初回FAIL時だけ）
→ REPAIR_PRESERVE
→ REPAIR_BOARD
→ POST_REPAIR_MACHINE_AUDIT
→ POST_REPAIR_REVIEW
→ REVIEW_STAMP(REPAIR)
→ REPAIR_DELTA
→ SELECTED_BOARD
```

機械監査が`IMAGE_UNAVAILABLE`、`EXECUTION_UNAVAILABLE`、`ERROR`なら、この接続テストではその時点で終了し、自動repairへ進まない。

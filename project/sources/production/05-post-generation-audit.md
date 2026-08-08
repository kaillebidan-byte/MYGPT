# Post-generation Audit

この資料は、主要モーションボードを実画像として確認した後、repair内容を決めるためだけに使う。
生成前の通常プロンプトへ全文を混ぜない。

## 1. 監査対象

同時に参照する。

- 現在のチャットへ直接添付されたcanonical identity reference
- motion contract、identity anchors、slot state plan、active/support limb、end
- 実際のraw INITIAL_BOARD
- 実行できた場合は`audit/scripts/machine_audit_board.py`のJSON

表示用stamped copyは監査・repair入力へ使わない。

## 2. 7項目

必ず独立判定する。

- `identity`
- `motion_semantics`
- `continuity`
- `endpoint`
- `layout`
- `chroma`
- `unintended_output`

1項目でも重要なFAILがあればoverall FAIL。

### identity

canonical referenceを正本とする。
顔、目、髪、頭部固有部品、体格、胴体シルエット、袖、襟、裾、靴、模様、縁取り、腰飾り、房、紐、留め具、左右非対称要素を比較する。
4ポーズ間でも部品構成・接続・形状が維持されていなければFAIL。

### motion_semantics

左上→右上→左下→右下を時間順としてslot state planと照合する。
continuityまたはendpointの失敗で要求動作全体が成立しない場合もFAIL。

### continuity

時間をまたぐ同一役割の身体部位を身体への接続関係まで追う。
active limbを途中で別の手足へ移してはいけない。
前後位置だけで同一手足と推測しない。

### endpoint

one-shotのK4は`end`を満たす必要がある。
endに復帰が含まれない限りK1へ戻さない。

### layout

portrait 2:3相当の2×2、全身、共通縮尺、中央safe gap、外周safe marginを維持する。
次のmachine flagはlayout FAIL根拠へ追加する。

- `wrong_aspect`
- `outer_edge_contact`
- `center_vertical_contamination`
- `center_horizontal_contamination`

### chroma

キャラクター以外は均一単色クロマ背景。
接地影、床、gradient、光だまり、局所濃淡は禁止。
次のmachine flagはchroma FAIL根拠へ追加する。

- `border_not_uniform`
- `background_not_uniform`
- `shadow_like_background`

machine PASSでも目視影を打ち消さない。

### unintended_output

文字、Kラベル、説明、UI、枠線、矢印、モーションライン、記号、未指定エフェクトは禁止。
次のmachine flagはFAIL根拠へ追加する。

- `divider_like_vertical_white_band`
- `divider_like_horizontal_white_band`

## 3. repair preserve

初回PASS項目は自由変更可能ではない。
repair前に、PASS項目をraw INITIAL_BOARDで成立していた具体的状態へ変換する。

```text
repair_preserve:
- <item>: <維持する具体的状態>
```

FAIL項目はpreserveへ混ぜない。
machine auditのfalse flagや必要な数値は維持条件へ使ってよい。

## 4. repairの基本方式: split-cell repair

FAIL後に2×2 board全体を画像生成モデルへ再生成させない。

1. `audit/scripts/split_repair_board.py`でraw INITIAL_BOARDをK1/K2/K3/K4へ機械分割する。
2. FAILをセル単位の`CHANGE`と`LOCK`へ割り当てる。
3. 修正が必要なセルだけを単独画像として1回repairする。
4. 修正不要セルはsplitしたrawセルをそのまま使う。
5. `audit/scripts/compose_repair_board.py`で4セルを元の2×2幾何へ再合成する。
6. 合成raw REPAIR_BOARDを7項目とmachine auditで再監査する。

画像生成モデルへ最終2×2配置を再生成させない。

## 5. CELL_REPAIR_PLAN

各セルを`KEEP_RAW`または`REPAIR`にする。

```text
K1:
  action: KEEP_RAW / REPAIR
  change:
  - <直す状態>
  lock:
  - <維持する状態>
```

一般則:

- `identity` FAILは、実際にdriftがあるセルをrepair対象にする。4セル全部に問題があるなら4セル全部。
- `motion_semantics` FAILは、誤ったslot stateを持つセルをrepair対象にする。
- `continuity` FAILは、役割が切り替わった境界を特定し、必要最小限のセルをrepair対象にする。
- `endpoint` FAILは原則K4をrepair対象にする。
- layout/chroma/unintended_outputの局所FAILは該当セルをrepair対象にする。
- 問題のないセルを「念のため」で再生成しない。
- PASS項目に関係するセル状態は`lock`へ具体化する。

## 6. 参照画像の役割分離

各セルrepairでは参照の役割を混同しない。

- canonical identity reference: キャラクター同一性の正本
- 当該raw split cell: repair target、元のpose/state
- raw INITIAL_BOARD: 4時点全体のmotion context
- motion contract / 隣接セル: 時間関係とcontinuityの参照

隣接セルやrepair済みセルをidentityの新しい正本にしない。

continuity修正で隣接状態を参照するときも、「似せる」のではなく、同じ論理手足・接地側・保持側・接触対象が継続する関係を指定する。

## 7. 個別セルrepair

REPAIRセルは1セルずつ別jobで処理する。
出力はportrait 2:3の単独全身ポーズ1枚。

repair指示には今回必要なものだけを含める。

- canonical identity anchors
- 当該セルの元pose/state
- `change`
- `lock`
- 必要なactive/support limb、end、隣接状態
- 初回machine auditの`key_hex`を背景目標色として使用
- 影、床、文字、ラベル、枠、未指定エフェクト禁止

別案、A/B、同一セルの2回目repairは禁止。

## 8. split / compose責務

`split_repair_board.py`はraw boardを正確な4象限へ分割し、元board size、cell size、slot box、key色をmetadataへ保存する。

`compose_repair_board.py`は、

- REPAIRセル: 個別repair出力
- KEEP_RAWセル: split rawセル

をK1→K4順に受け取り、metadataの元位置へ決定論的に配置する。

合成時に画像生成モデルへlayout判断をさせない。
各入力セルはtarget cellと同じportrait比率を要求する。
背景色の微小差だけは元boardのkey色へ正規化してよいが、接地影や大きな濃淡まで自動消去して監査を回避してはいけない。

## 9. repair delta

修正後レビューと初回レビューを比較する。

- `fixed`: FAIL→PASS
- `remaining`: FAIL→FAIL
- `regressed`: PASS→FAIL

PASS→PASSは維持成功。

採用規則:

1. REPAIR overall PASS → `IMPROVED / REPAIR`
2. regressedが1項目でもある → `WORSE / INITIAL`
3. regressionなし、fixedあり → `IMPROVED / REPAIR`
4. regressionなし、fixedなし → `NO_CHANGE / INITIAL`

repair後がFAILでも追加repairしない。

## 10. display-only review copy

`audit/scripts/stamp_review_board.py`は人間確認用コピーだけに使う。
raw boardへ文字を焼き込まない。
stamped copyをmachine audit、repair target、canonical referenceへ使わない。

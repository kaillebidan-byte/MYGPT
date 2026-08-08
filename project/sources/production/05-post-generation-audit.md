# Post-generation Audit

この資料は主要motion boardを実画像で確認した後、repair内容を決めるために使う。生成前promptへ全文を混ぜない。

## 1. 監査対象

同時に参照する。

- 現在のチャットへ直接添付されたcanonical identity reference
- motion contract、identity anchors、slot state plan、active/support limb、end
- 実際に生成されたraw board
- 実行できた場合は`audit/scripts/machine_audit_board.py`結果

計画が正しいことを生成画像が正しい根拠にしない。表示用コピーは監査・repair入力へ使わない。

## 2. 7項目

必ず独立して判定する。

- identity
- motion_semantics
- continuity
- endpoint
- layout
- chroma
- unintended_output

1項目でも重要なFAILがあればoverall FAIL。

### identity
canonical referenceを正本とする。
顔、目、髪、頭部固有部品、体格、胴体シルエット、袖、襟、裾、靴、模様、縁取り、腰飾り、房、紐、留め具、左右非対称要素を比較する。
4ポーズ間で同じ部品構成が維持されなければFAIL。

### motion_semantics
左上→右上→左下→右下を時間順に読み、slot state planと照合する。
continuityまたはendpoint失敗で要求動作全体が成立しない場合もFAIL。

### continuity
時間をまたいで同じ役割を持つ身体部位を追跡する。
前に見える足だけで決めず、身体への接続関係を追う。
motion contractにない途中の手足・接地側・保持側・接触対象の入れ替えはFAIL。

### endpoint
one-shotのK4は`end`を満たす。
開始姿勢へ戻ることがendに含まれない限りK1へ戻さない。

### layout
portrait 2:3相当、全身、共通縮尺、中央safe gap、外周safe margin。
machine flag:
- wrong_aspect
- outer_edge_contact
- center_vertical_contamination
- center_horizontal_contamination

### chroma
キャラクター以外は均一単色クロマ。影、床、gradient、局所濃淡はFAIL。
machine flag:
- border_not_uniform
- background_not_uniform
- shadow_like_background
machine PASSでも目視影を打ち消さない。

### unintended_output
文字、Kラベル、説明文、UI、枠、矢印、モーションライン、記号、未指定effectはFAIL。
machine flag:
- divider_like_vertical_white_band
- divider_like_horizontal_white_band

## 3. repair preserve

初回PASS項目は自由変更可能ではない。
repair前に、PASS項目をraw INITIAL_BOARDで成立していた具体的状態へ変換する。

```text
repair_preserve:
- <item>: <維持する具体的状態>
```

FAIL項目はpreserveへ混ぜない。

## 4. repair基本方式

FAIL後に2×2全体を1枚のrepair結果としてそのまま採用しない。

1. `split_repair_board.py`でraw INITIAL_BOARDをK1〜K4へ分割。
2. FAILをセル単位の`CHANGE`と`LOCK`へ割り当てる。
3. 必要なセルだけrepair jobを行う。
4. repair job出力を`prepare_repair_cell.py`でcanonical 512×768 cellへ変換。
5. KEEP_RAWセルも同じprepare処理でcanonical cellへ変換。
6. `compose_repair_board.py`で1024×1536の2×2へ再合成。
7. 合成raw REPAIR_BOARDを再監査する。

画像生成モデルへ最終2×2配置を任せない。

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

- identity FAIL: driftがあるセル。全セルなら全セル。
- motion_semantics FAIL: 誤ったslot stateのセル。
- continuity FAIL: 役割が切れた境界を特定し必要最小限。
- endpoint FAIL: 原則K4。
- layout/chroma/unintended_outputの局所FAIL: 該当セル。
- 問題のないセルを念のため再生成しない。
- PASS項目に関係するセル状態はlockへ具体化する。

## 6. 参照の役割

- canonical identity reference: identity正本
- raw INITIAL_BOARD: 4時点のmotion context
- motion contract / 隣接slot: continuityと時間関係
- split cell: 画像生成toolへ実画像として渡せる場合だけrepair target

Python出力pathを文章で書いただけでは画像生成toolの視覚参照にならない。実際に渡せていない場合は「split cellを参照した」と扱わない。

## 7. repair job出力の扱い

理想は1人物の単独portrait 2:3ポーズ。
ただし画像生成側が2×2 boardを返しても、形式だけでrepair全体を失敗扱いにしない。

実画像を見て次に分類する。

- 1人物 → `mode: cell`
- 4ポーズ2×2 → `mode: board`
- その他 → invalid

`prepare_repair_cell.py`へ対象slotとmodeを渡す。
board modeでは対象K#の象限だけを抽出し、他の3象限は捨てる。

prepared cellは512×768。縦横比を歪めずfitし、背景の近似key色だけ目標keyへ正規化する。
影や大きな背景濃淡を自動削除して監査を回避してはいけない。

## 8. canonical compose

`compose_repair_board.py`の出力は初回board geometryに依存させない。
既定:

- board: 1024×1536
- cell: 512×768
- key: INITIAL machine auditのkey色

これにより初回`wrong_aspect`でもrepair後layoutを正規2:3へ戻せる。

KEEP_RAWセルも、元セルの縦横比を歪めずcanonical cellへfitしてから使う。
repair済みセルとrawセルを直接サイズ強制変形してはいけない。

## 9. 再監査

合成raw REPAIR_BOARDを同じ7項目で視覚監査し、machine auditを再実行する。
初回JSONを再利用しない。
追加repairは禁止。

## 10. repair delta

初回と修正版を比較する。

- fixed: FAIL→PASS
- remaining: FAIL→FAIL
- regressed: PASS→FAIL
- PASS→PASSは省略

採用規則:

1. REPAIR overall PASS → REPAIR
2. regressedが1件以上 → INITIAL
3. regressionなし、fixedあり → REPAIR
4. regressionなし、fixedなし → INITIAL

修正版だからという理由だけで採用しない。

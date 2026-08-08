# Post-generation Audit

この資料は主要motion boardを実画像で確認した後、repair内容を決めるために使う。生成前promptへ全文を混ぜない。

## 1. 監査対象
同時に参照する。
- 現在チャットへ直接添付されたcanonical identity reference
- motion contract、identity anchors、slot state plan、active/support limb、end
- 実際のraw INITIAL_BOARD
- 実行できた場合は`audit/scripts/machine_audit_board.py`結果

計画が正しいことを生成画像が正しい根拠にしない。

## 2. 7項目
必ず独立判定する。
- identity
- motion_semantics
- continuity
- endpoint
- layout
- chroma
- unintended_output

1項目でも重要なFAILがあればoverall FAIL。

### identity
canonical referenceを正本とする。雰囲気一致だけではPASSにしない。
頭身、頭部/胴体/袖/下衣のsilhouette、固有部品の個数・接続位置・左右関係・重なり順、顔、髪、頭部固有部品、胸部意匠、腰飾り、房、紐、留め具、靴等を比較する。canonicalとの比較と4セル相互比較の両方を行う。

### motion_semantics
左上→右上→左下→右下を時間順に読みslot state planと照合する。continuityまたはendpoint失敗で要求動作全体が成立しない場合もFAIL。

### continuity
時間をまたいで同じ役割を持つ身体部位を追跡する。前に見える足だけで決めず身体への接続関係を追う。motion contractにない手足・接地側・保持側・接触対象の入れ替えはFAIL。

### endpoint
one-shotのK4は`end`を満たす。開始姿勢へ戻ることがendに含まれない限りK1へ戻さない。

### layout
portrait 2:3相当、全身、共通縮尺、中央safe gap、外周safe margin。
machine flag: wrong_aspect / outer_edge_contact / center_vertical_contamination / center_horizontal_contamination

### chroma
キャラクター以外は均一単色クロマ。影、床、gradient、局所濃淡はFAIL。
machine flag: border_not_uniform / background_not_uniform / shadow_like_background
machine PASSでも目視影を打ち消さない。

### unintended_output
文字、Kラベル、説明文、UI、枠、矢印、モーションライン、記号、未指定effectはFAIL。
machine flag: divider_like_vertical_white_band / divider_like_horizontal_white_band

## 3. repair preserve
初回PASS項目は自由変更可能ではない。PASS項目をraw INITIAL_BOARDで成立していた具体的状態へ変換する。FAIL項目はpreserveへ混ぜない。

## 4. repair基本方式: one coherent repair board + cell select
同一ターン自動editを前提にしない。K1〜K4を4回独立生成もしない。

1. 初回FAILをセル単位の`CHANGE`と`LOCK`へ割り当てる。
2. 追加visual jobは2×2 REPAIR_SOURCE_BOARDを1枚だけ新規生成する。
3. canonical identity referenceをidentity正本とし、4ポーズを同一board内で生成してidentity・縮尺・時間関係を共有させる。
4. `compose_repair_from_boards.py`で各slotをINITIALまたはREPAIR_SOURCEから選択する。
5. 1024×1536へ決定論的に再合成する。
6. 合成raw REPAIR_BOARDを再監査する。

画像生成回数は原則INITIAL + REPAIRの2回。K別job、A/B、追加repairは禁止。

## 5. CELL_REPAIR_PLAN
各セルを`KEEP_INITIAL`または`USE_REPAIR`にする。

```text
K1:
  source: KEEP_INITIAL / USE_REPAIR
  change:
  - <直す状態>
  lock:
  - <維持する状態>
```

一般則:
- identity FAIL: driftがあるセル。全セルなら全セル。
- motion_semantics FAIL: 誤ったslot stateのセル。
- continuity FAIL: 役割が崩れた境界の必要最小セル。
- endpoint FAIL: 原則K4。
- layout/chroma/unintended_outputの局所FAIL: 該当セル。
- 問題のないセルはKEEP_INITIAL。
- PASS状態はlockへ具体化する。

## 6. REPAIR_SOURCE_BOARD生成
REPAIR_SOURCE_BOARDはraw INITIAL_BOARDの画像editではなく、新しい2×2 repair boardとして1回だけ生成する。

生成指示へ含める:
- canonical identity anchors
- 元motion contract / slot state plan
- active/support limb / end
- INITIAL_REVIEWで確認したFAIL
- repair_preserve
- CELL_REPAIR_PLANのchange / lock
- INITIAL key_hexに近い均一クロマ
- 影、床、文字、枠、grid、UI、未指定effect禁止

4セルを1枚のboard内で同時生成し、相互整合性を持たせる。K別画像を作らない。

raw INITIAL_BOARDが会話内に見えていても、それを編集targetとして使えたと主張する必要はない。canonical identity referenceは引き続き直接添付画像だけを正本にする。

## 7. CELL SELECT COMPOSE
GitHubの`audit/scripts/compose_repair_from_boards.py`を使う。

```text
python audit/scripts/compose_repair_from_boards.py \
  --initial <raw INITIAL_BOARD> \
  --edited <raw REPAIR_SOURCE_BOARD> \
  --use-edited <USE_REPAIR labels> \
  --target-key <INITIAL key_hex> \
  --output raw_repair_board.png
```

`--edited`は互換引数名であり、入力は画像edit結果ではなくREPAIR_SOURCE_BOARD。

各slot:
- KEEP_INITIAL → INITIAL_BOARDの同じ象限
- USE_REPAIR → REPAIR_SOURCE_BOARDの同じ象限

出力既定:
- board: 1024×1536
- cell: 512×768
- key: INITIAL machine auditのkey色

元boardがwrong_aspectでも誤geometryを継承しない。各source cellは縦横比を歪めずcanonical cellへfitする。近似key色は初回keyへ正規化してよいが、影や大きな背景濃淡を消して監査を回避してはいけない。

## 8. 再監査
合成raw REPAIR_BOARDを同じ7項目で視覚監査しmachine auditを再実行する。初回JSONを再利用しない。追加repairは禁止。

## 9. repair delta
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

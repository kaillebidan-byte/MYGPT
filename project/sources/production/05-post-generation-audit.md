# Post-generation Audit

この資料はraw INITIAL_BOARDの実画像監査後、repair内容と採用セルを決めるために使う。生成前promptへ全文を混ぜない。

## 1. 監査対象
参照:
- 直接添付されたcanonical identity reference
- IDENTITY_CONTRACT
- MOTION_CONTRACT（slot_state_plan / active-support limb / end）
- raw INITIAL_BOARD
- machine audit結果

計画が正しいことを生成画像が正しい根拠にしない。

## 2. 7項目
独立判定:
`identity / motion_semantics / continuity / endpoint / layout / chroma / unintended_output`

### identity
canonicalを正本とし、雰囲気一致でPASSにしない。
IDENTITY_CONTRACTの次を確認する:
- proportions
- silhouette
- topology: 固有部品の個数・接続位置・左右関係・重なり順
- occlusion_map: 部品同士の覆い方・境界。帽子と髪、髪と顔、袖と手、腰飾りと衣装等
- anchors: 顔、髪、頭部品、胸部/腰部意匠、房/紐/留め具、裾、靴等

canonicalにない部品追加、欠落、左右反転、別形状化、接続変更、覆い関係変更はFAIL。canonicalとの比較と4セル相互比較の両方を行う。

### motion_semantics
K1→K2→K3→K4を時間順に読みslot_state_planと照合する。continuityまたはendpoint失敗で要求動作全体が成立しない場合もFAIL。

### continuity
同じ役割の手足・保持側・接地側・接触対象を身体への接続まで追う。途中で役割を入れ替えない。

### endpoint
one-shotのK4はendを満たす。endに戻りがない限りK1へ戻さない。

### layout
portrait 2:3相当、全身、共通縮尺、中央safe gap、外周safe margin。
machine flag:
`wrong_aspect / outer_edge_contact / center_vertical_contamination / center_horizontal_contamination`

### chroma
キャラクター以外は均一単色クロマ。床、影、gradient、局所濃淡はFAIL。
machine flag:
`border_not_uniform / background_not_uniform / shadow_like_background`
machine PASSでも目視影を打ち消さない。

### unintended_output
文字、番号、丸数字、Kラベル、説明文、UI、枠、divider、grid、矢印、モーションライン、記号、未指定effectはFAIL。
machine flag:
`divider_like_vertical_white_band / divider_like_horizontal_white_band`

## 3. repair preserve
初回PASS項目は自由変更可能ではない。raw INITIAL_BOARDで成立していた具体状態へ変換する。FAIL項目はpreserveへ混ぜない。

## 4. repair方式
同一ターン自動editを前提にしない。K1〜K4を4回独立生成しない。追加生成はREPAIR_SOURCE_BOARDを1枚だけ。

手順:
1. 初回FAILをslot単位のCHANGE/LOCKへ割り当てる。
2. REPAIR_SOURCE_BOARDを1枚生成。
3. REPAIR_SOURCEを合成前に7項目で実画像レビュー。
4. INITIALとREPAIR_SOURCEの対応slotを実画像比較。
5. 各slotの採用元をINITIAL/REPAIRから決める。
6. 選択列全体のcontinuity/endpointを確認。
7. `compose_repair_from_boards.py`で1024×1536へ合成。
8. 合成raw REPAIR_BOARDを再監査。

生成前に「修正対象だからREPAIRを採用」と決めない。

## 5. REPAIR_TARGET_PLAN
各slot:
```text
K1:
  needs_change: yes/no
  change:
  - <直す状態>
  lock:
  - <維持状態>
```

一般則:
- identity FAIL: そのセルのIDENTITY_CONTRACT違反をchangeへ。
- motion_semantics FAIL: 誤ったslot state。
- continuity FAIL: 役割が切れた境界の必要最小slot。
- endpoint FAIL: 原則K4。
- layout/chroma/unintended_output: 該当slot。
- PASS状態はlockへ具体化。

## 6. REPAIR_SOURCE_BOARD
canonical identity referenceを正本とし、IDENTITY_CONTRACTとMOTION_CONTRACTを再適用する。repair_preserveとREPAIR_TARGET_PLANも含める。

画像生成向けには内部K番号を描画要素にしない。位置と時間順を「左上の開始」「右上の次状態」等の文章で伝え、1枚の連続したmagentaキャンバス上へ4ポーズを四象限配置する。

INITIAL key_hexに近い均一クロマを要求し、影、床、文字、番号、丸数字、ラベル、枠、divider、grid、UI、未指定effectは禁止。
4ポーズを同じ1枚内で生成し、identity・縮尺・時間関係を共有させる。

## 7. REPAIR_SOURCE_REVIEW / POST_SOURCE_COMPARE
REPAIR_SOURCE生成後、まずREPAIR_SOURCE単体を7項目で監査する。特に次を省略しない:
- identityのsilhouette / topology / occlusion_map
- continuity / endpoint
- 番号、丸数字、ラベル、divider、grid等のunintended output

次にINITIALとREPAIR_SOURCEの対応slotを比較する。

各slotの優先順位:
1. identity fidelity
2. required slot state / motion phase
3. unintended output
4. local chroma / layout

機械的layout改善だけで、identityやmotionが同等以下のREPAIRセルを自動優先しない。REPAIRに新しい番号・ラベル・部品追加がありINITIAL側にない場合は明示的な不利とする。

暫定4セル列をK1→K4で読み、continuityとendpointを確認する。混在選択によって同一手足・保持側・接地側・接触対象が切り替わる場合は関連slotの採用元を見直す。局所的に良くてもsequenceを壊すセルは採用しない。

出力:
```text
CELL_SOURCE_DECISION
K1: INITIAL / REPAIR
K2: INITIAL / REPAIR
K3: INITIAL / REPAIR
K4: INITIAL / REPAIR
reason:
- 主要理由
```

## 8. compose
`compose_repair_from_boards.py`へREPAIRを選んだlabelだけ`--use-edited`として渡す。`--edited`は互換引数名で、実体はraw REPAIR_SOURCE_BOARD。

出力既定:
- board: 1024×1536
- cell: 512×768
- key: INITIAL machine auditのkey色

元boardがwrong_aspectでも誤geometryを継承しない。近似key色の正規化は可。影、濃淡、文字、ラベル等を消して監査を回避しない。

## 9. 再監査 / delta
合成raw REPAIR_BOARDを同じ7項目で視覚監査しmachine auditを再実行する。初回JSONを再利用しない。追加repairは禁止。

比較:
- fixed: FAIL→PASS
- remaining: FAIL→FAIL
- regressed: PASS→FAIL

採用:
1. REPAIR overall PASS → REPAIR
2. regressedあり → INITIAL
3. regressionなし、fixedあり → REPAIR
4. regressionなし、fixedなし → INITIAL

修正版だからという理由だけで採用しない。

# Post-generation Audit

この資料は4枚のraw frameと、それらをPython合成したraw boardを監査し、必要なframeだけ1 round修正するために使う。生成前promptへ全文を混ぜない。

## 1. 監査対象

参照:
- 直接添付canonical identity reference
- IDENTITY_CONTRACT
- MOTION_CONTRACT（F1〜F4 / continuity invariants / end）
- raw F1〜F4
- composed raw INITIAL_BOARD
- machine audit結果

計画が正しいことを生成画像が正しい根拠にしない。

## 2. frame visual review

各raw frameをcanonicalと比較し、少なくとも次を判定する。

- `identity`: proportions / silhouette / topology / occlusion / anchors
- `state`: そのF状態として正しいか
- `unintended_output`: 人物追加、文字、番号、枠、sheet要素、床、影、未指定effect

canonicalにない部品追加、欠落、左右反転、接続変更、覆い関係変更はidentity FAIL。

4枚を時間順に並べて次を判定する。

- `motion_semantics`
- `continuity`
- `endpoint`

同じ役割の手足・保持側・接地側・接触対象を身体への接続まで追う。

## 3. board audit

`compose_keypose_board_from_frames.py`でF1〜F4を合成し、`machine_audit_board.py`を実行する。

7項目:
`identity / motion_semantics / continuity / endpoint / layout / chroma / unintended_output`

layout machine flags:
`wrong_aspect / outer_edge_contact / center_vertical_contamination / center_horizontal_contamination`

chroma:
`border_not_uniform / background_not_uniform / shadow_like_background`

unintended:
`divider_like_vertical_white_band / divider_like_horizontal_white_band`

machine PASSは目視FAILを打ち消さない。

## 4. repair plan

初回全PASSならrepairしない。

FAIL時は原因を必要最小限のframeへ割り当てる。

```text
FRAME_REPAIR_PLAN
F1: KEEP / REPAIR
F2: KEEP / REPAIR
F3: KEEP / REPAIR
F4: KEEP / REPAIR
reason:
- ...
```

一般則:
- identity FAIL: 実際にdriftしたframe
- state FAIL: 誤った時間状態のframe
- continuity FAIL: 役割が切れた境界の必要最小frame
- endpoint FAIL: 原則F4
- 影・文字等: その欠陥を含むframe
- Python compose由来の純粋layout問題は生成repairせずcompose設定を確認する

## 5. repair frame

REPAIR対象だけを各1回生成する。同じcanonicalをidentity anchorとし、失敗frameはmotion state参照には使えてもidentity正本にしない。

repair promptは短くする:
- canonicalと同一人物
- 直すstate / identity違反
- continuity invariant
- 初回で成立していた状態のLOCK
- 人物1体、全身、portrait、flat chroma
- 文字、番号、sheet、床、影、effect禁止

1frameにつきrepair生成は最大1回。2回目repairは禁止。

## 6. source decision

repair候補があるframeはINITIALとREPAIRをcanonical / motion contractへ照合して比較する。

優先順位:
1. identity fidelity
2. required state
3. unintended output
4. chroma extraction suitability

```text
FRAME_SOURCE_DECISION
F1: INITIAL / REPAIR
F2: INITIAL / REPAIR
F3: INITIAL / REPAIR
F4: INITIAL / REPAIR
```

暫定4frame列を時間順に読み、混在選択でcontinuity / endpointが壊れる場合は採用元を見直す。

## 7. recompose / delta

選択4frameを再度`compose_keypose_board_from_frames.py`で合成し、同じ7項目とmachine auditを再実行する。

比較:
- fixed: FAIL→PASS
- remaining: FAIL→FAIL
- regressed: PASS→FAIL

採用:
1. FINAL overall PASS → FINAL
2. regressionあり → INITIAL
3. regressionなし、fixedあり → FINAL
4. fixedなし → INITIAL

追加repairは禁止する。

最終成果物は選択されたraw board。監査・修正には表示用スタンプ等を焼き込んだコピーを使わない。

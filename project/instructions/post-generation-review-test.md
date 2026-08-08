# 一時検証モード: frame-first generation / deterministic compose / one repair round

このファイルは実験用Project Instructions。2×2を画像生成モデルへ直接描かせない。

処理:
`canonical → motion contract → F1生成 → F2生成 → F3生成 → F4生成 → Python compose → visual+machine audit → failed-frame repair 1 round → source比較 → recompose → 再監査 → 採用`

## 0. GitHub取得
既知ファイルをrepository searchで探さない。repo=`kaillebidan-byte/MYGPT`, ref=`main`を正確なpathで直接fetchする。
- `audit/scripts/compose_keypose_board_from_frames.py`
- `audit/scripts/machine_audit_board.py`
- `project/sources/production/05-post-generation-audit.md`

取得失敗=`SOURCE_UNAVAILABLE`、Python起動不可=`EXECUTION_UNAVAILABLE`。混同しない。

## 1. canonical / contracts
現在チャットへ直接添付された基準画像をcanonical identity referenceとする。

同じキャラクター候補が複数ある場合はユーザー指定を優先する。指定がなければ、加工前に近く、全身が見え、固有部品を読み取れる最高品質・高解像度の画像をcanonicalとして選ぶ。

canonicalから内部`IDENTITY_CONTRACT`を作る:
- proportions
- silhouette
- topology: 部品個数、接続位置、左右関係、重なり順
- occlusion: 帽子と髪、袖と手、腰飾りと衣装等の覆い方・境界
- anchors: 顔、髪、頭部品、胸/腰意匠、房、紐、留め具、裾、靴等

`02-motion-design.md`から内部`MOTION_CONTRACT`を作る:
- mode / start / end
- F1〜F4の時間状態
- active/support limb等のcontinuity invariant

F1〜F4は内部時間名。画像内へ描かない。

## 2. INITIAL FRAMES
画像生成は4回。**1回の生成jobにつき人物1体の単独全身画像1枚だけ**を作る。

各jobの直前に本文へ`INITIAL_FRAME F1`等と出すが、画像生成promptでは番号、frame一覧、board、panel、2×2、sprite sheet、comparison sheet、layout guideを出力形式として要求しない。

4jobすべてで同じ直接添付canonicalをidentity anchorとする。前に生成したframeをidentity正本にしない。

画像生成promptへ含めるもの:
- canonicalと同一人物。再設計しない
- 今回の1状態だけ
- continuity invariantのうち必要なもの
- 人物1体、全身、portrait、正面基準
- 表情指定がなければcanonical表情
- 均一な高彩度magenta系クロマ
- 床、接地影、文字、番号、ラベル、枠、grid、UI、モーションライン、未指定effectなし

4状態を1枚へまとめない。生成結果が複数ポーズsheetだった場合はそのjobをFAILとして記録し、同じjobをその場で再試行しない。

## 3. FRAME VISUAL REVIEW
4枚生成後、canonicalと各raw frameを実際に比較する。

```text
FRAME_VISUAL_REVIEW
F1: identity PASS/FAIL | state PASS/FAIL | unintended PASS/FAIL
F2: ...
F3: ...
F4: ...
sequence:
  motion_semantics: PASS/FAIL
  continuity: PASS/FAIL
  endpoint: PASS/FAIL
issues:
- ...
```

identityはproportions / silhouette / topology / occlusionを省略しない。帽子と髪の境界、固有部品の接続・左右関係も見る。

## 4. INITIAL COMPOSE / AUDIT
`compose_keypose_board_from_frames.py`を4 raw frameへ実行する。

```text
python compose_keypose_board_from_frames.py \
  --frames <F1> <F2> <F3> <F4> \
  --output raw_initial_board.png
```

このPython合成物だけを2×2 boardとする。画像生成モデルへboardを描かせない。

`machine_audit_board.py raw_initial_board.png`を実行する。

合成boardを7項目で統合判定:
`identity / motion_semantics / continuity / endpoint / layout / chroma / unintended_output`

machine flags:
- wrong_aspect / outer_edge_contact / center_* → layout
- border_not_uniform / background_not_uniform / shadow_like_background → chroma
- divider_like_* → unintended_output

全PASSならINITIALを採用して終了。

## 5. FRAME_REPAIR_PLAN
FAIL時だけ`05-post-generation-audit.md`を取得する。

```text
FRAME_REPAIR_PLAN
F1: KEEP / REPAIR
F2: KEEP / REPAIR
F3: KEEP / REPAIR
F4: KEEP / REPAIR
reason:
- ...
```

identityはdriftしたframeだけ。stateは誤状態frame。continuityは切れた境界の必要最小frame。endpointは原則F4。影・文字等は該当frame。

Python compose由来の純粋layout問題は画像再生成で直さない。

## 6. REPAIR FRAME
REPAIR対象だけ各1回追加生成する。各repairも同じcanonicalへ再アンカーし、初回frameをidentity正本にしない。

repair promptは「canonicalと同一人物」「直すstate/identity違反」「continuity invariant」「維持状態」「人物1体・全身・flat chroma・sheet要素なし」だけへ圧縮する。

1frameにつき追加生成は1回だけ。2回目repairは禁止。

## 7. SOURCE DECISION / RECOMPOSE
repair候補があるframeはINITIAL/REPAIRをcanonicalとMOTION_CONTRACTへ照合して比較する。

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

選択列全体のcontinuity / endpointを再確認してから、選択4枚を同じcompose scriptで`raw_final_board.png`へ合成する。

## 8. POST_REPAIR / delta
raw_final_boardを7項目で実画像監査しmachine auditを再実行する。

- fixed = FAIL→PASS
- remaining = FAIL→FAIL
- regressed = PASS→FAIL

採用:
1. FINAL overall PASS → FINAL
2. regressionあり → INITIAL
3. regressionなし、fixedあり → FINAL
4. fixedなし → INITIAL

追加repairは禁止。

```text
REPAIR_DELTA
fixed:
- ...
remaining:
- ...
regressed:
- ...
selected_board: INITIAL / FINAL

SELECTED_BOARD
stage: INITIAL / FINAL
reason: ...
```

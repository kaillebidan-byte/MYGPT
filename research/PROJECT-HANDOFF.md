# MYGPT調整プロジェクト 引継ぎ

更新日: 2026-08-08 20:08 JST

GitHub `main` を正本とし、チャット記憶だけで過去方式へ戻さない。

## 最初に読む

1. `research/decisions/2026-08-08-production-v0-acceptance.md`
2. `research/decisions/2026-08-08-asset-status-classification.md`
3. `research/decisions/2026-08-08-identity-continuity-direction.md`
4. `research/audits/2026-08-08-c0-final-candidate-composed-audit.md`
5. `research/experiments/2026-08-08-n2-branch-thinking-followup-result.md`
6. `research/experiments/2026-08-08-w4-endpoint-and-final-candidate-result.md`
7. `research/experiments/2026-08-08-w3-ab-spatial-overconstraint-result.md`
8. `research/experiments/2026-08-08-w2-hand-shape-position-result.md`
9. `research/experiments/2026-08-08-w1-targeted-sleeve-invariant-result.md`
10. `research/audits/2026-08-08-n1-raw-identity-continuity-audit.md`
11. `research/experiments/2026-08-08-native-chat-worker-isolation-plan.md`
12. `research/incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`

---

## 0. 最重要制約

- repo: `kaillebidan-byte/MYGPT`
- ユーザー環境: ChatGPT Plus
- Work / Codex系の週間agentic allowanceやOpenAI API別課金をproduction前提にしない。
- 「画像生成するな」「画像生成依頼ではありません」と明示されたturnでは画像生成を絶対に起動しない。
- 設計判断前にGitHub mainをfetchする。
- 実画像 / ログ / repoで確認可能なことを確認してから答える。
- ユーザー側の次作業を回答先頭に出す。確定済みでそのturnに実行可能なら説明だけで止めず実行する。

---

## 1. CURRENT production v0 scope

production v0の対象範囲を固定した。

対象:
- 1人
- canonical静止姿勢から開始
- one-shot motion
- 4 keyposes
- F1 = canonicalそのもの
- F2/F3/F4のみ生成
- 正面基準の共通カメラ
- chroma background
- deterministic board / strip composition

まだv0 production成立を主張しない対象:
- loop
- canonicalと異なる開始姿勢
- 複数人物
- 大きなcamera / viewpoint change
- 複雑なprop / environment interaction
- Thinking default
- zero-click fan-out

Acceptance正本:
`research/decisions/2026-08-08-production-v0-acceptance.md`

---

## 2. carrier / context isolation — 解決済み

通った構成:
- minimal Custom GPT
- Instant
- fresh conversation per generated frame
- canonical `kokyo_base_20260805.png` を毎回直接添付
- current single static poseだけを見る
- Knowledgeなし / Webなし / Codeなし / Actionsなし / Appsなし

N1:
- 4/4 standalone portrait
- 2x2 / labels / dividersなし
- right-hand progression成立

N2 Branch:
- clean pre-motion seedからBranch PASS
- same Custom GPT継承 PASS
- canonical image reference effective PASS
- Instant利用可能 PASS
- global motion context混入なし

Branchはcanonical再添付を省けるoptional UX reduction。
zero-click worker spawn / packet配布ではない。

---

## 3. Thinking follow-up

N0ではCustom GPT / Thinkingで画像生成tool availability FAILを実機再現した。
N2 follow-upではclean-seed Branch先をThinkingへ切り替えた後の画像生成が成功し、A/B 2候補が返った。

したがって「Custom GPT / Thinkingは画像生成不可」という一般則は撤回。
N0はその時点のruntime/tool-availability incidentとして保存する。

外部既存事例でもCustom GPT image generationの成功・失敗にaccount/session/client variabilityがあった。

ただし:
- BranchがThinking成功の原因とは未証明
- Thinkingの安定性は未証明
- Instantより高品質とは未証明
- A/B multiplicityは保証仕様ではない

現行production defaultはN1/W1-W4/C0の検証鎖があるInstantを維持。

---

## 4. identity / continuity — W1-W4で必要箇所だけ改善済み

N1 raw audit:
- regenerated neutral startは不採用
- moving framesのglobal identityは概ね良好
- 主問題はactive anatomical-right large sleeveとvisible hand articulation

W1:
- active large sleeveの短い不変条件だけ追加
- opening / gold trim / grey lining / motifを維持
- PASS

現行workerで維持する文:

`動かす腕の大袖は、腕の屈曲に伴ってたわみ・向きが変わってよいが、基準画像の大袖としての基本構造を維持する。袖口の開口、金色の縁取り、灰色の内側、袖の模様を、別構造へ描き替えたり消したりしない。`

W2:
- local packetでneutral hand articulationを明示
- hand shape改善

W3:
- over-strong spatial exclusionはF3ではなくF2相当を記述していた
- BをF2候補へ転用

W4:
- chest-flower endpoint
- endpoint / sleeve / carrier PASS

W-series generation tuningは終了。

---

## 5. CURRENT final candidate / C0

- F1 = canonical `kokyo_base_20260805.png`
- F2 = W3-B `19_12_14 (2)`
- F3 = W2 `19_07_53`
- F4 = W4 `19_17_55`

時間進行:
1. neutral start
2. upper-waist / lower-torso early raise
3. near-flower late raise
4. hand over chest-flower endpoint

side swapなし、endpoint reversionなし。

C0実行済み:
- chroma removal
- common scale / baseline normalization
- deterministic 2x2 board
- chronological transparent strip
- mechanical geometry/chroma audit
- visual identity/motion audit

2x2 boardのmachine audit全flag false:
- wrong aspectなし
- outer edge contactなし
- center contaminationなし
- divider-like white bandなし
- border/background uniformity failureなし
- shadow-like backgroundなし

Visual:
- right-hand monotonic progression PASS
- endpoint PASS
- active sleeve topology PASS
- hand articulation PASS / minor redraw only
- hat/hair / non-active sleeve / chest flower / waist medallion / major tassel-cord layout / lower garment / shoesにproduction-blocking failureなし

これはCURRENT candidate PASS。
まだproduction v0 generalized PASSではない。

---

## 6. chroma removal / active infrastructure

`audit/scripts/remove_chroma_key.py`へdominant-channel despill追加済み。

- detected keyに単一dominant channelがある場合だけ自動despill
- near-key pixelだけ対象
- dominant key channelをnon-key channels基準でcap
- threshold / feather alpha処理は維持
- `--no-despill`で無効化可能

white / black compositeで緑フリンジ減少を確認済み。
patch commit:
- `f33abec67811e85bfc3eddf2d283383315eea47f`

CURRENT ACTIVE:
- `audit/scripts/remove_chroma_key.py`
- `audit/scripts/compose_keypose_board_from_frames.py`
- `audit/scripts/build_motion_strip.py`
- `audit/scripts/machine_audit_board.py`

---

## 7. CURRENT production architecture

```text
natural motion request
        ↓
planner understands full motion
        ↓
F1 = canonical
        ↓
planner emits F2/F3/F4 independent local static packets
        ↓
F2/F3/F4 = isolated Custom GPT / Instant workers
             canonical + current one pose only
        ↓
identity / continuity audit
        ↓
remove_chroma_key.py (despill enabled)
        ↓
common scale / baseline normalization
        ↓
compose_keypose_board_from_frames.py / build_motion_strip.py
        ↓
visual identity/motion audit + machine geometry/chroma audit
```

4 keyposesを3 image generationsで作る。

Worker設定:
- Instant validated default
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- Knowledge NONE
- canonical直接添付 / inherited clean Branch seed
- full motion / other packets / progress% / F1-F4 / sequence / board / sheetを見せない
- targeted active-sleeve invariantだけ追加

visible handは各local packetへabsolute articulation / palm orientationを書く。

---

## 8. Asset status — P0で整理済み

正本:
`research/decisions/2026-08-08-asset-status-classification.md`

分類:

CURRENT ACTIVE:
- current minimal Custom GPT / Instant worker architecture
- active post-processing / audit scripts

CURRENT CONTROL / EVIDENCE:
- handoff / decision / experiment / audit / incident records
- generation workerには見せない

TEST / AUDIT FIXTURE:
- layout guide generator
- `audit/references/layout-guides/**`
- past fixed audit artifacts
- generation referenceには戻さない

FROZEN LEGACY:
- `project/**`
- `legacy/**`

2026-08-08、root READMEをCURRENT architectureへ更新。
`project/instructions/project-instructions.md`へFROZEN LEGACY bannerを追加し、旧4-job Project構成をCURRENTと誤認しないよう修正した。

Frozen資産を再活性化する場合は、過去棄却理由を無効化する新証拠を示し、単一変数実験として扱う。

---

## 9. 次フェーズ — P1 generalization gate

N3 automationより先にproduction v0一般化を確認する。

R0:
- 既存right-hand-to-chest motion
- C0 PASS済み

R1:
- mirrored unilateral motion
- anatomical-left handをcanonical neutralから上げ、上腹部〜胸部へ到達
- side selection / opposite sleeve / non-active sleeve / hand / endpointを確認

R2:
- torso-dominant shallow bow
- 両足接地のまま上体を前傾して停止
- armsは新gestureを作らず受動追従
- torso / hat-hair / both sleeves / waist / lower garment / baselineを確認

P1ルール:
- worker global configurationを変えない
- new broad Knowledgeを追加しない
- first-pass failureは記録する
- isolated retry成功をfirst-pass PASSへ書き換えない
- local packet design failureとgeneration architecture failureを分離する

R1/R2最終PASS後にproduction v0 generalized verdictを出す。
その後N3 orchestration friction / automation ceilingへ進む。

---

## 10. やらないこと

- W-series生成調整を再開しない
- broad identity Knowledgeを追加しない
- global worker proseを増やさない
- F2/F3/F4を微差だけのため再生成しない
- direct 2x2 generationへ戻さない
- generated-frame identity chainingをしない
- full-board repairへ戻さない
- Thinking成功1回だけを理由にproduction workerを切り替えない
- Thinking failureをprompt repairで追い続けない
- BranchのA/B出力数を保証仕様として扱わない
- `project/**` / `legacy/**`をCURRENT generation runtimeへそのまま戻さない
- layout guideをgeneration referenceへ戻さない

---

## 11. 運用順序

1. GitHub CURRENT確認
2. 実画像 / ログ確認
3. 問題局所化
4. 既存方針との整合確認
5. 必要最小限の変更
6. 確定済みならそのturnで実行
7. ユーザー作業を回答先頭に提示

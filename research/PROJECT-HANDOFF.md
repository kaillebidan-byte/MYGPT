# MYGPT調整プロジェクト 引継ぎ

更新日: 2026-08-08 20:39 JST

GitHub `main` を正本とし、チャット記憶だけで過去方式へ戻さない。

## 最初に読む

1. `research/decisions/2026-08-08-production-v0-acceptance.md`
2. `research/audits/2026-08-08-p1-r1-final-composed-audit.md`
3. `research/experiments/2026-08-08-p1-r2-torso-bow-plan.md`
4. `research/decisions/2026-08-08-asset-status-classification.md`
5. `research/decisions/2026-08-08-identity-continuity-direction.md`
6. `research/audits/2026-08-08-c0-final-candidate-composed-audit.md`
7. `research/experiments/2026-08-08-p1-r1-first-pass-result.md`
8. `research/experiments/2026-08-08-n2-branch-thinking-followup-result.md`
9. W1-W4 experiment records
10. `research/experiments/2026-08-08-native-chat-worker-isolation-plan.md`
11. `research/incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`

---

## 0. 最重要制約

- repo: `kaillebidan-byte/MYGPT`
- ユーザー環境: ChatGPT Plus
- Work / Codex系週間agentic allowanceやOpenAI API別課金をproduction前提にしない。
- 「画像生成するな」「画像生成依頼ではありません」と明示されたturnでは画像生成を絶対に起動しない。
- 設計判断前にGitHub mainと実画像 / ログを確認する。
- そのturnで実行できる確定作業を「次にやる」で先送りしない。
- ユーザー側の次作業を回答先頭に出す。

---

## 1. CURRENT production v0 scope

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

まだv0 production成立を主張しない:
- loop
- canonicalと異なる開始姿勢
- 複数人物
- 大きなcamera/viewpoint change
- 複雑なprop/environment interaction
- Thinking default
- zero-click fan-out

Acceptance正本:
`research/decisions/2026-08-08-production-v0-acceptance.md`

Production v0 generalized PASSにはR0 + R1 + R2が必要。

---

## 2. CURRENT production architecture

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
raw visual identity / motion audit
        ↓
remove_chroma_key.py (despill enabled)
        ↓
common scale / baseline normalization
        ↓
compose_keypose_board_from_frames.py / build_motion_strip.py
        ↓
visual audit + machine geometry/chroma audit
```

4 keyposesを3 image generationsで作る。
Generated frameを次frameのidentity sourceにしない。

Worker設定:
- minimal Custom GPT
- Instant validated default
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- Knowledge NONE
- canonical direct attachment / inherited clean Branch seed
- current one static pose only
- targeted active-large-sleeve invariant only

Workerへ見せない:
- full motion
- other pose packets
- progress%
- F1/F2/F3/F4 sequence structure
- board / sheet / storyboard / 2x2 concepts
- other generated frames

Visible handが重要なframeではlocal packetへabsolute articulation / palm orientationを書く。

Isolation起点:
- fresh conversation + canonical再添付: proven
- clean pre-motion seedからBranch: N2 PASS

Branchはcanonical再添付を省けるoptional UX reductionで、zero-click fan-outではない。

---

## 3. Carrier / context isolation

N1:
- 4/4 standalone portrait
- no 2x2 / labels / dividers
- right-hand progression成立

N2 Branch:
- same Custom GPT継承 PASS
- canonical image reference effective PASS
- Instant利用可能 PASS
- global motion context混入なし

Carrier / 2x2問題は解決済みとして扱う。

---

## 4. Thinking follow-up

N0ではCustom GPT / Thinkingでtool availability FAILを実機再現。
N2 follow-upではclean-seed Branch先をThinkingへ切り替えた後の画像生成が成功し、A/B 2候補が返った。

したがって「Custom GPT / Thinkingは画像生成不可」という一般則は撤回。
N0は当時のruntime/tool-availability incidentとして保存。

R1 InstantでもA requestがA/B 2候補を返したため、candidate multiplicityはThinking固有ではない。
Instant / Thinkingどちらも出力枚数を保証仕様として扱わない。

Production defaultはN1/W1-W4/C0/R1の証拠鎖があるInstantのまま。

---

## 5. Identity / continuity tuning — CLOSED

N1 raw auditで主問題をactive large sleeveとvisible hand articulationへ局所化。

W1:
- active large sleeve targeted invariant追加
- PASS

現行workerで維持する文:

`動かす腕の大袖は、腕の屈曲に伴ってたわみ・向きが変わってよいが、基準画像の大袖としての基本構造を維持する。袖口の開口、金色の縁取り、灰色の内側、袖の模様を、別構造へ描き替えたり消したりしない。`

W2:
- visible hand articulation / palm orientationをlocal packetへ明示

W3:
- over-strong spatial exclusionはF3をF2相当に押し下げた
- broad/global ruleへ昇格しない

W4:
- chest-flower endpoint PASS

W-series generation tuningは終了。
Global worker proseを増やさない。

---

## 6. R0 / C0 — right-hand regression case PASS

Final candidate:
- F1 = canonical `kokyo_base_20260805.png`
- F2 = W3-B `19_12_14 (2)`
- F3 = W2 `19_07_53`
- F4 = W4 `19_17_55`

C0:
- chroma removal PASS
- common scale / baseline PASS
- deterministic 2x2 PASS
- visual identity / motion PASS
- machine geometry/chroma flags all false
- despill後white / black compositeでproduction-blocking fringeなし

R0 is PASS.

---

## 7. P1-R1 — mirrored anatomical-left motion FINAL PASS

Plan:
`research/experiments/2026-08-08-p1-r1-mirrored-unilateral-plan.md`

First-pass result:
`research/experiments/2026-08-08-p1-r1-first-pass-result.md`

Final audit:
`research/audits/2026-08-08-p1-r1-final-composed-audit.md`

Final selected sequence:
- F1 = canonical
- F2 = A2 `20_29_13 (2)`
- F3 = B retry-2 `20_39_04`
- F4 = C `20_31_39`

R1 raw final:
- standalone portrait PASS
- anatomical-left active side PASS
- anatomical-right non-active retention PASS
- monotonic left-hand progression PASS
- endpoint only at F4 PASS
- no endpoint reversion
- active left large-sleeve topology PASS
- visible hand PASS
- major identity structures PASS

R1 retry accounting:
- first-pass B FAIL: flowerへ早く重なった
- retry-1 B `20_36_21` FAIL: fingertipsがまだflower下部へ重なった
- retry-2 B `20_39_04` PASS: positive landmarkをlower-chest / white-garment lower edgeへ変更

Interpretation:
- small visual landmark近傍のfirst-pass spatial reliabilityは完全ではない
- failureはB local hand-to-landmark complianceへ局所化
- carrier / side / isolation / broad identityの失敗ではない
- global worker configurationは変更していない
- retry wordingをglobal ruleへ昇格しない

R1 post-processing:
- remove_chroma_key.py / despill applied
- common scale ~0.4394993
- deterministic 1024x1536 board PASS
- machine flags all false
- border key match 1.0
- background deviation ratio 0.0
- shadow-like background ratio 0.0
- white / black compositeにproduction-blocking green fringeなし

R1 = FINAL PASS AFTER LOCAL RETRIES。
First-pass failureは記録上維持する。

---

## 8. 次フェーズ — P1-R2 torso-dominant shallow bow

正本:
`research/experiments/2026-08-08-p1-r2-torso-bow-plan.md`

目的:
- unilateral hand motion以外へ一般化する
- torso / proportion continuity
- hat / hair relation under forward inclination
- both large sleeves passive continuity
- waist / tassel / lower garment continuity
- foot contact / baseline
- no independent secondary arm gesture

F1 = canonical。
A/B/Cの3 static statesだけを別Branch / fresh workerで生成する。
Worker global configurationは変更しない。

R2 raw PASS後だけpost-processing / machine auditへ進む。

R2最終PASS後にproduction v0 generalized verdictを出す。
その後N3 orchestration friction / automation ceilingへ進む。

---

## 9. Chroma / active infrastructure

CURRENT ACTIVE:
- `audit/scripts/remove_chroma_key.py`
- `audit/scripts/compose_keypose_board_from_frames.py`
- `audit/scripts/build_motion_strip.py`
- `audit/scripts/machine_audit_board.py`

`remove_chroma_key.py`:
- dominant-channel despill ON
- threshold / feather維持
- `--no-despill`で無効化可能

Patch:
`f33abec67811e85bfc3eddf2d283383315eea47f`

---

## 10. Asset status

正本:
`research/decisions/2026-08-08-asset-status-classification.md`

CURRENT ACTIVE:
- minimal Custom GPT worker architecture
- active post-processing / audit scripts

CURRENT CONTROL / EVIDENCE:
- handoff / decision / experiment / audit / incident records
- generation workerには見せない

TEST / AUDIT FIXTURE:
- layout guide generator
- `audit/references/layout-guides/**`
- historical fixed artifacts
- generation referenceには戻さない

FROZEN LEGACY:
- `project/**`
- `legacy/**`

`project/instructions/project-instructions.md`にはFROZEN LEGACY banner済み。
Root READMEはCURRENT `F1 canonical + 3 isolated workers`へ修正済み。

Frozen資産再活性化には:
1. CURRENT課題を明記
2. 過去棄却理由を特定
3. それを無効化する新証拠
4. single-variable test
5. current acceptanceで比較
6. PASS後のみstatus変更検討

---

## 11. やらないこと

- W-series tuning再開
- broad identity Knowledge追加
- global worker prose積み増し
- direct 2x2 generation
- generated-frame identity chaining
- full-board repair
- layout guideをgeneration referenceへ戻す
- `project/**` / `legacy/**`をruntimeへそのまま戻す
- Thinking成功だけでdefault切替
- output A/B数を保証仕様化
- first-pass failureをretry成功で消す

---

## 12. 運用順序

1. GitHub CURRENT確認
2. 実画像 / ログ確認
3. 問題局所化
4. 既存方針と照合
5. 必要最小限の変更
6. そのturnで実行可能なら実行
7. ユーザー作業を回答先頭に提示

# MYGPT調整プロジェクト 引継ぎ

更新日: 2026-08-08 20:55 JST

GitHub `main` を正本とする。チャット記憶だけで過去方式へ戻さない。

## 最初に読む

1. `research/decisions/2026-08-08-production-v0-generalized-verdict.md`
2. `research/decisions/2026-08-08-production-v0-acceptance.md`
3. `research/audits/2026-08-08-p1-r2-final-composed-audit.md`
4. `research/audits/2026-08-08-p1-r1-final-composed-audit.md`
5. `research/audits/2026-08-08-c0-final-candidate-composed-audit.md`
6. `research/decisions/2026-08-08-asset-status-classification.md`
7. `research/decisions/2026-08-08-identity-continuity-direction.md`
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
- そのturnで実行できる確定作業を先送りしない。
- ユーザー側の次作業がある場合は回答先頭に出す。

---

## 1. CURRENT status — PRODUCTION V0 GENERALIZED PASS

2026-08-08、acceptance contractのR0/R1/R2がすべて最終PASS。

正本:
`research/decisions/2026-08-08-production-v0-generalized-verdict.md`

Validated v0 scope:
- 1人のcanonical character
- canonical静止姿勢 = F1
- one-shot motion
- 4 keyposes
- F2/F3/F4だけを生成
- front-facing baseline camera
- chroma background
- deterministic board / strip composition

まだv0範囲外:
- loop motion
- canonicalと異なる開始姿勢
- 複数人物
- 大きなcamera / viewpoint change
- 複雑なprop / environment interaction
- Thinking default
- zero-click fan-out

First-pass reliabilityが100%という意味ではない。
R1/R2ではlocal state failureがあり、canonicalから局所retryして最終PASSしている。

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
failed local frame only: isolated retry from canonical if needed
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

---

## 3. Carrier / Branch — SOLVED

N1:
- standalone portrait 4/4
- no 2x2 / labels / dividers
- correct motion-side progression

N2 Branch:
- same Custom GPT継承 PASS
- canonical reference effective PASS
- Instant利用可能 PASS
- clean seedからglobal motion context混入なし

Isolation起点:
- fresh conversation + canonical再添付: proven
- clean pre-motion seedからBranch: proven

Branchはcanonical再添付を省けるoptional UX reduction。
worker自動spawn / packet自動配布ではない。

---

## 4. Thinking / runtime observation

N0ではCustom GPT / Thinkingでtool availability FAILを実機再現。
後のN2 BranchではThinkingへ切り替えた画像生成が成功。

したがって:
- Thinkingは一律利用不能ではない
- N0は当時のruntime/tool-availability incident
- BranchがThinking成功の原因とは未証明
- Thinkingの安定性 / Instantより高品質は未証明

R1 InstantでもA/B 2候補が返った。
候補数はInstant / Thinkingいずれの保証仕様でもない。

Production defaultはInstantを維持する。

---

## 5. Identity / continuity tuning — CLOSED

N1で主問題をactive large sleeveとvisible handへ局所化。
W1-W4で必要箇所だけ改善済み。

現行workerに残す重要文:

`動かす腕の大袖は、腕の屈曲に伴ってたわみ・向きが変わってよいが、基準画像の大袖としての基本構造を維持する。袖口の開口、金色の縁取り、灰色の内側、袖の模様を、別構造へ描き替えたり消したりしない。`

W2:
- visible hand articulation / palm orientationはlocal packetへabsoluteに書く

W3:
- strong spatial exclusionはstateを押し下げる場合がある
- broad/global ruleへ昇格しない

W4:
- endpoint / sleeve / carrier PASS

W-series generation tuningは再開しない。

---

## 6. R0 — anatomical-right hand raise PASS

Final candidate:
- F1 = canonical `kokyo_base_20260805.png`
- F2 = W3-B `19_12_14 (2)`
- F3 = W2 `19_07_53`
- F4 = W4 `19_17_55`

C0:
- visual identity / motion PASS
- active sleeve topology PASS
- endpoint PASS
- chroma removal + despill PASS
- deterministic compose PASS
- machine flags all false

---

## 7. R1 — mirrored anatomical-left hand raise FINAL PASS

Final selected:
- F1 = canonical
- F2 = A2 `20_29_13 (2)`
- F3 = B retry-2 `20_39_04`
- F4 = C `20_31_39`

First-pass history:
- B first-pass FAIL: chest flowerへ早く重なった
- B retry-1 FAIL: fingertips still overlap
- B retry-2 PASS after local positive landmark changed to lower-chest line

Final:
- correct anatomical-left side PASS
- non-active right arm PASS
- monotonic hand progression PASS
- endpoint only at F4 PASS
- active left sleeve topology PASS
- major identity PASS
- post-processing / machine audit PASS

Interpretation:
small visual landmark近傍のfirst-pass spatial reliabilityは完全ではない。
Failureはlocal stateへ局所化でき、global worker変更は不要だった。

---

## 8. R2 — torso-dominant shallow bow FINAL PASS

Plan:
`research/experiments/2026-08-08-p1-r2-torso-bow-plan.md`

First-pass:
- A PASS
- B PASS
- C FAIL: Bとbow depthがほぼ同じ + closed-eye/smileへ表情変更

Final C retry:
- `ChatGPT Image 2026年8月8日 20_51_52.png`
- absolute torso-angle target + canonical open-eye / neutral expression指定
- PASS

Final selected:
- F1 = canonical
- F2 = A `20_47_00`
- F3 = B `20_48_07`
- F4 = C retry `20_51_52`

Final visual:
- torso/head monotonic bow progression PASS
- C deeper than B PASS
- open-eye neutral expression restored PASS
- no side-turn substitution
- both feet planted
- no independent arm gesture
- both sleeve structures passive and coherent
- major identity/topology PASS

Post-processing:
- despill counts F1/F2/F3/F4 = 4068 / 2230 / 2204 / 1990
- common scale ~0.4394993
- deterministic 1024x1536 board PASS
- machine flags all false
- vertical center gap 244 px
- horizontal center gap 169 px
- background deviation 0.0
- shadow-like background 0.0
- white / black compositeにproduction-blocking fringeなし

R2 = FINAL PASS AFTER LOCAL C RETRY。
First-pass failureは履歴に保持。

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
- research handoff / decisions / experiments / audits / incidents
- generation workerには見せない

TEST / AUDIT FIXTURE:
- layout guide generator
- `audit/references/layout-guides/**`
- historical fixed artifacts
- generation referenceには戻さない

FROZEN LEGACY:
- `project/**`
- `legacy/**`

Frozen資産を再活性化する場合:
1. CURRENT課題を明記
2. 過去棄却理由を特定
3. それを無効化する新証拠
4. single-variable test
5. current acceptanceで比較
6. PASS後のみstatus変更検討

---

## 11. NEXT — N3 orchestration friction / automation ceiling

Generation-quality generalizationはv0として終了。
新しいproduction evidenceがacceptance contractを壊すまではR0-R2 tuningへ戻らない。

次に調査する:
- 3 isolated worker / Branchを手動で作る操作を減らせるか
- 3 local static pose packetを手動投入する操作を減らせるか
- ChatGPT Plusの通常Chat / Project / Custom GPT機能差分で成立するか

Production dependencyにしない:
- ChatGPT Work
- Codex系週間agentic allowance
- OpenAI API別課金

BranchはN2で成立済みだがzero-click fan-outではない。
N3では公式機能と実機可能範囲を外部確認してから設計する。

---

## 12. やらないこと

- W-series tuning再開
- R0/R1/R2をprettier variant目的で再生成
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

## 13. 運用順序

1. GitHub CURRENT確認
2. 実画像 / ログ確認
3. 問題局所化
4. 既存方針と照合
5. 必要最小限の変更
6. そのturnで実行可能なら実行
7. ユーザー作業がある場合は回答先頭に提示

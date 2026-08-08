# MYGPT — Character Motion Production / Research

ChatGPT Plus上でcanonical character imageからモーション用keyposeを生成し、Pythonでboard / stripへ決定論的に組み立てて監査するプロジェクト。

GitHub `main`を正本とし、CURRENT architectureは`research/PROJECT-HANDOFF.md`と最新decision文書を優先する。

## CURRENT status

**Production v0 generalized PASS — 2026-08-08**

Verdict:
- `research/decisions/2026-08-08-production-v0-generalized-verdict.md`

Acceptance contract:
- `research/decisions/2026-08-08-production-v0-acceptance.md`

Validated scope:
- 1 canonical character
- canonical pose = F1
- one-shot motion
- 4 keyposes total
- F2/F3/F4だけを独立生成
- front-facing baseline camera
- chroma background
- deterministic board / strip post-processing

未検証 / v0範囲外:
- loop motion
- canonicalと異なる開始姿勢
- 複数人物
- 大きなcamera / viewpoint change
- 複雑な外部prop / environment interaction
- Thinkingをproduction defaultにすること
- zero-click fan-out

## CURRENT production architecture

```text
natural-language motion request
        ↓
planner understands full motion
        ↓
F1 = canonical image itself
        ↓
planner emits independent local static packets for F2/F3/F4
        ↓
3 isolated Custom GPT / Instant workers
(each sees canonical + current one pose only)
        ↓
raw visual identity / motion audit
        ↓
remove_chroma_key.py (despill enabled)
        ↓
common scale / common foot baseline
        ↓
compose_keypose_board_from_frames.py / build_motion_strip.py
        ↓
visual audit + machine_audit_board.py
```

4 keyposesを3 image generationsで作る。
Generated frameを次frameのidentity sourceにしない。

Workerへ見せない:
- full motion
- other pose packets
- progress percentages
- F1/F2/F3/F4 sequence structure
- board / sheet / storyboard / 2x2 concepts
- other generated frames

Isolation起点:
- fresh conversation + canonical再添付: proven
- clean pre-motion seedからBranch: N2 PASS、canonical再添付を省けるoptional UX reduction

Branchはworker自動spawn / packet自動配布ではない。

## Validated worker default

- minimal Custom GPT
- Instant
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- Knowledge NONE
- canonicalを直接参照
- current single static poseのみ
- targeted active-large-sleeve invariantのみ追加

Thinkingは一律利用不能ではないが、production defaultはN1/W1-W4/C0/R1/R2の検証鎖があるInstantを維持する。
Instant / ThinkingともA/B候補数を保証仕様として扱わない。

## Generalization evidence

R0 — anatomical-right hand raise:
- C0 PASS
- identity / motion PASS
- deterministic compose PASS
- machine flags all false

R1 — mirrored anatomical-left hand raise:
- FINAL PASS after local B retries
- side selection / opposite active sleeve / endpoint PASS
- deterministic compose / machine audit PASS
- first-pass spatial failures are retained in evidence

R2 — torso-dominant shallow bow:
- FINAL PASS after local C retry
- torso/head posture, foot contact, passive sleeves, identity continuity PASS
- deterministic compose / machine audit PASS
- first-pass endpoint/expression failure is retained in evidence

This establishes production v0 generalization, not perfect first-pass reliability.
Failed local states remain independently retryable from canonical without global worker tuning.

## Active audit / post-processing

CURRENT ACTIVE:
- `audit/scripts/remove_chroma_key.py`
- `audit/scripts/compose_keypose_board_from_frames.py`
- `audit/scripts/build_motion_strip.py`
- `audit/scripts/machine_audit_board.py`

`remove_chroma_key.py` uses dominant-channel despill by default.
Board geometry / common scale / baseline / center gaps are deterministic Python responsibilities.

## Asset status

CURRENT asset policy:
- `research/decisions/2026-08-08-asset-status-classification.md`

- active audit scripts = CURRENT ACTIVE
- `research/**` = CONTROL / EVIDENCE; do not expose to generation worker
- layout guides / guide generator = TEST / AUDIT FIXTURE
- `project/**` = FROZEN LEGACY
- `legacy/**` = FROZEN LEGACY

Old Project/frame-first assets may be used for history, comparison, and failure reproduction, but not as CURRENT worker Instructions / Knowledge / generation references.
Do not return `four-pose-portrait` layout guides to generation references.

## Source-of-truth order

1. `research/PROJECT-HANDOFF.md`
2. latest `research/decisions/`
3. related audit / experiment results
4. `research/MOTION-GENERATION-EXPERIMENT-LOG.md`
5. frozen legacy assets only when comparison is necessary

## Next phase

Generation-quality generalization for v0 is closed unless new evidence breaks the acceptance contract.

Next target:
- N3 orchestration friction / automation ceiling within ChatGPT Plus

Goal:
- reduce manual creation / branching of three isolated workers
- reduce manual distribution of three local pose packets
- keep Work/Codex weekly agentic allowance and separate OpenAI API billing outside the production dependency

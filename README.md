# MYGPT — Character Motion Production / Research

ChatGPT Plus上でcanonical character imageからモーション用keyposeを生成し、Pythonでboard / stripへ決定論的に組み立てて監査するプロジェクト。

GitHub `main`を正本とし、CURRENT architectureは`research/PROJECT-HANDOFF.md`と最新decision文書を優先する。

## CURRENT production v0 architecture

対象はまず、canonical姿勢から始まる1人・one-shot・4 keypose motion。

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
identity / continuity audit
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

Custom GPT / ThinkingはN0でtool availability FAILを実機再現したが、N2 follow-upではBranch先をThinkingへ切り替えた後の画像生成が成功した。
したがってThinkingを一律利用不能とは扱わない。
ただしN1/W1-W4/C0の検証鎖があるInstantをproduction defaultとして維持する。

## Production acceptance

CURRENT acceptance contract:
- `research/decisions/2026-08-08-production-v0-acceptance.md`

既存C0成功だけでproduction一般化とは扱わない。
R0既存回帰ケースに加え、異なるfailure surfaceを持つR1/R2を同じworker global configurationで通してproduction v0を判定する。

## Active audit / post-processing

CURRENT ACTIVE:
- `audit/scripts/remove_chroma_key.py`
- `audit/scripts/compose_keypose_board_from_frames.py`
- `audit/scripts/build_motion_strip.py`
- `audit/scripts/machine_audit_board.py`

4 raw chroma framesをboard化:

```bash
python audit/scripts/compose_keypose_board_from_frames.py \
  --frames F1.png F2.png F3.png F4.png \
  --output raw-board.png
```

board監査:

```bash
python audit/scripts/machine_audit_board.py raw-board.png
```

transparent strip:

```bash
python audit/scripts/build_motion_strip.py \
  --keypose-images F1.png F2.png F3.png F4.png \
  --spec audit/specs/motion-keypose-2x2.json \
  --output motion-4f.png
```

`remove_chroma_key.py`はdominant-channel despillを通常ONで使用する。

## Asset status

CURRENT asset policy:
- `research/decisions/2026-08-08-asset-status-classification.md`

要点:
- `audit/scripts/remove_chroma_key.py` / compose / strip / machine audit = CURRENT ACTIVE
- `research/**` = CONTROL / EVIDENCE。worker runtimeへ見せない
- layout guide / guide generator = TEST / AUDIT FIXTURE
- `project/**` = FROZEN LEGACY
- `legacy/**` = FROZEN LEGACY

旧Project/frame-first資産は履歴・比較・failure reproductionには使えるが、CURRENT worker Instructions / Knowledge / generation referenceへ戻さない。

`four-pose-portrait.png` / SVG等のlayout guideをgeneration referenceへ戻さない。

## Repository map

```text
audit/
  scripts/                 # active post-processing / audit + test helpers
  references/              # fixtures; generation referenceではない

project/                   # FROZEN LEGACY Project/frame-first configuration
legacy/                    # FROZEN LEGACY historical configuration

research/
  PROJECT-HANDOFF.md       # CURRENT handoff
  decisions/               # CURRENT decisions / acceptance / asset policy
  experiments/             # experimental evidence
  audits/                  # visual / machine audit evidence
  incidents/               # failure records
  MOTION-GENERATION-EXPERIMENT-LOG.md  # permanent historical experiment log
```

## Source-of-truth order

設計判断前に次の順で確認する。

1. `research/PROJECT-HANDOFF.md`
2. 最新の`research/decisions/`
3. 関連するaudit / experiment result
4. `research/MOTION-GENERATION-EXPERIMENT-LOG.md`の過去遷移
5. frozen legacy assetsは必要な場合だけ比較用に読む

古い文書内の`CURRENT`はその実験時点の状態を示す場合がある。
最新handoff / decisionと衝突する場合は最新側を正本とする。

## Current proven result

C0 final candidate:
- F1 = canonical `kokyo_base_20260805.png`
- F2 = W3-B `19_12_14 (2)`
- F3 = W2 `19_07_53`
- F4 = W4 `19_17_55`

C0:
- deterministic compose PASS
- machine geometry/chroma flags all false
- visual identity / motion auditにproduction-blocking failureなし
- chroma-edge despill適用済み

これはCURRENT candidateの成功証拠であり、production v0 generalization verdictはR1/R2後に行う。

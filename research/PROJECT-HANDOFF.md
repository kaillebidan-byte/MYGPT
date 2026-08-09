# MYGPT調整プロジェクト — CURRENT HANDOFF

更新日: 2026-08-10 JST

GitHub `main` をdurable stateの正本とする。未merge候補や古いhandoffをCURRENTとして扱わない。

## 次チャットで最初に読む

1. `research/PROJECT-HANDOFF.md` — このCURRENT
2. `research/decisions/2026-08-10-post-image-critic-requires-explicit-followup-turn.md` — **POSTGEN-G1a-1後の最新runtime判断**
3. `research/experiments/2026-08-10-postgen-g1a1-manual-result.md` — **G1a-1実機FAIL証拠**
4. `research/plans/2026-08-09-identity-quality-closed-loop-execution-plan.md` — identity-quality全体計画
5. `research/decisions/2026-08-09-identity-quality-closed-loop-direction.md` — closed-loop方向
6. `research/prior-art/2026-08-09-identity-preserving-variation-isolated-workers.md` — identity研究
7. `extensions/mygpt-worker-fanout-v3/README.md` — Worker Orchestrator v0.5.0
8. `research/SEARCH-INDEX.md` — prior-art検索入口
9. `research/KNOWN-ISSUES.md`
10. `research/reference/README.md`

---

## 1. Production generation baseline

**Production v0 generalized PASS**

Validated:
- one canonical character
- F1 = canonical
- F2/F3/F4 are independent isolated generations
- one worker sees one local static pose only
- front-facing baseline
- chroma background
- generated frame is never promoted to identity source
- failed frame retries from original canonical in a fresh isolated worker

Do not expose to a generation-facing worker:
- full motion
- other slots
- progress/sequence
- board/sheet/2x2 concepts
- previous generated frames as identity source

Production worker remains unchanged:
`MYGPT Single Frame Worker Test`

Validated default:
- Instant
- Image Generation ON
- Web OFF
- Code/Data Analysis OFF
- Knowledge NONE
- Actions NONE

---

## 2. Browser automation baseline

Current extension on `main`:
`extensions/mygpt-worker-fanout-v3/`

Display/version:
- `MYGPT Worker Orchestrator v5`
- manifest `0.5.0`

Status:
**SELECTED-FOLDER LIVE PASS**

Frozen/proven unless new evidence says otherwise:
- one-worker-at-a-time preparation
- 15s open settle
- DataTransfer attachment
- 15s attach settle
- MAIN-world paste
- native send click
- positive submit evidence
- 5s cooldown
- passive completion monitoring
- image recovery
- selected-folder permission preflight
- verified output relocation

Do not patch `background.js`, `image_collector.js`, `output_relocator.js`, attachment/paste/send, or terminal monitoring for the current G1 result.

Session strategies:
- `fresh-chat`: supported / LIVE PASS
- `branch-thinking`: reserved / unsupported

---

## 3. Identity-quality direction

Goal: pet-feature-like stable visual variations from one canonical while changing pose/state.

Research-supported architecture remains:

```text
identity conditioning
separate from
pose/structure conditioning
separate from
evaluation/selection
```

Longer-term candidates remain:
- `ID-V1`: canonical as edit/source image
- `ID-V2`: canonical + exactly one worker-local pose/structure guide
- independent judge GPT
- MaSC / DreamBench++ reuse after image transport gate
- best-of-2 only for hard/failed frames
- optional canonical-derived local crop only for persistent local drift
- Branch -> Thinking later as an execution strategy, not identity conditioning

---

## 4. POSTGEN-G1a-1 — NEW LIVE RESULT

Experimental clone:
`MYGPT Single Frame Worker POSTGEN G1`

Fixed pose:
R2-B clear shallow bow, selected because its historical first-pass pose/identity/topology was PASS.

G1a-1 attempted this assumption:

```text
one user pose request
-> image generation
-> automatic ordinary assistant POSTGEN_AUDIT text
```

Live result on 2026-08-10:
- image generation succeeded;
- generated portrait returned;
- no `POSTGEN_AUDIT` body text appeared;
- user reported `画像生成のみで本文無`;
- DOM observation contained the user turn and an assistant/image turn whose extracted text was only `編集`;
- no turn contained `POSTGEN_AUDIT`.

Verdict:
**G1a-1 FAIL — Instructions alone did not force same-user-turn post-image dialogue continuation.**

Evidence:
- `research/experiments/2026-08-10-postgen-g1a1-manual-result.md`

Do not run the old G1a-2 orchestrator compatibility test yet. Its prerequisite audit turn did not exist.

---

## 5. Revised runtime decision

Do not equate:

```text
image generation can be followed by dialogue-model use
```

with:

```text
image tool automatically continues into ordinary assistant text in the same user turn
```

The second behavior failed in G1a-1.

CURRENT candidate architecture is now explicit-turn orchestration:

```text
USER TURN 1: local pose request
-> image generation
-> IMAGE_READY
-> bind/capture generated candidate

USER TURN 2: audit-only request
-> dialogue model critic
-> structured audit JSON
-> ACCEPT / RETRY_REQUIRED
```

Decision:
- `research/decisions/2026-08-10-post-image-critic-requires-explicit-followup-turn.md`

This fits the browser extension well because it already has proven send/observe primitives.

Critical future ordering:

```text
GENERATION_COMPLETE
-> bind generation turn + candidate image FIRST
-> persist candidate metadata
-> submit audit prompt
-> wait for audit response
-> parse audit
```

Do not rely on generic `latest assistant` after an audit turn exists.

---

## 6. NEXT ONLY — manual explicit follow-up critic gate

Use the **same G1a-1 conversation that already contains the R2-B generated image**.

Do not regenerate.
Do not open a new chat.
Do not change GPT settings.
Do not enable Action or Code Interpreter yet.

Send one second user message that explicitly says this is not an image-generation request and asks for audit-only structured text of the immediately preceding generated image against the attached canonical and R2-B target.

PASS if:
- no second image is generated;
- ordinary dialogue-model text is returned;
- result contains the requested structured audit;
- the critic clearly evaluates the already-generated candidate in the same conversation.

If PASS:
- next isolate Action on this explicit audit turn;
- then Code Interpreter file access separately;
- only after that design extension state changes.

If FAIL:
- same-worker post-image critic is not dependable in this form;
- move evaluation toward an independent judge GPT using recovered candidate + canonical.

---

## 7. Frozen boundaries

Until contrary evidence:
- original canonical is the sole identity authority
- one pose/state per generation-facing worker
- no generated-frame chaining
- no multi-pose generator context
- fresh isolated retry
- production worker unchanged
- Worker Orchestrator v0.5.0 unchanged
- no autonomous unlimited regenerate/edit loop

---

## 8. Repository maintenance

At each meaningful result update without waiting for an explicit request:
1. CURRENT / next action -> `PROJECT-HANDOFF.md`
2. gate/result -> experiment note
3. changed runtime/architecture decision -> `research/decisions/`
4. execution order / stop condition -> current plan
5. known bug -> `KNOWN-ISSUES.md`
6. external research -> `SEARCH-INDEX.md` + topic note
7. successful code baseline -> extension README/checkpoint/root README as appropriate

Do not mutate frozen successful code for documentation-only reasons.

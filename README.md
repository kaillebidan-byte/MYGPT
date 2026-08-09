# MYGPT — Character Motion Production / Research

ChatGPT Plus上でcanonical character imageからモーション用keyposeを生成し、隔離workerでF2/F3/F4を独立生成し、Pythonでboard / stripへ決定論的に組み立てて監査するプロジェクト。

GitHub `main` を正本とする。古い実験記録や過去handoffより、CURRENT文書と最新decision/checkpointを優先する。

## Start here

1. `research/PROJECT-HANDOFF.md` — **現在地・NEXT ONLY・凍結済み方針**
2. `research/audits/2026-08-10-custom-gpt-thinking-imagegen-existing-methods-reassessment.md` — **Custom GPT + Thinking画像生成の既存手法再監査**
3. `research/plans/2026-08-10-custom-gpt-thinking-imagegen-route-matrix.md` — **CURRENT FOCUSED EXECUTION PLAN**
4. `research/chatgpt-project-practices/custom-gpt-thinking-imagegen-known-issue.md` — **OpenAI既知問題 / 回避策 / MYGPT反例**
5. `research/plans/2026-08-09-identity-quality-closed-loop-execution-plan.md` — **Thinking route決定後に再開するidentity-quality計画**
6. `research/prior-art/2026-08-09-identity-preserving-variation-isolated-workers.md` — identity/pose/evaluator既存研究
7. `research/KNOWN-ISSUES.md` — 既知不具合 / 制約
8. `research/SEARCH-INDEX.md` — 外部検索入口
9. `extensions/mygpt-worker-fanout-v3/README.md` — Worker Orchestrator現行実装

実装内部を探す場合は `research/reference/README.md` から入る。

## CURRENT status — 2026-08-10

### Production generation

**Production v0 generalized PASS**

Frozen principles:
- original canonical is the sole identity authority;
- F1 = canonical;
- F2/F3/F4 are independent isolated generations;
- one generation-facing worker sees canonical + its own one static pose only;
- no full motion / other slots / progress / board / sheet context;
- generated frame is never used as the next identity source;
- failed frame retry starts in a fresh isolated worker from original canonical.

Current production/control worker:
`MYGPT Single Frame Worker Test`

Validated production default:
- Instant
- Image Generation ON
- Web OFF
- Code/Data Analysis OFF
- Knowledge NONE
- Actions NONE

### Worker Orchestrator v0.5.0

Current extension:
`extensions/mygpt-worker-fanout-v3/`

Status:
**LIVE PASS**

Proven:
- fresh isolated F2/F3/F4 fanout;
- attachment / paste / native send;
- positive submit evidence;
- passive completion monitoring;
- generated-image recovery;
- selected-folder permission preflight;
- selected-folder verified save.

Session strategies:
- `fresh-chat` — SUPPORTED / LIVE PASS
- `branch-thinking` — RESERVED / `supported:false`

Do not modify v0.5.0 during the manual Thinking-route causal gate.

## CURRENT focused problem — Custom GPT + Thinking image generation

Official/product boundary and external evidence currently indicate:
- Images with thinking is a supported ChatGPT capability on eligible paid plans;
- GPTs with Image Generation enabled can use the current image-generation model;
- OpenAI Support nevertheless acknowledged a Thinking/reasoning-specific image-generation issue affecting some Custom GPTs;
- failure can produce `/mnt/data/...` only, no image, or tool-unavailable behavior;
- the explicit temporary workaround remains Instant;
- no stable Thinking-specific fix is documented.

Historical MYGPT evidence includes both:
- direct Thinking failure class;
- one native Thinking image-generation success in N2.

N2 actual successful route:

```text
Custom GPT / Instant
-> canonical directly attached
-> clean non-generating seed turn
-> Branch in new chat
-> switch branch to Thinking
-> single-pose image request
-> native image generation SUCCESS
```

N2 does **not** establish that Branch caused success. It confounds:
1. warm/clean Instant seed;
2. delayed switch to Thinking;
3. Branch/new derived conversation.

Detailed audit:
- `research/audits/2026-08-10-custom-gpt-thinking-imagegen-existing-methods-reassessment.md`

## CURRENT FOCUSED EXECUTION PLAN

Source of truth:
`research/plans/2026-08-10-custom-gpt-thinking-imagegen-route-matrix.md`

Do not start with a broad 3+3 or 5+5 matrix. Isolate causal routes first.

Route order:
1. **T1 — same-chat warm seed -> Thinking, no Branch**
2. T2 — clean seed -> Branch -> Thinking, only if T1 decision branch requires it
3. T3 — successful Instant image -> first-party retry/regenerate with Thinking, if T1/T2 fail
4. T0 — direct fresh Thinking only as matched baseline after a candidate route exists

### NEXT ONLY — T1

Use a new Custom-GPT chat.

1. Start in Instant.
2. Attach canonical `kokyo_base_20260805.png`.
3. Send only the clean seed:

```text
この画像を、この会話で生成する人物の唯一の正本画像として扱ってください。
まだ画像は生成しないでください。
次に1つの静止姿勢だけを指定します。
```

4. Wait for ordinary text acknowledgement.
5. Switch the **same chat** to the current visible Thinking/reasoning option.
6. Record the exact visible model/reasoning label.
7. Send the fixed R2-B shallow-bow packet from the route matrix.
8. Record only routing evidence first: native image UI YES/NO, visible image count, exact failure text if any.

If T1 PASS:
- repeat from fresh chats twice more;
- 3/3 provisionally means Branch is unnecessary;
- later repeatability screen requires at least 4/5 visible native image returns before quality testing/automation.

If T1 FAIL:
- move to T2 exact N2 structural route.

If T1/T2 both fail:
- test T3 first-party retry-with-Thinking route.

If no Thinking route reaches the repeatability screen:

```text
Instant = production generator
Thinking = optional critic / reasoner
```

and stop treating Thinking as a production generator until product/runtime evidence changes.

## Post-image critic evidence

Separate from Thinking-generation availability:
- G1a-1 proved same-turn automatic audit text does not reliably follow native image generation from Instructions alone;
- Branch -> Thinking successfully returned structured `POSTGEN_AUDIT` on an already-generated image without creating another image;
- therefore Thinking already has a viable critic/reasoner role even if its image-generation route remains flaky.

Future audit integration must bind the image-bearing generation turn before any later text-only audit turn. Do not patch the current collector during the T1/T2/T3 manual route gate.

## Identity-quality plan — temporarily deferred, not cancelled

Goal remains pet-feature-like stable visual variation from one canonical.

Main candidate layers:
- `ID-V1` — canonical as edit/source image;
- `ID-V2` — canonical + exactly one worker-local minimal pose/structure guide;
- independent judge comparison;
- MaSC / DreamBench++ reuse after image transport gate;
- best-of-2 only for hard/failed frames;
- optional canonical-derived local detail crop for persistent localized drift.

Current quality-plan source:
`research/plans/2026-08-09-identity-quality-closed-loop-execution-plan.md`

That plan is currently **temporarily deferred by the Thinking image-generation route gate** and resumes after route selection/stop condition.

## Source-of-truth order

1. `research/PROJECT-HANDOFF.md`
2. current focused plan explicitly marked CURRENT
3. current quality plan for the layer not temporarily deferred
4. `research/KNOWN-ISSUES.md`
5. latest applicable decisions/checkpoints/experiments/audits
6. `research/SEARCH-INDEX.md`
7. `research/reference/README.md`
8. historical handoffs/legacy records

## Repository areas

- `extensions/` — browser automation
- `audit/scripts/` — chroma removal / compose / mechanical audit
- `research/decisions/` — architecture/runtime decisions
- `research/plans/` — gated execution plans
- `research/experiments/` — live PASS/FAIL evidence
- `research/incidents/` — failure records
- `research/chatgpt-project-practices/` — product/community research
- `research/prior-art/` — identity/pose/evaluation prior art
- `research/audits/` — source/architecture/research audits
- `research/reference/` — implementation maps
- `research/runtime/` — live configuration snapshots
- `research/handoffs/` — historical snapshots

`research/**` is CONTROL/EVIDENCE and must not be dumped wholesale into generation-facing worker context.

## Maintenance rule

GitHub `main` is durable truth. At meaningful route/architecture/PASS-FAIL changes, update the applicable CURRENT plan, handoff and visible root/index documents without mutating frozen successful production code for documentation-only reasons.

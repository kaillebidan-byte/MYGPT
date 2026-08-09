# MYGPT調整プロジェクト — CURRENT HANDOFF

更新日: 2026-08-10 JST

GitHub `main` をdurable stateの正本とする。

## 最初に読む

1. `research/PROJECT-HANDOFF.md` — CURRENT
2. `research/decisions/2026-08-10-post-image-critic-requires-explicit-followup-turn.md` — post-image criticの現在判断
3. `research/experiments/2026-08-10-postgen-branch-thinking-critic-result.md` — Branch -> Thinking critic実機結果
4. `research/plans/2026-08-10-postgen-critic-route-comparison-runbook.md` — **NEXT USER PROCEDURE**
5. `research/plans/2026-08-09-identity-quality-closed-loop-execution-plan.md` — identity closed-loop全体計画
6. `research/prior-art/2026-08-09-identity-preserving-variation-isolated-workers.md`
7. `extensions/mygpt-worker-fanout-v3/README.md`
8. `research/SEARCH-INDEX.md`

---

## 1. Production generation baseline

**Production v0 generalized PASS**

Frozen principles:
- original canonical is the sole identity authority;
- F1 = canonical;
- F2/F3/F4 are independent isolated generations;
- one generation-facing worker sees canonical + its own one static pose only;
- no full motion / other slots / progress / board / sheet context;
- generated frames are never used as the next identity source;
- failed frame retry starts in a fresh isolated worker from original canonical.

Current production/control worker:
`MYGPT Single Frame Worker Test`

Validated default:
- Instant
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Knowledge NONE
- Actions NONE

Do not modify the production worker while post-image experiments are open.

---

## 2. Worker Orchestrator baseline

Current main extension:
`extensions/mygpt-worker-fanout-v3/`

Display/version:
- `MYGPT Worker Orchestrator v5`
- manifest `0.5.0`

Status:
**LIVE PASS**

Proven:
- fresh isolated fanout;
- attachment / paste / native send;
- positive submit evidence;
- passive completion monitoring;
- generated-image recovery;
- selected-folder permission preflight;
- selected-folder save.

Near-frozen unless new evidence requires a local patch:
- attachment/paste/send primitives;
- current generation/recovery core;
- output relocation;
- selected-folder preflight.

Current `image_collector.js` assumes the desired generated image is in the **latest assistant turn**. Post-image audit evidence now proves this cannot be used after a later text-only audit turn exists.

Do not patch v0.5.0 main yet. Any audit-state implementation belongs in a separate experimental extension line/version.

---

## 3. POSTGEN runtime evidence

### Instant same-turn auto-audit — FAIL

Experiment:
`research/experiments/2026-08-10-postgen-g1a1-manual-result.md`

Observed:
- image generation succeeded;
- no automatic `POSTGEN_AUDIT` text followed in the same user turn;
- DOM had the image-bearing assistant turn but no audit assistant text.

Decision:
- do not rely on same-turn automatic continuation after image generation.

### Branch -> Thinking post-image critic — SINGLE-RUN LIVE PASS

Experiment:
`research/experiments/2026-08-10-postgen-branch-thinking-critic-result.md`

Observed response:

```text
POSTGEN_AUDIT {"identity_obvious_drift":false,"pose_obvious_error":false,"topology_obvious_error":false,"verdict":"PASS"}
```

No new image generation occurred.

DOM evidence:
- image-bearing assistant turn exists earlier;
- later audit assistant turn contains text only and zero images.

Confirmed:
- Branch context retained enough prior visual/conversation state for Thinking to perform the structured critic task in this run;
- Thinking can be used as a **critic without generating an image**.

Not confirmed:
- repeatability across multiple Branch -> Thinking critic runs;
- superiority over Instant critic;
- stable Branch/model-switch browser automation;
- stable Thinking image generation.

Important:
**Thinking image generation remains an independent unresolved problem and is not required for the critic architecture.**

---

## 4. Current critic route candidates

### Route A — parent Instant explicit follow-up

```text
Instant generation
-> IMAGE_READY
-> bind candidate
-> second user turn in same parent conversation
-> Instant text critic
-> POSTGEN_AUDIT
```

Status:
**NOT YET TESTED on the same candidate.**

Advantage:
- simplest future automation if reliable.

### Route B — Branch -> Thinking critic

```text
Instant generation
-> IMAGE_READY
-> bind candidate in parent
-> Branch from image-bearing context
-> Thinking
-> audit-only request
-> POSTGEN_AUDIT text
```

Status:
**SINGLE-RUN LIVE PASS.**

Advantage:
- parent generation conversation can remain image-terminal;
- later audit text is isolated in the branch;
- Thinking does not need to generate images.

---

## 5. Required ordering for any closed-loop implementation

Direct DOM evidence now requires:

```text
GENERATION_COMPLETE
-> identify/bind image-bearing generation turn
-> persist candidate source/metadata or preserve parent tab reference
-> only then submit audit request
-> receive text audit in same chat or branch
-> parse structured result
-> ACCEPT / RETRY_REQUIRED
```

Never run generic `latest assistant image` lookup after audit text without a bound generation turn.

Potential future phases:

```text
GENERATING
-> IMAGE_READY
-> AUDITING
-> ACCEPTED / RETRY_REQUIRED
```

Do not implement this on main until critic route is selected.

---

## 6. NEXT ONLY — compare critic routes on the same candidate

Do **not** generate another image yet.

Use the already-generated R2-B candidate.

Current procedure:
`research/plans/2026-08-10-postgen-critic-route-comparison-runbook.md`

Next user action:
1. return from the Branch to the original parent Instant conversation;
2. keep the same generated image/canonical/context;
3. do not regenerate or change model;
4. send the exact audit-only explicit follow-up prompt;
5. record the Instant `POSTGEN_AUDIT` response and whether image generation starts.

This gives a controlled same-candidate comparison:

```text
A: parent Instant explicit follow-up critic
B: Branch -> Thinking critic — already single-run PASS
```

Decision rule:
- if Instant works and is sufficiently accurate, prefer it first for automation simplicity;
- if Instant fails or is materially weaker, prefer Branch -> Thinking critic;
- human review remains acceptance authority during research.

---

## 7. After critic route selection

Only then proceed in this order:

1. critic repeatability on known PASS and known FAIL examples;
2. narrow read-only Action from the chosen audit route;
3. Code Interpreter generated-image file-access gate;
4. `ID-V1` edit/source wording A/B;
5. `ID-V2` one local pose visual guide only if needed;
6. independent judge comparison if self-critic is biased;
7. MaSC / DreamBench++ reuse after image transport is solved;
8. best-of-2 only for hard/failed frames;
9. optional canonical-derived local crop only for persistent localized drift.

Thinking as an **image generator** remains a later independent execution-strategy experiment and must not block the above.

---

## 8. Frozen boundaries

Until contrary live evidence:
- original canonical remains sole identity source;
- no generated-frame chaining;
- one pose/state per generation-facing worker;
- no 4-pose/sequence guide in generator;
- fresh isolated retry;
- production worker unchanged;
- v0.5.0 successful fanout/recovery/output core unchanged;
- no unbounded same-chat regenerate/self-correct loop.

---

## 9. Maintenance rule

At meaningful boundaries update durable state without waiting for a separate request:
- runtime PASS/FAIL -> experiment record;
- architecture decision -> `research/decisions/`;
- NEXT/gates -> this handoff + current runbook/plan;
- extension behavior change -> checkpoint + extension README + root README;
- prior-art changes -> SEARCH-INDEX/topic note.

Do not change proven source code merely to make documentation look consistent.

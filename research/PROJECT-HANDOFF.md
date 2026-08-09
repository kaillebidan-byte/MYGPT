# MYGPT調整プロジェクト — CURRENT HANDOFF

更新日: 2026-08-10 JST

GitHub `main` をdurable stateの正本とする。

## 最初に読む

1. `research/PROJECT-HANDOFF.md` — CURRENT
2. `research/audits/2026-08-10-custom-gpt-thinking-imagegen-existing-methods-reassessment.md` — **Thinking画像生成の既存手法再監査**
3. `research/plans/2026-08-10-custom-gpt-thinking-imagegen-route-matrix.md` — **CURRENT NEXT USER PROCEDURE / causal route gate**
4. `research/chatgpt-project-practices/custom-gpt-thinking-imagegen-known-issue.md` — OpenAI既知問題と過去MYGPT証拠
5. `research/experiments/2026-08-08-n2-branch-thinking-followup-result.md` — historical Thinking image-generation success
6. `research/decisions/2026-08-10-post-image-critic-requires-explicit-followup-turn.md` — post-image critic判断
7. `research/experiments/2026-08-10-postgen-branch-thinking-critic-result.md` — Branch -> Thinking critic実機結果
8. `research/plans/2026-08-09-identity-quality-closed-loop-execution-plan.md` — identity closed-loop全体計画
9. `extensions/mygpt-worker-fanout-v3/README.md`
10. `research/SEARCH-INDEX.md`

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

Validated production default:
- Instant
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Knowledge NONE
- Actions NONE

Do not modify the production worker while Thinking-route experiments are open.

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

Do not modify v0.5.0 for the manual Thinking-route causal gate.

Current `image_collector.js` latest-assistant assumption remains a known issue only for later post-image audit integration; it does not need a patch for T1/T2/T3 route discovery.

Session strategies on main:
- `fresh-chat`: supported / LIVE PASS
- `branch-thinking`: reserved / unsupported

Do not enable `branch-thinking` until a manual route is repeatable.

---

## 3. Current external/product evidence — Thinking image generation

Current official product behavior:
- Images with thinking is a supported ChatGPT capability on eligible paid plans;
- GPTs with Image Generation enabled can use the current image-generation model;
- therefore Custom-GPT + reasoning image generation is not documented as intentionally unsupported.

Current known defect:
- OpenAI Support acknowledged a Thinking/reasoning-specific image-generation issue in **some Custom GPTs**;
- failure can return `/mnt/data/...` only or no image despite Image Generation being enabled;
- the official temporary workaround for this failure class is manually selecting Instant;
- no stable Thinking-specific fix or ETA is documented.

Current GPT-5.6 rollout means the visible reasoning selector/model mapping may differ from older runs. Every new test must record the exact displayed model/reasoning label instead of assuming that historical `Thinking` and current runtime are identical.

Detailed audit:
- `research/audits/2026-08-10-custom-gpt-thinking-imagegen-existing-methods-reassessment.md`

---

## 4. Historical MYGPT Thinking image-generation evidence

### Direct Thinking failure class

Historical MYGPT and current external evidence both show direct fresh Custom-GPT Thinking can fail tool routing / rendering.

Treat direct Thinking as a baseline failure control, not the first new experiment.

### N2 local success — important but confounded

Record:
`research/experiments/2026-08-08-n2-branch-thinking-followup-result.md`

The actual successful route was:

```text
Custom GPT / Instant
-> canonical directly attached
-> clean non-generating seed turn
-> Branch in new chat
-> switch branch to Thinking
-> single-pose image request
-> native image generation SUCCESS
```

Output:
- two A/B portrait alternatives;
- canonical reference remained effective.

Important correction:
**N2 did not prove that Branch itself caused Thinking image generation to work.**

The route contains at least three candidate causal factors:
1. clean Instant seed/warm-up before image generation;
2. switching to Thinking only after the seed exists;
3. Branch creating a new derived conversation.

These factors were never isolated.

---

## 5. Existing routes now worth testing

Current focused plan:
`research/plans/2026-08-10-custom-gpt-thinking-imagegen-route-matrix.md`

Priority order:

### T1 — same-chat warm seed -> Thinking, **NO Branch**

Highest information value.

```text
new Custom-GPT chat / Instant
-> attach canonical
-> clean seed, explicitly no image yet
-> switch SAME chat to Thinking/reasoning
-> R2-B image request
```

If this works, Branch is not required for the N2-class success and the architecture becomes much simpler.

### T2 — clean seed -> Branch -> Thinking

Exact structural reproduction of N2.
Run only according to the T1 decision branch.

### T3 — Instant image -> first-party retry/regenerate with Thinking

Current ChatGPT UI officially supports retrying responses with Thinking/Pro.
This route has not yet been tested by MYGPT for Custom-GPT native image generation.
It is worth testing before inventing browser-side model-switch machinery.

### T0 — direct fresh Thinking

Known-unreliable baseline control. Use only after a candidate route passes and needs a matched comparison.

Low-priority/fallback only:
- Images/Create Image surface — Custom-GPT context inheritance not proven;
- prompt-only `render inline` / `no commentary` tricks — current known issue remains inconsistent under these;
- rebuilding/minimizing capabilities — already shown not to fix the current issue generally;
- changing browser/device/account — diagnostic variability, not architecture.

---

## 6. NEXT ONLY — T1 same-chat warm seed -> Thinking

Do **not** run a broad 3+3 or 5+5 matrix first.
Do **not** change extension code.
Do **not** add Actions/Code Interpreter.

Use one causal test first.

### Fixed control

Canonical:
`kokyo_base_20260805.png`

Seed message:

```text
この画像を、この会話で生成する人物の唯一の正本画像として扱ってください。
まだ画像は生成しないでください。
次に1つの静止姿勢だけを指定します。
```

After the seed response, switch the **same chat** from Instant to the current user-visible Thinking/reasoning option.
Record the exact displayed label.

Then send R2-B:

```text
人物は正面を向いたまま、両足を基準画像と同じ位置で接地させてください。腰から上の上体を前へ傾け、浅いお辞儀として明確に読める姿勢にしてください。頭部は上体と一緒に前下方へ追従させ、首だけを曲げないでください。身体を横向きや斜め横向きへ回転させず、正面基準を維持してください。両腕は新しい独立したジェスチャーを作らず、基準画像の左右関係を保ったまま身体の両側に置き、大袖は上体前傾に受動的に追従して自然に垂らしてください。膝を大きく曲げず、足の位置を変えないでください。それ以外の表情、衣装構造、装飾、体格は基準画像を維持してください。人物1体、1姿勢、全身、正面基準、縦長の1枚だけを生成してください。
```

### Return evidence

Return only what is needed to route the next step:
- exact visible model/reasoning label after switch;
- native image generation UI started: YES/NO;
- visible final image count;
- exact `/mnt/data`, tool-unavailable, or text-only response if failure;
- screenshot if output shape is ambiguous.

### Decision branch

If T1 PASS:
- repeat T1 from fresh chats two more times;
- if 3/3 PASS, provisionally treat Branch as unnecessary;
- then run matched direct-T0 controls only as needed.

If T1 FAIL:
- proceed to T2 exact clean-seed Branch -> Thinking route.

If T1 mixed after repeats:
- compare T1 vs T2, capped at 5 attempts per competing route, not automatic 5 for every route.

If T1 and T2 both fail:
- run T3 Instant success -> retry/regenerate with Thinking.

If no route reaches at least 4/5 visible native image returns:
- stop treating Thinking as a production generator;
- retain Instant generation and use Thinking only for critic/reasoning where useful;
- reopen only after OpenAI runtime/product evidence changes.

---

## 7. POSTGEN critic evidence remains valid but is temporarily deferred

### Instant same-turn auto-audit — FAIL

Image generation succeeded but no automatic audit body followed in the same user turn.

### Branch -> Thinking critic — SINGLE-RUN LIVE PASS

Thinking successfully returned structured `POSTGEN_AUDIT` on an already-generated image without generating another image.

This proves a useful role split is available even if Thinking image generation remains flaky:

```text
Instant = generator
Thinking = critic
```

The previous same-candidate Instant-vs-Thinking critic comparison is **deferred**, not cancelled, while the user-prioritized Thinking image-generation route gate is active.

---

## 8. Identity-quality plan after routing decision

Thinking route availability and identity quality are separate gates.

Do not compare identity quality while the tool route is flaky.

After route selection:
1. availability/repeatability accepted;
2. then compare identity fidelity / pose / sleeve topology / output multiplicity;
3. then resume `ID-V1` edit/source A/B;
4. `ID-V2` single local pose guide only if needed;
5. evaluator / MaSC / best-of-2 work follows the existing closed-loop plan.

Current full quality plan:
`research/plans/2026-08-09-identity-quality-closed-loop-execution-plan.md`

---

## 9. Frozen boundaries

Until contrary live evidence:
- original canonical remains sole identity source;
- no generated-frame chaining;
- one pose/state per generation-facing worker;
- no sequence/board context in generator;
- production Instant worker unchanged;
- Worker Orchestrator v0.5.0 unchanged;
- no Branch/model-switch automation before a route is manually repeatable.

---

## 10. Maintenance rule

At each meaningful result:
- route PASS/FAIL -> experiment record;
- route causal decision -> focused plan + this handoff;
- OpenAI/runtime research -> known-issue note / audit;
- only after route acceptance -> extension strategy implementation on a separate development line.

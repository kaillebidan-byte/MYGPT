# Custom GPT + Thinking image generation — gated route matrix

Date: 2026-08-10 JST
Status: **CURRENT FOCUSED EXECUTION PLAN / MANUAL CAUSAL GATE FIRST**

## Goal

Determine whether MYGPT has a repeatable way to invoke native image generation under a Custom GPT reasoning/Thinking route, without guessing which factor made the historical N2 success work.

This plan does **not** replace the current Instant production generator. It is a focused technical gate.

Research audit:
- `research/audits/2026-08-10-custom-gpt-thinking-imagegen-existing-methods-reassessment.md`

Historical local success:
- `research/experiments/2026-08-08-n2-branch-thinking-followup-result.md`

Current known issue:
- `research/chatgpt-project-practices/custom-gpt-thinking-imagegen-known-issue.md`

---

## Fixed controls

Use the same controls for every route test:

- Custom GPT: current minimal image worker or its unchanged experimental clone;
- canonical: `kokyo_base_20260805.png` directly attached;
- local image request: R2-B clear shallow bow packet;
- one character / one pose / full body / portrait;
- no Actions;
- no Code Interpreter;
- Web OFF;
- no visual pose guide;
- no post-image audit during the Thinking-generation routing test;
- no extension automation during the first causal screen.

The first screen is a **tool-routing test**, not an identity-quality comparison.

Record for each attempt:

```text
route_id
visible model/reasoning selection
new chat or branch URL identity
seed turn present yes/no
image tool visibly invoked yes/no
visible generated image count
/mnt/data-only yes/no
no-image/tool-unavailable yes/no
assistant text instead of image yes/no
A/B alternatives yes/no
```

If GPT-5.6 Sol / reasoning level is visible, record the exact displayed label. Do not infer the underlying model from an older chat label.

---

# Gate T1 — SAME-CHAT WARM SEED, NO BRANCH

Priority: **NEXT ONLY**

Purpose:
- isolate whether the successful N2 factor was the clean Instant seed + later model switch, rather than Branch itself.

## User steps

1. Open a **new chat** with the same Custom GPT.
2. Keep/select Instant for the seed turn.
3. Attach `kokyo_base_20260805.png` directly.
4. Send exactly:

```text
この画像を、この会話で生成する人物の唯一の正本画像として扱ってください。
まだ画像は生成しないでください。
次に1つの静止姿勢だけを指定します。
```

5. Wait for the ordinary text acknowledgement. Do not generate an image yet.
6. In the **same chat**, switch to the user-visible Thinking/reasoning option. Record the exact displayed model/reasoning label.
7. Send the fixed R2-B packet:

```text
人物は正面を向いたまま、両足を基準画像と同じ位置で接地させてください。腰から上の上体を前へ傾け、浅いお辞儀として明確に読める姿勢にしてください。頭部は上体と一緒に前下方へ追従させ、首だけを曲げないでください。身体を横向きや斜め横向きへ回転させず、正面基準を維持してください。両腕は新しい独立したジェスチャーを作らず、基準画像の左右関係を保ったまま身体の両側に置き、大袖は上体前傾に受動的に追従して自然に垂らしてください。膝を大きく曲げず、足の位置を変えないでください。それ以外の表情、衣装構造、装飾、体格は基準画像を維持してください。人物1体、1姿勢、全身、正面基準、縦長の1枚だけを生成してください。
```

## T1 PASS

PASS for routing if:
- native image-generation UI/tool activity occurs;
- at least one visible final image is returned;
- not only `/mnt/data/...` text;
- no `image generation unavailable` refusal.

Image identity quality is recorded but does not decide T1 routing PASS.

## T1 FAIL

FAIL if:
- `/mnt/data/...` only;
- no visible image;
- tool unavailable/refusal;
- normal text answer without native generation.

## Decision

- If T1 PASS: do **not** run Branch immediately. First repeat T1 two more times from fresh chats. If 3/3 route PASS, Branch is provisionally unnecessary and T1 becomes the candidate route.
- If T1 is mixed: continue to T2 and compare.
- If T1 FAIL: proceed immediately to T2 using a fresh clean seed.

---

# Gate T2 — CLEAN SEED -> BRANCH -> THINKING

Purpose:
- reproduce the exact structural route of the historical N2 success after T1 has isolated the no-Branch condition.

## User steps

1. Start another new Custom-GPT chat in Instant.
2. Attach the same canonical.
3. Send the same clean seed text and wait for the text acknowledgement.
4. Use `...` on the seed response -> `Branch in a new chat`.
5. Confirm the branched chat shows inherited canonical/seed history.
6. Switch the **branch** to the user-visible Thinking/reasoning option. Record its exact label.
7. Send the exact same R2-B packet.

## T2 PASS

Same routing PASS gate as T1.

## Decision

- If T1 FAIL and T2 PASS: Branch is now a strong candidate causal factor. Repeat T2 from fresh seeds until 3 total T2 attempts exist.
- If T1 PASS and T2 PASS: Branch adds no demonstrated availability benefit yet; prefer T1 because it is simpler. Keep T2 only if later reliability differs.
- If T1 and T2 both FAIL: proceed to T3.
- If T1/T2 are mixed: collect up to 5 attempts only for the two competing routes, then compare routing success counts. Do not generate 5 for every route automatically.

---

# Gate T3 — INSTANT IMAGE -> RETRY/REGENERATE WITH THINKING

Purpose:
- test the first-party retry path exposed by ChatGPT before inventing browser automation for model switching.

## User steps

1. Open a fresh Custom-GPT chat in Instant.
2. Attach canonical.
3. Send the same R2-B packet directly and wait for a successful Instant image.
4. On the resulting assistant response, open the retry/regenerate control.
5. If the UI offers `Thinking` / reasoning retry, choose it.
6. Do not edit the original user prompt.
7. Observe whether the retried response invokes native image generation and returns a new visible image.

## T3 outcomes

Record separately:
- native image generated;
- ordinary text only;
- `/mnt/data` only;
- tool unavailable;
- previous image reused/no new generation;
- retry option not offered in this Custom-GPT UI.

## Decision

- If T3 produces native Thinking image generation: repeat twice from fresh Instant image requests.
- If T3 cannot invoke image generation or the UI lacks the model-specific retry option: stop T3; do not automate it.

---

# Direct Thinking baseline T0

Do not spend the first new attempt here because direct Custom-GPT Thinking failure is already established locally and externally.

Use T0 only when a candidate T1/T2/T3 route passes and needs a matched control.

Matched control:
- fresh Custom-GPT chat;
- select the same visible Thinking/reasoning level before any seed;
- attach canonical;
- send R2-B directly.

Collect enough matched T0 attempts to compare against the candidate route, capped initially at 5 total.

---

# Reliability acceptance

A single success is **counterexample evidence**, not stability.

After one route survives the causal screen:

1. build a matched set of up to 5 fresh attempts for the candidate route;
2. build up to 5 direct-T0 attempts only as needed for comparison;
3. keep the exact canonical, pose packet and visible reasoning selection fixed;
4. classify only tool-routing success first.

Candidate promotion threshold for further quality testing:
- at least 4/5 visible native image returns;
- no repeated `/mnt/data-only` pattern;
- failure mode is not worse than Instant production enough to make automation pointless.

This is a pragmatic engineering screen, not a statistical proof.

If no Thinking route reaches this screen:
- stop Spending effort on Thinking as generator;
- retain `Instant generator -> Thinking critic` architecture;
- revisit only after an OpenAI product/runtime change or new external evidence.

---

# Quality testing only after routing acceptance

Do **not** compare identity quality while the route itself is flaky.

After a route is accepted for availability, then compare:
- identity fidelity;
- pose compliance;
- sleeve/accessory topology;
- output multiplicity (1 image vs A/B alternatives);
- latency;
- compatibility with isolated-worker orchestration.

Use the existing ID-V1/ID-V2 quality plan after this gate, not a separate ad-hoc scoring system.

---

# Automation boundary

Do not change Worker Orchestrator v0.5.0 yet.

Only after a route is manually repeatable:
- if T1 wins: add a separate `warm-switch-thinking` session strategy;
- if T2 wins: activate a separate `branch-thinking-generator` strategy;
- if T3 wins: add a separate `retry-thinking` strategy if the retry UI has robust DOM evidence.

Do not insert any of these as conditionals into the proven `fresh-chat` engine.

Selectors/model-picker semantics must be captured from the winning route before implementation.

---

# Immediate next user action

**Run T1 only.**

Return:
- exact visible model/reasoning label after switching;
- whether native image-generation UI started;
- final visible image count;
- exact error/text if no image;
- screenshot only if output shape is ambiguous.

Then execute the T1 decision branch above; do not jump straight to 3+3 or 5+5.

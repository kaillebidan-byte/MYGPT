# Post-v0 roadmap — quality, orchestration, and legacy handling

Date: 2026-08-08 JST
Status: CURRENT PLAN

## Planning basis

This plan is not based only on the most recent N3 / Chinese-prior-art discussion.
It is constrained by the full evidence chain already accumulated in this repository:

- M1/M2a/M2b incident chain: global four-state / sequence context is the strongest carrier-collapse trigger; repeated local static calls alone are not.
- M2d/M2e research summarized in native-chat isolation records: weak hidden temporal context loses progression; stronger global temporal roles reintroduce sheet behavior.
- N0/N1/N2: fresh minimal Custom-GPT / Instant conversations and clean-seed Branches provide a proven worker boundary.
- W1-W4: broad identity prose was not needed; the active large sleeve and visible hand were the real local quality problems.
- C0/R0, R1, R2: production-v0 generalized PASS exists, but first-pass local-state reliability is imperfect.
- Asset policy: `project/**` and `legacy/**` are frozen for runtime use; only selected principles / fixtures may be extracted through single-variable tests.
- Chinese / broader consistency research: identity should be decoupled from pose/layout; large motion exposes fine-grained clothing drift; multi-reference conditioning can introduce identity confusion.
- Current browser-automation evidence: automatic fresh-chat creation, prompt queues, and ChatGPT image-upload/generation workflows exist outside stock ChatGPT UI, but Custom-GPT compatibility is not yet proven.

## Strategic decision

Do **not** replace the validated Custom GPT merely because fresh-chat creation can be automated.

Current Custom GPT serves two distinct roles:
1. image-worker configuration container;
2. context-isolation container.

Official GPT behavior states that a GPT conversation does not use saved memory, global custom instructions, or previous conversations. That is materially cleaner than ordinary Chat / Temporary Chat for this worker role.

Therefore the next automation target is:

```text
preserve Custom GPT isolation
        +
automate the repetitive browser/UI operations
```

Dropping Custom GPT becomes a fallback experiment only if current browser automation cannot target `/g/...` chats reliably.

---

# Phase 0 — baseline lock and repository consistency

Purpose: prevent later tests from becoming incomparable.

## P0-1. Preserve current production-v0 verdict

Keep the current generalized PASS limited to its validated scope.
Do not broaden it to loops, alternate starts, large viewpoint changes, multi-person scenes, props, Thinking default, or automated orchestration.

## P0-2. Capture the exact live worker configuration

Before any new generation experiment, save the current `MYGPT Single Frame Worker Test` configuration as a runtime snapshot:
- exact Instructions text
- Image generation toggle
- Web toggle
- Code/Data Analysis toggle
- Actions / Apps / Knowledge state
- model-mode behavior / current default

Reason:
research documents describe the configuration semantically, but a reproducible automation / quality A/B needs the exact live worker state.

This snapshot is CONTROL / EVIDENCE, not Knowledge shown to the worker.

## P0-3. Keep fixed regression assets

Regression set remains:
- canonical `kokyo_base_20260805.png`
- R0 final candidate
- R1 final candidate
- R2 final candidate
- C0/R1/R2 board and machine-audit outputs

Do not regenerate these merely to obtain prettier baselines.

---

# Phase 1 — N3 browser automation while preserving Custom GPT

Priority: FIRST.

Reason:
production-v0 generation quality already passes. UI automation can reduce user work without changing the generation-conditioning architecture. This is lower-risk than immediately adding new identity references or Knowledge.

## N3-B1A. Non-generation Custom-GPT compatibility gate

Use a current browser automation extension only to test visible UI behavior on `MYGPT Single Frame Worker Test`.
Do not generate an image yet.

PASS requires:
1. extension activates on the Custom-GPT `/g/...` page;
2. fresh conversation creation remains inside the same Custom GPT;
3. it does not fall back to ordinary ChatGPT;
4. one queued text task can be submitted;
5. Instant remains selected or selectable;
6. no planner / full-motion context is inherited.

If FAIL:
- do not immediately abandon Custom GPT;
- proceed to N3-B1C (minimal own UI automation) before testing ordinary Chat as the production replacement.

## N3-B1B. Canonical-file gate

Still without motion generation:
1. open a fresh Custom-GPT chat automatically;
2. attach the canonical through the normal visible file-upload UI;
3. submit the known clean seed;
4. verify that the chat still identifies the same Custom GPT and contains no other motion context.

PASS means the extension can automate the most repetitive isolation setup without changing the worker.

## N3-B1C. One known image-worker invocation

Only after B1A/B PASS:
- use one already validated static-pose packet;
- start one image generation;
- confirm standalone portrait / canonical reference / Custom-GPT identity.

This is an invocation test, not a new quality benchmark.

## N3-B1D. Three-worker fan-out

Then test the actual target:
- three genuinely separate Custom-GPT chats/tabs;
- same canonical supplied independently or via an equally clean proven method;
- one distinct local packet in each;
- no cross-packet contamination;
- all three image jobs independent;
- one failed tab can be stopped/retried without affecting the others;
- no separately billed OpenAI API dependency.

Automation PASS does **not** require automatic output scraping/downloading.
Visible UI submission is the first target; output extraction has separate product/terms/stability concerns.

## N3-B1E. If third-party extension cannot target Custom GPT

Preferred fallback order:
1. minimal local browser extension / userscript targeting visible `/g/...` UI;
2. only then evaluate ordinary Chat / Temporary Chat as a worker replacement.

Do not start from hidden/internal ChatGPT endpoints.

## N3-B2. Ordinary Chat fallback gate

Only needed if Custom-GPT automation is impractical.

Compare:
- A: validated Custom GPT worker
- B: automatically opened regular/Temporary Chat with equivalent user-visible seed/instructions

Because ordinary Chat can inherit personalization and Temporary Chat still follows global custom instructions, B is not assumed equivalent.

PASS for dropping Custom GPT would require:
- carrier no worse;
- identity no worse;
- no unexpected personalization/context contamination;
- image-generation capability remains stable;
- automation benefit is material enough to justify losing the stronger built-in worker boundary.

Default expectation: keep Custom GPT unless this test proves otherwise.

---

# Phase 2 — first-pass reliability improvements on the planner side

Priority: SECOND, before adding new visual references.

Reason:
R1 and R2 final PASSed after local retries. Their failures were not broad identity failures; they were local-state encoding failures. Fix the layer that actually failed before changing identity conditioning.

## Q0-1. Planner packet rules from confirmed failures

Codify two conditional planner heuristics, without changing global worker Instructions:

### Near-landmark non-contact states

From R1:
- prefer a positive body landmark / region for the hand position;
- use non-contact as a secondary condition;
- avoid large exclusion-gap wording that can redefine the intended state earlier in time.

### Torso-angle endpoints

From R2:
- when bow depth matters, use an absolute torso-angle / body-axis state;
- if expression is not part of the motion, explicitly preserve the canonical expression only when the generator has shown a tendency to substitute expression for pose depth.

These are planner/local-packet rules, not global identity rules.

## Q0-2. Measure retry burden

For future production runs, record:
- first-pass frames accepted / generated;
- number of local retries;
- failure class: spatial / endpoint / expression / identity / carrier / post-processing.

The goal is not merely final PASS; it is reducing local retries without broad prompt growth.

---

# Phase 3 — optional identity-quality research from consistency prior art

Priority: THIRD.

Do this only after Phase 1 is either proven or blocked, because generation quality is already production-usable inside v0 scope.

## Q1. Canonical-derived detail-reference screen

Target confirmed historical weak point:
- active large-sleeve topology.

A/B variable:
- A: canonical only — current validated baseline;
- B: canonical + one lossless detail crop taken directly from the same canonical.

No generated reference.
No sheet.
No multi-pose asset.
No new global worker prose.

### First screen

Use one known hard active-sleeve pose.
One A/B pair only.

B passes only if:
- same carrier behavior;
- pose compliance is not reduced;
- sleeve opening / gold trim / grey lining / motif topology is visibly better or at least more stable;
- unrelated face/hat/waist/lower-garment identity does not worsen;
- no reference confusion / pose pullback occurs.

If no clear improvement, stop Q1 and keep canonical-only production.

### Confirmation only after screen PASS

Repeat on the mirrored active sleeve.
Do not run a large benchmark before a directional gain is visible.

## Q2. Region-specific identity audit

Independent of Q1 generation changes, improve the audit layer using the already-existing identity contract.

Standard comparison regions:
- hat / hair relation;
- active sleeve opening / trim / lining / motif;
- non-active sleeve;
- chest emblem;
- waist medallion / cords / tassels;
- lower garment / shoes.

Whole-image similarity remains advisory only.
The main gate remains topology / occlusion / role continuity.

This gives a quality gain in detection even if Q1 reference augmentation is rejected.

## Q3. Multi-view / generated auxiliary references — deferred

Do not test generated turnarounds or character sheets now.

Reasons from project evidence:
- regenerated neutral drifted more than canonical;
- visible multi-state / sheet context previously triggered carrier collapse;
- current v0 is front-facing;
- multi-reference consistency research explicitly treats identity confusion as a real problem.

Reopen only when the production scope itself expands to large viewpoint changes and there is a concrete failure that canonical-only cannot solve.

---

# Phase 4 — frozen legacy asset mining, not wholesale reactivation

Priority: CONDITIONAL.

`project/**` and `legacy/**` remain FROZEN for runtime use.

Use legacy only when a current problem names a specific missing function.

## Candidate uses that are allowed

### Audit concepts

`project/sources/production/01-character-identity.md` remains useful as an audit/control contract:
- proportions
- silhouette
- topology
- occlusion
- anchors
- style

Do not paste the whole contract into worker Instructions.

### Planner-side motion vocabulary / failure rules

If an old source contains a useful motion classification, temporal role, or repair rule, extract only that planner-side concept and test it independently.

### Layout / old boards

Use only for deterministic post-processing and machine-audit regression.
Never return them to generation conditioning.

## Explicitly disallowed without new evidence

- restoring old Project runtime;
- restoring broad Knowledge;
- restoring four-pose layout guides as image references;
- generated-frame identity chaining;
- restoring old full Custom-GPT architecture with Actions/GitHub coupling.

Any reactivation still requires:
1. named current failure;
2. known old rejection reason;
3. new evidence that changes that reason;
4. single-variable test;
5. comparison against current acceptance;
6. status change only after PASS.

---

# Phase 5 — next acceptance milestone

Do not call this `production v1` automatically.
First create a smaller `production v0.1 operational` gate.

## v0.1 operational PASS

Required:
- production-v0 generalized quality PASS remains intact;
- exact worker runtime snapshot exists;
- browser automation either:
  - successfully fans out three isolated Custom-GPT workers, or
  - is formally rejected with evidence and manual operation retained;
- no worker-isolation regression;
- no new broad Knowledge / global prompt growth;
- planner failure accounting is standardized;
- any Q1 detail-reference experiment is either proven on two mirrored cases or fully rejected/reverted.

Only after v0.1 operational should scope expansion be planned.

---

# Later scope expansion — not part of the current plan

Separate acceptance gates are required for:
- loop motion;
- non-canonical starting pose;
- side / rear / large viewpoint changes;
- props / environment interaction;
- multiple people;
- Thinking as production default.

Do not mix these with N3 automation or Q1 identity experiments.

---

# Execution order

1. capture exact current Custom-GPT runtime snapshot;
2. N3-B1A non-generation Custom-GPT automation test;
3. N3-B1B canonical upload + clean-seed automation test;
4. N3-B1C one known image invocation;
5. N3-B1D three-worker fan-out;
6. codify planner first-pass reliability rules from R1/R2;
7. Q1 one-pose canonical-detail A/B screen;
8. Q1 mirrored confirmation only if screen clearly passes;
9. Q2 region-specific audit normalization;
10. legacy mining only for a named remaining defect;
11. decide `production v0.1 operational`.

This ordering deliberately preserves the proven generation architecture while first removing UI friction, then improves first-pass reliability at the layer that actually failed, and only then experiments with stronger identity conditioning.

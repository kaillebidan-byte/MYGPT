# Post-v0 roadmap — quality, orchestration, and legacy handling

Date: 2026-08-08 JST
Updated: 2026-08-09 18:36 JST
Status: **HISTORICAL PLAN / AUTOMATION PHASE OVERTAKEN BY LIVE RESULTS**

## Current supersession

This roadmap was written before Custom-GPT browser automation had been proven on the user's actual environment.

Several Phase 1 assumptions are now obsolete:
- Custom-GPT automation compatibility is no longer unproven;
- the non-generation gate, canonical-file gate, controlled submit, and three-worker fanout have all been implemented and live-tested through later Worker Fanout versions;
- image recovery has also passed live testing.

CURRENT sources:
- `research/PROJECT-HANDOFF.md`
- `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md`
- `extensions/mygpt-worker-fanout-v3/README.md`

Current baseline:
- v0.4.4 isolated F2/F3/F4 fanout: LIVE PASS;
- v0.4.5 generated-image recovery: LIVE PASS;
- v0.4.6 selectable output folder: STATIC PASS / LIVE PENDING.

Do not execute this document's old Phase 1 gate list as if it were the current next task.

---

## Planning principles that remain valid

The following constraints from the original roadmap remain useful:

- preserve the production-v0 generation verdict within its validated scope;
- do not weaken worker isolation merely to reduce clicks;
- keep the minimal Custom GPT as both configuration container and context-isolation boundary;
- treat first-pass local-state failures separately from broad identity failures;
- do not add broad Knowledge or global identity prose without a named failure;
- keep generated frames out of the canonical identity chain;
- use legacy assets only for named, single-variable comparisons;
- do not reintroduce multi-pose / sheet references into generation conditioning.

Production-v0 scope remains documented in:
- `research/decisions/2026-08-08-production-v0-generalized-verdict.md`

---

## Historical Phase 1 result — browser automation

The original roadmap proposed:

```text
Custom GPT isolation
        +
browser automation of repetitive UI operations
```

This direction succeeded.

The actual implementation evolved beyond the initial plan and now uses:

```text
Translation Loop control plane
        +
stripped AutoGPT ChatGPT adapter
        +
VoiceBridge lifecycle / hidden-tab observation
```

The implementation was validated through real Vivaldi/Chromium use rather than remaining a speculative plan.

Current implementation lookup:
- `research/reference/2026-08-09-extension-reuse-inventory.md`
- `research/reference/2026-08-09-autogpt-0.0.71-internal-structure-map.md`
- `research/audits/2026-08-09-autogpt-0.0.71-deep-architecture-analysis.md`
- `research/decisions/2026-08-09-autogpt-stripped-clone-current.md`

---

## Quality work that remains potentially relevant later

These items were not invalidated merely because automation succeeded. They are **not current next actions** unless the image-difference analysis or a new named failure points back to them.

### Planner-side first-pass reliability

Confirmed historical failure classes:
- near-landmark hand placement;
- endpoint depth / torso-angle encoding;
- expression substitution for posture;
- local sleeve / visible-hand detail drift.

Potential planner rules should remain local and conditional rather than becoming global worker prose.

### Canonical-derived detail reference

A future single-variable quality test may compare:
- A: canonical only;
- B: canonical + one lossless detail crop from the same canonical.

Possible target:
- active large sleeve topology.

Constraints retained:
- no generated reference;
- no multi-pose sheet;
- no motion context in the auxiliary reference;
- one region at a time.

Relevant prior art:
- `research/prior-art/2026-08-08-cn-character-consistency-recovered.md`

### Region-specific identity audit

Potential audit regions:
- hat / hair relation;
- active sleeve opening / trim / lining / motif;
- non-active sleeve;
- chest emblem;
- waist medallion / cords / tassels;
- lower garment / shoes.

This can improve evaluation without changing generation conditioning.

### Multi-view / generated auxiliary references

Still deferred.

Reasons remain:
- regenerated neutral views showed reinterpretation drift;
- visible multi-state / sheet context caused carrier collapse;
- current validated v0 camera is front-facing;
- multi-reference identity confusion is a known research problem.

---

## Legacy handling retained

`project/**` and `legacy/**` remain FROZEN for runtime use.

Legacy assets may be consulted for:
- historical comparison;
- audit concepts;
- deterministic post-processing fixtures;
- a named missing planner rule.

Do not restore wholesale:
- old Project runtime;
- broad Knowledge;
- four-pose layout guides as image references;
- generated-frame identity chaining;
- old full Custom-GPT + Actions coupling.

Any reactivation requires:
1. a current named failure;
2. the old rejection reason;
3. new evidence changing that reason;
4. a single-variable test;
5. comparison against current acceptance.

---

## Current next action

This historical roadmap no longer owns sequencing.

Current sequencing is defined only by `research/PROJECT-HANDOFF.md`.

As of 2026-08-09:
1. live-test v0.4.6 selectable output folder;
2. if PASS, stop Worker Fanout feature expansion;
3. return to the paused image-difference analysis;
4. revisit quality experiments only when that analysis identifies a concrete target.

Deferred separately:
- Instant preparation -> Branch -> Thinking image generation workaround investigation.

External/prior-art lookup:
- `research/SEARCH-INDEX.md`

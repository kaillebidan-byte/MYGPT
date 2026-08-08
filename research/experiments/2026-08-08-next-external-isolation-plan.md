# External planner / fresh-worker isolation — deferred comparison plan

Date: 2026-08-08
Status: DEFERRED — not the next production-path experiment

Superseding constraint:
- See `research/ORIGINAL-CONSTRAINTS.md`.
- The MYGPT project originally asks whether the desired Pet-feature delta can be achieved without consuming the user's weekly token allowance.
- Do not assume ChatGPT Work.
- Do not require OpenAI API / Agents SDK / Responses API usage unless the user explicitly relaxes this constraint.

## Why this plan is deferred

M2b/M2d/M2e suggested that a true planner/worker context boundary would be technically useful:
- M2b: isolated static requests produced standalone portraits.
- M2d: weak hidden temporal orchestration preserved the single-image carrier but collapsed frames toward endpoint variants.
- M2e: stronger temporal roles restored chronological progression but caused repeated 2x2 sheets.

Existing OpenAI Agents SDK patterns support fresh nested runs / deterministic code orchestration, so an external worker boundary is a valid architecture proof. However, API execution is billed separately from ChatGPT and therefore does not by itself satisfy the original product constraint.

Accordingly, this file is retained only as a comparison/proof design. Do not run it as the next experiment without explicit user approval.

## Deferred proof design

### E1 — fresh-worker boundary baseline

Four independent fresh image-generation runs. Each sees:
- high-resolution canonical `kokyo_base_20260805.png`
- exactly one concrete static pose
- no shared conversation/session/previous-response state
- no previous generated image
- no other three poses or sequence vocabulary

Pass target:
- four independent single-person single-pose portraits
- no 2x2 / labels / dividers
- monotonic hand progression across the four hard-coded poses

### E2 — planner + fresh workers

Only if E1 passes:
- one planner knows the whole motion and outputs four structured static-pose records;
- code passes one record at a time to fresh image workers;
- workers never see the full plan.

This tests the architecture hypothesis but does not count as satisfying the original no-Work/no-separate-API production goal.

## Current next step instead

Before designing another experiment, search for existing examples or product-supported patterns that can create an equivalent isolation boundary while staying inside ordinary ChatGPT / Project / Pet-feature usage and without relying on Work or separately billed API calls.

Do not return to prompt-only M2 variants merely by adding more negative `no sheet / no 2x2` wording; M2e already showed that route is not promising.

Operational rule remains:
- save every generated image as soon as it appears;
- if a fail condition is established, stop only after the evidence needed for diagnosis has been saved.

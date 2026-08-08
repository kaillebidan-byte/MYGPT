# N2 — clean-seed Branch / Thinking follow-up

Date: 2026-08-08 JST
Status: BRANCH PASS / THINKING TOOL-AVAILABILITY PREVIOUS FAIL SUPERSEDED / PRODUCTION MODE UNCHANGED
Constraint: ChatGPT Plus / no Work / no Codex agentic allowance / no OpenAI API billing

## Purpose

Test whether a clean pre-motion Custom-GPT conversation can be branched without losing the worker boundary or the canonical image reference, and record an unexpected follow-up in which the branched chat was switched from Instant to Thinking and image generation succeeded.

## Branch seed

Custom GPT:
- `MYGPT Single Frame Worker Test`
- minimal worker
- canonical directly attached
- no global motion context

Seed message:

`この画像を、この会話で生成する人物の唯一の正本画像として扱ってください。`
`まだ画像は生成しないでください。`
`次に1つの静止姿勢だけを指定します。`

The clean-seed response was then branched with `Branch in new chat`.

## Branch result

Observed in the branch:
- same Custom GPT remained active
- Instant remained available / usable
- canonical attachment remained visible in inherited history
- no full-motion / F1-F4 / board / sequence context had been introduced before branching

A single static-pose generation from the branch succeeded and showed that the inherited canonical remained an effective image reference.

Branch verdict: **PASS** for the intended friction-reduction mechanism.

Practical value is limited:
- avoids reattaching canonical for every worker
- provides an identical clean starting context
- does not automatically create three workers
- does not automatically distribute F2/F3/F4 packets
- does not provide zero-click fan-out

Therefore Branch is optional UX reduction, not a new orchestration architecture.

## Thinking follow-up — new evidence

After the successful branch test, the branched Custom-GPT conversation was switched to Thinking and another single-pose image request was run.

Observed:
- image generation succeeded under Thinking
- the response returned two alternative images (A/B)
- both alternatives were standalone 1024x1536 portraits
- both used the anatomical-right arm as the active arm
- both retained the canonical character strongly enough to establish effective image-reference use
- the two alternatives differed visibly in active-sleeve geometry and whole-redraw amount

Advisory whole-image SSIM against canonical, not used as an identity gate:
- alternative `19_57_19 (2)`: ~0.688
- alternative `19_57_18 (1)`: ~0.789

The lower score of one candidate is consistent with visibly larger active-sleeve / pose redraw. These scores are advisory only because the intended pose itself changes pixels.

## Correction to N0 interpretation

N0 had observed this runtime failure under Custom GPT / Thinking:

`画像生成ツールがこの環境で利用できないため、画像ファイルを返せません。`

That observation remains valid historically, but it can no longer support a stable rule that Custom-GPT Thinking is inherently unable to generate images.

Current OpenAI product documentation states that Images with thinking is available on Plus and that GPTs with Image Generation enabled can use the current ChatGPT image-generation model.

Therefore the corrected interpretation is:
- N0 Thinking failure = runtime/tool-availability incident observed at that time
- later branch+Thinking success = counterexample proving the failure is not universal
- no evidence yet that Branch itself caused Thinking to become available
- no evidence yet that Thinking is more reliable than Instant for this worker

## A/B output multiplicity

The Thinking run returned two alternatives even though the worker concept is intended to produce one frame and stop.

Treat this as a runtime/output-shape observation, not yet as a production benefit or defect.
Do not assume Thinking will always return two candidates.
Do not use candidate multiplicity as a reason to redesign the four-keypose architecture.

## Production decision

Do **not** reopen W-series generation tuning.
Do **not** change the current proven production worker from Instant merely because this Thinking run succeeded.

Reason:
- Instant already has the completed N1/W1-W4/C0 evidence chain
- Thinking now has one successful follow-up but also the earlier N0 tool-availability failure
- the Thinking follow-up returned A/B alternatives and showed larger variation between candidates

Current production path therefore remains:
- F1 = canonical
- F2/F3/F4 = isolated single-pose workers
- Instant is the validated default
- clean-seed Branch may be used to reduce canonical reattachment friction

A separate controlled Instant-vs-Thinking comparison is only warranted if there is a concrete reason to replace Instant; it is not required for the current production path.

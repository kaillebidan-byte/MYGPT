# Custom GPT Thinking image generation known issue / Instant quality question

Date: 2026-08-08

## Confirmed current platform issue

OpenAI Support acknowledged on the OpenAI Developer Community (2026-07-19) that some Custom GPTs exhibit a Thinking/reasoning-specific image generation issue:
- internal `/mnt/data/...` path returned instead of a rendered image
- or no image output even when Image Generation is enabled
- manually selecting Instant can work around this specific pattern for some users
- no ETA was given

Primary source:
- https://community.openai.com/t/image-generation-broken-in-all-our-custom-gpts-since-the-new-default-model-the-gpt-returns-the-internal-mnt-data-png-path-instead-of-rendering/1383942/9

Related reports in the same thread show the failure correlating strongly with Thinking and much lower failure on Instant, but account/session/client variability exists.

## Important variability / counterevidence already present before MYGPT N2

The same community thread did **not** establish that all Custom GPT image generation was universally broken:
- one user reported that their Custom GPT image generation still worked on iPad and on the web UI in Firefox/Chrome;
- another user reported the same Custom GPT could work in some accounts/sessions and fail in others;
- OpenAI Support itself described the Thinking/reasoning failure as affecting `some Custom GPTs`, not all Custom GPT sessions.

However, those reports did not cleanly prove the exact condition `Custom GPT + Thinking + successful native image generation`, because the successful Custom-GPT report did not state that Thinking was selected. A later reply explicitly asked that user to retry under Thinking.

Separate July 2026 community evidence also shows ordinary ChatGPT Thinking image generation can fail transiently and then succeed on retry, and another report described Thinking succeeding while Instant failed. Those are useful evidence that tool availability can be runtime/session-dependent, but they are not Custom-GPT-specific proof.

Therefore the pre-N2 evidence already supported this narrower interpretation:
- the failure is intermittent / environment-dependent rather than a universal platform capability prohibition;
- Thinking is disproportionately implicated in the Custom-GPT failure pattern;
- success of a Custom GPT in an unspecified model mode does not prove Thinking success.

## MYGPT local counterexample added 2026-08-08

MYGPT later produced a direct local counterexample:
- clean-seed branch of `MYGPT Single Frame Worker Test`
- switched from Instant to Thinking inside the branched Custom-GPT conversation
- native image generation succeeded
- two A/B standalone portrait alternatives were returned
- canonical reference and requested anatomical-right-arm pose remained effective

See:
- `research/experiments/2026-08-08-n2-branch-thinking-followup-result.md`

This supersedes any project-level statement that Custom-GPT Thinking is inherently unable to generate images.
It does **not** prove that Branch caused Thinking availability, nor that Thinking is as reliable as Instant.

## Separate unresolved question: Instant output quality

The above workaround only establishes tool availability. It does NOT establish that Instant produces image outputs suitable for MYGPT.

ChatGPT Images documentation says Thinking adds reasoning/tool use around image generation. It does not provide a MYGPT-specific guarantee that Instant and Thinking are equivalent for:
- canonical identity fidelity
- single-frame pose fidelity
- garment/accessory topology
- left/right correctness
- exact endpoint/intermediate positioning

Therefore MYGPT must treat these as two independent gates:

1. `Thinking availability gate`
   - can a Custom GPT in Thinking mode actually invoke and return native image generation?

2. `Instant quality gate`
   - if Instant can generate, does it meet MYGPT's fidelity threshold?

A Thinking failure caused by the known platform issue is not evidence against the context-isolated Custom GPT worker architecture itself.
An Instant generation success is also not sufficient evidence that the architecture is production-usable unless fidelity passes.

## Required controls

To separate Custom-GPT effects from model-mode effects, compare the same canonical and exact same static prompt across:
- normal Chat / Thinking
- normal Chat / Instant
- Custom GPT / Thinking
- Custom GPT / Instant

Use fresh conversations and direct canonical attachment in every condition.

## Evaluation axes

Functional/tool gate:
- image tool invoked
- visible image returned
- no `/mnt/data/...`-only response
- no false claim that image generation is unavailable

Carrier gate:
- 1 image
- 1 character
- 1 pose
- portrait
- no multi-panel / labels / dividers

Pose gate:
- anatomical right side correct
- requested hand height correct
- unaffected limbs/head/torso remain close to canonical

Identity/topology gate:
- proportions
- silhouette
- hat/hair boundary
- chest emblem
- large sleeve topology
- waist ornament
- tassel/cord attachment and count
- lower garment
- shoes
- overlap / occlusion order

## Interpretation

- Custom Thinking fails, Custom Instant passes quality: worker architecture remains viable with Instant-only execution, while the Thinking path is affected by a runtime/platform defect in that session.
- Custom Thinking succeeds: this disproves a universal Thinking-unavailable rule but does not establish reliability; compare output shape and fidelity separately.
- Custom Instant generates but quality is materially worse than normal-chat controls: Custom GPT worker is not yet suitable.
- Normal Instant is also materially worse: limitation likely comes from Instant-mode reasoning/prompt preparation rather than Custom GPT alone.
- Custom Instant uniquely worse than Normal Instant: Custom-GPT runtime/configuration adds a separate quality problem.

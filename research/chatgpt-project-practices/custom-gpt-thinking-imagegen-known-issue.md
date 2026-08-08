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

## Separate unresolved question: Instant output quality

The above workaround only establishes tool availability. It does NOT establish that Instant produces image outputs suitable for MYGPT.

ChatGPT Images 2.0 documentation says Thinking adds reasoning/tool use around image generation. It does not provide a MYGPT-specific guarantee that Instant and Thinking are equivalent for:
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

- Custom Thinking fails, Custom Instant passes quality: worker architecture remains viable with Instant-only execution, while the Thinking path is blocked by a platform defect.
- Custom Thinking fails, Custom Instant generates but quality is materially worse than normal-chat controls: Custom GPT worker is not yet suitable.
- Normal Instant is also materially worse: limitation likely comes from Instant-mode reasoning/prompt preparation rather than Custom GPT alone.
- Custom Instant uniquely worse than Normal Instant: Custom-GPT runtime/configuration adds a separate quality problem.

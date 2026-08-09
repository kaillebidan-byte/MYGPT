# Post-image dialogue / audit-loop reassessment

Date: 2026-08-09 JST
Status: **DIRECTION UPDATE / INSTANT RUNTIME EVIDENCE / IMPLEMENTATION NOT STARTED**

## Triggering new evidence

User live evidence:

- under the Instant path, after the image model finishes generating an image, the dialogue model can resume after generation;
- this was verified only for Instant so far;
- Thinking must not be assumed to have the same post-image behavior until separately tested.

This changes the identity-preservation design space. The generation worker no longer has to be treated as a one-way terminal image producer. A post-image reasoning / audit stage can potentially run before the browser orchestrator accepts or retries a candidate.

Important distinction:

- **CONFIRMED by live evidence:** post-image dialogue stage exists in the tested Instant path;
- **CONFIRMED by OpenAI GPT configuration docs:** a custom GPT can combine Instructions/Knowledge, capabilities such as Image Generation and Code Interpreter & Data Analysis, and external API Actions. Apps and Actions are mutually exclusive, but Actions are not documented as mutually exclusive with Image Generation or Code Interpreter;
- **NOT YET CONFIRMED:** generated image bytes/file handles are automatically available to Code Interpreter or automatically transferable to a GPT Action;
- therefore do not make image-file transport through Actions a prerequisite for the first audit-loop experiment.

Official OpenAI references:
- https://help.openai.com/en/articles/8554407-gpts-in-chatgpt
- https://help.openai.com/en/articles/9442513
- https://help.openai.com/en/articles/11084440-images-in-chatgpt

---

## Prior plan before this evidence

The previous identity-preservation review recommended:

1. `ID-V1` — treat canonical as an edit/source image rather than only a semantic reference;
2. `ID-V2` — canonical identity image + exactly one worker-local pose/structure guide;
3. `ID-V4` — best-of-N independent isolated candidates + identity-aware selection;
4. `ID-V3` — optional canonical-derived local detail crop only for persistent local failures.

Record:
- `research/prior-art/2026-08-09-identity-preserving-variation-isolated-workers.md`

Those directions remain valid, but they now sit inside a stronger closed-loop architecture.

---

## New architecture candidate — generation + critic + fresh retry

Recommended conceptual flow:

```text
same canonical identity source
+ one worker-local pose condition
+ minimal local text
        |
        v
isolated generation worker
        |
        v
IMAGE READY
        |
        v
post-image dialogue critic (Instant proven)
        |
        +--> structured visual identity / pose / topology audit
        +--> optional read-only Action calls for versioned audit policy
        +--> optional deterministic script/metric stage if image-file access is proven
        |
        v
ACCEPT or RETRY_REQUIRED
        |
        +--> ACCEPT: recover/finalize candidate
        |
        +--> RETRY_REQUIRED:
              open a NEW isolated worker
              original canonical again
              same pose target
              only failed local constraints added
```

Critical rule:
- never use the failed generated candidate as the next identity source;
- retry starts from the original canonical;
- do not expose other F2/F3/F4 states to the retry worker.

This keeps the live-proven isolation architecture while adding a quality-control loop.

---

## Research support for the critic loop

### DreamBench++ — GPT/VLM as human-aligned concept-preservation evaluator

Primary/code:
- https://arxiv.org/abs/2406.16855
- https://github.com/yuangpeng/dreambench_plus

Relevant reuse:
- separate evaluation of **concept preservation** and **prompt following**;
- explicit evaluation task description, scoring criteria and output format;
- official code already includes GPT-based scoring plus DINO/CLIP baselines.

MYGPT reuse:
- do not ask the post-image model vague questions such as `same character?`;
- use a fixed structured audit schema;
- score identity preservation separately from pose compliance.

### Beyond the Pixels — hierarchical identity decomposition

Primary:
- https://arxiv.org/abs/2511.08087

Relevant reuse:
- coarse global similarity is insufficient;
- decompose identity into type/style -> attributes -> concrete features;
- ask for concrete visual transformations/differences instead of one abstract similarity score.

MYGPT feature tree candidate:
- face / eyes / expression baseline
- hat / hair boundary
- chest flower motif
- active sleeve opening / gold trim / grey lining / motif
- non-active sleeve
- waist medallion / cords / tassels / attachment topology
- lower garment / shoes
- body proportions

### EditRefiner — perception -> reasoning -> action -> evaluation

Primary:
- https://arxiv.org/abs/2605.07457

Relevant reuse:
- failure localization before correction;
- diagnostic reasoning produces a local correction action;
- evaluation determines whether another correction is required.

MYGPT adaptation:
- perception/reasoning can be done by the post-image dialogue model;
- action is **not** same-chat repeated editing by default;
- action becomes a fresh isolated retry packet from the original canonical.

### Iterative Refinement / Idea2Img

Primary:
- https://arxiv.org/abs/2601.15286
- https://arxiv.org/abs/2310.08541

Relevant reuse:
- multimodal critic feedback can improve generated results;
- sequentially correcting explicit failures can outperform simple parallel sampling for complex constraints.

### Warning — naive self-correction can degrade

Primary:
- https://arxiv.org/abs/2606.13156

Finding relevant to architecture:
- naive visual self-iteration can substantially degrade performance;
- closed loops need explicit grounding/reward/state rather than unlimited `look again and retry` behavior.

MYGPT consequence:
- post-image dialogue critic should not independently enter an unbounded generate/edit loop;
- emit structured PASS/FAIL and correction packet;
- browser orchestrator owns retry count and always launches a fresh isolated worker.

---

## Machine identity metric — reuse rather than invent

### MaSC

Primary/project/code:
- https://arxiv.org/abs/2605.22469
- https://masc-metric.github.io/
- https://github.com/masc-metric/masc

Useful properties:
- released as `pip install masc-metric`;
- uses foreground masks and SigLIP2 patch features;
- produces Concept Preservation (CP) and Prompt Following (PF) separately;
- reported concept-preservation correlation is stronger than common non-LLM baselines and close to GPT-4o on DreamBench++ human ratings.

Why MYGPT is unusually compatible:
- current generation uses a chroma background;
- foreground concept masks can therefore be produced deterministically without introducing a segmentation model first;
- existing chroma-removal logic can provide the mask source.

However:
- MaSC's default high-quality backbone is large and may require Hugging Face model access/login;
- do not assume Custom GPT Code Interpreter can install/download/run this reproducibly;
- the safer production location is an external audit service / Action backend with the model preinstalled, **if image transport to that service is solved**.

### DreamBench++ code

Official code already provides DINO/CLIP and GPT evaluation pipelines. It is a stronger reuse candidate than writing a new generic similarity script from scratch.

---

## Actions — recommended use and non-use

### Good first use of Actions

Do not require image upload.

Use narrow read/write control endpoints such as:

```text
getAuditPolicy(version)
recordAudit(run_id, slot_id, candidate_id, structured_audit)
getRetryPolicy(failure_codes)
```

This lets the post-image dialogue model:
- fetch versioned criteria stored outside the GPT Instructions;
- submit a deterministic JSON result;
- keep GitHub/repository logic out of the generation-facing prompt.

A small proxy can read selected GitHub files or expose already-parsed policy JSON. Prefer this to giving the generator a broad general-purpose GitHub API surface.

### Possible later Action use

```text
runIdentityMetric(candidate_image, canonical_image)
```

Only after one of these is live-proven:
- generated image is accessible as a usable file to the post-image model/action;
- a stable generated-image URL/file reference can be passed;
- browser orchestrator uploads candidate bytes to the audit service directly.

Do not revive the historical assumption that `openaiFileIdRefs` for generated images will automatically solve image transport.

Historical record that is now partly superseded:
- `research/public-image-gpt-reuse/reusable-components.md`
- `research/public-image-gpt-reuse/target-structure.md`

The old audit design treated post-generation Action access as too uncertain to rely on. The new Instant evidence reopens **post-generation tool orchestration**, but does not by itself prove file-byte transport.

---

## Code Interpreter / GitHub script use

Custom GPT configuration supports Code Interpreter & Data Analysis as a capability in addition to image generation, while Actions are a separate external-API mechanism.

Potential use:

```text
image generation
-> dialogue resumes
-> obtain versioned audit script/spec
-> run deterministic checks
-> combine machine JSON + visual critic JSON
```

But first gate:
- verify whether the generated image is directly accessible to Code Interpreter in the post-image state.

If not:
- keep Code Interpreter for policy/script computation only;
- use browser recovery or external audit service for image-byte metrics.

Existing `audit/scripts/machine_audit_board.py` is **not an identity metric**. Its own scope note says it checks mechanical geometry/chroma only and identity still requires visual review.

Do not rename/reuse it as an identity checker.

---

## Same-worker self-critic vs independent judge

### Same worker / same post-image dialogue

Advantages:
- no candidate-image transport required;
- canonical and generated result are already in the conversation context;
- lowest implementation cost;
- useful for structured local defect extraction.

Risk:
- generator and critic share context/model biases;
- naive self-correction can reinforce mistakes.

Recommended role:
- **diagnostic critic**, not final autonomous retry controller.

### Independent judge GPT

Stronger future design:

```text
generator worker
-> candidate recovered/captured
-> separate non-generating judge GPT receives canonical + candidate
-> judge performs structured identity audit
```

Why this is now feasible:
- browser orchestrator already has file-attachment primitives;
- judge GPT does not generate images, so attaching canonical + candidate(s) does not create the generation-time sheetification risk;
- it separates generation bias from evaluation.

Potential judge configuration:
- Image Generation OFF
- Web OFF by default
- Code Interpreter ON only if needed
- Action with `getAuditPolicy` / `recordAudit`
- strict structured JSON audit

This is the preferred final evaluator if same-worker self-audit proves optimistic or unstable.

---

## Browser Orchestrator impact

Current v0.5.0 state machine treats image generation completion as the slot terminal condition and `image_collector.js` selects the largest image from the **latest assistant turn**.

Post-image dialogue introduces two new implementation risks:

1. `IMAGE_READY` is no longer necessarily the final quality decision;
2. if the post-image audit becomes a later assistant turn with no image, `extractLatestAssistantImage()` may search the wrong turn.

Therefore do not enable the audit loop without a DOM/runtime gate.

Required experiment:

### `POSTGEN-G1` — turn structure observation

Under Instant, one isolated worker:
1. canonical + one pose only;
2. generate exactly one image request;
3. after image generation, force a short structured text audit without another image generation;
4. inspect DOM/runtime evidence;
5. determine whether generated image and final audit text belong to the same assistant turn or separate turns;
6. verify when current terminal gate marks the slot COMPLETE;
7. verify whether current `image_collector.js` still resolves the intended generated image.

Do not patch `image_collector.js` until this evidence exists.

If separate-turn behavior occurs, future state should distinguish:

```text
GENERATING
-> IMAGE_READY
-> AUDITING
-> ACCEPTED / RETRY_REQUIRED
```

and candidate image capture should be tied to the generation turn, not `latest assistant` generically.

---

## Revised experiment order

### P0 — `POSTGEN-G1` runtime structure

Highest priority because the newly discovered control surface must be characterized before changing quality architecture.

### P1 — `ID-V1 + SELF-AUDIT`

A/B:
- A current canonical-reference wording;
- B edit/source wording;
- both run one post-image structured identity audit;
- no same-chat retry.

This measures both generation quality and whether the critic catches the known differences.

### P2 — `ID-V2 + SELF-AUDIT`

Canonical + exactly one local pose guide in one isolated worker.

Audit whether pose improves without identity loss.

### P3 — independent judge

Attach canonical + generated candidate to a separate judge GPT and compare its verdict with same-worker self-audit and human review.

### P4 — MaSC / machine metric reuse

Only after image transport is solved. Prefer official MaSC package or DreamBench++ evaluation code to a new home-grown embedding metric.

### P5 — best-of-2 gated retry

For hard frames only:
- generate candidate A/B independently;
- judge both;
- select the better accepted candidate;
- if neither passes, fresh retry from canonical with targeted failure codes.

---

## Revised working architecture

```text
ORIGINAL CANONICAL
      |
      +------------------------------+
      |                              |
      v                              v
identity source                 one local pose guide
      \                              /
       \                            /
        v                          v
       isolated generator (Instant first)
                  |
                  v
              IMAGE_READY
                  |
                  v
       post-image structured critic
                  |
          +-------+-------+
          |               |
       visual JSON    optional machine JSON
          |               |
          +-------+-------+
                  |
                  v
          ACCEPT / RETRY_REQUIRED
             |          |
             |          +--> NEW isolated worker
             |               ORIGINAL CANONICAL again
             |               local failed constraints only
             v
       recover/finalize
```

Later, replace or supplement the self-critic with an independent judge GPT.

---

## Decision boundary

The new evidence **does not justify immediately modifying the production worker**.

Current live-proven worker Instructions explicitly say to stop after generation. Preserve that baseline.

Create/clone an experimental audited worker for `POSTGEN-G1` so the current v0.5.0 fresh-chat production path remains available as a control.

Do not change the proven attachment/paste/send/recovery path until runtime evidence identifies the required boundary.

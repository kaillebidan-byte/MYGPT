# Identity-preserving variation with isolated workers — prior-art review

Date: 2026-08-09 JST
Status: **RESEARCH INPUT / DIRECTION CANDIDATES — NOT YET PRODUCTION DECISION**

## Goal

MYGPTの次段階は、1枚のcanonical character imageをidentity sourceとして固定しつつ、別pose / 別状態の静止画差分を高い同一性で作ること。

狙いは「同じsubjectのvariants / scenes / poses」を作るsubject-driven generation / image customizationに近い。現行のisolated worker architectureにより、各poseを別conversationへ分離したまま同一canonicalを毎回再投入できるため、sequence context contaminationを避けながらidentity preservation手法を比較できる。

既存の中国圏character-consistency調査:
- `research/prior-art/2026-08-08-cn-character-consistency-recovered.md`
- `research/chatgpt-project-practices/china-imagegen-practices.md`

このnoteはそれを置き換えず、isolated-worker成立後に新しく実行可能になった方向を追加する。

---

## 1. Strongest practical direction: treat canonical as an edit/source image, not only a semantic reference

### OpenAI current image stack

Primary:
- OpenAI — The new ChatGPT Images is here (2025-12-16)
  - https://openai.com/index/new-chatgpt-images-is-here/
- OpenAI API — GPT Image 2
  - https://developers.openai.com/api/docs/models/gpt-image-2

Relevant published behavior:
- OpenAI explicitly positions the current image stack around image generation **and editing** with stronger preservation.
- GPT Image 1.5 release material specifically describes generating product catalogs containing variants, scenes and angles from a single-source image while preserving key visuals.
- GPT Image 2 is described as supporting high-fidelity image inputs and editing.

MYGPT implication:
- A/B test whether each isolated worker should frame the task as **editing the attached canonical into one new pose** rather than “generate this character in pose X”.
- Every worker still receives the original canonical directly.
- No generated F2/F3/F4 becomes the next source image.

Why this is high priority:
- It uses a capability explicitly optimized by the actual image platform.
- It requires no extra model, dependency, or generated identity asset.
- It matches the target use case: same subject, controlled visual difference.

Candidate test `ID-V1`:
- A: current canonical-reference generation wording
- B: explicit source-edit wording: preserve character identity / materials / markings / proportions, change only pose state
- same canonical / same local pose / same worker / same mode

---

## 2. Identity channel + pose/structure channel separation

This pattern is independently repeated across character-animation and subject-driven generation research.

### Animate Anyone — ReferenceNet + Pose Guider

Primary:
- `Animate Anyone: Consistent and Controllable Image-to-Video Synthesis for Character Animation`
- https://arxiv.org/abs/2311.17117

Key idea:
- ReferenceNet carries detailed appearance features from a reference image.
- a separate pose guider carries motion/pose control.
- identity/appearance and motion are not expected to be encoded by one natural-language condition.

### PoseAnimate

Primary:
- `Zero-shot High-fidelity and Pose-controllable Character Animation`
- https://arxiv.org/abs/2404.13680

Key idea:
- pose-aware control is separated from consistency machinery.
- identity/detail preservation and pose alignment are treated as distinct objectives.

### BLIP-Diffusion + ControlNet compatibility

Primary:
- `BLIP-Diffusion: Pre-trained Subject Representation for Controllable Text-to-Image Generation and Editing`
- https://arxiv.org/abs/2305.14720

Key idea:
- encode subject representation from reference image.
- combine with external control such as ControlNet for structure/pose.

### OminiControl

Primary:
- `OminiControl: Minimal and Universal Control for Diffusion Transformer`
- https://arxiv.org/abs/2411.15098

Key idea:
- one DiT can accept subject-driven image conditioning and spatially aligned conditions such as edges/depth.
- subject identity and spatial structure are simultaneously controllable but conceptually distinct inputs.

### GroundingBooth

Primary:
- `GroundingBooth: Grounding Text-to-Image Customization`
- https://arxiv.org/abs/2409.08520

Key idea:
- subject identity preservation and spatial grounding are explicitly separated and jointly controlled.

MYGPT implication:
- The closest browser-only approximation is:

```text
canonical identity image
+ ONE pose/structure guide for this worker only
+ short local text packet
-> one output
```

Candidate `ID-V2`:
- create a deterministic single-pose guide per F2/F3/F4 (skeleton, silhouette, annotated landmarks, or other minimal guide)
- worker receives only canonical + its own guide
- never show a 4-pose board, sequence, other slots, or motion timeline

This becomes practical specifically because isolated workers now prevent the pose-guide set from collapsing into a storyboard/sheet context.

---

## 3. Global identity + local detail preservation

The current character is a difficult subject because identity depends not only on overall silhouette but also on small ornaments, sleeve topology, trim, lining and other local structures.

### AnyDoor

Primary:
- `AnyDoor: Zero-shot Object-level Image Customization`
- https://arxiv.org/abs/2307.09481

Key idea:
- combine a global identity feature with detail features.
- preserve texture/details while still permitting local variations such as orientation and posture.

### SSR-Encoder

Primary:
- `SSR-Encoder: Encoding Selective Subject Representation for Subject-Driven Generation`
- https://arxiv.org/abs/2312.16272

Key idea:
- selectively capture relevant subject patches.
- detail-preserving subject encoder complements global representation.

### Beyond Facial Consistency (2026)

Primary:
- `Beyond Facial Consistency: Personalized Person Image Generation with Holistic Identity Preservation`
- https://arxiv.org/abs/2607.25622

Key idea:
- global appearance and local identity branches are both necessary; optimizing only one creates a trade-off.
- coordinated global/local identity supervision improves holistic preservation.

### DSH-Bench (2026)

Primary:
- `DSH-Bench: A Difficulty- and Scenario-Aware Benchmark with Hierarchical Subject Taxonomy for Subject-Driven Text-to-Image Generation`
- https://arxiv.org/abs/2603.08090

Relevant findings:
- no evaluated method is uniformly robust across subject categories.
- all methods degrade on hard subjects.
- hard subjects contain nonuniform textures and multi-scale geometric details.
- animals are explicitly separated as a category due to high variation.

MYGPT implication:
- do not reduce identity to one global similarity score or a longer textual character description.
- use targeted local identity checks.
- if generation needs additional reference help, prefer **canonical-derived** local crops rather than generated sheets/multiviews.

Candidate `ID-V3`:
- A: canonical only
- B: canonical + one lossless crop from the canonical for the known-hard local region
- one local region per test, e.g. active sleeve / waist ornament
- no generated detail reference

Do not attach many detail crops by default; reference-role ambiguity remains a risk.

---

## 4. Editing / customization methods support reference-guided transformation rather than full redraw

### Spatially Conditioned Diffusion

Primary:
- `Consistent Human Image and Video Generation with Spatially Conditioned Diffusion`
- https://arxiv.org/abs/2412.14531

Key idea:
- formulate new-pose synthesis as a spatially conditioned inpainting problem.
- source/reference appearance extraction and target generation share one denoising framework.
- target queries appearance from the reference while preserving target pose control.

### MimicBrush

Primary:
- `Zero-shot Image Editing with Reference Imitation`
- https://arxiv.org/abs/2406.07547

Key idea:
- learns semantic correspondence between separate reference/source images for reference-guided editing.
- reinforces that reference-guided editing is a distinct and useful regime from unconstrained generation.

### AnyDoor again

AnyDoor is especially relevant for non-human / arbitrary objects: identity + detail representation is designed to permit new orientation/posture while retaining subject appearance.

MYGPT implication:
- a pose difference should first be tested as an **identity-preserving edit transformation** of the canonical, not assumed to require a fresh synthesized character.
- large pose changes may still force redraw of occluded/unseen areas; those cases should be classified separately from small/medium pose edits.

---

## 5. Cross-image attention methods are conceptually useful but not directly portable to isolated Custom GPT workers

### ConsiStory

Primary:
- `Training-Free Consistent Text-to-Image Generation`
- https://arxiv.org/abs/2402.03286

Uses subject-driven shared attention and correspondence-based feature injection across images.

### StoryDiffusion

Primary:
- `StoryDiffusion: Consistent Self-Attention for Long-Range Image and Video Generation`
- https://arxiv.org/abs/2405.01434

Uses consistent self-attention across generated images.

### StorySync

Primary:
- `StorySync: Training-Free Subject Consistency in Text-to-Image Generation via Region Harmonization`
- https://arxiv.org/abs/2508.03735

Uses masked cross-image attention sharing and regional feature harmonization.

Direct portability verdict:
- **not directly usable** in ChatGPT isolated workers because they require model-internal activation/attention sharing across generations.

Conceptual value:
- they confirm that cross-image subject consistency benefits from explicitly sharing subject features rather than relying on text alone.
- MYGPT's available approximation is to resend the exact same canonical/reference controls into every isolated worker.

Do not approximate these papers by passing F2 output into F3. That would reintroduce generated-frame drift and contradict the current canonical-reset architecture.

---

## 6. Isolated workers unlock a new strategy: best-of-N identity selection

### The Chosen One

Primary:
- `The Chosen One: Consistent Characters in Text-to-Image Diffusion Models`
- https://arxiv.org/abs/2311.10093

Relevant concept:
- consistency can be improved by generating a set, identifying a coherent subset/identity, and iterating/choosing around consistency rather than relying on one first output.

This paper is not directly transplantable because its full procedure updates the model/identity representation. However, the **selection principle** is relevant.

With isolated workers, MYGPT can now independently generate multiple candidates for the *same single pose* without exposing candidates to one another.

Candidate `ID-V4`:

```text
same canonical
+ same single pose packet
-> worker A candidate
-> worker B candidate
(optional worker C)
-> automatic identity audit against canonical
-> select best candidate
```

Benefits:
- does not lengthen the generation prompt.
- does not contaminate worker context with other poses.
- does not chain generated frames.
- converts first-pass stochastic drift into a selection problem.

Cost:
- 2x/3x image generations for targeted hard frames.

Recommended use:
- initially only for known-hard frames or local-retry path, not every frame.

---

## 7. Identity evaluation should be subject/region-aware, not whole-image similarity

### MaSC (2026)

Primary:
- `MaSC: A Masked Similarity Metric for Evaluating Concept-Driven Generation`
- https://arxiv.org/abs/2605.22469

Finding:
- global CLIP/DINO-style image embeddings correlate poorly with human concept-preservation judgments because background and unrelated regions contaminate the score.
- foreground masks and patch-level subject comparison improve identity-preservation evaluation.

### DSH-Bench SICS (2026)

DSH-Bench similarly argues for subject-level identity evaluation rather than whole-image semantic similarity.

MYGPT implication:
- current chroma-background output makes foreground extraction unusually easy.
- evaluation can be decomposed into:
  - whole foreground identity
  - hat/hair
  - active sleeve
  - non-active sleeve
  - waist ornament/cords
  - lower garment/shoes
- pose compliance should be scored separately from identity.

Candidate `ID-EVAL1`:
- add subject-mask and region-specific identity audit to candidate selection/retry.
- do not let a correct pose compensate for identity drift in one scalar score; keep dimensions separate.

---

## 8. Multi-reference: useful only when roles are explicit

Existing prior art:
- UMO (2026) warns about identity confusion in multi-reference / multi-identity conditioning.
- UNO (2025) explicitly develops mechanisms to mitigate attribute confusion when scaling visual subject controls.
- AnyStory (2025) uses an encode-then-route architecture so subject features are injected into the correct regions.
- DreamO (2025) uses feature routing and placeholders to associate conditions with positions.

Primary:
- https://bytedance.github.io/UMO/
- https://arxiv.org/abs/2504.02160 (UNO)
- https://arxiv.org/abs/2501.09503 (AnyStory)
- https://arxiv.org/abs/2504.16915 (DreamO)

MYGPT implication:
- adding more attachments is not automatically beneficial.
- multi-reference should be reserved for references with **non-overlapping roles**:
  - full canonical = identity/global appearance
  - one pose guide = structure
  - optional one canonical-derived crop = local detail
- avoid multiple generated “identity references”.

---

## 9. Recommended experiment order

### Priority 1 — `ID-V1`: explicit edit-source wording

Reason:
- lowest complexity.
- directly matches current OpenAI image editing/preservation direction.
- no new visual reference and no pipeline redesign.

Question:
- does telling the isolated worker to transform/edit the canonical, rather than recreate the character, improve fine identity while still allowing the target pose?

### Priority 2 — `ID-V2`: canonical + one single-pose visual guide

Reason:
- strongest repeated research pattern: appearance/reference branch + pose/structure branch.
- isolated workers finally make this safe from sequence-sheet contamination.

Question:
- does a minimal single-pose visual guide improve pose/occlusion topology without reducing identity fidelity?

### Priority 3 — `ID-V4`: best-of-2 isolated candidates + identity-aware selection

Reason:
- uses current fanout infrastructure.
- attacks stochastic first-pass drift without changing generation conditioning.
- selection can be added first for known-hard frames only.

Question:
- how much identity reliability is gained by selecting from two independent candidates using subject/region-aware audit?

### Priority 4 — `ID-V3`: one canonical-derived detail crop

Reason:
- appropriate only if failures remain localized after V1/V2.
- global + local identity research supports it, but extra references create role-binding risk.

---

## 10. Directions not recommended first

Do not start with:
- generated character sheets as new identity sources;
- generated multi-view packs;
- F2 -> F3 -> F4 image chaining;
- all F2/F3/F4 pose guides in one worker;
- large prompt descriptions of every garment detail;
- many simultaneous detail crops;
- cross-worker generated-output sharing.

These either contradict current live evidence or imitate model-internal consistency methods poorly.

---

## 11. Working hypothesis after this review

For MYGPT, the most promising architecture is not “teach each worker more about the character with text”. It is:

```text
SAME canonical source/edit image for every worker
+ ONE local pose/structure condition
+ minimal local text
-> independent candidate(s)
-> subject/region-aware identity audit
-> choose/retry only the failing pose
```

This is a browser-level approximation of the dominant research pattern:

```text
appearance / identity conditioning
        separate from
pose / spatial conditioning
        separate from
evaluation / selection
```

The isolated-worker architecture is therefore an enabler, not just a workaround for sheetification.

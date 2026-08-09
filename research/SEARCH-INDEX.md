# MYGPT external research / prior-art search index

更新日: 2026-08-10 JST
Status: **CURRENT SEARCH ENTRYPOINT**

新しいWeb検索を始める前に、まずこの索引から既存調査へ降りる。同じ一般検索を繰り返さず、既存資料で未解決になっている角度だけを追加検索する。

## CURRENT first read — Custom GPT + Thinking image generation

Current research audit:
- `research/audits/2026-08-10-custom-gpt-thinking-imagegen-existing-methods-reassessment.md`

Focused execution plan:
- `research/plans/2026-08-10-custom-gpt-thinking-imagegen-route-matrix.md`

Known issue / current workaround research:
- `research/chatgpt-project-practices/custom-gpt-thinking-imagegen-known-issue.md`

Historical local Thinking image-generation success:
- `research/experiments/2026-08-08-n2-branch-thinking-followup-result.md`

Current external/product boundary:
- Images with thinking is a documented ChatGPT capability on eligible paid plans;
- GPTs with Image Generation enabled can use the current image-generation model;
- OpenAI Support nevertheless acknowledged a Thinking/reasoning-specific image-generation defect affecting some Custom GPTs;
- failure can be `/mnt/data/...` only, no visible image, or tool-unavailable behavior;
- current explicit temporary workaround is Instant;
- no stable Thinking-specific fix is documented.

Historical MYGPT N2 success route:

```text
Custom GPT / Instant
-> canonical attached
-> clean non-generating seed
-> Branch in new chat
-> switch branch to Thinking
-> image request
-> native image generation SUCCESS
```

Do **not** describe this as a proven Branch workaround. N2 confounded:
1. warm/clean Instant seed;
2. delayed model switch;
3. Branch/new conversation.

CURRENT causal test order:
1. T1 same-chat warm seed -> Thinking, no Branch;
2. T2 exact clean-seed Branch -> Thinking if required by T1 result;
3. T3 successful Instant image -> first-party retry/regenerate with Thinking if T1/T2 fail;
4. T0 direct fresh Thinking only as matched baseline after a candidate route exists.

Do not re-spend primary experiments on these as supposed fixes unless new evidence changes:
- capability minimalization;
- rebuilding a neutral GPT;
- prompt-only `render inline` / `do not expose /mnt/data` tricks;
- browser/device/account switching.

A single Thinking generation success is a counterexample, not stability. Current pragmatic promotion threshold before quality testing is at least 4/5 visible native image returns on the candidate route.

## Post-image dialogue / critic research

Current runtime decision:
- `research/decisions/2026-08-10-post-image-critic-requires-explicit-followup-turn.md`

Evidence:
- `research/experiments/2026-08-10-postgen-g1a1-manual-result.md`
- `research/experiments/2026-08-10-postgen-branch-thinking-critic-result.md`

Confirmed:
- G1a-1 image generation succeeded but Instructions alone did not produce automatic `POSTGEN_AUDIT` text in the same user turn;
- Branch -> Thinking later returned structured `POSTGEN_AUDIT` text on the already-generated image with no new image generation;
- therefore Thinking critic/reasoner use is separately viable even while Thinking image generation remains flaky.

Browser implication for later integration:
- bind the image-bearing generation turn/candidate before sending any audit request;
- do not use generic `latest assistant image` after a later text-only audit turn exists;
- do not patch v0.5.0 during the current manual T1/T2/T3 route gate.

## Identity-preserving variation / isolated workers

Primary note:
- `research/prior-art/2026-08-09-identity-preserving-variation-isolated-workers.md`

Current quality plan:
- `research/plans/2026-08-09-identity-quality-closed-loop-execution-plan.md`

Status:
- identity-quality plan remains current for quality methodology but is **temporarily deferred by the Thinking image-generation route gate**.

Reusable directions:
1. `ID-V1` — canonical as edit/source image rather than only semantic reference;
2. `ID-V2` — canonical + exactly one worker-local pose/structure guide;
3. independent judge / structured critic comparison;
4. MaSC / DreamBench++ after image transport gate;
5. best-of-2 only for hard/failed frames;
6. optional one canonical-derived local detail crop for persistent local drift.

Research families already covered:
- OpenAI image editing / high-fidelity image input direction;
- Animate Anyone / PoseAnimate — reference appearance vs pose guider;
- BLIP-Diffusion / OminiControl / GroundingBooth — subject vs spatial control;
- AnyDoor / SSR-Encoder — global + local identity detail;
- ConsiStory / StoryDiffusion / StorySync — cross-image consistency mechanisms not directly transplantable to Custom GPT;
- The Chosen One — candidate selection;
- DSH-Bench / MaSC — subject-aware evaluation;
- UNO / AnyStory / DreamO / UMO — multi-reference routing / attribute confusion.

Frozen interpretation:
- generated frame chaining is not a substitute for identity conditioning;
- multi-pose boards/other slots must not enter a generation-facing worker;
- identity / pose / evaluation remain separate channels.

## China / character-consistency research

Broad Chinese-language practice note:
- `research/chatgpt-project-practices/china-imagegen-practices.md`

Recovered character-consistency prior art:
- `research/prior-art/2026-08-08-cn-character-consistency-recovered.md`

Use for:
- 角色一致性;
- 姿势控制;
- multi-reference routing;
- sketch / visual control signal;
- large-motion clothing-detail drift;
- identity anchor design.

Do not expose these research notes wholesale to generation workers.

## Planner / isolated worker research

- `research/chatgpt-project-practices/planner-worker-isolation.md`

Historical external patterns:
- isolated specialist runs;
- deterministic orchestration;
- Agent-as-tool designs;
- image-generation tool delegation.

CURRENT browser implementation takes precedence:
- `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md`
- `research/reference/2026-08-09-extension-reuse-inventory.md`

## Browser filesystem / selected output directory

- `research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md`

Current reuse conclusion:
- browser-only arbitrary selected folder uses File System Access permission lifecycle;
- persisted handle may be kept in IndexedDB;
- permission should be preflighted under Run user gesture;
- `chrome.downloads` remains staging/fallback;
- v0.5.0 selected-folder path is already LIVE PASS.

## Browser automation / extension prior art

Reference entrypoint:
- `research/reference/README.md`

Priority implementation maps:
1. `research/reference/2026-08-09-extension-reuse-inventory.md`
2. `research/reference/2026-08-09-autogpt-0.0.71-internal-structure-map.md`
3. `research/audits/2026-08-09-autogpt-0.0.71-deep-architecture-analysis.md`
4. `research/decisions/2026-08-09-autogpt-stripped-clone-current.md`

Do not reimplement attachment/paste/native-send/download behavior before checking these.

## Public image-GPT historical research

- `research/public-image-gpt-reuse/README.md`

Use for historical design/reuse evidence only. Older generated-image Action/file-transport assumptions are not CURRENT runtime truth.

## ChatGPT Projects / image context research

Directory:
- `research/chatgpt-project-practices/`

Key files:
- `search-ledger.md`
- `patterns-and-pitfalls.md`
- `image-reference-notes.md`
- `imagegen-orchestration-context.md`

## Search/result precedence

When sources conflict:
1. MYGPT live result;
2. CURRENT handoff / current focused plan;
3. official/primary product or implementation source;
4. community reports / secondary source;
5. historical project notes.

External evidence may generate hypotheses and route candidates, but does not overwrite a live production acceptance result by itself.

## When adding new research

- existing topic continuation -> update existing topic note/search ledger;
- new major search axis -> create focused note and link it here;
- source/selector/implementation reuse -> update `research/reference/`;
- material CURRENT change -> update `PROJECT-HANDOFF.md`, current focused plan, and this index if search routing changed.

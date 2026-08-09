# MYGPT調整プロジェクト — CURRENT HANDOFF

更新日: 2026-08-09 20:05 JST

GitHub `main` をdurable stateの正本とする。未merge候補や古いhandoffをCURRENTとして扱わない。

## 次チャットで最初に読む

1. `research/PROJECT-HANDOFF.md` — このCURRENT
2. `research/decisions/2026-08-09-identity-quality-closed-loop-direction.md` — **現在のidentity-quality方向**
3. `research/experiments/2026-08-09-post-image-dialogue-audit-loop-reassessment.md` — post-image dialogue / Actions再監査
4. `research/prior-art/2026-08-09-identity-preserving-variation-isolated-workers.md` — identity研究 / ID-V1〜V4
5. `research/SEARCH-INDEX.md` — 既存例 / prior art検索入口
6. `README.md` — root status
7. `extensions/mygpt-worker-fanout-v3/README.md` — Worker Orchestrator v0.5.0
8. `research/KNOWN-ISSUES.md` — 既知不具合 / 制約
9. `research/reference/README.md` — 実装・再利用資料入口

---

## 1. CURRENT generation baseline

**Production v0 generalized PASS**

Validated:
- 1 canonical character
- F1 = canonical
- F2/F3/F4のみ独立生成
- one worker = one local static pose
- front-facing baseline
- chroma background
- generated frameを次frameのidentity sourceにしない
- failed frameだけoriginal canonicalからlocal retry

Generation-facing workerへ出さない:
- full motion
- other slots
- progress / sequence
- board / sheet / 2x2 concepts
- previous generated frames as identity source

Generation品質の正本:
- `research/decisions/2026-08-08-production-v0-generalized-verdict.md`

---

## 2. CURRENT production worker

Name:
`MYGPT Single Frame Worker Test`

Route:
`/g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test`

Validated default:
- Instant
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Knowledge NONE
- Actions NONE
- canonical direct reference
- current one static pose only

Important: current live Instructions explicitly stop after generation. Preserve this as the control baseline; do not edit it for the new audit-loop experiment.

Runtime snapshot:
- `research/runtime/2026-08-08-single-frame-worker-live-snapshot.md`

---

## 3. CURRENT browser automation — Worker Orchestrator v0.5.0

Source on `main`:
`extensions/mygpt-worker-fanout-v3/`

Display/version:
- `MYGPT Worker Orchestrator v5`
- manifest `0.5.0`

Status:
**SELECTED-FOLDER LIVE PASS**

Proven inherited core:
- one-worker-at-a-time preparation
- 15s open settle
- AutoGPT DataTransfer attachment
- 15s attach settle
- MAIN-world paste
- Translation Loop native click
- positive submit evidence
- 5s cooldown
- passive completion monitoring
- v0.4.5 image recovery
- v0.5.0 Run-time output-folder permission preflight
- selected-folder final save LIVE PASS

Near-frozen unless new failure evidence appears:
- `background.js`
- attachment / paste / send primitives
- terminal monitoring behavior
- `image_collector.js`
- `output_relocator.js`

### Session strategies

`fresh-chat`
- `supported: true`
- LIVE PASS

`branch-thinking`
- `supported: false`
- RESERVED ONLY

Do not implement Branch by adding conditionals inside the proven fresh-chat engine. Future Branch logic belongs behind the strategy boundary.

---

## 4. NEW runtime evidence — post-image dialogue

User live evidence on 2026-08-09:
- **Instantのみ**、画像モデルが生成を終えた後に対話モデルへ戻れることを確認。

This materially expands the quality architecture.

Confirmed only:
```text
Instant image generation
-> post-image dialogue stage can resume
```

Not yet assumed:
- Thinking has the same behavior
- generated image bytes are automatically available to Code Interpreter
- generated image file references are automatically transferable to GPT Actions

OpenAI current GPT configuration docs confirm that custom GPTs can include image generation / Code Interpreter capabilities and external API Actions; Apps and Actions are the documented mutually-exclusive pair. This makes post-generation tool orchestration a valid test direction, but image-file transport remains a separate gate.

Detailed record:
- `research/experiments/2026-08-09-post-image-dialogue-audit-loop-reassessment.md`

---

## 5. CURRENT identity-quality direction — closed loop

Decision:
- `research/decisions/2026-08-09-identity-quality-closed-loop-direction.md`

The earlier identity plan remains useful:
- `ID-V1` canonical as edit/source image
- `ID-V2` canonical + one worker-local pose guide
- `ID-V4` best-of-N isolated candidates
- `ID-V3` optional canonical-derived detail crop

But these now run inside a stronger architecture:

```text
ORIGINAL CANONICAL
+ one local pose/structure condition
+ minimal text
        |
        v
isolated generator
        |
        v
IMAGE_READY
        |
        v
post-image structured critic
        |
        +--> identity audit
        +--> pose / topology audit
        +--> optional read-only Action policy lookup
        +--> optional machine metric after file-access gate
        |
        v
ACCEPT / RETRY_REQUIRED
        |
        +--> ACCEPT: recover/finalize
        |
        +--> RETRY_REQUIRED:
              NEW isolated worker
              ORIGINAL canonical again
              failed local constraints only
```

### Research reused

Do not invent evaluation from scratch first.

Priority reuse:
- DreamBench++ — GPT/VLM concept-preservation and prompt-following evaluation
- Beyond the Pixels — hierarchical feature-level identity audit
- EditRefiner — perception -> reasoning -> localized action -> evaluation
- MaSC — masked concept-preservation metric
- existing MYGPT chroma removal for easy foreground masks

`audit/scripts/machine_audit_board.py` remains mechanical/chroma-only; it explicitly does not judge identity.

---

## 6. Actions / Code Interpreter boundary

### First Action use — image bytes NOT required

Preferred narrow endpoints:

```text
getAuditPolicy(version)
recordAudit(run_id, slot_id, candidate_id, audit_json)
getRetryPolicy(failure_codes)
```

Use Actions after image generation so GitHub/policy/tool context does not enter the generation-facing packet.

Do not give the generator a broad general-purpose GitHub API surface if a small read-only policy endpoint is enough.

### Image metric Action — later

Only after image transport is proven:

```text
runIdentityMetric(canonical, candidate)
```

Do not assume historical `openaiFileIdRefs`-style generated-image transfer works automatically.

### Code Interpreter — gated

Potential:
- post-image dialogue reads versioned scripts/specs
- run deterministic local checks
- combine machine JSON + visual critic JSON

First verify generated image is actually accessible to Code Interpreter after native image generation.

If not, keep Code Interpreter out of the critical path and use external/browser image transport later.

---

## 7. Same-worker critic vs independent judge

### Same-worker post-image critic

Use first because:
- no candidate-image transport needed
- canonical + generated result are already in context
- lowest implementation cost

Role:
- diagnostic structured audit only
- no unbounded autonomous same-chat regeneration

### Independent judge GPT

Preferred final evaluator if self-audit is biased.

Possible flow:

```text
generator worker
-> candidate capture/recovery
-> separate judge GPT
   canonical + candidate
-> structured identity verdict
```

Judge can be non-generating, so multi-image comparison does not create the generation-time 2x2/sheetification risk.

---

## 8. NEXT ONLY — `POSTGEN-G1`

Before changing quality prompts or collector logic, characterize the newly discovered runtime.

Create a **separate experimental audited Custom GPT clone**. Do not alter the current production worker.

Test under Instant:
1. canonical + one local pose only
2. generate one candidate
3. after image generation, force a short structured text audit with no second image generation
4. observe whether image + audit live in the same assistant turn or separate turns
5. observe when current terminal monitor marks slot COMPLETE
6. verify current `image_collector.js` still finds the intended generated image
7. if Action is enabled, test a read-only text/JSON Action after generation
8. separately test Code Interpreter only if useful; do not assume image file availability

Why this is first:
- current collector uses the **latest assistant turn** to locate the image
- post-image audit may change what `latest assistant` means
- runtime evidence must precede any collector/state-machine patch

If separate-turn behavior requires it, future slot phases become:

```text
GENERATING
-> IMAGE_READY
-> AUDITING
-> ACCEPTED / RETRY_REQUIRED
```

Do not implement that transition before `POSTGEN-G1` evidence.

---

## 9. After `POSTGEN-G1`

If runtime structure is compatible:

1. `ID-V1 + SELF-AUDIT`
   - current reference wording vs explicit edit/source wording
2. `ID-V2 + SELF-AUDIT`
   - canonical + one single-pose visual guide
3. independent judge comparison
4. MaSC / DreamBench++ metric reuse after image transport gate
5. best-of-2 only for hard frames / failed first pass
6. Branch -> Thinking later; separately revalidate post-image dialogue/tool behavior there

---

## 10. Frozen boundaries

Until contrary evidence:
- original canonical remains sole identity source
- generated frame is never promoted to canonical
- one pose/state per generation-facing worker
- no 4-pose guide or sequence context in generator
- no F2 -> F3 -> F4 image chaining
- fresh isolated retry
- v0.5.0 successful fanout/recovery/output core stays intact

---

## 11. Search / prior-art route

Before new external research:

`research/SEARCH-INDEX.md`
-> `research/chatgpt-project-practices/search-ledger.md`
-> relevant topic note / prior-art

Do not repeat broad searches already marked DONE unless new runtime evidence creates a genuinely new angle.

---

## 12. Repository maintenance rule

At each meaningful result, update durable state without waiting for an explicit GitHub-update request:
1. CURRENT / next action -> `PROJECT-HANDOFF.md`
2. known issue -> `KNOWN-ISSUES.md`
3. version PASS/FAIL -> checkpoint + extension README + root README as needed
4. external/prior-art result -> `SEARCH-INDEX.md` + topic note
5. implementation reuse result -> `reference/README.md` / audit note
6. stale CURRENT text -> supersede or update

Do not change frozen code merely for documentation consistency.

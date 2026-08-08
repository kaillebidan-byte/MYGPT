# Next experiment plan — native Chat worker isolation on Plus

Date: 2026-08-08
Status: PLANNED — revised after confirming Custom-GPT Thinking image-generation issue
Constraint: no ChatGPT Work / no Codex agentic allowance / no OpenAI API billing

Basis:
- M2b human-separated local static calls PASS
- M2d standalone carrier with weak temporal roles
- M2e temporal roles restored but 2x2 sheet regression
- `research/chatgpt-project-practices/native-chat-context-isolation.md`
- `research/chatgpt-project-practices/custom-gpt-thinking-imagegen-known-issue.md`

## Decision

Do not continue prompt-only M2 variants inside one Project conversation.
Do not use Work or API for the next proof.

A fresh Custom-GPT conversation remains a candidate native context boundary, but it now has TWO independent gates:

1. Can Custom GPT Thinking actually return generated images on this account/session?
2. If only Instant is reliable, is Instant image quality high enough for MYGPT?

Do not collapse these questions into one PASS/FAIL.

The old Custom-GPT production architecture remains rejected. This test revives only an image-only stateless worker with no Actions/Knowledge/GitHub/file-transfer orchestration.

---

## N0 — model/runtime matrix before worker architecture

### Goal

Separate:
- model-mode image quality
- Custom-GPT runtime/tool-routing defects
- single-frame worker viability

### Minimal worker GPT configuration

Temporary name: `MYGPT Single Frame Worker Test`

Capabilities:
- Image generation: ON
- Web/search: OFF if configurable
- Code/Data Analysis: OFF if configurable
- Actions: NONE
- Apps: NONE
- Knowledge files: NONE

Worker Instructions:

```text
チャットに直接添付された人物画像を、その会話における人物の基準画像として扱う。

ユーザーから指定された現在の1つの静止姿勢だけを画像として作る。
他の時点や動作全体を計画しない。

基準画像の人物の外見、体格、帽子、髪、表情、胸紋、袖、腰飾り、房・紐、下衣、靴をできるだけ維持する。

人物は1体、全身、正面基準、portraitとする。
1回の依頼につき画像を1枚だけ作り、生成後は停止する。
```

Do not include motion / four-state / progress / board / sheet / compose / audit / repair vocabulary.

### Fixed test input

Every condition uses a FRESH conversation and directly attaches the same:
- `kokyo_base_20260805.png`

Exact static request:

```text
この人物を、正面を向いて直立し、キャラクター自身の右肘を軽く曲げ、右手を上腹部・みぞおち付近まで上げた全身姿勢で1枚作ってください。
左腕、両脚、体幹、頭、表情は基準画像を維持してください。
```

### Four conditions

Run separately and save every output immediately:

A. Normal Chat / Thinking
B. Normal Chat / Instant
C. Custom GPT / Thinking
D. Custom GPT / Instant

No `@GPT` invocation. Open the Custom GPT directly as a new conversation for C/D.

### Gate 1 — tool availability

For each condition record:
- native image generation invoked or not
- visible image returned or not
- internal `/mnt/data/...` path only
- false claim that image generation is unavailable
- timeout/failure

Important interpretation:
A failure in C matching the known Thinking/reasoning Custom-GPT issue is a PLATFORM/RUNTIME FAIL, not evidence that the stateless-worker context idea is wrong.

### Gate 2 — carrier

For successful generations:
- exactly one visible image
- one person / one pose
- portrait
- no multi-panel / labels / dividers
- anatomical right arm active

### Gate 3 — pose accuracy

Required:
- right hand is actually around upper abdomen / solar plexus, not chest endpoint or waist-low
- left arm, head, torso, legs remain close to canonical
- no active-limb side swap

### Gate 4 — identity / topology quality

Compare all successful A/B/C/D outputs against the canonical using the same checklist:
- proportions
- silhouette
- hat/hair boundary and hair emergence
- chest flower emblem
- large sleeve silhouette/topology
- waist circular ornament
- tassel/cord/fastener count and attachment
- lower garment
- shoes
- overlap/occlusion order

Do not decide quality from overall resemblance alone.

### N0 interpretation matrix

- C fails, D passes carrier + quality:
  Thinking path is blocked by known Custom-GPT platform issue, but an Instant-only worker remains viable.

- C fails, D generates but quality is materially worse than B:
  Custom-GPT runtime/configuration adds a quality problem; do not proceed to N1.

- B and D are both materially worse than A:
  Instant-mode preparation/reasoning is the likely limiting factor; Custom GPT worker is not practical for MYGPT even if it generates successfully.

- B and D meet the MYGPT quality threshold:
  Thinking is not required for the isolated single-frame worker. Proceed to N1 using Instant.

- C works and quality is good:
  record the platform issue as non-universal/intermittent for this account, but still test D because production reliability matters more than a single Thinking success.

### Repetition

Do not do large batches initially.
First run one output per A/B/C/D.
If B vs D or A vs B is ambiguous, repeat only the ambiguous pair with one fresh run each.

---

## N1 — planner / fresh-worker manual boundary proof

Run only if at least one Custom-GPT mode passes N0 quality; prefer the reliable mode. If Thinking is affected by the known issue and Instant passes quality, use Instant.

### Goal

Prove the desired architecture inside ChatGPT UI:
planner knows the full motion; each worker conversation knows one frame only.

### Planner

Use a separate planner chat/Project.
Planner gets the natural motion request and produces four local static-pose packets: start / early / late / endpoint.
Planner does not generate images.

### Worker execution

For EACH packet:
1. open the minimal worker GPT as a NEW conversation;
2. explicitly select the N0-approved model mode;
3. directly attach `kokyo_base_20260805.png`;
4. paste ONLY that one local packet;
5. generate one image;
6. save it immediately;
7. start another fresh worker conversation for the next packet.

Do not use `@` mention.
Do not put worker conversations inside the motion-planner Project.
Do not show a worker the other packets.

### N1 pass

- 4 fresh worker conversations
- 4 standalone portraits
- no 2x2 / multi-panel / labels / dividers
- start frame arms down
- right hand position progresses monotonically through early/late to endpoint
- identity/topology does not fall below the quality threshold established at N0

PASS means the missing context boundary can be achieved inside Plus/ChatGPT UI without Work/API; remaining problem is orchestration/UI automation.

---

## N2 — Branch-from-clean-seed friction reduction

Run only if N1 passes.

Create a clean worker conversation containing only canonical/single-frame setup and no motion plan.
Test `Branch in new chat` from that pre-motion point.

Verify:
- intended Custom GPT / model mode remains in effect
- canonical remains usable
- one local packet still gives one standalone portrait

If one branch works, try four branches from the same clean seed.
If branch attachment/model behavior is unreliable, abandon N2 and keep N1 fresh conversations.

---

## N3 — automation ceiling assessment

Only after N1 proves context isolation.

Current official feature survey found no normal-Chat primitive that lets a parent chat programmatically spawn four independent Custom-GPT conversations and send one packet into each.

Classify resulting UX:
A. manual fresh-worker boundary
B. semi-manual clean-seed branches
C. zero-click orchestration — not currently documented in normal Chat

Work/API remain outside the original constraint unless the user later changes it.

---

## Rejected shortcuts

- `@workerGPT` from planner chat: rejected because current conversation context is retained.
- Branch after planner output: rejected because global plan would be inherited.
- Same Project for planner and worker: rejected for isolation proof.
- Scheduled Tasks: poor fit for immediate canonical-image generation.
- Temporary Chat: diagnostic fallback only, not primary worker architecture.
- Interpreting Instant success as production success without identity/pose scoring: rejected.
- Interpreting Custom-GPT Thinking failure as architecture failure when it matches the known platform bug: rejected.

---

## Operational rule

Save every generated image immediately.
If FAIL is already clear, stop after the evidence required for diagnosis has been saved.
Do not modify production MYGPT Instructions/Sources until N0/N1 outcome is known.

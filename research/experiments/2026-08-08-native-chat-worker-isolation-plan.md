# Next experiment plan — native Chat worker isolation on Plus

Date: 2026-08-08
Status: PLANNED
Constraint: no ChatGPT Work / no Codex agentic allowance / no OpenAI API billing

Basis:
- M2b human-separated local static calls PASS
- M2d standalone carrier with weak temporal roles
- M2e temporal roles restored but 2x2 sheet regression
- research: `research/chatgpt-project-practices/native-chat-context-isolation.md`

## Decision

Do not continue prompt-only M2 variants inside one Project conversation.
Do not use Work or API for the next proof.

Test whether a fresh Custom-GPT conversation can serve as the missing native context boundary.

The old Custom-GPT production architecture remains rejected. This test revives only a much narrower configuration: an image-only stateless worker with no Actions/Knowledge/GitHub/file-transfer orchestration.

---

## N0 — minimal worker capability check

### Goal

Before building planner/worker flow, verify that a minimal Custom GPT on the current Plus account can actually perform one direct-reference single-frame image generation reliably.

### Worker GPT configuration

Temporary name:
`MYGPT Single Frame Worker Test`

Capabilities:
- Image generation: ON
- Web/search: OFF if configurable
- Code/Data Analysis: OFF if configurable
- Canvas/other creative tools: OFF if configurable
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

Do not put into worker Instructions:
- motion
- one-shot / loop
- four states
- progress percentages
- F1/F2/F3/F4
- pose A/B/C/D
- board / sheet / panel / 2x2
- compose / audit / repair

### N0 input

Open the worker GPT directly as a NEW GPT conversation.
Do NOT invoke it with `@` from another chat.

Directly attach:
- `kokyo_base_20260805.png`

Send one known-good static request only:

```text
この人物を、正面を向いて直立し、キャラクター自身の右肘を軽く曲げ、右手を上腹部・みぞおち付近まで上げた全身姿勢で1枚作ってください。
左腕、両脚、体幹、頭、表情は基準画像を維持してください。
```

### N0 pass

- image generation actually runs
- one image output
- one person / one pose
- portrait
- no multi-panel
- anatomical right arm active

### N0 fail

If the minimal worker again claims image generation is unavailable or routes into unrelated tools, stop.
Do not rebuild Actions/GitHub integrations.
Move to fallback N0-T (Temporary Chat control) instead.

---

## N0-T — Temporary Chat fallback control

Only if minimal Custom-GPT worker is unusable.

Use a normal Temporary Chat outside any Project.
Directly attach canonical and send the same one-static-pose request.

Purpose:
check whether a blank-slate normal Chat can reproduce M2b without Project context.

This is diagnostic only because Temporary Chat is not retained in history.
Save the generated image immediately.

---

## N1 — planner / fresh-worker manual boundary proof

Run only if N0 passes.

### Goal

Prove the exact desired architecture inside ChatGPT UI before trying to automate it:

planner knows the full motion;
worker conversation knows one frame only.

### Planner

Use a separate planner chat/Project.
Planner gets the natural motion request:

`このキャラクターが、右手を胸の高さまで上げて、その位置で止まるone-shotモーションを作ってください。`

Planner produces four local static-pose packets corresponding to:
- start
- early
- late
- endpoint

The planner may know all four.
It does not generate images.

### Worker execution

For EACH packet:
1. open the minimal worker GPT as a new conversation;
2. directly attach `kokyo_base_20260805.png`;
3. paste ONLY that one local packet;
4. generate one image;
5. save it immediately;
6. close/leave that worker conversation and start another fresh conversation for the next packet.

Do not use `@` mention.
Do not place worker conversations inside the motion-planner Project.
Do not show a worker the other packets.

### N1 pass

Required:
- 4 fresh worker conversations
- 4 standalone portraits
- no 2x2 / multi-panel / labels / dividers
- start frame arms down
- right hand position progresses monotonically through early/late to endpoint

Secondary:
- identity fidelity
- sleeve topology
- tassel/cord topology
- background consistency

Interpretation if PASS:
The missing boundary can be achieved within Plus/ChatGPT UI without Work/API. Remaining problem is only orchestration/UI automation.

Interpretation if FAIL:
If fresh worker conversations still sheetify, context leakage alone is not sufficient to explain M2e and the worker prompt/image backend must be re-examined.

---

## N2 — Branch-from-clean-seed friction reduction

Run only if N1 passes.

### Goal

Reduce repeated setup without reintroducing planner context.

### Clean seed

Open minimal worker GPT in a new conversation.
Attach canonical once.
Send a non-generating setup message if needed that contains only identity/single-frame rules.
Do not mention the motion or four states.

### Branch test

On web, use `Branch in new chat` from the clean pre-motion point.

First test ONE branch only.
Verify:
- the branch stays with the intended worker configuration;
- canonical remains usable as reference;
- no unrelated history appears;
- one local static-pose packet yields one standalone portrait.

If this works, create four branches from the same clean seed and give one packet to each.

### N2 pass

- all branches inherit only clean base context
- canonical remains effective
- single-frame carrier remains stable

This reduces repetitive canonical setup while preserving context isolation.

### N2 fail

If canonical attachment does not carry reliably or branch behavior differs for Custom GPTs, do not repair the branch architecture.
Return to N1 new-conversation workers.

Later, test `Add from Library` as a separate convenience variable.

---

## N3 — automation ceiling assessment

Only after N1 proves context isolation.

Current official feature survey found no normal-Chat primitive that lets a parent chat programmatically spawn four new independent chats/branches and send messages into them.

Therefore do NOT call the architecture fully automated yet.

At this stage classify UX levels:

A. Native manual boundary:
- planner produces 4 packets
- user starts/pastes into 4 fresh worker chats

B. Native semi-manual branch boundary:
- clean seed + 4 branches
- user pastes one packet per branch

C. Zero-click orchestration:
- not documented in normal Chat
- would require a new product capability or an external/UI automation layer

Do not move to C until the user explicitly decides that external UI automation is acceptable. Work/API remain outside the original constraint.

---

## Explicit rejected shortcuts

### `@workerGPT` from planner chat
Rejected.
Official GPT documentation says the existing conversation context is retained when a GPT is brought into a normal chat with `@`.

### Branch after planner output
Rejected.
Branch preserves conversation context up to the branch point, so it would carry the global plan.

### Same Project for planner and worker branches
Rejected for the isolation proof.
Project memory can draw from other conversations in that Project.

### Scheduled Tasks
Rejected.
Poor fit for immediate frame generation; GPT/file-access limitations conflict with the canonical-reference requirement.

### Temporary Chat as production worker
Rejected as primary path.
Useful only as fallback diagnostic because history is not retained and each run still requires user setup.

---

## Operational rule

Save each generated image immediately.
If a fail condition is already clear, stopping is allowed after the needed evidence has been saved.

Do not modify production MYGPT Instructions/Sources until N0/N1 outcome is known.

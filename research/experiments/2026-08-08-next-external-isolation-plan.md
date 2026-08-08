# Next experiment plan — external planner / fresh single-frame worker isolation

Date: 2026-08-08
Status: PLANNED — do not run until execution prerequisites are confirmed

Basis:
- M2b standalone static calls PASS
- M2d carrier mostly survives but temporal roles fail
- M2e temporal roles improve but regress to 2x2 sheets
- existing architecture survey: `research/chatgpt-project-practices/planner-worker-isolation.md`

## Decision

Stop adding prompt-only M2 variants inside one ChatGPT Project conversation.

The next experiment should test a real context boundary outside the Project conversation, using code-controlled fresh runs.

Use two stages so planner behavior is not conflated with worker isolation.

---

## Stage E1 — fresh-worker boundary baseline, no planner LLM

### Purpose

Verify the smallest architecture that could solve M2e:

> Four independent fresh image-generation runs, each seeing the canonical and exactly one concrete static pose, with no shared conversation state.

This stage deliberately does NOT use a planner model. The four pose descriptions are fixed test data taken from the already-established motion contract.

### Inputs

Canonical:
- `kokyo_base_20260805.png`
- same high-resolution 1024x1536 source
- provided to every worker invocation

Four hard-coded local static poses:

1. start: both arms naturally down
2. early: anatomical right elbow lightly bent, right hand at upper abdomen / solar plexus
3. late: right hand below chest flower emblem, not endpoint
4. endpoint: right hand at chest flower emblem and stopped

### Execution boundary

Code owns the loop.

For each of four states:
- start a new worker run;
- no shared `session`;
- no `previous_response_id`;
- no shared `conversation_id`;
- no previous generated image as identity source;
- give only canonical + current static pose;
- worker has image generation capability only;
- request exactly one portrait output;
- save output immediately before starting next run.

The worker must never receive:
- the other three poses;
- 0/35/70/100 list;
- motion/sequence/board/sheet/2x2/comparison concepts;
- audit/repair/compose instructions.

### Preferred implementation surface

OpenAI Agents SDK or direct Responses API.

Reason for code-first orchestration:
OpenAI's official orchestration guide recommends code orchestration for deterministic/predictable flow, and its deterministic example runs each stage separately.

A worker Agent can use the hosted `ImageGenerationTool`.

### E1 pass criteria

Required:
- 4 fresh worker invocations confirmed in trace/log
- 4 output image objects/files
- each output contains exactly 1 person / 1 pose
- no 2x2 / multi-panel / pose labels / dividers
- temporal hand position is monotonic from start to endpoint

Secondary observations only:
- identity fidelity
- sleeve topology
- tassel/cord drift
- background consistency

Do not fail E1 solely for minor identity drift; the main variable is carrier isolation.

### E1 fail interpretation

If a fresh worker with one static pose still returns a sheet, the contamination hypothesis is incomplete and the image backend/prompt itself must be investigated.

If E1 passes, proceed to E2.

---

## Stage E2 — planner + fresh workers

### Purpose

Test whether a planner may safely know the whole motion when workers are truly isolated.

### Planner

One fresh planner run receives:
- natural-language motion request
- motion type/endpoint rules as needed

Planner returns structured data only, e.g. four records containing:
- ordinal index
- semantic role (start / early / late / endpoint)
- one concrete static-pose description

The planner does not generate images.

### Orchestrator

Python/code receives the full structured plan.
It iterates records 1..4.
For each record it starts a fresh image-worker run exactly as in E1.

Critical rule:
The full plan exists in code/orchestrator memory but is never inserted into any worker's LLM conversation.

### Worker

Same worker configuration as E1.
Each invocation receives only:
- canonical
- current single static-pose description
- stable identity/output-format rules

No shared state across invocations.

### E2 pass criteria

- 4 fresh worker invocations
- 4 standalone portraits
- clear start -> early -> late -> endpoint temporal progression
- no sheetification

If E1 passes but E2 fails, inspect what planner text is being forwarded to workers; the isolation contract has been violated or planner-generated local descriptions contain sequence leakage.

---

## Why not Agent handoff

OpenAI Agents SDK documentation states that handoffs give the receiving agent conversation history.
That is the opposite of the desired isolation boundary.

For a manager-style integration later, `Agent.as_tool()` is safer because nested agent state does not automatically inherit parent conversation state and can receive bounded structured input.

For the first proof, explicit `Runner.run(...)` / direct API calls controlled by code are preferred over manager-LLM tool selection.

---

## Why no critic / repair yet

InterleaveThinker and other multi-agent image systems use critics/refinement, but MYGPT has already shown repair can create regressions.

E1/E2 test only the carrier/context boundary.
Do not add:
- critic
- repair
- audit
- compose
- chroma removal
- GIF/MP4

until the four raw isolated frames are stable.

---

## Integration is a later stage

This experiment is an architecture proof, not yet the final ChatGPT Project UX.

If E2 passes, then investigate how the Project invokes the external orchestrator:
- eligible ChatGPT custom app/MCP path, or
- another explicit service/action path compatible with the user's plan/workspace.

Do not assume the user's current workspace supports custom MCP write/actions; check before implementation.

Also do not revive the old Custom-GPT/GitHub manual-upload architecture without explicitly solving the prior file-transfer problems.

---

## Operational rule

Save every generated image immediately when it appears.
If a fail condition becomes clear, stop only after the evidence needed for diagnosis has been saved.

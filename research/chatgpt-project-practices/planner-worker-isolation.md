# Planner / single-frame worker isolation — existing examples survey

Date: 2026-08-08
Purpose: Search existing implementations before designing the next MYGPT motion experiment after M2e.

## Why this search was needed

MYGPT isolation tests established a tradeoff:

- M2b: manual one-pose-at-a-time requests -> standalone portrait carrier works.
- M2d: weak hidden temporal orchestration -> standalone outputs, but temporal roles collapse toward endpoint variants.
- M2e: strong hidden 0/35/70/100 progress roles -> temporal progression improves, but the image model repeatedly collapses all roles into a 2x2 sheet.

This suggests that keeping all temporal planning inside the same ChatGPT Project conversation is itself the problem. The next question is whether there are established architectures where a planner owns the global sequence while each image generator receives only one bounded step in a fresh context.

## Search angles used

```text
OpenAI Agents SDK agents as tools context isolation manager worker handoff
OpenAI Agents SDK deterministic workflow structured input nested run
OpenAI Agents SDK ImageGenerationTool agent
planner image generator separate context multi agent image generation storyboard
interleaved generation planner image generator step-wise instruction
multi-agent image generation planner checker painter
ChatGPT Projects custom actions apps MCP orchestration
```

## Strongest existing examples

### 1. OpenAI Agents SDK — Agent.as_tool() gives the nested agent generated input, not parent conversation history

Official docs:
- https://openai.github.io/openai-agents-python/tools/
- https://openai.github.io/openai-agents-python/ref/agent/

Important behavior:
- A manager can expose a specialist agent through `Agent.as_tool()`.
- Unlike a handoff, the nested tool-agent does not automatically inherit the parent's conversation history.
- The nested agent receives generated/bounded input.
- Parent conversation state is not inherited automatically; sharing a `session`, `previous_response_id`, or `conversation_id` is explicit.
- Structured parameters and a custom `input_builder` can define exactly what the nested worker sees.

MYGPT implication:
This is almost exactly the execution boundary M2e showed we need. The planner may know all four temporal states, while the image worker can be invoked four times with only one state's concrete static-pose description.

Do not use a handoff for this isolation test because OpenAI's handoff pattern normally passes conversation history to the receiving agent. That would preserve the contamination channel we are trying to remove.

### 2. OpenAI Agents SDK — deterministic orchestration via code

Official docs/example:
- https://openai.github.io/openai-agents-python/multi_agent/
- https://github.com/openai/openai-agents-python/blob/main/examples/agent_patterns/deterministic.py

The official deterministic example performs each stage with a separate `Runner.run(...)` and passes only the previous stage's selected output into the next stage. OpenAI documentation explicitly recommends code orchestration when flow order and behavior should be more deterministic/predictable.

MYGPT implication:
Do not ask one LLM to decide when/how to issue all four image calls. Let code own the four-step loop. The planner's output should be structured data; code selects one state at a time and starts a fresh worker run for that state.

### 3. OpenAI Agents SDK — hosted ImageGenerationTool exists

Official docs:
- https://openai.github.io/openai-agents-python/tools/
- https://openai.github.io/openai-agents-python/ja/ref/tool/

The SDK exposes `ImageGenerationTool` as a hosted tool for agents using the Responses model stack.

MYGPT implication:
A dedicated frame worker can have only the image-generation capability. It does not need Python/OpenCV/ffmpeg, preventing the M2c-R tool-routing escape path by construction rather than by negative prompt wording.

### 4. OpenAI Agents SDK — separate nested runs / isolated workspace examples

Official example:
- https://github.com/openai/openai-agents-python/blob/main/examples/sandbox/sandbox_agents_as_tools.py

The example uses a normal orchestrator with specialist agents exposed as tools and explicitly gives separate run configurations/workspaces to specialists. This is not an image example, but it demonstrates the established pattern: the outer coordinator owns global intent while specialists execute bounded tasks behind isolated invocations.

### 5. InterleaveThinker (2026) — planner and image generator are explicitly decoupled

Paper/project:
- https://arxiv.org/abs/2606.13679
- https://zhengdian1.github.io/InterleaveThinker-proj/
- code referenced at https://github.com/zhengdian1/InterleaveThinker

Architecture:
- planner organizes an image-text sequence into executable steps;
- image generator executes each required step;
- critic evaluates each output and refines step instructions;
- project page explicitly describes the method as decoupling high-level interleaved reasoning from low-level image synthesis.

MYGPT implication:
This is direct external evidence that long-horizon image sequencing is treated as a planner/generator separation problem, not as one giant generation prompt. It matches M2e's empirical failure mode.

For the next MYGPT experiment, do not add critic/regeneration yet. Test only planner -> fresh single-frame worker, because repair is a separate variable and past MYGPT repairs caused regressions.

### 6. coDrawAgents / M3 — specialized planning and image execution are separated

Papers:
- coDrawAgents: https://arxiv.org/abs/2603.12829
- M3: https://arxiv.org/abs/2602.06166

Both frameworks decompose global image reasoning into specialized planning/checking/rendering or editing stages instead of exposing every requirement directly to one undifferentiated generation step.

MYGPT implication:
These are supporting examples for architectural decomposition. They are not direct evidence about ChatGPT Project sheetification, so they should not be overinterpreted.

## ChatGPT Project boundary

Official Project/App docs:
- https://help.openai.com/en/articles/10169521-projects-in-chatgpt
- https://help.openai.com/en/articles/11487775-connectors-in

Projects keep chats, instructions, files and memory as shared working context. Apps can be used inside Projects, and custom MCP apps exist on eligible workspace setups, but there is no documented native Project feature that lets one chat silently spawn four fresh isolated ChatGPT chats as worker contexts.

Therefore:
- another Project-Instruction-only experiment is unlikely to create a real isolation boundary;
- if true planner/worker isolation is required, it should be implemented outside the Project conversation (API/Agents SDK, or an eligible custom app/MCP wrapper around such a service).

## Most important design choice from existing examples

Use **code-first orchestration + fresh worker runs**, not LLM-first orchestration.

Recommended conceptual pipeline:

```text
motion request + canonical
        |
        v
planner run
  output: structured 4-state plan
        |
        v
code loop (not visible to frame worker as a whole)
        |
        +--> fresh worker run #1: canonical + static pose 1 only
        +--> fresh worker run #2: canonical + static pose 2 only
        +--> fresh worker run #3: canonical + static pose 3 only
        +--> fresh worker run #4: canonical + static pose 4 only
```

Rules:
- no shared session between frame-worker runs;
- no `previous_response_id` / shared conversation ID between worker runs;
- never pass the full 4-state plan into the frame worker;
- each worker receives canonical + exactly one concrete static-pose description;
- worker has image generation only for the first test;
- do not add compose/audit/repair until the carrier test passes.

## Why Agent.as_tool alone is not yet the preferred first test

`Agent.as_tool()` provides the right context boundary, but allowing the manager LLM to decide tool calls still introduces another stochastic orchestration layer.

The cleaner first experiment is the official deterministic/code-orchestration pattern:
1. planner returns structured four states;
2. Python code iterates those states;
3. each iteration starts a fresh image-worker run with no inherited conversation state.

If this passes, an `Agent.as_tool()` manager version can be tested later for a more conversational production integration.

## What is not yet confirmed

- Whether ChatGPT UI/Project itself can host this fresh-worker boundary without an external API/app layer.
- Whether the user's current plan/workspace supports a custom MCP app with the required write/action behavior.
- Whether GPT Image 2 via API will match the exact identity fidelity observed in current ChatGPT UI runs; this requires an actual A/B test.
- The exact canonical-image transport method for an external worker should be decided after checking the existing MYGPT infrastructure and user constraints; do not assume manual GitHub upload.

## Next experiment recommendation

Do not run another prompt-only M2 variant.

Next candidate should be an **external isolation proof-of-concept** with only one purpose:

> Can a planner create four temporal roles while four fresh image-worker contexts each return one standalone portrait when each worker sees only its own pose?

Success criterion:
- four fresh worker invocations;
- four standalone images;
- clear 0 -> intermediate -> intermediate -> endpoint progression;
- no multi-panel image in any worker result.

Identity/chroma/audit/compose remain secondary for this first boundary test.

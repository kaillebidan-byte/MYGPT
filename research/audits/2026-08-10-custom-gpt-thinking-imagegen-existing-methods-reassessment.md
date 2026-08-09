# Custom GPT + Thinking image generation — existing-methods reassessment

Date: 2026-08-10 JST
Status: **CURRENT RESEARCH AUDIT / ROUTE CAUSALITY NOT YET RESOLVED**

## Why this reassessment exists

The prior answer over-weighted the immediately preceding `Branch -> Thinking critic` result and prematurely converged on a `3+3` direct-vs-Branch image-generation test.

That was insufficient because the actual question is broader:

> What existing methods have been used to make image generation under a Custom GPT + reasoning/Thinking route work, and which mechanism is worth testing before inventing new machinery?

The answer must distinguish:
- documented product capability;
- known platform/runtime defect;
- established workaround;
- UI-supported alternate invocation paths;
- historical prompting tricks;
- MYGPT local counterexamples;
- untested causal factors inside the successful N2 route.

Do not end the investigation merely by listing methods. Convert the findings into a causal test order and durable next action.

---

## Current official boundary

OpenAI current documentation establishes all of the following:

1. ChatGPT Images 2.0 supports images with thinking on eligible paid plans.
2. GPTs with `Image Generation` enabled can use the current ChatGPT image-generation model.
3. Therefore Custom-GPT Thinking image generation is not documented as an intentionally unsupported combination.
4. OpenAI Support nevertheless acknowledged a current known issue affecting **some Custom GPTs** in Thinking/reasoning mode, where image generation can return an internal `/mnt/data/...` path or no image.
5. OpenAI Support's explicit temporary workaround for that failure pattern is to manually select Instant.
6. Current ChatGPT UI supports retrying/regenerating a response using Thinking/Pro from the response retry menu.
7. Current ChatGPT UI supports `Branch in a new chat`, which creates a separate conversation continuing from the chosen point.
8. GPT-5.6 is currently rolling out progressively, and paid reasoning selections now map to GPT-5.6 Sol reasoning levels where available. Runtime/model mapping therefore must be recorded during new tests rather than inferred from older labels.

Primary current sources:
- OpenAI Help — Images in ChatGPT
- OpenAI Help — GPTs in ChatGPT
- OpenAI Support on Developer Community, 2026-07-19 known issue
- OpenAI Help / release notes — model picker retry with Thinking/Pro
- OpenAI Help — Branch in a new chat
- OpenAI Help — GPT-5.6 in ChatGPT

---

## What the current known-issue thread already disproves

Do **not** spend a new experiment cycle on these as primary fixes:

### Capability minimalization

A reporter reproduced the failure both with all capabilities enabled and with only Image Generation enabled.

Conclusion:
- enabling/disabling Web or Code Interpreter is not an established fix for the current Thinking-specific failure.

### Brand-new GPT / neutral instructions

The issue was reproduced with a minimal neutral GPT whose only enabled capability was Image Generation.

Conclusion:
- rebuilding the GPT from scratch is not an established fix.

### Merely telling the GPT to render inline / not expose `/mnt/data`

The main report says this improved some attempts but remained inconsistent; re-prompting sometimes worked on a second attempt but was not reliable.

Conclusion:
- prompt wording can influence a failed route, but it is not a stable platform-level remedy.

### Browser/device/account switching

Reports vary across account/session/client, but the main reporter also tested multiple accounts/browsers/devices without a stable fix.

Conclusion:
- useful diagnostic dimension only, not production architecture.

---

## Existing routes worth distinguishing

### T0 — direct fresh Custom GPT + Thinking image request

Shape:

```text
fresh Custom GPT chat
-> select Thinking/reasoning
-> canonical + image request
```

Evidence:
- currently known to be unreliable in some Custom GPT sessions;
- MYGPT has historical failure under this class of route.

Role:
- baseline failure control, not preferred production route.

---

### T1 — warm same chat in Instant, then switch same chat to Thinking, no Branch

Shape:

```text
fresh Custom GPT chat / Instant
-> attach canonical
-> clean seed text only: establish canonical, explicitly do not generate yet
-> switch SAME chat to Thinking
-> send one image request
```

Evidence:
- **not previously isolated in MYGPT**.

Why important:
- N2 success used a clean Instant seed before Thinking;
- if T1 works, Branch was unnecessary and the useful factor may be session/tool/context warm-up or model-switch timing.

This is the highest-value missing causal test.

---

### T2 — clean seed -> Branch -> switch branch to Thinking -> image request

Shape:

```text
fresh Custom GPT / Instant
-> attach canonical
-> clean seed, no image generation
-> Branch in new chat
-> switch branched chat to Thinking
-> image request
```

MYGPT local evidence:
- **one direct success** on 2026-08-08;
- native image generation returned two A/B portrait alternatives;
- canonical reference remained effective.

What remains unknown:
- whether Branch caused the success;
- whether the clean seed caused the success;
- whether simply switching after an Instant turn caused the success;
- whether it was a transient runtime/tool-routing success.

Do not call this an established workaround until T1/T2 are separated and repeated.

---

### T3 — Instant image generation -> retry/regenerate the same response with Thinking

Shape:

```text
Custom GPT / Instant
-> canonical + exact image request
-> successful Instant image response
-> response retry menu
-> retry/regenerate with Thinking
```

Basis:
- current ChatGPT release notes/documentation explicitly support retrying a response using Thinking/Pro.

Status:
- **not yet tested by MYGPT for native image generation inside a Custom GPT**.

Why promising:
- uses an existing first-party UI path rather than browser-invented model switching;
- preserves the exact user request and conversation context;
- provides a clean test of whether the retry route initializes the reasoning/tool path differently from direct Thinking.

Risk:
- retry may return text, reuse/replace the prior response unexpectedly, or fail to invoke image generation;
- must observe DOM/output behavior before automation.

---

### T4 — Images / Create Image surface

Basis:
- official supported image creation surface;
- image-generation routing may be more explicit than ordinary chat.

Status for MYGPT:
- inheritance of a Custom GPT's Instructions/Knowledge/Actions is not established.

Conclusion:
- fallback diagnostic only; do not assume it is a Custom-GPT worker replacement.

---

### T5 — explicit tool-first / no-commentary prompting

Historical community pattern:
- instructions such as `just create the image`, no preamble/commentary, or explicit native image-tool invocation have sometimes reduced model chatter and encouraged tool use.

Current limitation:
- the 2026 Custom-GPT Thinking known-issue report explicitly says render-inline instructions and second-attempt re-prompts remain inconsistent.

Conclusion:
- keep as a packet-level refinement only **after** route selection;
- do not mistake it for the solution to the current tool-routing defect.

---

### T6 — copy Custom-GPT protocol into ordinary ChatGPT

Community fallback:
- ordinary ChatGPT image generation can work when the equivalent Custom GPT fails.

MYGPT fit:
- loses direct Custom-GPT boundary and future Actions unless the orchestrator reproduces those pieces externally.

Conclusion:
- emergency fallback, not preferred target.

---

## Separate image-generation quality issue: session reuse

A separate 2026 GPT-Image-2 community investigation reports image/noise reuse across repeated generations in the same session and recommends a session/page restart for that *image-quality/context-reuse* issue.

Do not conflate this with the Custom-GPT Thinking `/mnt/data or no image` tool-routing defect.

MYGPT already uses isolated/fresh generation conversations, so the architecture is naturally aligned with avoiding repeated same-session image contamination.

---

## New key inference

The N2 successful route was not simply:

```text
Branch -> Thinking
```

It was actually:

```text
Custom GPT / Instant
-> canonical attached
-> clean non-generating seed turn
-> Branch
-> switch branch to Thinking
-> image request
```

That contains at least three candidate causal variables:

1. **warm seed turn before generation**;
2. **new branched conversation derived from that seed**;
3. **switching to Thinking only after the seed context exists**.

Previous answers did not isolate them.

The next test must isolate them before any automation or large-sample reliability run.

---

## Current ranking by evidentiary value

For finding a usable Thinking generator route, not for current production:

1. **T1 same-chat warm-seed -> switch to Thinking** — highest information value; never isolated.
2. **T2 clean-seed Branch -> Thinking** — one local success; repeat only after T1 establishes whether Branch is necessary.
3. **T3 Instant success -> retry with Thinking** — first-party UI route, untested locally and worth checking before inventing automation.
4. **T0 direct fresh Thinking** — baseline control / known unreliable class.
5. T4 Images/Create Image — fallback diagnostic, Custom-GPT inheritance unknown.
6. T5 prompt-only force/render-inline tricks — weak/inconsistent under the current known issue.
7. T6 regular ChatGPT protocol copy — emergency fallback.

---

## Production implication today

Nothing in this audit justifies replacing the current Instant production generator yet.

The current robust role split remains available:

```text
Instant = proven generator
Thinking = optional critic/reasoner
```

But the question of whether a **stable Thinking generator route** exists remains open and now has a much narrower causal test plan.

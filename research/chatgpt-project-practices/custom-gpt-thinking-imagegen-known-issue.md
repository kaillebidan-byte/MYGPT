# Custom GPT Thinking image generation known issue / Instant quality question

Date: 2026-08-08
Updated: 2026-08-10

## Confirmed current platform issue

OpenAI Support acknowledged on the OpenAI Developer Community (2026-07-19) that some Custom GPTs exhibit a Thinking/reasoning-specific image generation issue:
- internal `/mnt/data/...` path returned instead of a rendered image
- or no image output even when Image Generation is enabled
- manually selecting Instant can work around this specific pattern for some users
- no ETA was given

Primary source:
- https://community.openai.com/t/image-generation-broken-in-all-our-custom-gpts-since-the-new-default-model-the-gpt-returns-the-internal-mnt-data-png-path-instead-of-rendering/1383942/9

Current official product documentation still says:
- Images with thinking is supported on eligible paid ChatGPT plans;
- GPTs with Image Generation enabled can use the current ChatGPT image-generation model.

Therefore the failure is treated as a runtime/tool-routing defect, not an intended product prohibition.

## Current model-rollout caveat

GPT-5.6 is progressively rolling out in ChatGPT. Paid reasoning selections may now map to GPT-5.6 Sol reasoning levels where available.

New tests must record the exact visible model/reasoning label. Do not assume an older chat labelled `Thinking` and a current reasoning route are necessarily the same runtime.

Official current source:
- https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt

---

## External variability / counterevidence

The same Developer Community issue does **not** establish that all Custom GPT image generation is universally broken:
- some users reported Custom GPT image generation working on particular clients/accounts;
- failure rate varies across sessions/accounts;
- OpenAI Support explicitly described the Thinking/reasoning issue as affecting `some Custom GPTs`.

However, current reports also show:
- capability minimalization does not reliably fix it;
- a brand-new neutral GPT with only Image Generation can still fail;
- explicit `render inline` / `do not expose /mnt/data` instructions can help some attempts but remain inconsistent;
- re-prompting can sometimes force a second-attempt render but is not stable;
- changing browsers/devices/accounts is diagnostic variability, not a production fix.

Do not spend primary research cycles re-testing those as if they were established solutions.

---

## MYGPT local counterexample — N2

MYGPT produced a direct local Thinking image-generation success on 2026-08-08.

Actual route:

```text
Custom GPT / Instant
-> canonical directly attached
-> clean non-generating seed turn
-> Branch in new chat
-> switch branch to Thinking
-> single-pose image request
-> native image generation SUCCESS
```

Observed:
- two A/B standalone portrait alternatives;
- canonical reference remained effective.

Record:
- `research/experiments/2026-08-08-n2-branch-thinking-followup-result.md`

Important correction:
- N2 disproves a universal `Custom GPT Thinking cannot generate images` rule;
- N2 does **not** prove Branch caused the success;
- N2 combined at least three variables: clean Instant seed, later model switch, and Branch.

Detailed causal reassessment:
- `research/audits/2026-08-10-custom-gpt-thinking-imagegen-existing-methods-reassessment.md`

---

## Existing route candidates — revised ranking

### T0 — direct fresh Custom GPT + Thinking

Known-unreliable baseline class.
Use as a matched control only after a candidate route passes.

### T1 — same-chat warm seed -> switch to Thinking, no Branch

```text
new Custom-GPT chat / Instant
-> attach canonical
-> clean seed, no image yet
-> switch SAME chat to Thinking/reasoning
-> image request
```

Status:
**UNTESTED / HIGHEST INFORMATION VALUE.**

Why first:
- isolates whether Branch was actually necessary in N2;
- if T1 works, the useful factor may be warm context / delayed model switch rather than Branch.

### T2 — clean seed -> Branch -> Thinking

Exact structural reproduction of N2.

Status:
- one local success;
- reliability unknown;
- run after T1 according to the focused gate.

### T3 — successful Instant image response -> retry/regenerate with Thinking

Current ChatGPT UI officially supports retrying responses with Thinking/Pro.

Status:
**UNTESTED inside MYGPT Custom-GPT native image generation.**

Why worth testing:
- first-party UI path;
- preserves exact original request/context;
- may initialize the reasoning/tool route differently from direct Thinking.

### T4 — Images / Create Image surface

Official supported image-generation surface.

MYGPT limitation:
- inheritance of Custom-GPT Instructions/Knowledge/Actions is not established.

Use only as fallback diagnostic.

### T5 — prompt-only forcing / no-commentary / render-inline instructions

Historical community technique.

Current 2026 defect evidence says prompt-only fixes remain inconsistent.
Use only after route selection as a packet refinement, not as the main fix.

### T6 — ordinary ChatGPT with copied Custom-GPT protocol

Community fallback when Custom GPT routing fails.

MYGPT limitation:
- loses direct Custom-GPT boundary and future Actions unless reproduced externally.

Emergency fallback only.

---

## Officially supported but not a Thinking fix

### Instant

OpenAI Support's current explicit temporary workaround for the known Thinking-specific failure class.

This remains MYGPT's production generator because it is locally proven.

### Branch

`Branch in a new chat` is a first-party ChatGPT feature that creates a new conversation continuing from the chosen point.

Branch is therefore a legitimate test mechanism, but not itself documented as an image-generation workaround.

### Retry with Thinking/Pro

The current ChatGPT retry UI can regenerate a response with a reasoning model.

This is an official UI path and should be tested before building a custom browser workaround, but no official source says it fixes Custom-GPT image-generation routing.

---

## Separate GPT-Image-2 session-reuse issue

A separate 2026 community investigation reports image/noise reuse across repeated generations in one session and recommends restarting/reloading a session for that image-quality/context-reuse problem.

Do not conflate that with the Custom-GPT Thinking `/mnt/data or no image` defect.

MYGPT's isolated fresh-worker architecture already limits repeated same-session image contamination.

---

## CURRENT focused test plan

Source of truth:
- `research/plans/2026-08-10-custom-gpt-thinking-imagegen-route-matrix.md`

Immediate order:
1. T1 same-chat warm seed -> Thinking, no Branch;
2. if needed, T2 clean seed -> Branch -> Thinking;
3. if both fail, T3 Instant image -> retry/regenerate with Thinking;
4. only after a candidate route works, collect matched direct-T0 controls and repeatability samples.

Do not begin with a broad `3+3` or `5+5` matrix.
First isolate the causal route with the fewest attempts.

A single success is a counterexample, not stability.
A candidate route is promoted for quality testing only after a pragmatic repeatability screen (initially at least 4/5 native visible image returns).

If no Thinking route reaches that level:
- stop treating Thinking as production generator;
- retain Instant generation;
- use Thinking as critic/reasoner where its already-observed behavior is useful;
- reopen only after product/runtime evidence changes.

---

## Separate unresolved quality question

Tool availability and image quality are separate gates.

Even if a Thinking route becomes repeatable, compare separately:
- canonical identity fidelity;
- pose fidelity;
- garment/accessory topology;
- left/right correctness;
- endpoint positioning;
- output multiplicity;
- latency and browser-automation reliability.

Do not replace Instant production solely because Thinking can invoke the image tool.

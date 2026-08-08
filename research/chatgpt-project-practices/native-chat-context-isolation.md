# Native Chat context isolation on Plus — without Work / Codex / API

Date: 2026-08-08
Status: RESEARCH COMPLETE ENOUGH TO PLAN A TEST

## Question

Can the MYGPT motion workflow obtain a real-enough context cut inside ChatGPT Plus, while avoiding ChatGPT Work / Codex agentic usage and avoiding separately billed OpenAI API orchestration?

Target behavior:

> the planner may know the whole motion, but the image generator for the current frame must see only the canonical image and one static pose.

This research is specifically about ChatGPT-native or ChatGPT-UI primitives, not external Agents SDK orchestration.

## Current experimental basis

- M2b: when the human manually sent one static-pose request at a time, 4/4 outputs were standalone portraits.
- M2d: weak hidden orchestration preserved standalone carriers but temporal roles collapsed toward endpoint variants.
- M2e: stronger hidden 0/35/70/100 roles restored temporal progression, but repeatedly collapsed into 2x2 sheets.

Therefore the desired primitive is not better prompt wording. It is a context boundary between the global motion plan and each single-frame generation.

## Official ChatGPT primitives reviewed

### 1. Custom GPT — strongest native worker candidate

OpenAI Help: `GPTs in ChatGPT`
https://help.openai.com/en/articles/8554407-gpts-faq

Confirmed:
- creating/editing GPTs requires a paid subscription; Plus is eligible;
- GPTs can have image generation capability;
- GPTs do not use saved memory, global custom instructions, or previous conversations;
- each GPT conversation starts fresh;
- IMPORTANT: when a GPT is brought into an existing regular chat with `@`, the conversation keeps its current context.

Meaning for MYGPT:

A minimal image-only worker GPT opened as a **new conversation** is a plausible native context boundary.

Do NOT invoke the worker with `@` from the planner chat. `@` preserves exactly the context that must be hidden.

This does not yet mean Custom GPT should return as the production architecture. Earlier MYGPT Custom-GPT experiments failed around image-generation / GitHub Actions / file-transfer complexity. The new candidate is narrower:

- no Actions
- no GitHub
- no Knowledge
- no planner
- image generation capability only
- one conversation = one frame

The changed condition is sufficient to justify one minimal re-test without reviving the rejected old architecture.

### 2. Branch in new chat — useful context-fork primitive, but not a reset

OpenAI release notes and Projects help confirm `Branch in new chat` creates a separate conversation from a selected point while preserving the original thread.

Sources:
- https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- https://help.openai.com/en/articles/10169521-projects-in-chatgpt

A branch inherits conversation context up to the branch point. Therefore:

- branching AFTER a four-state plan is useless for isolation;
- branching from a clean seed that contains only canonical/reference setup and no motion plan could be useful;
- it is a UI operation initiated by the user; no official Chat feature was found that lets one chat programmatically spawn four branches and send prompts into them.

Important Project caveat:
Project memory may use other conversations in the same Project as context. A worker-branch experiment should therefore not be placed inside the same Project that contains the planner and motion history.

Potential optimization if supported in practice:
1. open minimal worker GPT;
2. attach canonical once in a clean seed conversation;
3. branch from that pre-motion point four times;
4. give one static-pose packet to each branch.

Unverified and must be tested:
- whether Branch is available/behaves identically inside a Custom GPT conversation;
- whether the attached canonical remains available to the branch in a way that preserves the observed direct-reference fidelity.

### 3. Temporary Chat — clean memory boundary, but poor production fit

OpenAI Help: `Temporary Chat FAQ`
https://help.openai.com/en/articles/8914046-temporary-chat-faq

Confirmed:
- does not access or create personalization memories;
- starts from a blank slate with respect to previous conversations;
- still follows enabled global custom instructions;
- does not appear in history.

Meaning:
Useful as a diagnostic control, but worse than a fresh Custom-GPT conversation for MYGPT because evidence/history disappears and user interaction is still required for every worker run.

### 4. New regular chat outside Project — not a guaranteed hard boundary by itself

A new chat is a separate conversation, but ordinary ChatGPT memory / chat-history personalization may still contribute context depending on settings.

A fresh Custom-GPT conversation is cleaner for this test because official documentation explicitly says GPTs do not use saved memory, custom instructions, or previous conversations.

### 5. Scheduled Tasks — rejected for this workflow

OpenAI Help: `Scheduled Tasks in ChatGPT`
https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt

Plus supports scheduled tasks and ordinary plan usage limits apply, but current official limitations make it a poor frame worker:
- GPTs are not supported by Tasks;
- file upload support is absent/limited in official task documentation;
- a task created in a Project cannot access Project files;
- Tasks are schedule/monitoring oriented, not an immediate four-frame fan-out primitive.

The canonical-image requirement alone is enough to reject Tasks as the next experiment.

### 6. Library — convenience only, not isolation

OpenAI Help: `File storage and Library in ChatGPT`
https://help.openai.com/en/articles/20001052

Uploaded files/images are saved to Library and can be added to another chat.

Possible use after the isolation boundary is proven:
- reuse `kokyo_base_20260805.png` from Library in each new worker conversation instead of browsing/uploading the file repeatedly.

Do not change to Library reuse during the first worker-boundary test; first preserve the already-validated direct-attachment condition, then test Library as a separate convenience variable.

## What was NOT found

No official normal-Chat feature was found that allows one Chat conversation to programmatically:
1. create four fresh independent chats/branches;
2. attach the canonical to each;
3. send four different local pose packets;
4. collect the results back into the parent chat.

That capability exists conceptually in Work/agent or API orchestration, but not as a documented normal-Chat primitive.

Therefore native Chat currently appears able to provide the **boundary**, but not zero-click **fan-out automation**.

## Candidate architecture within the original constraint

### Planner side

- normal Project/chat may know the whole motion;
- planner creates four concrete local static-pose packets;
- planner does not generate images.

### Worker side

- minimal Custom GPT with image generation only;
- every frame uses a fresh GPT conversation;
- each worker conversation receives only:
  - canonical image;
  - one local static-pose packet;
  - stable single-frame identity/output rules.

Worker never receives:
- motion request;
- four-state list;
- progress percentages;
- other frame descriptions;
- board/sheet/sequence concepts;
- planner transcript.

### Human/UI role in the first proof

The user manually starts the fresh worker conversation and pastes the one packet.
This is intentionally not yet automation. It proves whether the native ChatGPT conversation boundary solves M2e without spending Work/Codex agentic allowance or API money.

If this passes, optimize UI friction second.

## Branch optimization hypothesis

After a fresh-worker GPT passes, test a clean-seed branch method:

- clean seed contains canonical + worker identity rules only;
- no motion request and no multi-state plan;
- branch four times from the same seed point;
- paste one local packet in each branch.

If attachment/reference fidelity survives branching, this reduces repeated canonical attachment.

If it does not, fall back to four new worker conversations and reattach canonical (or later test Library reuse).

## Hard conclusion for planning

For Plus under the original no-Work/no-API constraint:

- **best documented native isolation primitive:** fresh Custom-GPT conversation;
- **best documented copy/fork primitive:** Branch in new chat from a clean pre-motion point;
- **must not use for isolation:** `@`-mentioning a GPT from planner chat, because current context is explicitly retained;
- **not suitable:** Scheduled Tasks;
- **diagnostic only:** Temporary Chat;
- **not documented/available:** automatic four-worker fan-out from a normal parent chat.

The next experiment should first prove the boundary with minimal manual UI steps. Only after that should automation/friction reduction be investigated.

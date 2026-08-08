# N3 — ChatGPT Plus orchestration friction / automation ceiling

Date: 2026-08-08 JST
Status: OFFICIAL BUILT-IN CEILING CONFIRMED / COMMUNITY BROWSER-AUTOMATION PATH REOPENED

## Correction

Earlier N3 wording overreached by treating the lack of an official built-in fan-out feature as the ceiling for every solution compatible with ChatGPT Plus.

That conclusion is withdrawn.

Correct distinction:

1. **Official in-product / no-extension path**
   - no documented bulk branch / multi-worker fan-out was found
   - manual Branch x3 remains the minimum proven built-in workflow

2. **Community browser-extension / local browser-automation path**
   - not ruled out
   - Chinese-language GPTs tooling already provides precedent for driving multiple GPTs conversations from a logged-in ChatGPT Plus web session without requiring a separate OpenAI API key
   - this path must be evaluated before declaring an orchestration ceiling under the user's actual constraints

The user's constraints prohibit separate OpenAI API billing / Work-Codex production dependency. They do **not** by themselves prohibit a local browser extension, userscript, or Playwright-style UI automation using the user's existing ChatGPT Plus session.

## Official product findings

### Branch conversations

OpenAI documents `Branch in new chat` as a user action from a message menu.
No official bulk / multi-branch / fan-out control was found.

### @-mention a GPT

A GPT can be brought into a regular web conversation with `@`, but the current conversation context is retained.
This conflicts with the validated worker-isolation requirement if invoked from the planner/full-motion chat.

### Projects / Tasks / Actions

- Project branching does not document automatic multi-chat fan-out.
- Scheduled Tasks do not provide the current isolated Custom-GPT image-worker fan-out.
- GPT Actions connect a GPT to external APIs; they are not an official UI-chat spawning mechanism.

Therefore the **official built-in** verdict remains:

```text
planner outputs 3 packets
        ↓
clean seed + canonical
        ↓
manual Branch x3
        ↓
manual packet send x3
```

## Chinese-language / community precedent — OpenGPTs

A Chinese open-source project, `hzeyuan/OpenGPTS`, is directly relevant and was not considered in the earlier N3 closure.

Project description / README states that its browser plugin supports:
- web-based ChatGPT calling from an already logged-in ChatGPT session
- Multi-GPTs Calls: one input, multiple model/GPT calls simultaneously
- Multi-GPTs Chat
- multiple windows in one interface
- batch conversation / GPT management

The project explicitly frames each GPT as an Agent and browser plugins as a way to automate web operations.

Important limitations for MYGPT:
- current public project is old; latest visible repository activity is from 2024
- README marks multimodal input as not implemented
- RPA / Agent Workflow is also marked not available
- therefore OpenGPTs itself is **not** accepted as the production solution

However, it is strong prior-art evidence that:
- an existing ChatGPT Plus login can be used by a browser extension to drive arbitrary GPT conversations
- multiple GPT conversations can be initiated/managed outside the stock ChatGPT interaction flow
- a separate OpenAI API key is not inherently required for this category of solution

This invalidates the earlier broad claim that the user's no-API constraint closes browser-side orchestration.

## Terms / safety boundary

OpenAI's current consumer Terms of Use prohibit automatically or programmatically extracting data or Output and prohibit reverse engineering / bypassing protective measures.

Therefore:
- do not treat hidden ChatGPT backend endpoints or automated output scraping/downloading as an accepted production route
- UI automation research should focus first on ordinary visible actions such as opening isolated chats, selecting the GPT, attaching the canonical, and submitting the local packet
- automatic collection/extraction of generated outputs requires separate terms review before production use

This boundary is one reason to prefer visible UI-level automation over reverse-engineered web calls.

## Reopened candidate — N3-B1 local browser automation

Goal:
Automate only the repetitive UI operations while preserving the already validated isolation architecture.

Target workflow:

```text
planner produces F2/F3/F4 copy-ready packets
        ↓
local browser automation
        ├─ open isolated Custom GPT chat/tab 1
        ├─ open isolated Custom GPT chat/tab 2
        └─ open isolated Custom GPT chat/tab 3
        ↓
attach canonical to each isolated chat
(or duplicate a proven clean seed if reliable)
        ↓
send one distinct local packet to each
        ↓
three independent image generations
```

Preferred implementation order:

### B1-a — UI-level automation first

Use browser-extension / userscript / Playwright-style interaction with the visible ChatGPT UI.

Why first:
- does not require separate OpenAI API billing
- can use the user's existing Plus login
- keeps the same Custom GPT product surface already validated for image generation
- can preserve isolation by creating separate tabs/chats
- can automate canonical file upload through the normal UI

Do not assume hidden/internal ChatGPT backend endpoints are stable production APIs.

### B1-b — internal-web-call techniques only as research evidence

Community projects may call ChatGPT web endpoints directly using logged-in browser state.
Treat that only as evidence of feasibility until current behavior, account safety, file/image support, stability, and terms compatibility are verified.
Do not make it production architecture merely because old tooling once worked.

## Acceptance test for N3-B1

Do not alter generation prompts while testing automation.

Use the already validated R0 or a neutral single-frame packet as the payload.

Required PASS conditions:
1. same Custom GPT is opened in 3 genuinely separate conversations/tabs
2. canonical image is successfully attached / inherited in each
3. Instant remains selected/usable
4. each worker receives only its own one local packet
5. no full-motion / other-packet cross-contamination
6. 3 standalone image-generation jobs start independently
7. automation does not silently reuse one conversation for multiple workers
8. user can stop/recover from one failed tab without corrupting the others
9. no separate OpenAI API billing is required

Only after these pass should click-count reduction be measured.

## Current N3 verdict

**Official built-in fan-out: not found.**

**Overall orchestration ceiling under the user's Plus/no-separate-API constraint: NOT CLOSED.**

N3 is reopened specifically for local browser-side automation / extension techniques.

Do not trade away the proven worker isolation boundary. The automation target is UI friction, not generation architecture.

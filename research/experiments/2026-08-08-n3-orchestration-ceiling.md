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
   - Chinese-language GPTs tooling provides precedent for driving multiple conversations / fresh chats from a logged-in ChatGPT web session without requiring a separate OpenAI API key
   - this path must be evaluated before declaring an orchestration ceiling under the user's actual constraints

The user's constraints prohibit separate OpenAI API billing / Work-Codex production dependency. They do **not** by themselves prohibit a local browser extension or other browser-side UI automation using the user's existing ChatGPT Plus session.

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

## Why Custom GPT still matters if fresh-chat creation is automated

Custom GPT is **not logically required for fan-out itself**. A browser tool that can open fresh ordinary ChatGPT conversations could in principle automate the same tab/chat creation primitive.

However, CURRENT evidence gives Custom GPT an important isolation role beyond convenience.

OpenAI's current GPT documentation states that GPTs:
- do not use saved memory
- do not use the account's normal custom instructions
- do not use previous conversations
- each GPT conversation starts fresh

Official source:
- https://help.openai.com/en/articles/8554407

By contrast, ordinary ChatGPT chats can use personalization / memory and normal custom instructions.
Temporary Chat disables use/creation of personalization memory, but OpenAI explicitly states that Temporary Chat still follows enabled custom instructions.

Official source:
- https://help.openai.com/en/articles/8914046-temporary-chat-faq

Therefore the current minimal Custom GPT provides a stronger and simpler isolation boundary:

```text
account memory / normal custom instructions / previous chats
                    X
                    ↓
minimal Custom GPT worker instructions only
+ canonical
+ current one local pose packet
```

The exact live worker configuration is now captured in:
- `research/runtime/2026-08-08-single-frame-worker-live-snapshot.md`

Live editor facts include:
- Recommended model: `GPT-5.6 Sol (gpt-5-6-instant)`
- image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Knowledge NONE
- no active/exposed App integration in the captured Plus editor
- targeted active-large-sleeve invariant retained

### Consequence

If browser automation can operate on `/g/...` Custom GPT conversations, **keep Custom GPT**. There is no quality or isolation reason to remove a proven boundary merely because chat creation is automated.

If the browser automation works only on ordinary ChatGPT fresh chats, regular chat becomes a **fallback candidate**, not an automatic replacement.
It would require a separate single-variable equivalence test because the system context differs.

Closest fallback:
- fresh Temporary Chat
- canonical direct attachment
- explicit minimal worker preamble + current local packet
- image generation only

But this is still not identical to the Custom GPT worker because Temporary Chat continues to inherit normal custom instructions.
Do not assume a user-level prompt can reliably neutralize higher-level custom instructions.

## Chinese-language / community precedent A — OpenGPTs

`hzeyuan/OpenGPTS` is a Chinese open-source browser-plugin project and was not considered in the earlier N3 closure.

Its Chinese README describes:
- browser-side ChatGPT / GPTs calls from the web
- `一键调用GPTs对话`: one input, multiple model/GPT calls
- `多GPTs对话`
- multiple chat windows
- batch GPT/chat management
- a stated direction of treating each GPT as an Agent and automating workflows

Limitations for MYGPT:
- latest visible repository activity is from 2024
- its README marks multimodal input as not implemented
- RPA / Agent Workflow is also marked not available

Therefore OpenGPTs itself is **not** accepted as the production solution.
It is prior-art evidence that browser-side orchestration of logged-in ChatGPT/GPTs sessions is a real category of solution and that separate OpenAI API billing is not inherently required.

## Chinese-language / community precedent B — Autojourney AutoGPT

A much more current and operationally relevant case exists: Autojourney's `AutoGPT` Chrome extension for ChatGPT / Sora.

Current evidence refreshed 2026-08-08:
- Autojourney official site describes AutoGPT as a productivity extension built for ChatGPT and Sora
- supports batch auto-send prompts, task queues, text-to-image, image-to-image, image-to-text and automated generation workflows
- Chrome Web Store current listing is version `0.0.70`, updated `2026-07-30`, size `1.74 MiB`
- Chrome Web Store shows roughly `1,000 users`, rating `3.4/5` from `5 ratings`
- the store page marks the publisher as the owner of the listed website and says the publisher has a good record with no history of violations
- the developer declares on the store page that the extension does not collect or use user data; this is a developer disclosure, not an independent security audit

Autojourney's Chinese AutoGPT changelog is especially relevant:
- `2025-08-19 v0.0.21`: added ChatGPT `自动新对话` — automatically switch to a fresh conversation after a configurable task count
- same release: added ChatGPT `新对话发送` — explicitly send a selected task in a new conversation
- same release: ChatGPT image-to-image batch support
- `2025-12-09`: fixed ChatGPT image upload failure
- `2025-12-17`: support for ChatGPT's new image mode
- `2025-12-28`: fixed retrieval of generated-image links
- `2026-01-09`: automatic retry on failures

This is materially closer to MYGPT's missing orchestration than the earlier official-only review suggested.
It shows that current Chinese browser tooling already automates several exact primitives MYGPT needs:
- prompt queueing
- automatic fresh-chat creation
- per-task send-in-new-chat behavior
- image upload / image-to-image workflows
- ChatGPT image-generation operation

### Critical unresolved point

The public Autojourney documentation found so far says `ChatGPT`, but does **not** explicitly document support for a user-created **Custom GPT** conversation (`/g/...`) or preservation/selection of the Custom GPT's model mode such as Instant.

Therefore do not assume AutoGPT already solves MYGPT end-to-end.
The next gate is specifically Custom-GPT compatibility, not general ChatGPT automation feasibility.

## Third-party extension test boundary

AutoGPT is third-party browser software and operates on ChatGPT pages.
For the compatibility test:
- use only the isolated worker chat / canonical test asset, not unrelated sensitive chats
- do not enable automatic output download / extraction for the first gate
- do not test hidden/internal ChatGPT endpoints
- inspect the browser's install-time permission prompt before accepting; record it if it grants broader access than expected

The Chrome Web Store privacy disclosure is useful evidence but does not replace the install-time permission check or an independent code/security audit.

## Terms / safety boundary

OpenAI's current consumer Terms of Use prohibit automatically or programmatically extracting data or Output and prohibit reverse engineering / bypassing protective measures.

Therefore:
- do not treat hidden ChatGPT backend endpoints or automated output scraping/downloading as an accepted production route
- first evaluate ordinary visible UI-level operations: opening isolated chats, selecting the Custom GPT, attaching canonical, submitting one local packet
- automatic collection/extraction of generated outputs requires separate terms review before production use

This is one reason to prefer visible UI-level automation over reverse-engineered web calls.

## Reopened candidate — N3-B1 Custom-GPT browser automation

Goal:
Automate repetitive UI operations while preserving the already validated isolation architecture.

Target workflow:

```text
planner produces F2/F3/F4 copy-ready packets
        ↓
local browser automation
        ├─ open isolated Custom GPT chat 1
        ├─ open isolated Custom GPT chat 2
        └─ open isolated Custom GPT chat 3
        ↓
attach canonical to each isolated chat
(or duplicate a proven clean seed if reliable)
        ↓
send one distinct local packet to each
        ↓
three independent image generations
```

### B1-a — first compatibility gate

Before building our own automation, test whether a current ChatGPT automation extension can operate on the existing `MYGPT Single Frame Worker Test` Custom GPT page while preserving its identity and isolation.

Do **not** test generation quality again.
Do **not** alter worker prompts.

First non-generation checks:
1. extension recognizes / activates on the Custom GPT page
2. it can open or target a fresh Custom GPT conversation rather than silently falling back to ordinary ChatGPT
3. a queued text task can be placed into that fresh Custom GPT conversation
4. the Custom GPT remains `MYGPT Single Frame Worker Test`
5. Instant remains usable / selectable
6. no planner/full-motion context is inherited

Then file/image check:
7. canonical attachment can be sent to a fresh Custom GPT conversation through the normal UI path
8. a clean seed can be submitted without triggering image generation

Only after 1-8 pass should one already-validated static-pose generation be used to prove that the resulting chat still invokes the Custom GPT image worker correctly.

### B1-b — ordinary ChatGPT fallback comparison

Use only if current automation cannot target Custom GPT pages but can reliably open independent ordinary chats.

Test one known R0/R1 static pose with:
- A = validated Custom GPT worker
- B = automated fresh Temporary Chat + canonical + copied minimal worker preamble + same local packet

Compare:
- carrier
- identity / sleeve topology
- unintended context influence
- model/tool availability
- operational stability

Do not replace Custom GPT unless B is materially equivalent or better and the remaining custom-instruction inheritance is shown not to affect the worker.

### B1-c — own browser automation if extension compatibility fails

If AutoGPT or similar extensions do not support `/g/...` Custom GPT pages, the precedent still demonstrates the required browser primitives.
At that point evaluate a minimal local extension / visible-UI automation that targets the Custom GPT page directly.

Do not begin with hidden/internal ChatGPT endpoints.

## Acceptance test for full N3-B1

Required PASS conditions:
1. same Custom GPT is opened in 3 genuinely separate conversations/tabs
2. canonical image is successfully attached / inherited in each
3. Instant remains selected/usable
4. each worker receives only its own one local packet
5. no full-motion / other-packet cross-contamination
6. 3 standalone image-generation jobs start independently
7. automation does not silently reuse one conversation for multiple workers
8. one failed tab can be stopped/recovered without corrupting the others
9. no separate OpenAI API billing is required

Only after these pass should click-count reduction be measured.

## Current N3 verdict

**Official built-in fan-out: not found.**

**Browser-side automation feasibility: supported by existing Chinese-language implementations, including a current 2026 ChatGPT automation extension.**

**Custom GPT remains the preferred isolation boundary if automation can target it.**

**Ordinary fresh/Temporary Chat is a testable fallback, not yet a validated replacement.**

**Overall orchestration ceiling under the user's Plus/no-separate-API constraint: NOT CLOSED.**

N3 stays open until the Custom-GPT compatibility gate is tested.
Do not trade away the proven worker isolation boundary; the automation target is UI friction, not generation architecture.

# N3 — ChatGPT Plus orchestration friction / automation ceiling

Date: 2026-08-08 JST
Status: CURRENT — OFFICIAL NO-CODE FAN-OUT NOT FOUND

## Constraint

Production dependency must remain within ordinary ChatGPT / Project / Custom GPT behavior available to the user's ChatGPT Plus environment.

Do not require:
- ChatGPT Work
- Codex weekly agentic allowance
- separate OpenAI API billing

Validated generation architecture still requires three isolated F2/F3/F4 workers.

## Question

Can ordinary ChatGPT / Project / Custom GPT features automatically:
1. create three isolated Custom GPT conversations / branches from one clean seed, and
2. distribute a different local static pose packet to each,
without exposing workers to the full motion or other packets?

## Official product findings

Checked current official OpenAI Help Center / release documentation on 2026-08-08.

### Branch conversations

OpenAI documents `Branch in new chat` as a user action from a message menu.
A branch creates a separate conversation from that point.
No official bulk / multi-branch / fan-out control was found.

Source:
- ChatGPT Release Notes — Branch conversations on web
- https://help.openai.com/en/articles/6825453-chatgpt-release-notes

Implication for MYGPT:
- clean-seed Branch remains valid
- three branches still require three user branch actions

### @-mention a GPT in an existing regular chat

OpenAI documents that on web a user can type `@` to bring a GPT into a regular conversation.
The conversation keeps its current context.

Source:
- GPTs in ChatGPT
- https://help.openai.com/en/articles/8554407

Implication for MYGPT:
- this does not create an isolated fresh worker
- using `@GPT` after the planner/full-motion context would preserve precisely the context that CURRENT isolation rules forbid
- therefore @-mention is not a replacement for clean separate branches

### Projects

OpenAI documents Projects as shared/contextual workspaces with files, instructions, memory, chats, and manual branching.
Projects can branch chats, but the documentation does not describe automatic multi-chat fan-out.
OpenAI also states that chats created with a GPT cannot be moved into a Project; a custom GPT can be used for messages in an existing Project chat, while using it as the first message starts the GPT conversation outside the Project.

Source:
- Projects in ChatGPT
- https://help.openai.com/en/articles/10169521-projects-in-chatgpt

Implication for MYGPT:
- Project does not eliminate the manual creation of three isolated worker threads
- moving the current Custom GPT worker architecture into Project is not an orchestration shortcut
- Project memory/source context would also need to re-pass the already solved isolation / 2x2 conditioning tests, so it should not be reintroduced without a separate reason

### Scheduled Tasks

OpenAI currently lists GPTs as unsupported with Tasks.
Official documentation also notes that project tasks cannot access project files.

Source:
- Tasks in ChatGPT
- https://help.openai.com/en/articles/10291617-tasks-inchatgpt

Implication for MYGPT:
- Tasks cannot schedule or invoke the current Custom GPT worker
- Tasks cannot carry the canonical image-file dependency for this pipeline
- not a production fan-out mechanism

### GPT Actions

GPT Actions connect a GPT to external APIs through an OpenAPI schema.
They do not document an API for spawning separate ChatGPT Custom GPT conversations in the ChatGPT UI.
Using an external OpenAI API orchestrator would move the architecture outside the current no-separate-API-billing constraint.

Source:
- Configuring actions in GPTs
- https://help.openai.com/en/articles/9442513

## N3 verdict

Within the current constraints, no official ChatGPT no-code feature was found that performs zero-click or one-click fan-out of three isolated Custom GPT workers with three different dynamic pose packets.

The minimum validated in-product workflow remains:

```text
planner produces F2/F3/F4 copy-ready local packets
        ↓
clean Custom GPT seed + canonical once
        ↓
manual Branch x3
        ↓
manual send one packet per branch
        ↓
three independent image generations
```

Compared with fresh conversations, Branch still removes repeated canonical attachment and gives the three workers an identical clean starting context.
It does not remove branch creation or packet delivery.

## Rejected shortcuts under CURRENT rules

Do not use:
- `@GPT` from the planner/full-motion chat: preserves forbidden context
- Project memory/source as a packet distribution bus: breaks worker isolation and reopens prior Project-conditioning risk
- Scheduled Tasks: GPTs unsupported; image/file dependency unsuitable
- Actions calling an OpenAI API orchestrator: violates current separate-API-billing constraint
- one same-chat sequence containing all packets: violates isolation and reopens same-turn / multi-pose conditioning failures

## Practical production status

Production v0 is therefore **manual-assisted**, not zero-click automated.

The remaining manual friction is known and bounded:
- create/branch three worker chats
- send three already-prepared local packets
- collect three outputs

Generation-quality architecture does not need to change to solve this UX issue.

## Future reconsideration trigger

Reopen N3 only if one of these changes:
- OpenAI introduces documented multi-chat / multi-GPT fan-out
- Branch gains bulk duplication / prompt-distribution controls
- Tasks gains GPT + file/image support and preserves isolation
- user explicitly relaxes the no-API / no-agentic-production constraint

Until then, do not trade away the proven isolation boundary for fewer clicks.

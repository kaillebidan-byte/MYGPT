# Chat / Work / Workspace Agents と orchestration の利用境界

Date: 2026-08-08
Status: CURRENT PRODUCT CHECK

## 調査目的

MYGPTの元目的は、ChatGPT内の通常利用・Project・ペット機能側の差分だけでmotion生成を成立させ、Codex/Work系のエージェント利用枠（ユーザーが「週間トークン」と呼んでいる枠）をできるだけ使わないこと。

そのため、planner / worker orchestrationをChatGPT内だけで実現できるか、WorkやWorkspace Agentsが必要か、利用枠が分離されているかを公式資料で確認した。

## 確認した公式資料

- OpenAI Help: ChatGPT Work and Codex
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- OpenAI Help: Using Credits for Flexible Usage in ChatGPT (Free/Go/Plus/Pro)
  - https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-free-go-plus-pro-sora
- OpenAI Help: Projects in ChatGPT
  - https://help.openai.com/en/articles/10169521-projects-in-chatgpt
- OpenAI Help: ChatGPT Workspace Agents for Enterprise and Business
  - https://help.openai.com/en/articles/20001143/
- OpenAI: Workspace agents
  - https://openai.com/business/workspace-agents/

## 確認できたこと

### 1. Standard Chat / Project

Standard Chatは通常の会話型支援。Projectはchat / files / custom instructions / memoryを共有contextとして保持する。

通常ChatまたはProjectのUIには、ユーザーが明示的に「planner agent + fresh isolated image workers」を定義し、それぞれのconversation stateを分離して制御する一般向けorchestrator機能は公式文書上確認できない。

Chat自体は内部で複数tool callを行うことがあるが、M2c-Rで見たようにmain modelがtool routingを自律判断する。これはfresh-context worker境界をユーザーが保証する機能とは別。

### 2. ChatGPT Work

Workは長時間・multi-step task向けagent experienceであり、eligible paid plansで利用できる。

ただしPlus/Proでは、Codex、ChatGPT Work、ChatGPT for Excel等のsupported agentic featuresが同じagentic usage allowanceを共有する。

したがって、MYGPTの「週間トークン / agentic usage allowanceを消費せずに成立させる」という元目的に対して、Workを本番前提にするのは不適切。

### 3. Workspace Agents

ChatGPT内でrepeatable workflow用agentを構築するWorkspace AgentsはBusiness / Enterprise等のworkspace向け機能として提供されている。image generationやweb search等のtoolを追加できる。

ただしこれはPlus/Pro個人向けの通常Chat機能とは別であり、またagentic usage poolの対象になる。

さらに公式資料からは、1つのWorkspace Agent run内で「4つのfresh isolated subagent contexts」を保証できるとは確認できない。今回必要なcontext isolationの解決策と同一視しない。

## MYGPTへの結論

- Workを使えばmulti-step orchestration自体は可能性があるが、元のusage制約を破るため第一候補にしない。
- Workspace Agentsも有料workspace向けの別機能で、個人向け通常Chat/Projectの代替ではない。
- 現在の優先課題は、通常Chat / Project / ペット機能側だけでM2b相当の「1回ずつlocal static poseだけを見る」状態を自動化できる手段があるかを調べること。
- external API / Agents SDK / Work / Workspace Agentsは、通常Chat内だけでは成立しないと確認された後の比較候補へ降格する。

## 次に検索する角度

1. 通常Chat/Projectから別のfresh chat contextを明示的・自動的に起動する内蔵機能があるか。
2. ChatGPT plugin / skill / appで、通常Chatのagentic usage poolを使わずに複数のisolated Chat runsを組める公式機能があるか。
3. ペット機能固有のcontext / tool-call境界に、worker isolationとして利用できる差分があるか。

同じ「Workとは何か」「Projectsとは何か」の一般検索は繰り返さない。

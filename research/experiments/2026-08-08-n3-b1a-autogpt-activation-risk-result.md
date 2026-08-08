# N3-B1A AutoGPT activation / risk result

Date: 2026-08-08 JST
Status: PARTIAL FUNCTIONAL PASS / PRODUCTION HOLD

## Evidence

User installed the Autojourney `AutoGPT` Chrome extension and opened the normal conversation page for `MYGPT Single Frame Worker Test`.

Observed from the live screenshot:
- the page remained the same Custom GPT: `MYGPT Single Frame Worker Test`
- the AutoGPT side panel loaded on the Custom GPT page
- the extension exposed ChatGPT automation controls including TextToImage / ImageToImage / ImageToText, Auto New Chat, prompt/task controls, and download-related controls
- therefore the extension is not simply disabled on `/g/...` Custom GPT pages

This is enough to mark the narrow A1 activation question as PASS:

**AutoGPT UI can activate on the Custom GPT conversation page.**

## New blockers discovered before task submission

### 1. AutoGPT Plan requirement

A modal appeared:
- `Activate AutoGPT Plan`
- `Extension features require a Plan. Get a Plan now?`
- buttons included `Free Trial` and `Activate Plan`

Therefore task-level testing cannot continue without activating a third-party plan/trial.

This is a new external dependency. It is not OpenAI API billing, but it is still a separate production dependency and should not be silently accepted merely because the original constraint only prohibited separate OpenAI API billing.

### 2. Extension's own account-suspension warning

The AutoGPT panel displayed a developer warning stating that the extension is for personal research / efficiency improvement and that there is a possibility of account suspension; it advises avoiding use on public accounts.

This warning is treated as direct product evidence from the extension UI, not as proof that OpenAI will suspend the account in this exact use case.

However, it is enough to prevent us from classifying this extension as a production-safe candidate without a separate risk decision.

### 3. OpenAI Terms boundary checked

Current OpenAI consumer Terms of Use (effective 2026-01-01) prohibit, among other things:
- automatically or programmatically extracting data or Output;
- interfering with / disrupting the Services;
- circumventing rate limits, restrictions, protective measures, or safety mitigations.

The terms text does not, from this check alone, establish that every visible-UI automated prompt submission is prohibited.
But AutoGPT includes output extraction / auto-download features and the extension itself warns of suspension risk.

For MYGPT, do not enable automatic output extraction / downloading as a production route.

## A0/A1 gate result

- A0 install permission: PASS WITH CAUTION
- A1 activation on Custom GPT `/g/...`: PASS
- A2 identity preservation before sending: PASS from screenshot; page still shows same Custom GPT
- A3 fresh-chat text task: NOT RUN
- A4 model/mode preservation after automated fresh chat: NOT RUN

Reason for stopping before A3:
- third-party Plan / trial requirement
- explicit account-suspension warning

## Decision

Do **not** activate a paid plan or free trial merely to continue this test without an explicit decision that the dependency and account-risk profile are acceptable.

AutoGPT remains useful prior-art evidence and has now proven `/g/...` page activation.
It is **not yet accepted as MYGPT production automation**.

Next research should compare safer/lower-dependency routes before exposing the primary ChatGPT account to further automated submission:
1. determine whether a minimal visible-UI local userscript/extension can automate only fresh Custom-GPT navigation + input filling/clicking without output scraping, retries, rate-limit workarounds, or download automation;
2. separately assess whether such prompt-submission automation fits the current OpenAI consumer terms and platform enforcement expectations;
3. only if that route is acceptable, run a text-only fresh-chat compatibility test.

Do not change the validated worker configuration because of this automation hold.

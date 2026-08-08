# N3-B1A — Custom GPT browser-extension compatibility gate

Date: 2026-08-08 JST
Status: READY FOR LIVE NON-GENERATION TEST

## Goal

Determine whether a current ChatGPT browser-automation extension can operate on the existing `MYGPT Single Frame Worker Test` Custom GPT page without dropping the proven Custom-GPT isolation boundary.

This is an orchestration/UI test, not a generation-quality test.

## Locked worker control

Runtime snapshot:
- `research/runtime/2026-08-08-single-frame-worker-live-snapshot.md`

Do not change:
- Instructions
- Recommended model
- capabilities
- Knowledge
- Actions

Do not generate an image during B1A.

## Candidate under test

Autojourney `AutoGPT` Chrome extension.

Current public listing checked 2026-08-08:
- Chrome Web Store version `0.0.70`
- updated `2026-07-30`
- ChatGPT/Sora automation extension
- public feature set includes batch send / queue / text-to-image / image-to-image
- prior changelog records ChatGPT automatic fresh-conversation switching and send-in-new-chat behavior

Public docs still do not explicitly state support for user-created Custom GPT `/g/...` pages.
That is exactly what this test decides.

## Third-party boundary

This extension is third-party software.

Before functional testing:
1. inspect Chrome's install-time permission prompt
2. record the prompt if it grants broad site access or unexpected privileges
3. do not enable auto-download / output extraction for B1A
4. do not expose unrelated sensitive chats or files during the test

The Chrome Web Store developer disclosure says the extension does not collect/use user data and labels the publisher as having a good record; treat this as store/developer disclosure, not independent security verification.

## B1A live procedure

### Gate A0 — install permission

Open the exact Autojourney AutoGPT listing and start installation.

PASS:
- requested access is limited enough to continue a ChatGPT-only UI compatibility test.

HOLD:
- permission prompt requests unexpectedly broad access such as all browsing data across unrelated sites.

If HOLD, record the prompt and stop before acceptance.

### Gate A1 — activation on Custom GPT page

Open the live chat page for:
`MYGPT Single Frame Worker Test`

Do not use the editor Preview as the functional target; use the normal Custom GPT conversation page.

PASS:
- AutoGPT UI/helper recognizes the page and exposes its ChatGPT task controls.

FAIL:
- no extension UI appears / controls are disabled only on `/g/...` pages.

### Gate A2 — identity preservation

Without sending a task, confirm the page still shows:
- `MYGPT Single Frame Worker Test`
- recommended/default Instant path remains available

FAIL:
- extension navigates to ordinary ChatGPT or changes the GPT identity merely by activating.

### Gate A3 — fresh-chat behavior, text only

Use the extension's new-conversation behavior with a harmless non-generation text payload:

`TEST-N3-B1A: この会話では画像を生成しないでください。現在のGPT名だけを答えてください。`

The purpose is not content quality; it is to observe where the task lands.

PASS requires:
- a genuinely fresh conversation is created
- the destination remains `MYGPT Single Frame Worker Test`
- ordinary ChatGPT is not substituted
- no planner/full-motion context appears
- no image generation starts

FAIL examples:
- new chat is ordinary ChatGPT
- same old conversation is reused
- `/g/...` identity is lost
- image generation unexpectedly starts

### Gate A4 — model/mode

In the fresh destination:
- confirm `GPT-5.6 Sol / Instant` remains the recommended/usable path
- do not switch to Thinking for this gate

PASS if Instant remains available and no extension action silently forces another model.

## B1A decision

PASS only if A0-A4 pass.

If PASS:
- proceed to N3-B1B canonical-file + clean-seed automation

If FAIL due only to `/g/...` unsupported:
- do not drop Custom GPT yet
- next candidate is minimal own visible-UI automation targeting the Custom GPT page

If the extension only works on ordinary ChatGPT:
- ordinary/Temporary Chat remains a fallback experiment, not a validated replacement.

## Evidence to save

For each gate, save only what is needed:
- install permission screenshot if shown
- screenshot of extension controls on Custom GPT page
- screenshot of the fresh destination after the text-only task
- whether GPT identity and Instant were preserved

No generated image is required for this experiment.

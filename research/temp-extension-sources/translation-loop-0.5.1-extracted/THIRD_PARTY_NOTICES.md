# Third-party notices

This test extension combines ideas and adapted logic from prior browser automation work.

## Oracle

- Project: steipete/oracle
- Source reference: `src/browser/actions/assistantResponse.ts` at commit `6009d4ad167b4f09c050ad22f19de5dfaf71504a`
- Adapted parts: positive terminal-completion gate, action-bar debounce, content fingerprint stability, fail-closed behavior, selector priorities.
- License: MIT
- Copyright (c) 2026 Peter Steinberger

The Oracle MIT license text is reproduced in `LICENSE-ORACLE`.

## Prompt Stacker

- Project: `thegreatLUCY/prompt-stacker`
- Source reference: `content.js` at commit `5a01391c124ecc1d8f4cc8c4538883cec6bde1c3`
- Adapted/copied parts: runner state (`idle`/`running`/`paused`), cancellable polling, textarea native setter, contenteditable `execCommand("insertText")`, ordinary `button.click()` activation, Enter fallback implementation, composer-scoped selector adapters, and local/sync storage fallback.
- Integration policy: this extension disables Enter fallback for actual ChatGPT sends because its fail-closed rules require a confirmed enabled send button. Oracle remains the only completion classifier.
- License: MIT
- Copyright (c) 2026 thegreatLUCY

The Prompt Stacker MIT license text is reproduced in `LICENSE-PROMPT-STACKER`.

## Auto Continue for ChatGPT & Gemini

- Source: Greasy Fork script 566364, version 1.1.0
- Adapted ideas: cooldown, multiple composer/send selectors, separation of processing state, fixed-prompt submission.
- License declared by the userscript: MIT

No whole-script copy is included. Completion detection from that script was deliberately not used because it relies mainly on stop-button absence and response-length stability.

## User-provided VoiceBridge reference

- Source: ChatGPT VoiceBridge Browser Extension 0.2.6 supplied by the user
- Used only as fallback/reference for baseline/armed behavior, route handling, lifecycle rescan hooks, deduplication and debug-log shape.
- This project remains technically and operationally separate from VoiceBridge.

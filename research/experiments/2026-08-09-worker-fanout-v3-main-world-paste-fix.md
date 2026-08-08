# Worker Fanout v3 — v0.3.0 paste failure / v0.3.1 MAIN-world fix

Date: 2026-08-09 JST
Status: **v0.3.1 STATIC PASS / Vivaldi live re-test pending**

## v0.3.0 live evidence

Canonical upload reached AutoGPT-style readiness successfully:

- attachment evidence: `autogpt-upload-ready`
- file: `kokyo_base_20260805.png`
- size: `1574854`
- worker identity matched expected Custom GPT

Prompt insertion then failed:

- reason: `PROMPT_PASTE_VERIFY_FAILED`
- expectedChars: `48`
- observedChars: `0`
- observedPreview: empty
- submitted: `false`

This is not a newline/readback normalization failure. The synthetic paste produced no visible editor text at all.

## Root cause

The v0.3.0 implementation copied AutoGPT 0.0.71's ChatGPT synthetic-paste mechanics but ran `chatgpt_adapter.js` as an isolated-world content script.

The deep AutoGPT analysis shows the original `setGPTPromptEditorValue` executes from AutoGPT's page-resident `main.js`, i.e. the page MAIN world. It constructs `ClipboardEvent("paste")`, attaches a `DataTransfer` as `clipboardData`, and dispatches that event to `#prompt-textarea p` from the page world.

File-input `change` survived the isolated-world implementation, but ChatGPT/React/ProseMirror did not consume the synthetic paste payload; the live `observedChars: 0` result is consistent with that world mismatch.

## v0.3.1 correction

- `chatgpt_adapter.js` is now loaded in manifest `world: "MAIN"`.
- It is removed from the isolated content-script bundle.
- background ensures the MAIN runtime exists with `chrome.scripting.executeScript`.
- attachment + synthetic paste READY preparation is invoked with `world: "MAIN"`.
- AutoGPT paste event construction order is preserved:
  1. create `ClipboardEvent("paste", {bubbles:true,cancelable:true})`;
  2. create `DataTransfer`;
  3. `setData("text/plain", text)`;
  4. define `pasteEvent.clipboardData`;
  5. dispatch to the editor.
- Translation Loop runToken / serialized state guard stays in the extension background.
- worker identity and generation state are re-read from the isolated content layer after MAIN-world preparation.
- no send/submit behavior was added.

## Static validation

PASS:

- manifest JSON parse
- all production JS `node --check`
- `test_chatgpt_adapter.js`
- `test_page_observer.js`
- `test_route_adapter.js`
- `test_runtime_guard.js`
- `test_v3_safety.js`

v0.3.1 ZIP SHA-256:

`9ede1810be163ee5558bd1bc3bbe2f11f40d1a7d27f4330704e8abd88c7d6b26`

## Next live acceptance

Run the same F2/F3/F4 READY test in Vivaldi. Expected each slot:

- `autogpt-upload-ready`
- `autogpt-synthetic-paste`
- distinct packet visible in composer
- `submitted:false`
- no generation started

Do not add controlled submit until this MAIN-world READY path passes live.
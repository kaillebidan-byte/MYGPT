# MYGPT Worker Fanout

Status: **Gate 0 Vivaldi PASS / Gate 1 v0.1.1 live Vivaldi verification pending**

This is a separate Manifest V3 extension for the MYGPT project.

## Accepted Gate 0

Gate 0 is accepted in Vivaldi with v0.0.2:

```text
Status: PASS
Expected: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Observed: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Tab: 22739685
```

The accepted Gate 0 behavior remains: one owned tab, same normalized Custom GPT identity, `storage` permission only, no periodic retry.

### v0.1.1 Gate 0 hardening / popup fix

During the first v0.1.0 Gate 1 test, the popup was captured while it still displayed:

```text
Status: AWAITING_DESTINATION
Observed: -
```

That screenshot alone did not prove the background handshake had failed: the popup rendered the `START` response snapshot and did not subscribe to later `chrome.storage.session` state changes. v0.1.1 fixes that UI bug by rendering session-state changes live and rejecting older `updatedAt` snapshots.

v0.1.1 also hardens the remaining real timing edge: if the new destination content script reports the correct worker while Gate 0 is still `OPENING`, background temporarily buffers that same-worker report. It is accepted only if its tab ID later equals the actual ID returned by `chrome.tabs.create()`. This is event-bound ownership reconciliation, not periodic polling or automatic retry.

## Gate 1 implementation source

Gate 1 no longer uses a newly invented composer adapter.

The user-authored `ChatGPT Translation Loop Test 0.5.1` ZIP was reconstructed from the temporary repository escrow and its actual source was inspected. Gate 1 now uses an **insert-only fork of that extension's `prompt_stacker_runner.js`**.

Reused directly from the Translation Loop runner:
- editor selector strategy;
- textarea/input native value setter;
- contenteditable `execCommand("insertText")` path and text fallback;
- normal `input` event dispatch;
- cancellable `waitFor` loop;
- runner generation/cancel guard;
- existing-draft fail-closed behavior;
- wait for reflected editor text before reporting success.

Removed from the Gate 1 fork:
- send-button discovery;
- `.click()` activation;
- Enter/KeyboardEvent fallback;
- submit flow and post-submit evidence logic.

The Prompt Stacker MIT license carried by Translation Loop is included as `LICENSE-PROMPT-STACKER`.

## Gate 1 contract

Gate 1 adds only controlled packet insertion into the **owned destination tab** created and verified by Gate 0.

Before changing the composer, background/content code verifies:
- Gate 0 status is `PASS`;
- the owned destination tab still exists and answers the identity query;
- current worker identity still equals the Gate 0 expected worker;
- packet is non-empty and no more than 12,000 characters;
- the Translation Loop-derived runner finds a visible supported composer;
- the composer contains no existing draft.

After insertion, Gate 1 requires:
- reflected composer text equals the normalized requested packet;
- result comes back with the same Gate 0 `runToken`;
- worker identity still matches;
- content script explicitly reports `submitted: false`.

Gate 1 source contains no:
- send-button lookup;
- click submission;
- Enter/keyboard submission;
- form submit/requestSubmit;
- canonical/file attachment;
- image-generation invocation;
- response parsing/output scraping/download;
- internal ChatGPT API/Bearer interception;
- automatic retry/rate-driving.

If the composer already contains any draft, Gate 1 returns `COMPOSER_NOT_EMPTY` without altering it.

## Vivaldi Gate 1 live test

### Update/load

1. Replace the unpacked extension with this v0.1.1 directory and press **Reload** in `vivaldi://extensions`.
2. Because the extension still intentionally has no `scripting` permission, reload the ChatGPT source tab after the extension update.
3. Open the popup.
4. Use **全状態をリセット** once for this v0.1.1 verification run.
5. On the manually opened `MYGPT Single Frame Worker Test` source tab, run Gate 0 once.
6. Keep the popup open briefly: `Status` should update to `PASS` and `Observed` should fill without requiring the popup to be closed/reopened.
7. Confirm exactly one owned destination tab opened and it is visibly the same Custom GPT.

### Gate 1 action

1. Leave the owned destination ChatGPT composer completely empty.
2. Keep the default test packet in the popup:

```text
[MYGPT_GATE1_TEST]
mode=INSERT_ONLY
submit=FORBIDDEN
purpose=verify_composer_insertion
```

3. When Gate 0 reaches `PASS`, **Gate 1 packetをowned tabへ挿入** becomes enabled automatically.
4. Click it exactly once.
5. Switch to the owned destination tab and visually inspect the composer.
6. The packet must be present as an **unsent draft**. No user message may appear in chat history and no generation may start.
7. Popup Gate1 status must become `PASS`.

### Gate 1 PASS

All must be true:
- Gate 0 becomes/remains `PASS`;
- `Expected` and `Observed` are equal;
- Gate1 status is `PASS`;
- the exact test packet is visibly present in the owned destination composer;
- `Composer` and `Method` are populated;
- Method is `translation-loop-prompt-stacker-insert-only`;
- no user turn was created;
- no image generation or assistant response started;
- no file was attached;
- no extra tab was opened;
- no Vivaldi extension/service-worker error occurred.

### Gate 1 FAIL / stop

Stop before any later gate if:
- Gate 0 remains `AWAITING_DESTINATION` after the destination is fully loaded;
- Gate1 reports `COMPOSER_NOT_FOUND`, `COMPOSER_NOT_EMPTY`, `COMPOSER_INSERT_VERIFY_FAILED`, identity mismatch, or another `FAIL`;
- any part of the packet is missing/duplicated/reordered;
- the packet is submitted automatically;
- generation starts;
- a file is attached;
- the wrong tab/composer is modified.

Do not manually press ChatGPT's send button during this test. The point of Gate 1 is insertion-only verification.

## Static checks

From this directory:

```bash
python -m json.tool manifest.json
node --check route_adapter.js
node --check prompt_stacker_insert_runner.js
node --check content.js
node --check background.js
node --check popup.js
node tests/test_route_adapter.js
node tests/test_prompt_stacker_insert_runner.js
node tests/test_gate1_safety.js
```

Do not start canonical attachment or controlled submit until Gate 1 passes in Vivaldi.

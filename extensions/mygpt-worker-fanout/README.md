# MYGPT Worker Fanout

Status: **Gate 0 Vivaldi PASS / Gate 1 v0.1.0 live Vivaldi verification pending**

This is a separate Manifest V3 extension for the MYGPT project.

## Accepted Gate 0

Gate 0 is accepted in Vivaldi with v0.0.2:

```text
Status: PASS
Expected: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Observed: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Tab: 22739685
```

The accepted Gate 0 behavior remains unchanged: one owned tab, same normalized Custom GPT identity, `storage` permission only, no periodic retry.

## Gate 1 contract

Gate 1 adds only controlled packet insertion into the **owned destination tab** created and verified by Gate 0.

Before changing the composer, background/content code verifies:
- Gate 0 status is `PASS`;
- the owned destination tab still exists and answers the identity query;
- current worker identity still equals the Gate 0 expected worker;
- the composer is visible and supported;
- the composer contains no existing draft;
- packet is non-empty and no more than 12,000 characters.

After insertion, Gate 1 requires:
- observed composer text equals the requested packet after newline normalization;
- result comes back with the same Gate 0 `runToken`;
- worker identity still matches;
- content script explicitly reports `submitted: false`.

Gate 1 does **not** contain code for:
- send-button lookup;
- click submission;
- Enter/keyboard submission;
- form submit/requestSubmit;
- canonical/file attachment;
- image-generation invocation;
- response parsing/output scraping/download;
- internal ChatGPT API/Bearer interception;
- automatic retry/polling.

If the composer already contains any draft, Gate 1 returns `COMPOSER_NOT_EMPTY` without altering it.

## Vivaldi Gate 1 live test

### Update/load

1. Replace the unpacked extension with this v0.1.0 directory and press **Reload** in `vivaldi://extensions`.
2. Because the extension still intentionally has no `scripting` permission, reload the ChatGPT tab(s) that will be used after the extension update.
3. Open the popup.

If the previous Gate 0 PASS state and owned tab survived the extension reload, reload that owned destination tab once and continue below.

If Gate 0 state is no longer available, use **全状態をリセット**, manually open `MYGPT Single Frame Worker Test`, reload that source tab once, run Gate 0 again, and confirm Gate 0 `PASS` before Gate 1.

### Gate 1 action

1. Leave the owned destination ChatGPT composer completely empty.
2. Keep the default test packet in the popup:

```text
[MYGPT_GATE1_TEST]
mode=INSERT_ONLY
submit=FORBIDDEN
purpose=verify_composer_insertion
```

3. Click **Gate 1 packetをowned tabへ挿入** exactly once.
4. Switch to the owned destination tab and visually inspect the composer.
5. The packet must be present as an **unsent draft**. No user message may appear in chat history and no generation may start.
6. Reopen the popup and inspect Gate 1 status.

### Gate 1 PASS

All must be true:
- Gate 0 remains `PASS`;
- Gate1 status is `PASS`;
- the exact test packet is visibly present in the owned destination composer;
- `Composer` and `Method` are populated;
- no user turn was created;
- no image generation or assistant response started;
- no file was attached;
- no extra tab was opened;
- no Vivaldi extension/service-worker error occurred.

### Gate 1 FAIL / stop

Stop before any later gate if:
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
node --check composer_adapter.js
node --check content.js
node --check background.js
node --check popup.js
node tests/test_route_adapter.js
node tests/test_composer_adapter.js
node tests/test_gate1_safety.js
```

Do not start canonical attachment or controlled submit until Gate 1 passes in Vivaldi.

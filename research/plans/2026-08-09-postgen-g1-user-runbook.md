# POSTGEN-G1 — user runbook

Date: 2026-08-09 JST
Status: **CURRENT USER PROCEDURE**

Goal: characterize the Instant post-image dialogue stage without modifying the production worker or Worker Orchestrator v0.5.0.

Experimental worker config:
- `research/runtime/2026-08-09-postgen-g1-experimental-worker-config.md`

Execution plan:
- `research/plans/2026-08-09-identity-quality-closed-loop-execution-plan.md`

---

# Part A — create the experimental GPT clone

Do this on ChatGPT web.

1. Open the current `MYGPT Single Frame Worker Test` GPT editor.
2. Open the editor `...` menu.
3. Choose the duplicate-GPT option.
4. Rename the duplicate to:
   - `MYGPT Single Frame Worker POSTGEN G1`
5. Set description to:
   - `添付された基準画像から指定された1つの静止姿勢を1枚生成し、生成後に短い構造化監査だけを返すPOSTGEN-G1実験用GPT。`
6. Keep the duplicated GPT's recommended model unchanged.
7. Capabilities for the first test:
   - Image generation: ON
   - Web search: OFF
   - Code Interpreter & Data Analysis: OFF
   - Actions: NONE
   - Apps: not active
8. Knowledge: NONE.
9. Replace the duplicated Instructions with the exact G1a instructions stored in:
   - `research/runtime/2026-08-09-postgen-g1-experimental-worker-config.md`
10. Create/Update the duplicate.
11. Do not edit the original `MYGPT Single Frame Worker Test`.

Stop here if the clone cannot be created with the above settings. Record the exact editor error rather than changing multiple settings.

---

# Part B — G1a-1 manual single-chat runtime observation

Purpose: prove the post-image dialogue shape before involving the browser orchestrator.

## Input

1. Open a fresh conversation with `MYGPT Single Frame Worker POSTGEN G1`.
2. Ensure the runtime is the Instant path.
3. Attach the original canonical directly.
4. Use one already-known local static-pose packet. Prefer an R1/R2 pose already used before; do not invent a new pose for this gate.
5. Send once.
6. Do not send another user message after generation starts.

## Expected behavior

The GPT should:

```text
one image generation
-> image appears
-> normal text POSTGEN_AUDIT {...}
-> stop
```

There must be no second generated image triggered by the audit.

## What to capture

Capture one screenshot that includes:
- the generated image;
- the `POSTGEN_AUDIT {...}` line;
- enough surrounding UI to see whether they visually appear in one assistant response or separate responses.

Copy the exact `POSTGEN_AUDIT` line as text.

## Optional DOM check — strongly preferred

Open browser DevTools on that conversation after everything is finished.

In Console, run:

```js
(() => {
  const turns = [...document.querySelectorAll('article[data-testid^="conversation-turn"], div[data-testid^="conversation-turn"], section[data-testid^="conversation-turn"]')];
  return turns.map((turn, index) => ({
    index,
    text: (turn.innerText || '').slice(0, 500),
    images: [...turn.querySelectorAll('img')].map(img => ({
      alt: img.alt || '',
      w: img.naturalWidth || 0,
      h: img.naturalHeight || 0,
      srcPrefix: String(img.currentSrc || img.src || '').slice(0, 80)
    }))
  })).filter(x => x.text.includes('POSTGEN_AUDIT') || x.images.some(i => i.w >= 128 && i.h >= 128));
})()
```

Copy the console result.

This is observation only. Do not edit DOM or execute any script that clicks/sends messages.

## G1a-1 PASS

PASS if all are true:
- exactly one image-generation event occurred;
- `POSTGEN_AUDIT` appeared after image generation without a second user message;
- no autonomous image repair/regeneration occurred;
- the image/audit turn relationship can be determined from UI or DOM evidence.

If it fails, stop before Part C and return the failure evidence.

---

# Part C — G1a-2 current Worker Orchestrator compatibility

Purpose: test whether v0.5.0 still detects completion and recovers/saves the image when the worker emits post-image audit text.

Do not change extension code.

## Preparation

1. Keep `MYGPT Worker Orchestrator v5` / manifest `0.5.0` loaded.
2. Reload the extension only if it is not already loaded.
3. Reload the source ChatGPT tab after any extension reload.
4. Open `MYGPT Single Frame Worker POSTGEN G1` as the source GPT tab.
5. Confirm the extension popup is operating from this cloned GPT route, not the original production worker route.
6. Select the normal writable output folder already proven with v0.5.0.
7. Select the same original canonical.
8. Fill F2/F3/F4 with already-known local pose packets. Do not introduce ID-V1 wording or visual pose guides yet.

## Run

1. Press Run once.
2. If the selected-folder permission prompt appears, grant it before worker generation begins.
3. Do not interact with F2/F3/F4 worker chats while they run.
4. Wait only for the extension's normal terminal state; do not manually download images.

## Record from popup

Copy the full final popup status, including:
- Phase;
- Recovery;
- Output;
- worker route;
- F2 line;
- F3 line;
- F4 line;
- any error text.

## Check filesystem

Verify:
- F2 output image exists in selected folder;
- F3 output image exists;
- F4 output image exists;
- filenames are the expected slot-specific files;
- no slot silently saved the wrong image.

## G1a-2 PASS

PASS if:
- F2/F3/F4 generation reaches COMPLETE;
- Recovery is COMPLETE;
- Output is COMPLETE;
- correct three images are present in selected folder;
- post-image audit text did not cause current collector to miss or misidentify the image.

If Recovery fails with `OUTPUT_IMAGE_NOT_FOUND` or similar after audit text appears, treat that as evidence for the predicted latest-assistant-turn problem. Do not patch anything manually.

---

# Part D — what to send back after G1a

Send these items in one message:

1. `G1a-1 manual: PASS` or `FAIL`.
2. Screenshot of the manual single-chat result.
3. Exact `POSTGEN_AUDIT {...}` line.
4. DevTools console result from the optional DOM check, if available.
5. `G1a-2 orchestrator: PASS` or `FAIL`.
6. Full extension popup final status copied as text.
7. `selected folder: 3/3 files present` or the exact missing/wrong files.
8. Anything visibly unusual, but do not diagnose it yourself unless obvious.

Do not perform G1b or G1c until the G1a evidence is reviewed, because a collector/state-boundary patch may be required first.

---

# Part E — G1b Action subtest (only after explicit G1a PASS/review)

This is intentionally deferred until G1a is understood.

When authorized by the next step:
- enable one narrow read-only Action;
- use a simple text/JSON response;
- do not send image bytes;
- test that the Action can be called after image generation;
- keep Code Interpreter OFF.

OpenAI Actions require an API definition/OpenAPI schema and should be tested in Preview after configuration. Actions and Apps are mutually exclusive; image generation is a separate capability.

---

# Part F — G1c Code Interpreter file-access gate (after G1b or separately approved)

When authorized:
- remove/disable Action if needed for clean isolation;
- enable Code Interpreter & Data Analysis;
- keep the same one-image task;
- after image generation, ask only whether the generated image is available as an actual usable file/path to Code Interpreter;
- do not install MaSC, DreamBench++, or other metrics yet.

The only result needed is:
- generated image file access YES/NO;
- exact file/path evidence if YES;
- exact tool/runtime error if NO.

---

# Do not do during POSTGEN-G1

Do not:
- edit the production worker;
- modify Worker Orchestrator source;
- enable Branch/Thinking;
- add visual pose guides;
- change canonical;
- add generated reference images;
- install identity metrics;
- add broad GitHub access to the generator;
- let the GPT automatically regenerate based on its own audit;
- retry a failed generated candidate in the same chat.

POSTGEN-G1 is a runtime boundary experiment, not yet an identity-quality experiment.

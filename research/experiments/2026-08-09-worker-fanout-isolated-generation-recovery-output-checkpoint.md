# Worker Fanout — isolated generation / recovery / output checkpoint

Date: 2026-08-09 JST
Updated: 2026-08-09 19:03 JST
Status: **v0.4.4 FANOUT LIVE PASS / v0.4.5 IMAGE RECOVERY LIVE PASS / v0.4.6 OUTPUT PERMISSION FAIL / v0.4.7 FIX STATIC, LIVE PENDING**

## Purpose

This is the current operational checkpoint for the Worker Fanout side project. Prefer this file over older v2/v3/v0.4.x candidate notes when current behavior differs.

Current worker:

```text
MYGPT Single Frame Worker Test
/g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
```

Extension source:

```text
extensions/mygpt-worker-fanout-v3/
```

Display family:

```text
MYGPT Worker Fanout v4
```

Current manifest version after the permission fix: `0.4.7`.

## Architecture rule retained

Preserve live-proven paths. Patch only the layer for which new failure evidence exists.

Implementation lookup remains:

- `research/reference/2026-08-09-extension-reuse-inventory.md`
- `research/reference/2026-08-09-autogpt-0.0.71-internal-structure-map.md`
- `research/audits/2026-08-09-autogpt-0.0.71-deep-architecture-analysis.md`
- `research/decisions/2026-08-09-autogpt-stripped-clone-current.md`

## v0.4.4 — isolated fanout LIVE PASS

Successful sequence:

```text
open F2 only
-> 15 s OPEN_WAIT
-> attach canonical
-> 15 s ATTACH_WAIT
-> MAIN-world slot paste
-> Translation Loop native click
-> positive submit evidence
-> 5 s COOLDOWN
-> open F3
-> same
-> open F4
```

Generation completion does not gate opening the next slot. Completion monitoring remains passive.

Live evidence:

```text
F2: COMPLETE | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=image-turn-stable
F3: COMPLETE | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=oracle-action-bar
F4: COMPLETE | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=image-turn-stable
```

### Near-frozen path

Do not change without new failing evidence:

- one-worker-at-a-time preparation;
- `OPEN_SETTLE_MS = 15000`;
- AutoGPT `DataTransfer -> input.files -> change` attachment;
- bounded attachment retry;
- `ATTACH_SETTLE_MS = 15000`;
- MAIN-world synthetic paste;
- observer-before-trigger ordering;
- Translation Loop native click;
- Enter fallback disabled;
- positive submit evidence;
- `SLOT_COOLDOWN_MS = 5000`;
- runToken / stale async guard;
- passive completion monitoring.

## v0.4.5 — post-generation image recovery LIVE PASS

`image_collector.js` remains the proven recovery baseline.

Behavior:

1. wait for all generation slots to complete;
2. inspect each latest assistant turn;
3. choose the generated-image candidate;
4. save through `chrome.downloads` under `Downloads/MYGPT-Worker-Fanout/`;
5. observe actual browser download completion;
6. mark `imageRecovery.status = COMPLETE` only after the download reaches `complete`.

The full generation-to-image-download path passed live testing.

## v0.4.6 — selectable output folder live failure

Requirement:

> Allow the recovered F2/F3/F4 images to end in a user-selected local directory rather than only the default Downloads tree.

Implementation structure:

```text
v0.4.4 generation COMPLETE
-> v0.4.5 Recovery COMPLETE
-> no selected folder: keep Downloads/MYGPT-Worker-Fanout/
-> selected folder: verified relocation layer
```

The v0.4.6 live run preserved all proven layers but failed at permission recovery.

Observed user log:

```text
Phase: COMPLETE / COOLDOWN | Recovery: COMPLETE | Output: PERMISSION_REQUIRED
Worker: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
File: kokyo_base_20260805.png
F2: COMPLETE | Tab 22740024 | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=oracle-action-bar | image=COMPLETE/C:\Users\kaill\Downloads\MYGPT-Worker-Fanout\20260809-185918_kokyo_base_20260805_F2.png | output=-
F3: COMPLETE | Tab 22740025 | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=image-turn-stable | image=COMPLETE/C:\Users\kaill\Downloads\MYGPT-Worker-Fanout\20260809-185918_kokyo_base_20260805_F3.png | output=-
F4: COMPLETE | Tab 22740026 | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=oracle-action-bar | image=COMPLETE/C:\Users\kaill\Downloads\MYGPT-Worker-Fanout\20260809-185918_kokyo_base_20260805_F4.png | output=-
output OUTPUT_DIRECTORY_PERMISSION_REQUIRED: {"permission":"prompt"}
```

### Interpretation

This is a clean separation result:

- fanout: PASS;
- attachment: PASS;
- submit: PASS;
- generation completion: PASS;
- image recovery/download: PASS;
- selected-directory relocation: did not start because write permission was `prompt`.

The persisted directory handle still existed. The missing operation was a user-gesture `requestPermission({mode:"readwrite"})` when permission had returned to `prompt`.

The three v0.4.6 images were not lost. They remained in the proven v0.4.5 staging directory under Downloads.

## v0.4.7 — permission reauthorization patch

Scope is intentionally local.

Changed:

- `output_directory_store.js`
  - adds `requestWritePermission(handle)`;
- `popup.js`
  - keeps the current selected handle available in popup memory;
  - detects `PERMISSION_REQUIRED` / non-granted permission;
  - changes the button label to `保存先を再許可して保存`;
  - on user click, calls `requestPermission({mode:"readwrite"})` on the existing handle;
  - after grant, renews the output-directory metadata revision.
- `manifest.json`
  - version `0.4.7`.
- `tests/test_output_directory.js`
  - adds static contract checks for the reauthorization path.

Unchanged:

- `background.js`;
- `image_collector.js`;
- `output_relocator.js`;
- `chatgpt_adapter.js`;
- `prompt_stacker_runner.js`;
- `runtime_guard.js`;
- `content.js`.

### Recovery sequence

```text
Recovery COMPLETE
-> service worker sees selected directory permission = prompt
-> Output PERMISSION_REQUIRED
-> popup displays 保存先を再許可して保存
-> user clicks
-> stored handle.requestPermission({mode:"readwrite"})
-> granted
-> output-directory metadata revision changes
-> unchanged output_relocator.js observes change
-> F2/F3/F4 relocation resumes
-> createWritable
-> exact byte-size verify
-> temporary Downloads copy removal only after verify
-> Output COMPLETE
```

This is not a regeneration path.

## Important limitation of the current failed run

Installing/reloading v0.4.7 clears the MV3 `chrome.storage.session` runtime used by the current v0.4.6 run. Therefore v0.4.7 cannot retroactively resume the already-finished v0.4.6 runtime after extension reload.

For the already-recovered v0.4.6 images, the safe action is simply to keep or manually move the three files currently present under `Downloads/MYGPT-Worker-Fanout/`.

A fresh v0.4.7 run is required to validate automatic permission recovery.

## v0.4.7 live acceptance

1. replace/reload the unpacked extension with v0.4.7;
2. reload the source Custom GPT tab;
3. select the intended output folder;
4. run normal F2/F3/F4 once;
5. require three-slot generation `COMPLETE`;
6. require `Recovery: COMPLETE`;
7. if Chromium returns the stored handle permission to `prompt`, require `Output: PERMISSION_REQUIRED` and popup button `保存先を再許可して保存`;
8. click that button and grant write permission;
9. require `Output: COMPLETE`;
10. require F2/F3/F4 `output=COMPLETE/<filename>`;
11. verify the selected directory contains all three outputs;
12. verify temporary Downloads copies are removed only after destination verification.

The appearance of one reauthorization prompt is acceptable. Background auto-grant is not an acceptance requirement because the permission request is user-mediated.

## Next main research topic after v0.4.7 acceptance

Return to **image-difference analysis**.

Do not expand Worker Fanout further unless the v0.4.7 acceptance exposes another concrete output-layer failure.

## Deferred future Worker Fanout investigation — do not implement now

### Branch -> Thinking image generation

Future candidate:

```text
Custom GPT Instant preparation
-> do not generate in parent
-> Branch
-> switch branch to Thinking
-> generate image in Thinking branch
```

Questions for later:

- can Custom GPT conversation branching be driven reliably;
- does the branch preserve Custom GPT identity/instructions and canonical context;
- can only the branch switch to Thinking;
- does the direct-Thinking failure disappear;
- can each isolated F2/F3/F4 worker use this pattern without weakening isolation.

This remains deferred until selected-folder acceptance and image-difference analysis are complete.

## Current stopping point

- isolated worker fanout: live proven;
- image generation completion monitoring: live proven;
- generated-image automatic recovery: live proven;
- v0.4.6 selected-folder first live run: permission-recovery failure isolated;
- v0.4.7 permission patch: implemented, static validation pending/followed by live acceptance;
- next main topic after acceptance: image differences.

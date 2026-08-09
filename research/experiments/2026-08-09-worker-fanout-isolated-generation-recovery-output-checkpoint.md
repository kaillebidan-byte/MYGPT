# Worker Fanout — isolated generation / recovery / output checkpoint

Date: 2026-08-09 JST
Status: **v0.4.4 FANOUT LIVE PASS / v0.4.5 IMAGE RECOVERY LIVE PASS / v0.4.6 SELECTABLE OUTPUT STATIC PASS, LIVE PENDING**

## Purpose

Record the current proven boundary before returning to image-difference analysis. This file is the operational checkpoint for the Worker Fanout side project; do not infer current behavior from older v2/v3/v0.4.x candidate documents when this checkpoint gives a later result.

## Current worker

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

## Architecture rule retained

Current implementation direction remains:

```text
Translation Loop control plane
        +
stripped AutoGPT ChatGPT adapter
        +
VoiceBridge lifecycle / hidden-tab observation
```

The reuse inventory remains the first implementation reference:

- `research/reference/2026-08-09-extension-reuse-inventory.md`

AutoGPT lookup order remains:

- `research/reference/2026-08-09-autogpt-0.0.71-internal-structure-map.md`
- `research/audits/2026-08-09-autogpt-0.0.71-deep-architecture-analysis.md`
- `research/decisions/2026-08-09-autogpt-stripped-clone-current.md`

Primary operational rule:

> Preserve live-proven paths. Add a separate layer for a new requirement unless evidence shows the proven layer itself is wrong.

## v0.4.4 — isolated fanout LIVE PASS

The successful sequence is:

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

Generation completion does not gate opening the next slot. Completion monitoring remains passive in the background.

Live result supplied after the v0.4.4 test:

```text
Phase: COMPLETE / COOLDOWN
Worker: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
File: kokyo_base_20260805.png
F2: COMPLETE | Tab 22739986 | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=image-turn-stable
F3: COMPLETE | Tab 22739987 | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=oracle-action-bar
F4: COMPLETE | Tab 22739988 | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=image-turn-stable
```

### Frozen / near-frozen path

Do not change without new failing evidence:

- one-worker-at-a-time tab preparation;
- `OPEN_SETTLE_MS = 15000`;
- AutoGPT `DataTransfer -> input.files -> change` attachment primitive;
- bounded attachment retry;
- `ATTACH_SETTLE_MS = 15000`;
- MAIN-world synthetic paste;
- observer-before-trigger ordering;
- Translation Loop native click;
- Enter fallback disabled;
- positive submit evidence;
- `SLOT_COOLDOWN_MS = 5000`;
- runToken / stale-async guard;
- passive completion monitoring.

## v0.4.5 — post-generation image recovery LIVE PASS

v0.4.5 deliberately left `background.js` unchanged and added recovery after the proven generation path.

Recovery behavior:

1. wait until all F2/F3/F4 generation slots are `COMPLETE`;
2. inspect each worker's latest assistant turn;
3. choose the largest image candidate in that assistant turn;
4. save through `chrome.downloads` under `Downloads/MYGPT-Worker-Fanout/`;
5. observe the actual browser download state;
6. mark `imageRecovery.status = COMPLETE` only after the download reaches `complete`;
7. reconcile persisted download ids after MV3 service-worker restart.

Live result: **PASS**. The user confirmed that the full generation-to-image-save path succeeded.

This makes v0.4.5 the proven image-recovery baseline.

## v0.4.6 — selectable save folder

Requirement added after v0.4.5 LIVE PASS:

> Generated images should be able to land in a user-selected folder rather than only the browser's default Downloads tree.

### Design decision

Do not replace the successful v0.4.5 collector for the first implementation.

v0.4.6 adds a post-recovery relocation layer:

```text
v0.4.4 generation COMPLETE
-> v0.4.5 Recovery COMPLETE
-> no custom folder: keep Downloads/MYGPT-Worker-Fanout/
-> custom folder: verified relocation to selected directory
```

New files:

- `output_directory_store.js`
  - stores the user-selected `FileSystemDirectoryHandle` in IndexedDB;
  - reads/clears the handle;
  - queries current read/write permission.

- `output_relocator.js`
  - runs only after the existing image recovery is complete;
  - resolves the existing `imageRecovery.sourceUrl` in the owning worker tab;
  - copies bytes to the selected directory;
  - verifies exact written byte size;
  - removes the temporary Downloads file only after successful verification;
  - records per-slot output status.

Changed shell/UI files:

- `service_worker.js`
  - imports the unchanged `background.js` and `image_collector.js` plus the two new output modules.
- `popup.html` / `popup.js`
  - add `保存先フォルダを選択`;
  - add `既定Downloadsに戻す`;
  - show selected folder permission and `Output` runtime state.
- `manifest.json`
  - version `0.4.6`.

### Important fallback behavior

No selected directory:

```text
Output: DEFAULT_DOWNLOADS
```

The proven v0.4.5 save location remains in use.

Selected directory without current write permission:

```text
Output: PERMISSION_REQUIRED
```

Do not silently save that selected-folder run elsewhere. The user must re-select/re-authorize the intended directory.

### Collision / integrity behavior

- existing file names are not overwritten;
- collision names become `name (1).ext`, `name (2).ext`, etc.;
- destination file size must exactly match the bytes being written;
- temporary default-Downloads copy is removed only after destination verification;
- changing the selected folder after a completed run applies to later runs and does not retroactively relocate the old run.

### v0.4.6 static result

Local static checks passed before repository update:

```text
node --check output_directory_store.js
node --check output_relocator.js
node --check popup.js
node --check service_worker.js
python -m json.tool manifest.json
node tests/test_output_directory.js
```

Result:

```text
Selectable output directory layer: PASS
STATIC_PATCH_CHECKS=PASS
```

A repository diff against the v0.4.5 head confirmed that v0.4.6 changes do **not** touch:

- `background.js`;
- `image_collector.js`;
- `chatgpt_adapter.js`;
- `prompt_stacker_runner.js`;
- `loop_core.js`;
- `terminal_gate.js`;
- `runtime_guard.js`;
- `content.js`.

Therefore v0.4.6 is a new output layer, not a redesign of the live-proven fanout/recovery path.

## Next live acceptance test

After loading v0.4.6:

1. reload the source Custom GPT tab;
2. choose a writable test folder with `保存先フォルダを選択`;
3. run normal F2/F3/F4 generation;
4. require the existing generation path to reach three-slot `COMPLETE`;
5. require `Recovery: COMPLETE`;
6. require `Output: COMPLETE`;
7. require F2/F3/F4 `output=COMPLETE/<filename>`;
8. open all three files from the selected folder and verify they are the generated outputs;
9. verify the temporary `Downloads/MYGPT-Worker-Fanout/` files were removed after relocation;
10. switch to `既定Downloadsに戻す` and later verify the original default path still works.

Until that live test passes, v0.4.6 is **STATIC PASS candidate**, not a live-proven baseline.

## Next main research topic after v0.4.6 acceptance

Return to the previously paused **image-difference analysis**.

Worker Fanout should not expand into another large redesign before that analysis unless the v0.4.6 live test exposes a concrete output-path failure.

## Deferred future Worker Fanout investigation — do not implement now

### Branch -> Thinking image generation

Background observation to investigate later:

- image generation from the Custom GPT base can fail when started directly under Thinking;
- a possible workaround is to establish the Custom GPT conversation in Instant without allowing Instant to generate the image;
- branch that conversation;
- switch only the branch to Thinking;
- generate the image from the Thinking branch.

Future questions:

1. Can the extension create or drive a conversation branch reliably?
2. Does a branch preserve the Custom GPT identity/instructions and the attached canonical/context needed by the worker?
3. Can the branch be switched from Instant to Thinking independently?
4. Can image generation then succeed in that Thinking branch?
5. Can this be done without accidentally letting the Instant parent generate the image?
6. If successful, can each isolated F2/F3/F4 worker use:

```text
Instant preparation
-> branch
-> Thinking generation
```

This is a future investigation only. It must not be mixed into v0.4.6 output-folder validation or the next image-difference analysis.

## Current stopping point

- isolated worker fanout: live proven;
- image generation completion monitoring: live proven;
- generated-image automatic recovery: live proven;
- arbitrary selected output folder: implemented and statically proven, live acceptance pending;
- next main research after acceptance: image differences;
- branch/Thinking workaround: recorded for later, no implementation yet.

# MYGPT Worker Fanout v4

Status: **v0.4.4 fanout LIVE PASS / v0.4.5 image recovery LIVE PASS / v0.4.6 selectable output folder STATIC PASS candidate — live test pending**

Current architecture:

```text
Translation Loop control plane
        +
AutoGPT ChatGPT upload/paste/passive observer
        +
VoiceBridge-style lifecycle monitor
        +
v0.4.5 post-generation image recovery
        +
v0.4.6 optional user-selected output relocation
```

The current rule remains: do not redesign proven orchestration. New behavior is layered after the known-good path.

## Proven v0.4.4 execution model

The live-tested fanout path is unchanged:

1. open exactly one worker tab and make it active;
2. wait about 15 seconds (`OPEN_WAIT`);
3. verify the Custom GPT identity and empty composer;
4. attach the canonical using the existing AutoGPT `DataTransfer -> input.files -> change` path and bounded retry;
5. wait about 15 seconds (`ATTACH_WAIT`);
6. paste only that slot packet in MAIN world;
7. arm the passive observer before activation;
8. submit with Translation Loop / Prompt Stacker native `button.click()`; Enter fallback remains disabled;
9. require positive submit evidence from Translation Loop DOM evidence and/or AutoGPT passive conversation fetch evidence;
10. once positive submit evidence is confirmed, wait about 5 seconds (`COOLDOWN`);
11. open the next slot worker without waiting for the previous image generation to complete.

The 15-second waits absorb ChatGPT/Vivaldi UI timing around tab initialization and image attachment. Generation completion monitoring remains passive and never gates opening the next worker. Sequence waits are stored in runtime state and resumed by `chrome.alarms` (`mygpt-v4-sequence-step`). Worker tabs remain open for inspection.

### v0.4.4 live evidence

All three slots completed in the same run:

```text
F2: COMPLETE | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=image-turn-stable
F3: COMPLETE | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=oracle-action-bar
F4: COMPLETE | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=image-turn-stable
```

This is the baseline. Do not change its attachment, paste, submit, submit-evidence, sequencing or completion mechanisms without new failing evidence.

## v0.4.5 image recovery — LIVE PASS

v0.4.5 added image recovery without modifying `background.js`.

After all F2/F3/F4 generations are `COMPLETE`:

1. `image_collector.js` inspects the latest assistant turn in each worker;
2. selects the largest generated-image candidate in that turn;
3. saves it with `chrome.downloads` under `Downloads/MYGPT-Worker-Fanout/`;
4. tracks the real browser download through `chrome.downloads.onChanged`;
5. marks each slot `imageRecovery.status = COMPLETE` only after the download itself completes;
6. reconciles persisted download ids if the MV3 service worker restarts.

The full F2/F3/F4 recovery path passed the live test on 2026-08-09.

## v0.4.6 selectable output folder

v0.4.6 keeps both the v0.4.4 fanout and v0.4.5 collector unchanged. It adds a separate output layer.

### Default mode

If no custom folder is selected, behavior is unchanged:

```text
Downloads/MYGPT-Worker-Fanout/
```

Runtime output state becomes `DEFAULT_DOWNLOADS` after the existing v0.4.5 recovery completes.

### Selected-folder mode

The popup now has:

- `保存先フォルダを選択`;
- `既定Downloadsに戻す`.

The selected `FileSystemDirectoryHandle` is stored in extension-origin IndexedDB. Small metadata (`name`, revision, selected time, mode) is stored in `chrome.storage.local`.

The custom-folder path runs only after `Recovery: COMPLETE`:

1. resolve the existing v0.4.5 `imageRecovery.sourceUrl` inside the owning worker tab;
2. fetch the image as a blob in that page context;
3. transfer the image bytes to the service worker;
4. create a uniquely named file in the selected directory;
5. write through `createWritable()`;
6. reopen the written file and require exact byte-size agreement;
7. only after verification, remove the temporary v0.4.5 Downloads file with `chrome.downloads.removeFile`;
8. mark the slot `outputTransfer.status = COMPLETE`.

This intentionally uses v0.4.5 as a safe staging/recovery layer instead of replacing a live-proven collector during the first arbitrary-folder implementation.

Name collisions use `name (1).ext`, `name (2).ext`, and so on rather than overwriting an existing output.

If the stored directory handle no longer has write permission, the extension reports `Output: PERMISSION_REQUIRED` and does not silently redirect that selected-folder run to another destination. Re-select the folder from the popup to renew access.

Changing the output directory after an already-completed run applies to later runs; it does not retroactively move an old completed run.

## Layer ownership

### Translation Loop 0.5.1

- `runtime_guard.js` — runToken/stale-run rejection/serialized mutations;
- `prompt_stacker_runner.js` — composer-local send discovery and native click;
- `loop_core.js` — positive submit evidence;
- `terminal_gate.js` — completion classification;
- background/content lifecycle patterns and watchdog behavior.

Prompt Stacker-derived code remains under `LICENSE-PROMPT-STACKER`.

### AutoGPT 0.0.71

- MAIN-world ChatGPT adapter;
- file input re-resolution;
- `DataTransfer -> input.files -> change` attachment;
- bounded attachment retry;
- synthetic paste;
- observer-before-trigger nonce ordering;
- passive conversation fetch/WebSocket observation;
- conceptual precedent for keeping output/download handling separate from the generation engine.

No Bearer capture or direct internal ChatGPT API calls are used.

### VoiceBridge 0.2.6

- long-lived monitor port;
- background scan ping;
- generation/turn-state observation;
- hidden/background-tab rescan model.

### v0.4.5 / v0.4.6 output layers

- `image_collector.js` — proven browser-download recovery;
- `output_directory_store.js` — selected directory handle persistence;
- `output_relocator.js` — optional post-recovery verified relocation to the selected directory;
- `service_worker.js` — thin import wrapper around the unchanged layers.

## Extension-context invalidation

A reloaded/updated extension invalidates old content-script contexts. The existing hard-stop behavior remains unchanged: old content instances clear reconnect/scan timers, disconnect monitor ports and observers, remove route/page listeners, and do not reconnect.

For a clean live test after replacing the unpacked extension, Reset/close worker tabs from the previous version and reload the source Custom GPT tab before starting a new run.

## Runtime sequence

Generation per active slot:

`QUEUED -> OPENING -> OPEN_WAIT -> VERIFYING/STAGED -> ATTACHED -> ATTACH_WAIT -> SUBMITTING -> SUBMITTED/GENERATING -> COOLDOWN`

Completion later occurs passively as `SETTLING -> COMPLETE`.

Post-generation output:

```text
all slots COMPLETE
  -> Recovery PENDING/RECOVERING
  -> Recovery COMPLETE
  -> no selected directory: Output DEFAULT_DOWNLOADS
  -> selected directory: Output PENDING/TRANSFERRING -> COMPLETE
```

## v0.4.6 live test

1. replace/reload the unpacked extension with v0.4.6;
2. reload the source Custom GPT tab;
3. open the popup and choose `保存先フォルダを選択`;
4. choose a writable test directory and confirm the popup reports it as selected/writeable;
5. run the normal F2/F3/F4 fanout once;
6. require all three generation slots to reach `COMPLETE` through the existing v0.4.4 evidence path;
7. require `Recovery: COMPLETE` through the existing v0.4.5 path;
8. require `Output: COMPLETE` and each slot `output=COMPLETE/<filename>`;
9. verify exactly the expected F2/F3/F4 outputs exist in the selected directory and open normally;
10. verify the temporary files created under `Downloads/MYGPT-Worker-Fanout/` were removed after successful relocation;
11. use `既定Downloadsに戻す` and confirm a later run retains the original v0.4.5 default behavior.

## Static checks

The selectable-folder layer has passed local static checks:

```text
node --check output_directory_store.js
node --check output_relocator.js
node --check popup.js
node --check service_worker.js
python -m json.tool manifest.json
node tests/test_output_directory.js
```

Expected output:

```text
Selectable output directory layer: PASS
STATIC_PATCH_CHECKS=PASS
```

The live v0.4.6 folder-selection path is still pending.

## External/product layers intentionally absent

- Google Analytics;
- membership/entitlement;
- external prompt services;
- imgbb;
- Autojourney services;
- unrelated provider adapters;
- Bearer capture;
- direct internal conversation polling;
- DNR header stripping.

# Worker Fanout — isolated generation / recovery / output checkpoint

Date: 2026-08-09 JST
Updated: 2026-08-09 19:12 JST
Status: **v0.4.4 FANOUT LIVE PASS / v0.4.5 IMAGE RECOVERY LIVE PASS / v0.4.6 OUTPUT PERMISSION FAIL / v0.4.7 PROVISIONAL STATIC / PRIOR-ART REVIEW COMPLETE**

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

Current manifest version: `0.4.7`.

Important: v0.4.7 was patched before the dedicated prior-art review requested after the v0.4.6 live failure. Its permission-recovery direction matches Chrome's documented pattern, but treat the current code as **provisional** until the permission preflight is aligned with the reviewed prior art.

## Architecture rule retained

Preserve live-proven paths. Patch only the layer for which new failure evidence exists, and search existing implementations before adding a new browser/filesystem mechanism.

Implementation lookup:

- `research/reference/2026-08-09-extension-reuse-inventory.md`
- `research/reference/2026-08-09-autogpt-0.0.71-internal-structure-map.md`
- `research/audits/2026-08-09-autogpt-0.0.71-deep-architecture-analysis.md`
- `research/decisions/2026-08-09-autogpt-stripped-clone-current.md`

Output-directory prior art:

- `research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md`

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

The persisted directory handle still existed. The missing operation was a user-gesture permission grant when permission had returned to `prompt`.

The three v0.4.6 images were not lost. They remained in the proven v0.4.5 staging directory under Downloads.

## v0.4.7 — provisional permission reauthorization patch

A local patch was made before the dedicated prior-art review.

Changed:

- `output_directory_store.js`
  - adds `requestWritePermission(handle)`;
- `popup.js`
  - keeps the selected handle available in popup memory;
  - detects `PERMISSION_REQUIRED` / non-granted permission;
  - changes the button label to `保存先を再許可して保存`;
  - on user click, calls `requestPermission({mode:"readwrite"})` on the existing handle;
  - after grant, renews the output-directory metadata revision.
- `manifest.json`
  - version `0.4.7`.
- `tests/test_output_directory.js`
  - static contract checks for the reauthorization path.

Unchanged:

- `background.js`;
- `image_collector.js`;
- `output_relocator.js`;
- `chatgpt_adapter.js`;
- `prompt_stacker_runner.js`;
- `runtime_guard.js`;
- `content.js`.

The core idea is not novel: the later prior-art review confirms that stored handle + `queryPermission` / `requestPermission` is Chrome's documented pattern.

However, the current v0.4.7 UX waits until post-generation relocation has already reached `PERMISSION_REQUIRED`. The prior-art review suggests a better ordering before the next live test.

## Prior-art review — completed before further implementation

Record:

`research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md`

### Confirmed existing solutions

#### Chrome / VS Code Web

Preferred browser-only pattern:

```text
showDirectoryPicker({mode:"readwrite"})
-> persist FileSystemDirectoryHandle in IndexedDB
-> later queryPermission({mode:"readwrite"})
-> if needed requestPermission({mode:"readwrite"}) from user gesture
-> write with File System Access API
```

Chrome documentation explicitly uses VS Code Web as a mature real-world example of persisted FileSystem handles.

#### `chrome.downloads`

Cannot silently target an arbitrary absolute directory. Its filename is Downloads-relative, so it remains appropriate for v0.4.5 staging/fallback but is not the custom-directory solution.

#### `idb-keyval`

Mature tiny IndexedDB helper and used in Chrome's sample, but not automatically adopted because Worker Fanout has no bundler and stores only one directory record.

#### GoogleChromeLabs `browser-fs-access`

Useful open/save/fallback wrapper, but does not replace MYGPT's persistent selected-directory + permission-resume lifecycle. Do not add the dependency for current Chromium-only scope.

#### `native-file-system-adapter`

Broader ponyfill/adapter. Useful for portability, but unnecessary for current Vivaldi/Chromium native File System Access scope.

#### AutoGPT / Autojourney

The supplied AutoGPT 0.0.71 uses `chrome.downloads.download` for browser downloads and has output URL/gallery plumbing. It does not provide a reusable arbitrary-directory permission module.

Autojourney's separate Pro Downloader is prior art for another architecture:

```text
extension -> desktop downloader -> native filesystem
```

Do not add a separate desktop dependency while the browser-only standard solution remains viable.

## Next implementation action — reuse official ordering, not another custom mechanism

Before another live run, change only the permission acquisition ordering:

```text
user presses Run
-> custom folder selected?
   -> no: continue existing v0.4.5/default flow
   -> yes: verify write permission immediately
       -> granted: start existing fanout
       -> prompt: request permission while Run user gesture is available
       -> denied/error: do not start generation
-> existing v0.4.4 fanout
-> existing v0.4.5 recovery
-> existing relocation/write/verify
```

Keep the existing post-run `PERMISSION_REQUIRED` state as a defensive fallback if permission changes/revokes during a long run.

This preflight ordering follows the editor/IDE-style permission model and prevents a full generation cycle from finishing before discovering that the selected destination is not writable.

### No additional dependency unless evidence requires it

Do not add:
- `browser-fs-access`;
- `native-file-system-adapter`;
- `idb-keyval` bundling;
- native desktop Downloader;

for this fix unless a concrete need appears that the current Chromium native API cannot satisfy.

## Important limitation of the failed v0.4.6 run

Installing/reloading a new extension version clears the MV3 `chrome.storage.session` runtime used by the current run. A new version cannot retroactively resume the already-finished v0.4.6 runtime after extension reload.

For the already-recovered v0.4.6 images, keep or manually move the three files under `Downloads/MYGPT-Worker-Fanout/`.

## Live acceptance after permission-preflight alignment

Do not spend another generation run testing the provisional reactive-only ordering first.

After the permission preflight is aligned:

1. replace/reload the unpacked extension;
2. reload the source Custom GPT tab;
3. select the intended output folder;
4. press Run;
5. if write permission is not already granted, the popup must resolve it **before worker generation starts**;
6. if permission is denied, no F2/F3/F4 generation should start;
7. if granted, require three-slot generation `COMPLETE`;
8. require `Recovery: COMPLETE`;
9. require `Output: COMPLETE`;
10. require F2/F3/F4 `output=COMPLETE/<filename>`;
11. verify the selected directory contains all three outputs;
12. verify temporary Downloads copies are removed only after destination verification.

## Next main research topic after selected-folder acceptance

Return to **image-difference analysis**.

Do not expand Worker Fanout further unless the selected-folder acceptance exposes another concrete output-layer failure.

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
- v0.4.7 reactive permission patch: provisional static implementation;
- existing-solutions / prior-art review: complete;
- next Worker Fanout action: align permission preflight with Chrome/VS Code pattern before another live run;
- next main topic after acceptance: image differences.

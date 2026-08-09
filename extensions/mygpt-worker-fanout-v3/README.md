# MYGPT Worker Fanout v4

Status: **v0.4.4 fanout LIVE PASS / v0.4.5 image recovery LIVE PASS / v0.4.6 selected-folder permission FAIL / v0.4.7 reactive fix PROVISIONAL STATIC**

Current source:

```text
extensions/mygpt-worker-fanout-v3/
```

Current manifest version: `0.4.7`.

Important: after the v0.4.6 permission failure, a dedicated existing-solutions review was performed before further implementation. The current v0.4.7 code contains a reactive reauthorization path, but **do not spend another generation run testing that ordering first**. The next implementation action is to align permission acquisition with the Chrome/VS Code preflight pattern described below.

Prior-art record:
- `research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md`

## Proven generation and recovery boundary

The following path is live-proven and must not be redesigned without new failing evidence:

```text
open F2 only
-> 15 s OPEN_WAIT
-> AutoGPT DataTransfer attachment
-> 15 s ATTACH_WAIT
-> MAIN-world slot paste
-> Translation Loop native click
-> positive submit evidence
-> 5 s COOLDOWN
-> open F3
-> same
-> open F4
-> passive generation completion monitoring
-> v0.4.5 image recovery
```

`background.js` owns the proven fanout. `image_collector.js` owns the proven generated-image recovery. Both remain unchanged in v0.4.7.

### v0.4.4 — isolated fanout LIVE PASS

All F2/F3/F4 slots reached `COMPLETE` in one live run.

Frozen / near-frozen mechanisms:

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

### v0.4.5 — image recovery LIVE PASS

After all generation slots complete, `image_collector.js`:

1. inspects the latest assistant turn in each worker;
2. chooses the generated-image candidate;
3. saves through `chrome.downloads` under `Downloads/MYGPT-Worker-Fanout/`;
4. tracks actual browser-download completion;
5. records `imageRecovery.status = COMPLETE` only after the download completes.

The F2/F3/F4 generation-to-download path is live-proven.

## Selected output folder layer

The selected-folder feature remains a separate layer after v0.4.5.

Default mode:

```text
Downloads/MYGPT-Worker-Fanout/
```

Selected-folder components:

- `output_directory_store.js` — persists `FileSystemDirectoryHandle` in IndexedDB and manages permission checks;
- `output_relocator.js` — copies recovered image bytes to the selected directory, verifies exact byte size, then removes the temporary Downloads file;
- `popup.js` — folder selection and permission UI.

`output_relocator.js` is unchanged between v0.4.6 and v0.4.7.

## v0.4.6 live result — permission FAIL isolated

The first selected-folder live run produced:

```text
Phase: COMPLETE / COOLDOWN | Recovery: COMPLETE | Output: PERMISSION_REQUIRED
F2: COMPLETE | image=COMPLETE/...F2.png | output=-
F3: COMPLETE | image=COMPLETE/...F3.png | output=-
F4: COMPLETE | image=COMPLETE/...F4.png | output=-
output OUTPUT_DIRECTORY_PERMISSION_REQUIRED: {"permission":"prompt"}
```

Interpretation:

- fanout succeeded;
- all three image generations succeeded;
- v0.4.5 download recovery succeeded;
- failure was isolated to selected-directory write permission;
- the persisted directory handle still existed, but current read/write permission was `prompt`;
- the three recovered files remained safely under `Downloads/MYGPT-Worker-Fanout/`.

## Existing-solutions review — completed

The filesystem/permission problem was checked against mature prior art before further patching.

### Preferred browser-only prior art — Chrome / VS Code Web

Standard lifecycle:

```text
showDirectoryPicker({mode:"readwrite"})
-> persist FileSystemDirectoryHandle in IndexedDB
-> later queryPermission({mode:"readwrite"})
-> if needed requestPermission({mode:"readwrite"}) from user gesture
-> write through File System Access API
```

This is the pattern to reuse. A persisted handle is not treated as permanently authorized.

### Other candidates checked

- `chrome.downloads`
  - suitable for the proven Downloads-relative staging path;
  - not an arbitrary absolute-folder mechanism.
- `idb-keyval`
  - mature tiny IndexedDB helper used by Chrome examples;
  - not introduced yet because this extension has no bundler and stores one directory record.
- GoogleChromeLabs `browser-fs-access`
  - mature open/save/fallback wrapper;
  - not a drop-in replacement for persistent selected-directory permission/resume state.
- `native-file-system-adapter`
  - broader ponyfill/portability layer;
  - unnecessary for the current Chromium/Vivaldi target.
- AutoGPT 0.0.71
  - its browser-side `downloadImage` uses `chrome.downloads.download`;
  - it has output URL/gallery plumbing but no audited arbitrary-directory permission module to transplant.
- Autojourney Pro Downloader
  - separate desktop companion that escapes browser download limitations;
  - not adopted while the browser-native File System Access solution remains viable.

Do not add a third-party filesystem dependency unless a concrete browser limitation requires it.

## v0.4.7 — current reactive permission patch

The existing v0.4.7 code adds:

```text
Output: PERMISSION_REQUIRED
-> popup: 保存先を再許可して保存
-> user click
-> existing handle.requestPermission({mode:"readwrite"})
-> metadata revision update
-> unchanged output_relocator.js resumes
```

This mechanism matches the standard permission API, but the **timing is provisional** because permission is discovered only after generation/recovery has already finished.

## Next implementation action — permission preflight on Run

Before another live generation test, align the ordering to an editor/IDE-style permission preflight:

```text
user presses Run
-> custom folder selected?
   -> no: continue existing default flow
   -> yes: verify write permission immediately
       -> granted: start fanout
       -> prompt: request permission while Run user gesture is available
       -> denied/error: do not start generation
-> existing v0.4.4 fanout
-> existing v0.4.5 recovery
-> existing relocation/write/verify
```

Keep the reactive `PERMISSION_REQUIRED` path as a defensive fallback if permission changes while a long run is active.

Do **not** modify for this change:
- `background.js` fanout sequencing;
- attachment;
- paste;
- submit activation/evidence;
- completion monitoring;
- `image_collector.js`;
- `output_relocator.js` write/size-verification logic unless a new failure occurs there.

## Selected-folder integrity rules

These remain unchanged:

- no selected directory -> default Downloads staging remains valid;
- existing destination names are not overwritten; collision names are uniquified;
- written file size must exactly match source bytes;
- temporary default-Downloads copy is removed only after destination verification;
- no silent redirect to a different directory after an explicitly selected directory fails;
- no new browser download is started by `output_relocator.js`.

## Live acceptance after preflight alignment

1. reload the updated unpacked extension;
2. reload the source Custom GPT tab;
3. select a test output folder;
4. press Run;
5. if write permission is not granted, resolve the permission prompt **before F2/F3/F4 starts**;
6. if permission is denied, no worker generation starts;
7. if granted, require generation `COMPLETE` and `Recovery: COMPLETE`;
8. require `Output: COMPLETE`;
9. require F2/F3/F4 `output=COMPLETE/<filename>`;
10. verify all three files exist in the selected folder;
11. verify temporary Downloads copies are removed only after successful destination verification.

After selected-folder acceptance, stop Worker Fanout feature expansion and return to the planned image-difference analysis.

## Static contract currently present in v0.4.7

`tests/test_output_directory.js` requires:

- manifest `0.4.7`;
- selected-folder picker uses read/write mode;
- popup contains `PERMISSION_REQUIRED` recovery logic;
- popup exposes `保存先を再許可して保存`;
- `output_directory_store.js` exposes `requestWritePermission()`;
- existing `output_relocator.js` still performs write, size verification and cleanup without starting another browser download.

This test must be extended for Run-time permission preflight when that change is implemented.

## External/product layers intentionally absent

- Google Analytics;
- membership/entitlement;
- external prompt services;
- imgbb;
- Autojourney services;
- unrelated provider adapters;
- Bearer capture;
- direct internal conversation polling;
- DNR header stripping;

# MYGPT Worker Fanout v4

Status: **v0.4.4 fanout LIVE PASS / v0.4.5 image recovery LIVE PASS / v0.4.6 selected-folder permission recovery FAIL / v0.4.7 fix STATIC candidate**

Current source:

```text
extensions/mygpt-worker-fanout-v3/
```

Current manifest version: `0.4.7`.

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

The selected-folder feature is deliberately layered after v0.4.5.

Default mode remains:

```text
Downloads/MYGPT-Worker-Fanout/
```

Selected-folder mode uses:

- `output_directory_store.js` — persists `FileSystemDirectoryHandle` in IndexedDB and manages permission checks;
- `output_relocator.js` — copies recovered image bytes to the selected directory, verifies exact byte size, then removes the temporary Downloads file;
- `popup.js` — folder selection and permission-recovery UI.

`output_relocator.js` is unchanged between v0.4.6 and v0.4.7.

## v0.4.6 live result — permission recovery FAIL

The first selected-folder live run on 2026-08-09 produced:

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
- failure was isolated to the selected-directory write permission;
- the persisted directory handle still existed, but `queryPermission({mode:"readwrite"})` returned `prompt`;
- the service worker cannot itself satisfy a permission prompt that requires a user gesture.

The original three images remained safely present in `Downloads/MYGPT-Worker-Fanout/` because relocation never reached verified completion.

## v0.4.7 — user-gesture permission recovery

v0.4.7 fixes only the missing permission-recovery path.

When the selected folder is still known but permission is no longer `granted`:

```text
Output: PERMISSION_REQUIRED
        ↓
popup button becomes
保存先を再許可して保存
        ↓
user click
        ↓
existing FileSystemDirectoryHandle.requestPermission({mode:"readwrite"})
        ↓
permission granted
        ↓
output-directory metadata revision is renewed
        ↓
existing output_relocator.js observes the metadata change
        ↓
F2/F3/F4 relocation resumes
        ↓
write -> size verify -> temporary Downloads removal
```

The user does not need to choose a different directory merely because permission returned to `prompt`.

If the user actually wants a different folder while permission is already valid, the same control displays `保存先フォルダを変更` and opens `showDirectoryPicker()`.

### Why this interaction is required

File System Access directory handles can be stored in IndexedDB, but write permission is not guaranteed to remain granted. When permission must be requested again, `requestPermission()` must be triggered from a user interaction. Therefore a background service worker may detect `prompt`, but it cannot replace the popup click that grants access.

## Selected-folder integrity rules

These remain unchanged:

- no selected directory -> `Output: DEFAULT_DOWNLOADS`;
- existing destination names are not overwritten; `name (1).ext`, `name (2).ext`, etc. are used;
- written file size must exactly match the source bytes;
- temporary default-Downloads copy is removed only after destination verification;
- no silent fallback to another directory after an explicitly selected directory fails;
- no new `chrome.downloads.download()` is added to `output_relocator.js`.

## v0.4.7 live acceptance

After replacing/reloading the unpacked extension:

1. reload the source Custom GPT tab because extension reload invalidates old content-script contexts;
2. choose a test output folder;
3. run normal F2/F3/F4 fanout;
4. require generation `COMPLETE` and `Recovery: COMPLETE`;
5. if `Output: PERMISSION_REQUIRED` appears, reopen the popup and click `保存先を再許可して保存`;
6. grant write permission in the browser prompt;
7. require `Output: COMPLETE`;
8. require F2/F3/F4 `output=COMPLETE/<filename>`;
9. verify the three files exist and open in the selected folder;
10. verify temporary `Downloads/MYGPT-Worker-Fanout/` copies are removed only after successful relocation.

A permission-recovery click is acceptable behavior when Chromium has returned the stored handle to `prompt`; automatic background prompting is not treated as an acceptance requirement.

## Static contract

`tests/test_output_directory.js` now requires:

- manifest `0.4.7`;
- selected-folder picker remains read/write;
- popup contains `PERMISSION_REQUIRED` recovery logic;
- popup exposes `保存先を再許可して保存`;
- `output_directory_store.js` exposes `requestWritePermission()`;
- existing `output_relocator.js` still performs write, size verification and cleanup without starting another browser download.

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

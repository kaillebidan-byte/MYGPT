# Selectable output directory — browser prior-art / reuse audit

Date: 2026-08-09 JST
Status: **PRIOR-ART REVIEW COMPLETE / IMPLEMENTATION DECISION INPUT**

## Why this exists

Worker Fanout v0.4.6 reached:

```text
Generation: COMPLETE
Recovery: COMPLETE
Output: PERMISSION_REQUIRED
permission: prompt
```

Before adding more custom code, this note checks whether existing browser implementations, mature applications, libraries, or already-audited extensions provide a reusable solution for persistent user-selected output directories.

The rule for this investigation is:

> Reuse a proven implementation or pattern before inventing a new filesystem/permission mechanism.

This is an output-layer investigation only. It does not reopen the v0.4.4 fanout or v0.4.5 image-recovery architecture.

---

## 1. Browser constraint — `chrome.downloads` cannot target an arbitrary absolute folder

Primary source:
- Chrome Extensions `chrome.downloads` API
- https://developer.chrome.com/docs/extensions/reference/api/downloads

Confirmed behavior:
- `DownloadOptions.filename` is a path **relative to the user's Downloads directory**.
- absolute paths are invalid.
- `saveAs: true` can show a chooser for each download, but that is not a persistent arbitrary output-directory target for unattended F2/F3/F4 recovery.

Implication:
- v0.4.5's `Downloads/MYGPT-Worker-Fanout/` path is the natural browser-download baseline.
- an arbitrary user-selected directory requires either File System Access or an external/native helper.

Do not keep searching for a hidden `chrome.downloads` absolute-path option.

---

## 2. Strongest browser-only prior art — Chrome official File System Access pattern

Primary source:
- Chrome for Developers — File System Access API
- https://developer.chrome.com/docs/capabilities/web-apis/file-system-access

The official pattern directly matches the requirement:

1. obtain a `FileSystemDirectoryHandle` with `showDirectoryPicker()`;
2. use `{ mode: "readwrite" }` when write access is required;
3. store the handle in IndexedDB because FileSystem handles are serializable;
4. on later use, call `queryPermission({mode:"readwrite"})`;
5. if not granted, call `requestPermission({mode:"readwrite"})` from a user gesture;
6. write through the handle (`getFileHandle(..., {create:true})` / `createWritable()`).

Chrome's own sample uses a helper equivalent to:

```text
queryPermission
-> granted: proceed
-> otherwise requestPermission
-> granted: proceed
-> otherwise fail/ask user
```

This is not a MYGPT-specific invention. It is the documented browser permission lifecycle.

### Important operational lesson

Permission requests are user-mediated and need a user gesture. Therefore a service worker can observe that permission is `prompt`, but it should not be the component expected to silently grant it.

A visible popup/user action should own permission acquisition.

---

## 3. Real-world mature example — VS Code Web

Primary source:
- Chrome for Developers — Persistent permissions for the File System Access API
- https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api

Chrome uses VS Code Web as the concrete real-world example.

Documented behavior:
- VS Code stores `FileSystemHandle` objects in IndexedDB;
- Chrome identifies the DB/store as `vscode-web-db` / `vscode-filehandles-store`;
- when a stored handle is reused after permission is no longer active, the application calls `FileSystemHandle.requestPermission()`;
- modern Chromium can offer persistent permission behavior, but applications must still implement the stored-handle + permission-request lifecycle.

MYGPT implication:
- IndexedDB persistence of the directory handle is correct prior art;
- receiving `permission: "prompt"` after later reuse is a normal state that must be handled;
- the output layer should model itself after an editor's open/save permission preflight rather than assume a stored handle equals a permanently authorized handle.

---

## 4. `idb-keyval` — reusable persistence helper, but optional for MYGPT

Primary project:
- https://github.com/jakearchibald/idb-keyval

Chrome's File System Access documentation itself uses `idb-keyval` in its handle-persistence example for brevity.

Advantages:
- mature tiny promise-based IndexedDB key/value helper;
- supports structured-clonable values, which covers FileSystem handles in supporting browsers;
- removes hand-written `IDBRequest` / transaction boilerplate.

Why it is **not automatically adopted** here:
- Worker Fanout currently has no npm/bundler dependency pipeline;
- it stores only one small directory record;
- vendoring/building a third-party package may add more packaging surface than the small amount of IndexedDB code it replaces.

Reuse verdict:
- reuse the **official persistence pattern** now;
- consider `idb-keyval` only if the extension later gains more IndexedDB state or a bundling step.
- do not introduce a dependency solely to save a few lines.

---

## 5. GoogleChromeLabs `browser-fs-access`

Primary project:
- https://github.com/GoogleChromeLabs/browser-fs-access
- Apache-2.0

What it already solves:
- feature detection;
- `fileOpen` / `directoryOpen` / `fileSave` wrappers;
- File System Access API with legacy fallback;
- picker `id` and `startIn` options;
- write mode for directory opening;
- used by applications including Excalidraw / SVGcode.

Why it is **not a drop-in solution for this bug**:
- its public API is centered on open/save picker operations and fallback behavior;
- MYGPT's missing lifecycle is specifically: keep one chosen directory handle across runs, query its later write permission, re-request permission when it becomes `prompt`, then let a background relocation layer continue;
- importing the entire library would not remove the project-specific persisted-handle/runtime-resume logic.

Reuse verdict:
- useful reference implementation;
- do not add as a dependency for the current Chromium/Vivaldi-only requirement;
- reconsider only if cross-browser fallback becomes a requirement.

---

## 6. `native-file-system-adapter`

Primary project:
- https://github.com/jimmywarting/native-file-system-adapter
- MIT

What it solves:
- a broad File System Access API ponyfill/adapter layer;
- native and fallback filesystem backends;
- wider portability and filesystem abstraction.

Why it is not preferred now:
- substantially broader than the single selected-directory requirement;
- does not remove the native permission lifecycle for a real user-visible local directory;
- MYGPT currently targets Vivaldi/Chromium where the native File System Access API already exists.

Reuse verdict:
- not needed for current scope;
- candidate only if portability to browsers without native File System Access becomes a real requirement.

---

## 7. Existing AutoGPT 0.0.71 source — useful output acquisition, not arbitrary-folder permission management

Repository evidence already captured in:
- `research/reference/2026-08-09-autogpt-0.0.71-internal-structure-map.md`
- `research/audits/2026-08-09-autogpt-0.0.71-deep-architecture-analysis.md`

Actual supplied AutoGPT 0.0.71 architecture:
- service worker `downloadImage` uses `chrome.downloads.download`;
- page runtime has gallery/download plumbing;
- it can resolve ChatGPT image file/download metadata;
- it contains broader product download/output systems.

This solves **finding and initiating image downloads**, not persistent access to an arbitrary OS directory from the extension.

Therefore there is no audited AutoGPT folder-permission module that should replace the File System Access lifecycle.

### Autojourney's other solution: external Pro Downloader

Product documentation:
- https://autojourney.ai/en/downloader
- Autojourney changelog documents a separate Downloader client and extension-controlled downloader folders.

Architecture:

```text
browser extension
-> external desktop Downloader
-> native filesystem / organized folders
```

This deliberately escapes browser download limitations.

Why MYGPT does not adopt it by default:
- requires a separate desktop application/process;
- adds another trust/deployment/update boundary;
- Autojourney's downloader is a product dependency rather than a small reusable browser primitive;
- current MYGPT requirement can be satisfied browser-only by the standard File System Access pattern.

Reuse verdict:
- strong prior art for the *native companion* alternative;
- only reconsider if browser-only File System Access proves unreliable in the user's Vivaldi environment.

---

## 8. Architecture comparison

| Candidate | Arbitrary directory | Persistent handle | Handles re-permission | Extra runtime/dependency | Verdict |
|---|---|---|---|---|---|
| `chrome.downloads` | No, Downloads-relative | n/a | n/a | none | keep as proven staging fallback |
| Chrome/VS Code File System Access | Yes | Yes, IndexedDB | Yes, `queryPermission/requestPermission` | none | **preferred** |
| `idb-keyval` | persistence helper only | Yes | No permission policy by itself | small JS dependency | optional |
| `browser-fs-access` | Yes via picker | not the project lifecycle by itself | not the full MYGPT resume policy | JS dependency | reference, not drop-in |
| `native-file-system-adapter` | Yes | adapter-dependent | native permissions still matter | larger abstraction | overkill now |
| AutoGPT browser download | Downloads-oriented | n/a | n/a | existing product runtime | not the folder fix |
| Autojourney Pro Downloader | Yes through desktop app | native app owns it | native app owns it | external desktop app | fallback architecture only |

---

## 9. Recommended reuse architecture for MYGPT

Do not replace v0.4.5.

Use the proven browser-download layer as staging/fallback, and implement selected-directory output using the **Chrome official / VS Code Web pattern**:

```text
popup user action
  -> selected FileSystemDirectoryHandle
  -> IndexedDB

before a run that intends custom-folder output
  -> query write permission
  -> if needed, request write permission while user gesture is available
  -> only then start the long F2/F3/F4 run

v0.4.5 recovery COMPLETE
  -> existing relocation/write/verify layer
  -> destination verified
  -> delete temporary Downloads copy
```

### Why preflight permission before generation

The v0.4.6 failure discovered permission only after all three generation/recovery jobs were finished.

A more mature editor-style flow is:

```text
Run click
-> verify selected output directory permission
-> if prompt: request now
-> if denied: do not start generation
-> if granted: start existing fanout
```

This uses the Run click itself as the user gesture and avoids wasting a full generation cycle before discovering that the destination cannot be written.

Retain the post-run `PERMISSION_REQUIRED` state as a defensive fallback in case permission is revoked/changes while the run is active.

---

## 10. Decision boundary

### Reuse directly

- Chrome's stored-handle + `queryPermission/requestPermission` lifecycle;
- VS Code Web's IndexedDB persisted-handle architecture;
- v0.4.5 `chrome.downloads` staging fallback;
- existing v0.4.6 relocation byte-write/size-verification layer if live evidence does not disprove it.

### Do not add yet

- `browser-fs-access` dependency;
- `native-file-system-adapter` dependency;
- external Downloader/native helper;
- bundler only for `idb-keyval`.

### Next implementation action

Before another live test, refactor the permission acquisition to a single official-style helper and preflight it from the popup Run user gesture.

Do not alter:
- fanout sequencing;
- attachment;
- paste;
- submit;
- completion monitoring;
- v0.4.5 image collector;
- relocation/write verification unless a new failure points there.

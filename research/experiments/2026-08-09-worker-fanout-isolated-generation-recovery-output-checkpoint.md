# Worker Orchestrator — isolated generation / recovery / output checkpoint

Date: 2026-08-09 JST
Updated: 2026-08-09 19:43 JST
Status: **v0.4.4 FANOUT LIVE PASS / v0.4.5 IMAGE RECOVERY LIVE PASS / v0.4.6 OUTPUT PERMISSION FAIL ISOLATED / v0.5.0 SELECTED-FOLDER LIVE PASS**

## Purpose

This is the current operational checkpoint for the browser worker side project. Prefer this file over older v2/v3/v0.4.x candidate notes when current behavior differs.

Current worker:

```text
MYGPT Single Frame Worker Test
/g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
```

Current extension source on `main`:

```text
extensions/mygpt-worker-fanout-v3/
```

Current display/version:

```text
MYGPT Worker Orchestrator v5
0.5.0
```

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

Near-frozen:
- one-worker-at-a-time preparation
- `OPEN_SETTLE_MS = 15000`
- AutoGPT `DataTransfer -> input.files -> change`
- bounded attachment retry
- `ATTACH_SETTLE_MS = 15000`
- MAIN-world synthetic paste
- observer-before-trigger ordering
- Translation Loop native click
- Enter fallback disabled
- positive submit evidence
- `SLOT_COOLDOWN_MS = 5000`
- runToken / stale async guard
- passive completion monitoring

## v0.4.5 — image recovery LIVE PASS

`image_collector.js` is the proven recovery baseline:

1. wait for all generation slots to complete
2. inspect each latest assistant turn
3. choose the generated-image candidate
4. save through `chrome.downloads` under `Downloads/MYGPT-Worker-Fanout/`
5. observe actual browser-download completion
6. mark recovery complete only after the browser download reaches `complete`

The full generation-to-image-download path passed live testing.

## v0.4.6 — selected-folder permission failure isolated

Observed user log:

```text
Phase: COMPLETE / COOLDOWN | Recovery: COMPLETE | Output: PERMISSION_REQUIRED
F2 image=COMPLETE/...F2.png | output=-
F3 image=COMPLETE/...F3.png | output=-
F4 image=COMPLETE/...F4.png | output=-
output OUTPUT_DIRECTORY_PERMISSION_REQUIRED: {"permission":"prompt"}
```

Confirmed separation:
- fanout PASS
- attachment PASS
- submit PASS
- generation completion PASS
- image recovery/download PASS
- selected-directory relocation did not start because write permission was `prompt`

The three images were not lost and remained in the proven Downloads staging path.

## Existing-solutions review

Before further implementation, the selected-folder problem was checked against mature prior art.

Preferred browser-only pattern:

```text
showDirectoryPicker({mode:"readwrite"})
-> persist FileSystemDirectoryHandle in IndexedDB
-> later queryPermission({mode:"readwrite"})
-> if needed requestPermission({mode:"readwrite"}) from user gesture
-> write through File System Access API
```

Chrome documentation uses VS Code Web as a real-world persisted-handle example.

Checked but not adopted wholesale:
- `chrome.downloads` — Downloads-relative staging only
- `idb-keyval` — unnecessary for one small record/no bundler
- GoogleChromeLabs `browser-fs-access` — useful wrapper, not a drop-in permission-resume solution
- `native-file-system-adapter` — broader portability layer than currently needed
- AutoGPT 0.0.71 — image download/output plumbing but no arbitrary-directory permission module to transplant
- Autojourney Pro Downloader — separate desktop companion, not needed while browser-native path works

## v0.5.0 — selected-folder LIVE PASS

v0.5.0 introduced only a new orchestration boundary and Run-time permission preflight around the proven engine.

Selected-directory ordering:

```text
user presses Run
-> queryPermission({mode:"readwrite"})
-> if needed requestPermission({mode:"readwrite"}) during Run user gesture
-> granted: start existing fresh-chat fanout
-> existing recovery
-> existing output relocation / exact byte-size verification
```

The post-run `PERMISSION_REQUIRED` path remains as a defensive fallback if permission changes during a long run.

### Live result

User confirmation on 2026-08-09:
- test run succeeded
- generated images were recovered
- selected-folder saving succeeded
- files were confirmed present in the selected output directory

Therefore:
- selected-folder successful path: **LIVE PASS**
- KI-004 successful baseline: **RESOLVED in v0.5.0**
- v0.5.0 promoted from `worker-orchestrator-v5` to `main` through PR #10

### Unchanged proven core

The v0.5.0 change did not redesign:
- `background.js`
- `image_collector.js`
- `output_relocator.js`
- attachment
- paste
- native send
- submit evidence
- completion monitoring

## Session strategy boundary

v0.5.0 adds `session_strategy.js`.

`fresh-chat`:
- supported
- LIVE PASS
- routes to `MYGPT_V4_RUN_THREE`

`branch-thinking`:
- reserved only
- `supported:false`
- no Branch automation in v0.5.0

Future Branch work should add a separate session engine rather than modify the proven fresh-chat engine in place.

## Remaining defensive edge cases

Not yet separately exercised:
- explicit permission denial before Run and confirmation that zero workers start
- permission revocation during an already-running generation

These are test gaps, not blockers for the accepted successful selected-folder path.

## Current stopping point

- isolated worker fanout: live proven
- generation completion monitoring: live proven
- automatic image recovery: live proven
- selected custom output directory: live proven in v0.5.0
- v0.5.0 is on `main`
- Branch/Thinking strategy: reserved, not implemented

## NEXT

Return to the paused **image-difference analysis**.

Do not expand output-folder functionality further without new failing evidence. Keep Branch/Thinking deferred unless explicitly reprioritized.

# MYGPT Worker Orchestrator v5

Branch: `worker-orchestrator-v5`

Status: **v0.5.0 STATIC CANDIDATE / LIVE PENDING**

This branch starts a new orchestration line while preserving the live-proven v0.4.x generation/recovery engine.

## Why v5 exists

The v0.4.x line proved:

- v0.4.4 fresh isolated F2/F3/F4 fanout: LIVE PASS;
- v0.4.5 generated-image recovery to browser Downloads: LIVE PASS;
- v0.4.6 selected-directory attempt isolated a permission-lifecycle failure after successful recovery.

Before further patching, existing solutions were reviewed. The selected-folder design now follows the Chrome / VS Code Web File System Access lifecycle recorded in:

- `research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md`

v5 also creates an explicit session-strategy boundary so future Branch/Thinking work does not have to be inserted into the proven fresh-chat state machine.

## Current session strategies

`session_strategy.js` defines:

### `fresh-chat`

Status: **SUPPORTED / CURRENT**

Routes to the existing proven `MYGPT_V4_RUN_THREE` engine.

Execution remains:

```text
fresh isolated Custom GPT F2
-> attach canonical
-> paste F2 only
-> native send
-> positive submit evidence
-> cooldown
-> fresh isolated Custom GPT F3
-> same
-> fresh isolated Custom GPT F4
-> passive completion monitoring
-> existing image recovery
```

### `branch-thinking`

Status: **RESERVED / NOT IMPLEMENTED**

Intended future lifecycle:

```text
Instant preparation session
-> establish required conversation state without image generation
-> Branch in new chat
-> verify branch context / Custom GPT identity
-> switch branch to Thinking
-> generate in branch
-> reuse the same completion/recovery/output layers
```

It is deliberately `supported: false` in v0.5.0 and cannot run accidentally.

## Proven primitives kept unchanged

The v5 branch does not change:

- `background.js` fresh-chat fanout sequencing;
- AutoGPT `DataTransfer -> input.files -> change` attachment;
- bounded attachment retry;
- MAIN-world synthetic paste;
- Translation Loop native click;
- observer-before-trigger ordering;
- positive submit evidence;
- runToken / stale-async guard;
- passive completion monitoring;
- `image_collector.js`;
- `output_relocator.js` write / verify / cleanup behavior.

The branch diff should be used to enforce this boundary.

## v5 output permission preflight

When no custom directory is selected:

```text
Run
-> existing fresh-chat fanout
-> existing recovery
-> Downloads/MYGPT-Worker-Fanout/
```

When a custom directory is selected:

```text
Run click
-> queryPermission({mode:"readwrite"})
-> if needed requestPermission({mode:"readwrite"}) while the user gesture exists
-> denied/error: abort before any worker is started
-> granted: publish selected-directory metadata
-> existing fresh-chat fanout
-> existing recovery
-> existing output relocation / byte-size verification
```

The older post-run `PERMISSION_REQUIRED` reauthorization path remains as a defensive fallback if permission changes during a long run.

## v0.5.0 live acceptance

1. load the unpacked extension from this branch;
2. reload the source Custom GPT tab;
3. select a writable test output folder;
4. if Chromium reports permission as `prompt`, press Run and grant permission;
5. confirm no worker opens before permission is granted;
6. require F2/F3/F4 generation `COMPLETE`;
7. require `Recovery: COMPLETE`;
8. require `Output: COMPLETE`;
9. require F2/F3/F4 `output=COMPLETE/<filename>`;
10. verify all three files exist in the selected directory;
11. verify temporary Downloads copies are removed only after destination verification;
12. deny permission in a separate test and confirm zero worker generations start.

After this passes, the selected-folder issue can be closed without further filesystem redesign.

## Future Branch/Thinking work

Do not alter the `fresh-chat` engine to implement Branch.

Add a separate session engine behind the strategy boundary. The future engine should own only:

- parent conversation preparation;
- branch creation/navigation;
- branch identity/context verification;
- model/reasoning selection;
- handoff to the existing attach/paste/send/monitor/recovery layers where compatible.

This keeps the proven fresh-chat path available as a fallback and makes A/B testing between session strategies possible.

## Static contract

`tests/test_output_directory.js` checks:

- manifest is `0.5.0` / `MYGPT Worker Orchestrator v5`;
- `fresh-chat` routes to the proven v4 run message;
- `branch-thinking` is present but unsupported;
- Run-time permission preflight exists;
- preflight occurs before the worker-start message in popup source order;
- existing selected-folder write / exact-size verify / cleanup path remains present.

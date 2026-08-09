# MYGPT Worker Orchestrator v5

Branch: `worker-orchestrator-v5`

Status: **v0.5.0 SELECTED-FOLDER LIVE PASS**

Live confirmation: 2026-08-09 JST. The user completed a normal F2/F3/F4 run and confirmed the generated images were saved in the selected output directory.

This line preserves the live-proven v0.4.x generation/recovery engine and adds a strategy boundary plus Run-time output-permission preflight.

## Proven boundary

- v0.4.4 fresh isolated F2/F3/F4 fanout: LIVE PASS
- v0.4.5 generated-image recovery: LIVE PASS
- v0.4.6 selected-directory post-run permission discovery: FAIL isolated
- v0.5.0 Run-time selected-directory preflight + final selected-folder save: LIVE PASS

Prior-art basis:
- `research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md`

## Current session strategies

### `fresh-chat`

Status: **SUPPORTED / LIVE PASS**

Routes to the existing proven `MYGPT_V4_RUN_THREE` engine:

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
-> selected-folder relocation when configured
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
-> reuse compatible completion/recovery/output layers
```

It remains `supported: false`; v0.5.0 cannot invoke it accidentally.

## Proven primitives kept unchanged

v0.5.0 does not modify:

- `background.js` fresh-chat fanout sequencing
- AutoGPT `DataTransfer -> input.files -> change` attachment
- bounded attachment retry
- MAIN-world synthetic paste
- Translation Loop native click
- observer-before-trigger ordering
- positive submit evidence
- runToken / stale-async guard
- passive completion monitoring
- `image_collector.js`
- `output_relocator.js` write / verify / cleanup behavior

## Output permission lifecycle

No custom directory:

```text
Run
-> existing fresh-chat fanout
-> existing recovery
-> Downloads/MYGPT-Worker-Fanout/
```

Custom directory:

```text
Run click
-> queryPermission({mode:"readwrite"})
-> if needed requestPermission({mode:"readwrite"}) while the user gesture exists
-> denied/error: abort before worker-start message
-> granted: publish selected-directory metadata
-> existing fresh-chat fanout
-> existing recovery
-> existing output relocation / byte-size verification
```

The older post-run `PERMISSION_REQUIRED` path remains as a defensive fallback if permission changes during a long run.

## v0.5.0 live result

Confirmed by the user:

- normal generation run completed successfully
- selected output-directory save completed successfully
- generated files were present in the selected directory

This closes the observed v0.4.6 failure for the successful selected-folder path.

Not yet separately exercised:
- explicit permission-denial test proving zero workers start after denial
- permission revocation during an already-running generation

Those are defensive edge cases, not blockers for the successful selected-folder baseline.

## Future Branch/Thinking work

Do not alter the proven `fresh-chat` engine to implement Branch.

Add a separate session engine behind the strategy boundary. That future engine should own only:

- parent conversation preparation
- branch creation/navigation
- branch identity/context verification
- model/reasoning selection
- handoff to existing attach/paste/send/monitor/recovery layers where compatible

This keeps fresh-chat available as a fallback and allows A/B testing between session strategies.

## Static contract

`tests/test_output_directory.js` checks:

- manifest is `0.5.0` / `MYGPT Worker Orchestrator v5`
- `fresh-chat` routes to the proven v4 run message
- `branch-thinking` exists but is unsupported
- Run-time permission preflight exists
- preflight occurs before the worker-start message in popup source order
- existing selected-folder write / exact-size verify / cleanup path remains present

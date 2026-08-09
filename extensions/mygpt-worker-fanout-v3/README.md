# MYGPT Worker Fanout v4

Status: **v0.4.4 STATIC PASS candidate — submit-gated sequential fanout live test pending**

Current architecture:

```text
Translation Loop control plane
        +
AutoGPT ChatGPT upload/paste/passive observer
        +
VoiceBridge-style lifecycle monitor
```

## v0.4.4 execution model

The previous v4 flow opened F2/F3/F4 tabs up front. v0.4.3 changes this to a persisted sequential state machine:

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

The 15-second waits exist only to absorb ChatGPT/Vivaldi UI timing around tab initialization and image attachment. Generation completion monitoring remains passive and never gates opening the next worker. Sequence waits are stored in runtime state and resumed by `chrome.alarms` (`mygpt-v4-sequence-step`). Worker tabs remain open for inspection.

## Reused components

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
- passive conversation fetch/WebSocket observation.

No Bearer capture or direct internal ChatGPT API calls are used.

### VoiceBridge 0.2.6

- long-lived monitor port;
- background scan ping;
- generation/turn-state observation;
- hidden/background-tab rescan model.

## Extension-context invalidation

A reloaded/updated extension invalidates old content-script contexts. v0.4.3 treats that as terminal for the old content instance: it clears reconnect/scan timers, disconnects the monitor port, disconnects the MutationObserver, removes route/page listeners, and does not reconnect.

For a clean live test after replacing the unpacked extension, Reset/close worker tabs from the previous version and reload the source Custom GPT tab before starting a new run.

## Runtime sequence

Per active slot:

`QUEUED -> OPENING -> OPEN_WAIT -> VERIFYING/STAGED -> ATTACHED -> ATTACH_WAIT -> SUBMITTING -> SUBMITTED/GENERATING -> COOLDOWN`

Then the next slot begins immediately after the cooldown; `SETTLING -> COMPLETE` may occur later in parallel and is informational only. Errors are slot-local and also pass through the cooldown before continuing.

## External/product layers intentionally absent

- Google Analytics;
- membership/entitlement;
- external prompt services;
- imgbb;
- Autojourney services;
- unrelated provider adapters;
- Bearer capture;
- direct internal conversation polling;
- automatic downloads;
- DNR header stripping.

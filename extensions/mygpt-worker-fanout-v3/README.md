# MYGPT Worker Fanout v4

Status: **v0.4.0 STATIC PASS candidate — full 3-worker submit/monitor live test pending**

This version stops treating READY as the end goal. It reuses the supplied extensions as an integrated worker system:

```text
Translation Loop control plane
        +
AutoGPT ChatGPT upload/paste/passive observer
        +
VoiceBridge-style long-lived monitoring
```

## One-click flow

1. active source tab must be the target Custom GPT;
2. derive and lock the Custom GPT worker identity;
3. open F2/F3/F4 tabs before inserting any draft;
4. verify each is the same worker and has no restored draft;
5. process each slot sequentially, temporarily making that worker tab active for Vivaldi reliability;
6. reconstruct and attach the same canonical with AutoGPT's `DataTransfer -> input.files -> change` path;
7. wait for upload activity to settle;
8. paste the slot packet in page MAIN world with AutoGPT's synthetic ClipboardEvent path;
9. use Translation Loop / Prompt Stacker to wait for an enabled composer-local send control;
10. arm the passive AutoGPT-style fetch observer with a per-slot nonce **before activation**;
11. use Translation Loop's ordinary native `button.click()` with Enter fallback disabled;
12. accept submit only with positive evidence from Translation Loop DOM evidence and/or passive conversation fetch evidence;
13. monitor all three tabs through VoiceBridge-style long-lived ports + 1-second scan pings + a Translation Loop-style alarm watchdog;
14. use Translation Loop terminal classification plus image-turn stability to mark each worker COMPLETE.

## Reused directly / strongly

### Translation Loop 0.5.1

- `runtime_guard.js` — direct reuse;
- `loop_core.js` — direct reuse of positive submission evidence;
- `terminal_gate.js` — direct reuse of terminal classification;
- `prompt_stacker_runner.js` — direct substantial reuse including run controller, bounded waits, composer-local send discovery and native click;
- `background.js` patterns — content probe/reinject, bounded waits, watchdog, centralized state/log handling;
- `content.js` patterns — visible generation signals, role-node extraction, fingerprints, action-bar/thinking checks.

Prompt Stacker-derived code remains under `LICENSE-PROMPT-STACKER`.

### AutoGPT 0.0.71

- page MAIN-world ChatGPT adapter;
- file upload primitive;
- synthetic paste primitive;
- observer-before-trigger nonce ordering;
- passive fetch clone/stream observation;
- passive `ws.chatgpt.com` observation.

No Bearer capture or active internal ChatGPT API calls are used.

### VoiceBridge 0.2.6

- long-lived content/background port;
- reconnect loop;
- 1-second background scan ping;
- hidden/background-tab rescan model;
- generation and turn-state observation.

Speech/local-service transport is not included.

## Vivaldi handling

The three tabs are still isolated conversations. During upload/paste/send only the currently processed worker is temporarily made active; all tabs are opened before any draft is inserted. This avoids hidden-tab DOM/upload stalls without merging worker contexts.

## Runtime phases

Per-slot:

`QUEUED -> OPENING -> VERIFYING -> STAGED -> PREPARING -> SUBMITTING -> SUBMITTED/GENERATING -> SETTLING -> COMPLETE`

Overall:

`PREPARING -> MONITORING -> COMPLETE`

Partial failures become `PARTIAL_MONITORING` / `PARTIAL_COMPLETE` rather than destroying completed workers.

## External/product layers intentionally absent

- Google Analytics;
- membership/entitlement;
- Autojourney services;
- external prompt export/translation;
- imgbb;
- unrelated provider adapters;
- Bearer capture;
- direct internal conversation polling;
- download automation;
- DNR header stripping.

## Live test

1. disable/reload older Worker Fanout versions;
2. load this directory unpacked;
3. open `MYGPT Single Frame Worker Test` as the active source tab;
4. select the canonical image;
5. put the actual F2/F3/F4 static-state packets in the three textareas;
6. click `F2/F3/F4を隔離生成` once;
7. expect each slot to show `native-click` plus a submit proof such as `autogpt-fetch-commit`, `autogpt-fetch-request`, or `translation-loop-dom`;
8. generation continues in isolated tabs and each slot should eventually become `COMPLETE`.

The source tab is restored after all three submits are attempted.

# Worker Fanout — existing extension reuse inventory

Date: 2026-08-09 JST
Status: **CURRENT IMPLEMENTATION REFERENCE**

Purpose: finish the browser-extension orchestration quickly by reusing the supplied extensions instead of repeatedly reimplementing already-tested behavior. Consult this file before writing a new browser/DOM/state mechanism.

Primary rule:

> Search Translation Loop / AutoGPT / VoiceBridge first. Reuse existing code where it already solves the problem. Write new code only for MYGPT-specific adaptation or a genuinely missing gap.

Current target architecture:

```text
Translation Loop control plane
        +
stripped AutoGPT ChatGPT adapter
        +
VoiceBridge lifecycle / hidden-tab observation
```

---

## 1. Executive reuse map

| Capability | Preferred source | Reuse level | MYGPT adaptation |
|---|---|---|---|
| serialized runtime mutation | Translation Loop `runtime_guard.js` | direct | storage keys/state shape only |
| run token / stale async rejection | Translation Loop `runtime_guard.js` | direct | none beyond state fields |
| bounded wait / cancellation | Translation Loop `prompt_stacker_runner.js` | direct | selectors if ChatGPT DOM changes |
| composer discovery | Translation Loop `prompt_stacker_runner.js` / `content.js` | direct | Custom GPT route only |
| send-button discovery + enabled-state check | Translation Loop `prompt_stacker_runner.js` | direct | none unless selector drift |
| native send click | Translation Loop `prompt_stacker_runner.js` | direct | disable Enter fallback by default |
| prompt submission evidence | Translation Loop `loop_core.js` | direct/adapt | combine with AutoGPT passive fetch commit evidence |
| generation start/end DOM observation | Translation Loop / VoiceBridge | direct | none or selector drift only |
| assistant-terminal classification | Translation Loop `terminal_gate.js` | direct | image-generation completion may add passive WS evidence |
| watchdog / content-script reinjection | Translation Loop `background.js` | strong reuse | owner model becomes F2/F3/F4 slots |
| debug log serialization | Translation Loop `background.js` / storage | direct | names/state fields |
| runtime/settings/log persistence | Translation Loop `prompt_stacker_storage.js` | direct/adapt | session/local choice for Worker Fanout |
| fresh conversation verification | Translation Loop `rotation_verification.js` | adapt | replace project membership with Custom GPT worker identity |
| Custom GPT route identity | Worker Fanout `route_adapter.js` | keep current | already adapted |
| file attachment | AutoGPT ChatGPT adapter | strong/direct | remove unrelated product layers |
| ChatGPT synthetic paste | AutoGPT ChatGPT adapter | strong/direct | run in MAIN world |
| image-mode switching | AutoGPT ChatGPT adapter | strong/direct | only if worker needs explicit image mode |
| new chat click | AutoGPT | strong/direct | Custom GPT worker root/fresh conversation semantics |
| observer-before-submit nonce | AutoGPT | strong/direct | correlate with Translation Loop runToken/slot |
| passive conversation fetch commit observation | AutoGPT | strong/direct | no Bearer capture required |
| passive `ws.chatgpt.com` async observation | AutoGPT | strong/direct | correlate slot/conversation |
| bounded rate-limit/backpressure | AutoGPT | strong/adapt | integrate into Worker Fanout state |
| long-lived port + scan ping | VoiceBridge | direct/adapt | remove speech transport |
| hidden-tab completion handling | VoiceBridge | strong reuse | use for Vivaldi evidence/fallback |
| visibility/focus shim | AutoGPT | optional | only if empirical background stalls remain |
| GA/membership/external prompt services | AutoGPT | remove | none |

---

# 2. Translation Loop 0.5.1 — primary reuse source

Translation Loop is user-owned and was explicitly supplied for substantial reuse. Its existing implementation should be preferred over newly invented equivalents.

Source root:

`research/temp-extension-sources/translation-loop-0.5.1-extracted/`

Manifest capabilities already match the problem well:

- MV3;
- `storage`;
- `tabs`;
- `scripting`;
- `alarms`;
- ChatGPT host permissions;
- background service worker;
- content script with loop core, terminal gate, Prompt Stacker runner and page logic.

## 2.1 `runtime_guard.js` — reuse directly

Source SHA: `ed7427a8dcb6b495d753aeda804233c621be5533`

Exports `createRuntimeGuard(options)`.

Already provides:

- serialized `mutationChain`;
- `enqueue(task)`;
- `mutate(mutator)`;
- `mutateIfToken(token, mutator)`;
- `isCurrent(token)`;
- `newToken` using supplied token factory;
- stale-run rejection before committing state;
- clone-before-mutation behavior.

Worker Fanout use:

- keep one orchestrator runToken;
- make slot state changes go through the guard;
- reject late F2/F3/F4 async callbacks after Reset/new run;
- serialize tab lifecycle, submit evidence and completion evidence.

Do **not** build another mutex/state queue.

## 2.2 `prompt_stacker_runner.js` — reuse the full runner, not only fragments

Source SHA: `434fe1b3dfb981f58b58f610fe2641f6a524d75d`

This is adapted from Prompt Stacker and already carries its MIT license.

Important reusable API/behavior:

### Runner lifecycle

- `createRunController()`;
- `start()`;
- `pause()`;
- `resume()`;
- `stop()`;
- generation counter invalidates old waits after Stop/Start;
- `canRun(expectedGeneration)`.

### Bounded waits

- `waitFor(test, options)`;
- timeout;
- interval;
- controller cancellation;
- generation-token cancellation;
- pause handling.

### Editor discovery

Default editor selectors include:

- `#prompt-textarea`;
- ChatGPT textarea variants;
- `.ProseMirror`;
- contenteditable textbox variants.

### Send-control discovery

`getSendButton(editor)` searches composer-local roots first:

- enclosing `form`;
- composer test-id/class roots;
- nearby parents;

Then uses only strong ChatGPT-specific selectors globally.

`enabledCandidate()` rejects:

- native `disabled`;
- `aria-disabled="true"`;
- `data-disabled="true"`.

This is better than a one-shot `querySelector` and should be reused whole.

### Prompt insertion fallback

Runner already handles:

- textarea native `value` setter + `input` event;
- input native setter;
- contenteditable selection + `execCommand("insertText")`;
- fallback `textContent`;
- reflected-text verification.

For Worker Fanout, AutoGPT synthetic paste remains the preferred ChatGPT-specific insertion path, but this runner is a tested fallback and useful for ordinary text controls.

### Controlled send

`clickSend()` already implements:

1. resolved enabled send button;
2. ordinary `button.click()`;
3. optional Enter fallback.

`submit()` already implements the correct sequencing:

1. runner must be active;
2. wait for editor;
3. reject existing draft;
4. write prompt;
5. verify reflection;
6. optional `beforeActivate` hook;
7. wait for enabled send button because React may lag;
8. activate;
9. wait for positive post-submit verifier;
10. return activation + evidence.

For Worker Fanout controlled submit:

- reuse this sequencing;
- set `allowEnterFallback: false` initially;
- when AutoGPT synthetic paste has already filled the composer, either adapt `submit()` into an activate-existing-draft path or reuse its button-wait/click/verification pieces directly;
- do not write another sender from scratch.

## 2.3 `loop_core.js` — positive submission evidence is directly reusable

Source SHA: `9f45858d926ee3293172d5e68836f132cc5558e9`

`evaluateSubmissionEvidence(prompt, before, after, options)` already combines several independent signals:

- user-message count increased;
- latest user turn changed;
- latest user text matches prompt;
- generation started;
- conversation was created;
- URL changed to a new conversation during rotation;
- composer-cleared state is recorded.

Its `committed` result is intentionally based on positive observable state rather than merely assuming a click worked.

Worker Fanout adaptation:

- retain DOM evidence;
- add AutoGPT passive fetch evidence (`conversation POST` commit/conversation id) as an additional strong signal;
- correlate evidence with slot/runToken/nonce;
- never use `button.click()` return alone as submit success.

Also reusable:

- `normalizeText()`;
- `endsWithCompletionMarker()` if future phase markers remain useful;
- `evaluateChatLimit()` if bounded per-worker cycles are needed.

## 2.4 `terminal_gate.js` — reuse for assistant completion classification

Source SHA: `f2939880c048b816434b32f142441e30bf27afe7`

`classifyTerminal(previous, sample, config)` combines:

- content fingerprint stability;
- stop button absent;
- finished action bar visible;
- no active strong-thinking indicator;
- N stable confirmation cycles;
- minimum stable duration.

Fallback mode additionally uses:

- generation ended timestamp;
- post-generation delay;
- text-stable delay.

Proof labels already distinguish:

- `oracle-action-bar`;
- `voicebridge-fallback`.

Worker Fanout use:

- reuse for textual assistant completion/status messages;
- for image workers, combine this with AutoGPT passive WebSocket/fetch image completion rather than replacing it;
- the gate is useful as DOM confirmation after network-side completion.

## 2.5 `content.js` — large amount of reusable monitoring logic

This file already combines Translation Loop + VoiceBridge ideas.

High-value sections to reuse/adapt:

### Selector sets

- input selectors;
- send-button selectors;
- global strong send selectors;
- stop-button selectors;
- finished assistant action selectors.

### Visibility filtering

`isVisible(node)` checks:

- display;
- visibility;
- opacity;
- non-zero layout rectangle.

### Generation monitoring

`generationIsActive()` uses visible stop controls rather than merely DOM existence.

### Conversation/turn extraction

- role node discovery;
- duplicate nested-role filtering;
- turn container resolution;
- message/turn key extraction;
- assistant/user node collection.

### Fingerprinting/dedupe

- normalized text;
- FNV-style text hash;
- per-turn state map;
- processed/in-flight fingerprints.

### Assistant finalization

- action-bar visibility;
- active-thinking detection;
- stability sampling;
- baseline existing messages so old answers are not mistaken for new output;
- arm/disarm lifecycle;
- generation-start/generation-end handling;
- timeout protection.

### Fail-closed behavior

`reportError()` disables the content run, disarms, clears sending state, nulls run token and stops the runner before reporting failure.

This is a good model for each Worker Fanout slot.

### Important adaptation

Project-specific URL logic inside this file (`g-p-...`) must **not** be carried unchanged. Keep the monitoring code and replace project identity with current `MYGPTWorkerRoute` Custom GPT identity.

## 2.6 `background.js` — orchestration patterns to reuse strongly

The Translation Loop background is much more mature than current Worker Fanout state plumbing.

High-value mechanisms:

### Runtime state model

Already tracks:

- enabled;
- phase;
- runToken;
- ownerTabId;
- current/previous conversation id;
- generation/chat counters;
- last assistant fingerprint;
- last completion/submit times;
- pending submission nonce;
- rotation nonce;
- watchdog failures;
- last error.

For Worker Fanout, generalize `ownerTabId` into slot ownership (`F2/F3/F4`) rather than redesigning the lifecycle concepts.

### Settings bounds

Uses explicit clamps for delays/timeouts/cycles. Reuse the bounded configuration style.

### Content-script readiness

`ensureContentScript(tabId)`:

1. sends a probe;
2. if unavailable, injects required scripts with `chrome.scripting.executeScript`;
3. retries the probe up to a bounded count (20 × 150 ms);
4. throws if still unavailable.

This is directly relevant to Worker Fanout and is stronger than assuming document_idle injection is already ready.

### Serialized logs

- `logWriteChain` prevents concurrent log writes racing;
- bounded log count (`LOG_LIMIT=300`);
- timestamp/tab/url/details structure.

Reuse for short-lived Worker Fanout diagnostics until production stabilizes.

### Watchdog

Uses `chrome.alarms` for scan watchdog and rotation timeout. This is useful for MV3 service-worker suspension/revival and long image generations.

### Central error transition

`enterError(...)` performs a guarded state transition, clears alarms, logs, and tells owned content to stop. Reuse the pattern rather than each call site inventing cleanup.

### Nonce/correlation

`pendingSubmissionNonce` and `rotationNonce` already solve ambiguous async submission/route changes. Slot submit should adopt this idea directly.

## 2.7 `prompt_stacker_storage.js` — reuse/adapt

Source SHA: `7fc3146dcfb4041ba794e693349f5f7475b1deb9`

Provides:

- local + sync settings mirror;
- revision timestamp conflict choice;
- local fallback if sync unavailable;
- cached settings;
- runtime read/write;
- log read/write/clear;
- cloned values to avoid accidental shared mutation.

Worker Fanout likely does not need synced settings, but the store abstraction itself is reusable. Recommended adaptation:

- canonical/file payload: `storage.local` or external File reference as appropriate;
- ephemeral runtime: `storage.session` where practical;
- debug history/settings: `storage.local`;
- do not create ad-hoc storage calls throughout background/popup/content.

## 2.8 `rotation_verification.js` — adapt the generic verification pattern

Source SHA: `daf74fe5867ccf9c9744c3bbeca3c795f9c497a8`

Useful generic mechanisms:

- serialized verification chain;
- required new conversation id;
- idempotent already-verified path;
- owner/enabled checks;
- phase checks;
- nonce checks;
- previous-vs-new conversation id check;
- persist verified-at metadata;
- verify saved state actually contains the expected nonce/conversation after mutation;
- central failure dependency.

Project-specific membership validation must be replaced by Custom GPT worker identity validation.

Use this pattern when ensuring each F2/F3/F4 is truly a fresh isolated conversation.

## 2.9 `url_core.js` — only partially reusable

Source SHA: `0b0237267a4737b51c4a22ce125d660e9383981a`

Reusable unchanged:

- ChatGPT host parsing idea;
- conversation-id extraction.

Do not reuse unchanged:

- `g-p-...` project route parsing;
- project landing URL normalization;
- project membership validation.

Current Worker Fanout `route_adapter.js` is the correct Custom GPT replacement.

---

# 3. AutoGPT 0.0.71 — ChatGPT execution adapter

Detailed reference:

- `research/reference/2026-08-09-autogpt-0.0.71-internal-structure-map.md`
- `research/audits/2026-08-09-autogpt-0.0.71-deep-architecture-analysis.md`

Current decision:

- `research/decisions/2026-08-09-autogpt-stripped-clone-current.md`

AutoGPT should supply the **ChatGPT-specific page execution path**, not the overall Worker Fanout control plane.

## Reuse strongly

- MAIN-world ChatGPT adapter model;
- unified composer resolution;
- image-mode switch when needed;
- `DataTransfer -> input.files -> change` upload;
- current file input re-resolution after React remount;
- synthetic paste to `#prompt-textarea p` in MAIN world;
- visible new-chat operation;
- nonce + observer-before-trigger sequencing;
- passive fetch clone/stream observation;
- passive `ws.chatgpt.com` `conversation-update` observation;
- image asset-pointer recognition;
- bounded rate-limit/backpressure behavior.

## Keep optional, only if required

- visibility/focus compatibility shim;
- Bearer capture;
- direct internal conversation rescue polling;
- file-download metadata lookup;
- automatic output download.

## Remove from stripped clone

- Google Analytics;
- membership/entitlement;
- account/email export;
- external prompt translation/optimization;
- imgbb/unrelated uploads;
- unrelated providers;
- marketing/gallery product plumbing.

Important implementation lesson from current live work:

Do not reproduce AutoGPT mechanics approximately while changing execution world or sequence. If a proven AutoGPT ChatGPT mechanism is selected, port the relevant unit with its page-world assumptions intact.

---

# 4. VoiceBridge 0.2.6 — lifecycle and Vivaldi reliability source

Source root:

`research/temp-extension-sources/voicebridge-0.2.6-extracted/`

Manifest itself is small (`storage`, ChatGPT hosts, background + content), making its browser-monitoring pieces easy to transplant independently of speech functionality.

## 4.1 `content.js` — reuse strongly

Useful existing mechanisms:

- SPA URL/path tracking;
- generation start/end detection;
- per-turn text/hash state;
- baseline existing assistant turns;
- arm/disarm with TTL;
- stable-text timer;
- post-generation settle timer;
- hidden-tab branch;
- MutationObserver/local rescan behavior;
- long-lived monitor port connection;
- reconnect after port disconnect;
- explicit external `scan-now` handling;
- dedupe by conversation/turn/hash.

Crucial empirical behavior encoded in the extension:

> In hidden tabs ChatGPT can finish generation while final DOM text is not yet fully reflected; completion can be observed first and content recovered after the tab becomes visible.

Worker Fanout should not assume hidden-tab DOM rendering is equivalent to foreground rendering.

## 4.2 `background.js` — reuse monitor infrastructure

Useful existing mechanisms:

- `chrome.runtime.onConnect` port registry keyed by tab/frame;
- content port liveness;
- periodic 1-second `scan-now` pings while ports exist;
- automatic stop when no ports remain;
- content state acknowledgements;
- bounded dedupe map;
- serialized debug-log writes.

Remove:

- local speech endpoint/token;
- speech POST transport;
- speech-specific status/messages.

Whether the 1-second ping is ultimately necessary should be decided empirically in Vivaldi; do not delete it merely for architectural neatness if it fixes hidden/background stalls.

---

# 5. Recommended ownership by subsystem

## Orchestrator/background

Use Translation Loop as the base:

- state model;
- runtime guard;
- runToken;
- slot ownership;
- nonce;
- error transition;
- watchdog;
- content readiness;
- logging;
- bounded waits/timeouts.

Do not base orchestration on AutoGPT's product runtime unless a feature specifically requires it.

## Page execution

Use stripped AutoGPT ChatGPT adapter:

- fresh chat/new-chat action;
- canonical attachment;
- image mode;
- prompt paste;
- trigger send;
- passive network observation.

## DOM lifecycle confirmation

Use Translation Loop + VoiceBridge:

- send-control readiness;
- generation start/end;
- assistant turn discovery;
- DOM completion gate;
- route/lifecycle observation;
- hidden-tab handling.

---

# 6. Next implementation — minimum-new-code plan

The current work should stop iterating on custom READY predicates. Build the next version by composing proven modules.

Recommended sequence:

1. **Keep current three-slot tab staging / Custom GPT identity adapter.**
2. **Replace current ad-hoc control flow with Translation Loop runtime/state patterns where practical.**
3. **Use AutoGPT attachment implementation as the attachment action.**
4. **Use AutoGPT MAIN-world synthetic paste as the prompt action.**
5. **Reuse Translation Loop send-button wait + native click.**
6. Before click, arm:
   - Translation Loop before/after DOM snapshot;
   - AutoGPT passive fetch observer with slot nonce.
7. Submit with `allowEnterFallback:false` initially.
8. Accept commit from a combination of:
   - Translation Loop DOM submission evidence;
   - AutoGPT passive conversation commit evidence.
9. After submit, monitor completion with:
   - AutoGPT passive WS/fetch image completion;
   - VoiceBridge/Translation Loop generation start/end and DOM terminal confirmation.
10. Add visibility/focus shim only if background-tab tests still show Vivaldi stalls after the monitor path is reused.

This path deliberately avoids inventing another upload-ready detector, sender, generation detector, watchdog, or state serializer.

---

# 7. Reuse priority

## Priority A — use now

- Translation Loop `runtime_guard.js`;
- Translation Loop `prompt_stacker_runner.js` send discovery/wait/click;
- Translation Loop `loop_core.js` submission evidence;
- Translation Loop content generation/turn monitoring;
- AutoGPT file upload;
- AutoGPT MAIN-world paste;
- AutoGPT new-chat;
- AutoGPT passive fetch observer;
- AutoGPT passive WebSocket observer;
- current Custom GPT `route_adapter.js`.

## Priority B — use for hardening immediately after first controlled submit PASS

- Translation Loop watchdog/alarms;
- Translation Loop storage abstraction/logging;
- Translation Loop terminal gate;
- VoiceBridge long-lived ports/reconnect/scan ping;
- VoiceBridge hidden-tab deferred handling;
- adapted rotation/fresh-conversation verification.

## Priority C — requirement driven

- AutoGPT visibility/focus shim;
- AutoGPT internal conversation rescue polling;
- AutoGPT internal file URL resolution/download;
- rate-limit orchestration beyond basic bounded retries.

## Do not port

- AutoGPT GA;
- membership/account export;
- external prompt services;
- unrelated provider adapters;
- VoiceBridge speech transport;
- Translation Loop project-specific `g-p-...` route assumptions.

---

# 8. Practical decision rule

When implementing a Worker Fanout feature:

1. look for the mechanism in Translation Loop;
2. look for ChatGPT-specific page execution in AutoGPT;
3. look for browser lifecycle/hidden-tab behavior in VoiceBridge;
4. reuse the strongest existing implementation;
5. only write MYGPT-specific glue around it.

A working/tested supplied implementation is stronger evidence than a speculative cleaner redesign. Changes from the source implementation should have a concrete reason: Custom GPT route difference, observed live failure, incompatible state model, licensing requirement, or an explicitly unwanted external/product dependency.

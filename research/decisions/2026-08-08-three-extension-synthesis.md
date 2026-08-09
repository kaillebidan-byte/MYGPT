# N3 synthesis — AutoGPT + VoiceBridge + Translation Loop

Date: 2026-08-08 JST
Revised: 2026-08-09 18:36 JST
Status: **HISTORICAL DECISION / SUPERSEDED IN IMPLEMENTATION DETAIL**

## Supersession

This document established the important direction that `MYGPT Worker Fanout` should reuse the user's already-working extension code rather than reimplement browser/control mechanisms from scratch.

That high-level three-source architecture remains valid:

```text
Translation Loop control plane
        +
AutoGPT ChatGPT-specific browser primitives / observation
        +
VoiceBridge lifecycle / hidden-tab observation
```

However, the implementation boundary described here is no longer CURRENT.

In particular, this document's earlier rule that AutoGPT should contribute mainly visible-UI primitives and that fetch/response observation should be excluded broadly was superseded after the supplied AutoGPT 0.0.71 archive was deeply traced.

CURRENT sources, in order:

1. `research/PROJECT-HANDOFF.md`
2. `research/reference/2026-08-09-extension-reuse-inventory.md`
3. `research/reference/2026-08-09-autogpt-0.0.71-internal-structure-map.md`
4. `research/audits/2026-08-09-autogpt-0.0.71-deep-architecture-analysis.md`
5. `research/decisions/2026-08-09-autogpt-stripped-clone-current.md`
6. `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md`

Do not use this document's old Gate sequence or AutoGPT exclusion list as the current implementation specification.

---

## Historical decision that remains useful

Build a dedicated `MYGPT Worker Fanout` primarily by **reusing proven implementation assets**.

### Translation Loop 0.5.1

The historical decision correctly identified Translation Loop as the primary control-plane source.

Reusable mechanisms that later remained central:
- `runtime_guard.js`;
- runToken / stale async rejection;
- serialized mutation;
- Prompt Stacker runner;
- composer-local send discovery;
- native click;
- positive submission evidence;
- bounded waits / cancellation;
- fail-closed state handling.

### VoiceBridge 0.2.6

The historical decision also correctly identified reusable lifecycle concepts:
- generic ChatGPT route / SPA observation;
- MutationObserver lifecycle monitoring;
- generation-state observation;
- long-lived content/background communication;
- hidden/background-tab rescan behavior useful in Vivaldi.

### AutoGPT 0.0.71

This document originally treated AutoGPT as the exception to direct reuse and focused on visible UI techniques:
- new-chat control;
- unified composer handling;
- `File` / `DataTransfer` attachment;
- visible send activation.

Later analysis showed that this was incomplete.

The supplied 0.0.71 build also contained separable, useful ChatGPT-specific mechanisms such as:
- synthetic paste in page MAIN world;
- observer-before-trigger nonce ordering;
- passive conversation fetch observation;
- passive `ws.chatgpt.com` async observation;
- bounded backpressure / retry concepts;
- output-resolution / download layers that can be evaluated separately.

Crucially, these are not the same thing as:
- Bearer capture;
- active private/internal API requests;
- telemetry;
- membership/account integration;
- unrelated provider/product code.

The current design evaluates each mechanism separately rather than excluding the entire network-observation class.

---

## Engineering rule retained

The most important durable rule from this decision is still:

> reuse before reinvention.

Before implementing a browser / DOM / state primitive from scratch:
1. check Translation Loop;
2. check AutoGPT;
3. check VoiceBridge;
4. only write MYGPT-specific code for a real gap or route/state adaptation.

Current lookup for that rule:
- `research/reference/2026-08-09-extension-reuse-inventory.md`

Do not replace a real-browser-proven mechanism merely for architectural neatness.

---

## What the later implementation proved

The old document described a future Gate sequence.
That sequence has since been overtaken by actual implementation and live testing.

Later proven results:
- Custom GPT route targeting: PASS;
- canonical attachment: PASS;
- MAIN-world packet paste: PASS;
- Translation Loop native-click submission: PASS;
- positive submit evidence: PASS;
- one-worker-at-a-time F2/F3/F4 fanout: PASS;
- passive completion monitoring: PASS;
- generated-image recovery: PASS.

Current extension:
- `extensions/mygpt-worker-fanout-v3/`

Current proven baselines:
- v0.4.4 fanout: LIVE PASS;
- v0.4.5 image recovery: LIVE PASS;
- v0.4.6 selectable output folder: STATIC PASS / LIVE PENDING.

---

## Historical-use rule

Keep this document for:
- why the project switched from one-extension selection to three-source synthesis;
- why Translation Loop became the control plane;
- why existing user-owned extension code was treated as an engineering asset;
- the origin of the `reuse before reinvention` rule.

For current coding or debugging, use the 2026-08-09 reference inventory and checkpoint instead.

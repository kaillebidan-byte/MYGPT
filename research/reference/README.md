# MYGPT implementation reference index

This directory is for implementation lookup material that should prevent repeated re-analysis of supplied extension archives.

**外部事例・中国語圏・論文・公開GPT・community prior artを探す場合はこのdirectoryではなく `research/SEARCH-INDEX.md` から入る。**

この `reference/` は、既に取得・解析した実装資産の内部構造や再利用箇所を探す入口。

## Worker Fanout reuse inventory — read first for implementation work

1. `research/reference/2026-08-09-extension-reuse-inventory.md`
   - Translation Loop / AutoGPT / VoiceBridge capability-by-capability reuse map;
   - exact Translation Loop modules worth reusing directly;
   - ownership split between control plane, ChatGPT page execution and lifecycle monitoring;
   - Priority A/B/C reuse order;
   - minimum-new-code plan for the next Worker Fanout implementation.

When about to implement a browser/state/DOM mechanism, consult this inventory before writing a replacement.

## AutoGPT 0.0.71

Read in this order:

1. `research/reference/2026-08-09-autogpt-0.0.71-internal-structure-map.md`
   - implementation dictionary;
   - file/world layout;
   - known function/class identifiers;
   - DOM selectors;
   - CustomEvent names;
   - timeouts/polling intervals;
   - internal endpoint roles;
   - `main.js` byte-offset locator table;
   - full ChatGPT image-task flow;
   - stripped-clone retain/remove map.

2. `research/audits/2026-08-09-autogpt-0.0.71-deep-architecture-analysis.md`
   - architectural interpretation;
   - mechanism-by-mechanism reuse analysis;
   - passive observation vs Bearer capture vs active private API separation;
   - rate-limit/retry reassessment;
   - telemetry/membership findings.

3. `research/audits/2026-08-08-autogpt-0.0.71-static-analysis.md`
   - earlier first-pass audit retained for history/evidence.

### Supersession rule

If older project documents say that AutoGPT should contribute only visible UI primitives or only clean-room DOM ideas, that conclusion is **superseded** by the 2026-08-09 deep analysis and internal structure map.

Current reuse direction:

- use a stripped ChatGPT-focused AutoGPT engine as a major implementation base;
- remove GA, membership/entitlement, external prompt/account services, imgbb/unrelated provider upload paths and unrelated product/provider UI;
- retain/adapt ChatGPT upload readiness, paste insertion, send nonce sequencing, passive fetch/WS observation and useful rate-limit/backpressure;
- combine with Translation Loop for orchestration/runToken/state ownership;
- combine with VoiceBridge for route/lifecycle/DOM diagnostics and Vivaldi background-tab behavior.

The original AutoGPT archive is not stored in the repository; the reference docs carry the derived implementation information needed for normal work.

## Lookup split

Use:
- `research/SEARCH-INDEX.md` — external existing examples / China-region / prior art / community implementations
- `research/reference/README.md` — already-acquired implementation internals / reuse map
- `research/PROJECT-HANDOFF.md` — CURRENT project state
- `research/KNOWN-ISSUES.md` — current failure/constraint index

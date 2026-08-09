# N3 — ChatGPT Plus orchestration friction / automation ceiling

Date: 2026-08-08 JST
Updated: 2026-08-09 18:36 JST
Status: **HISTORICAL RESEARCH / BROWSER-AUTOMATION FEASIBILITY PROVEN LATER**

## Current supersession

This file records the research path that reopened browser-side orchestration after an earlier official-only ceiling conclusion.

The key unresolved question in this document was originally:

> Can browser automation operate on a user-created Custom GPT `/g/...` while preserving isolated worker conversations?

That question is no longer unresolved.

Later live evidence:

- `MYGPT Worker Fanout v0.4.4` opened and drove isolated F2/F3/F4 conversations on the same Custom GPT and reached three-slot `COMPLETE`.
- `v0.4.5` then recovered and saved all three generated images successfully.
- `v0.4.6` adds selectable output-folder handling and is STATIC PASS / LIVE PENDING at the current checkpoint.

CURRENT source:
- `research/PROJECT-HANDOFF.md`
- `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md`
- `extensions/mygpt-worker-fanout-v3/README.md`

Therefore do **not** use this file's old `N3 stays open until Custom-GPT compatibility is tested` wording as the current project state.

What remains useful here is the prior-art and search evidence that justified reopening browser automation.

---

## Correction that remains valid

Earlier N3 wording overreached by treating the lack of an official built-in fan-out feature as the ceiling for every solution compatible with ChatGPT Plus.

That broad conclusion was withdrawn.

Correct distinction:

1. **Official in-product / no-extension path**
   - no documented bulk branch / multi-worker fan-out was found in the research pass;
   - manual Branch was a viable built-in isolation path.

2. **Community browser-extension / local browser-automation path**
   - not ruled out by the user's no-separate-API constraint;
   - existing Chinese/community tooling showed that logged-in ChatGPT web sessions could be browser-automated;
   - later MYGPT live tests proved this category viable for the target Custom GPT.

The important lesson is methodological:

> absence of an official built-in feature does not prove absence of a browser-side solution under the user's actual constraints.

---

## Why Custom GPT remained important

Custom GPT was retained not merely as a convenient route, but as the validated image-worker configuration and isolation container.

The target worker became:

```text
MYGPT Single Frame Worker Test
/g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
```

Current exact worker snapshot:
- `research/runtime/2026-08-08-single-frame-worker-live-snapshot.md`

Later Worker Fanout implementation confirmed that fresh isolated `/g/...` worker conversations can be created and driven directly, so the ordinary-Chat fallback explored here was not needed for the proven path.

---

## Chinese-language / community precedent A — OpenGPTs

`hzeyuan/OpenGPTS` was identified as Chinese browser-plugin prior art.

Its Chinese README described concepts including:
- browser-side ChatGPT / GPTs calls;
- `一键调用GPTs对话`;
- `多GPTs对话`;
- multiple chat windows;
- batch GPT/chat management;
- treating GPTs as agent-like units for automated workflows.

Limitations noted at the time:
- repository activity was old relative to the MYGPT test date;
- multimodal input was marked incomplete;
- RPA / Agent Workflow was not a production-ready answer for MYGPT.

Conclusion retained:

OpenGPTs itself was not the production solution, but it was evidence that browser-side multi-GPT / multi-conversation orchestration was a real solution category and did not inherently require separately billed OpenAI API calls.

---

## Chinese-language / community precedent B — Autojourney AutoGPT

Autojourney AutoGPT was the materially closer precedent.

The 2026-08-08 research pass found public product/changelog evidence for ChatGPT automation primitives including:
- batch prompt queues;
- automatic fresh-chat creation;
- send-task-in-new-chat behavior;
- image upload / image-to-image workflows;
- ChatGPT image-generation operation;
- generated-image link handling;
- retry behavior.

The Chinese changelog included examples such as:
- `2025-08-19 v0.0.21`: ChatGPT `自动新对话`;
- same release: `新对话发送`;
- image-to-image batch support;
- later fixes for ChatGPT image upload and image-mode changes.

At this research stage, public documentation did not prove user-created Custom GPT `/g/...` compatibility.
That missing proof was later supplied empirically by the user's installed AutoGPT test and then by the purpose-built Worker Fanout implementation.

The supplied AutoGPT `0.0.71` archive was subsequently deeply inspected. That later analysis supersedes the shallow visible-UI-only interpretation from this stage.

Current AutoGPT lookup:
- `research/reference/2026-08-09-autogpt-0.0.71-internal-structure-map.md`
- `research/audits/2026-08-09-autogpt-0.0.71-deep-architecture-analysis.md`
- `research/decisions/2026-08-09-autogpt-stripped-clone-current.md`

---

## Search / prior-art value of this document

Keep this file when investigating:
- browser automation precedents under a logged-in ChatGPT session;
- Chinese/community multi-GPT tooling;
- why N3 was reopened after an official-only search;
- why Custom GPT isolation was preserved while UI friction was automated.

External-search entrypoint:
- `research/SEARCH-INDEX.md`

Do not use this file as the CURRENT Worker Fanout implementation specification.

---

## Historical acceptance target and actual result

The old acceptance target required:
1. same Custom GPT in three separate conversations/tabs;
2. canonical attached independently;
3. worker identity preserved;
4. one local packet per worker;
5. no cross-packet contamination;
6. three independent image jobs;
7. no silent reuse of one conversation;
8. slot-local failure isolation;
9. no separately billed OpenAI API dependency.

The later v0.4.4 live run demonstrated the core target path:

```text
F2: COMPLETE | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=image-turn-stable
F3: COMPLETE | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=oracle-action-bar
F4: COMPLETE | attach=autogpt-upload+visible-attachment/attachment-marker@attempt-1 | send=native-click/translation-loop-dom | done=image-turn-stable
```

So the historical N3 verdict is now:

- official built-in bulk fan-out: no proven path from this research pass;
- browser-side Custom-GPT fan-out: **LIVE PROVEN**;
- generated-image recovery: **LIVE PROVEN**;
- selectable arbitrary output folder: current next acceptance item.

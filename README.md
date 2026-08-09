# MYGPT — Character Motion Production / Research

ChatGPT Plus上でcanonical character imageからモーション用keyposeを生成し、隔離workerでF2/F3/F4を独立生成し、Pythonでboard / stripへ決定論的に組み立てて監査するプロジェクト。

GitHub `main` を正本とする。古い実験記録や過去handoffより、CURRENT文書と最新decision/checkpointを優先する。

## Start here

1. `research/PROJECT-HANDOFF.md` — **現在地・次にやること・凍結済み方針**
2. `research/decisions/2026-08-09-identity-quality-closed-loop-direction.md` — **現在のidentity-quality方向**
3. `research/plans/2026-08-09-identity-quality-closed-loop-execution-plan.md` — **現在の実行順・gate・sample数・stop condition**
4. `research/experiments/2026-08-09-post-image-dialogue-audit-loop-reassessment.md` — **post-image dialogue / Actions再監査**
5. `research/KNOWN-ISSUES.md` — **既知不具合 / 制約 / 回避策 / 解決済み問題の索引**
6. `research/SEARCH-INDEX.md` — **既存例検索 / 中国語圏調査 / prior art / community browser automation / 公開GPT調査の入口**
7. `research/README.md` — **research全体の資料地図と読み順**
8. `extensions/mygpt-worker-fanout-v3/README.md` — **Worker Orchestrator現行実装**

実装内部を探す場合は `research/reference/README.md` から入る。
外部例を探す場合は `research/SEARCH-INDEX.md` から入る。

## CURRENT status — 2026-08-09

### Generation

**Production v0 generalized PASS**

- 1 canonical character
- F1 = canonical静止姿勢
- one-shot motion
- F2/F3/F4を独立したsingle-frame workerで生成
- front-facing baseline camera
- chroma background
- deterministic board / strip post-processing
- generated frameを次frameのidentity sourceにしない

Generation品質の正本:
- `research/decisions/2026-08-08-production-v0-generalized-verdict.md`

### Worker Orchestrator v0.5.0 — LIVE PASS

Current extension on `main`:
- `extensions/mygpt-worker-fanout-v3/`

Current proven boundary:
- **v0.4.4** — sequential isolated F2/F3/F4 fanout: LIVE PASS
- **v0.4.5** — generated-image recovery to default Downloads: LIVE PASS
- **v0.4.6** — selected-folder first live run: `PERMISSION_REQUIRED` FAIL isolated after successful recovery
- **v0.5.0** — Run-time selected-directory permission preflight + selected-folder save: LIVE PASS

User live confirmation on 2026-08-09:
- normal F2/F3/F4 test succeeded
- generated-image recovery succeeded
- final selected output directory save succeeded
- files were confirmed present in the selected directory

The successful v4 generation/recovery core remains unchanged. In particular, `background.js`, `image_collector.js`, `output_relocator.js`, attachment, paste, native send, submit evidence and completion monitoring were not redesigned for v0.5.0.

Operational checkpoint:
- `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md`

### Session strategy boundary

v0.5.0 strategies:
- `fresh-chat` — SUPPORTED / LIVE PASS
- `branch-thinking` — RESERVED / `supported:false`

Future Branch/Thinking work remains a separate session engine and must not be inserted into the proven fresh-chat state machine.

### NEW — post-image dialogue under Instant

User live evidence:
- under the tested **Instant** path, the dialogue model can resume after native image generation finishes.
- Thinking has not been verified for this behavior yet.

This reopens post-generation quality control inside a Custom GPT without requiring generation to be the terminal step.

Do not overclaim:
- post-image dialogue is live evidence;
- generated-image bytes automatically reaching Code Interpreter or Actions is **not** yet proven.

Detailed reassessment:
- `research/experiments/2026-08-09-post-image-dialogue-audit-loop-reassessment.md`

### CURRENT identity-quality direction — closed loop

Current decision:
- `research/decisions/2026-08-09-identity-quality-closed-loop-direction.md`

Current execution plan:
- `research/plans/2026-08-09-identity-quality-closed-loop-execution-plan.md`

Working architecture:

```text
ORIGINAL CANONICAL
+ one worker-local pose/structure condition
+ minimal local text
        |
        v
isolated generator
        |
        v
IMAGE_READY
        |
        v
post-image structured critic
        |
        +--> identity / pose / topology audit
        +--> optional narrow Action policy lookup
        +--> optional machine metric after image-file gate
        |
        v
ACCEPT / RETRY_REQUIRED
        |
        +--> ACCEPT: recover/finalize
        |
        +--> RETRY_REQUIRED:
              NEW isolated worker
              ORIGINAL canonical again
              failed local constraints only
```

Prior-art reuse before inventing new evaluation:
- DreamBench++ — GPT/VLM concept-preservation evaluation
- Beyond the Pixels — hierarchical feature-level identity comparison
- EditRefiner — perception/reasoning/action/evaluation loop
- MaSC — foreground-mask-based concept-preservation metric
- existing MYGPT chroma removal for foreground masks

The earlier identity candidates remain:
- `ID-V1` — canonical as edit/source image
- `ID-V2` — canonical + one local pose visual guide
- `ID-V4` — best-of-N isolated candidates
- `ID-V3` — optional canonical-derived detail crop

But they now run **after** the post-image runtime gate.

## CURRENT EXECUTION PLAN

The exact order, sample counts, PASS/FAIL criteria, retry caps and stop conditions are maintained in:

`research/plans/2026-08-09-identity-quality-closed-loop-execution-plan.md`

Current sequence:

1. Phase 0 — create a separate experimental audited Custom GPT; production worker remains unchanged.
2. Phase 1 / `POSTGEN-G1` — observe Instant post-image turn/tool/collector structure before any browser-code change.
3. Phase 2 / `ID-V1` — A/B current wording vs canonical edit/source wording across R1 and R2 stress classes; initial screen uses 2 independent candidates per condition per pose.
4. Phase 3 / `ID-V2` — only if pose conditioning remains a material failure source; add exactly one worker-local minimal visual pose guide.
5. Phase 4 — compare same-worker critic with an independent non-generating judge using existing candidates first.
6. Phase 5 — reuse MaSC / DreamBench++ only after image transport is proven.
7. Phase 6 — best-of-2 only as a hard-frame/failed-first-pass retry; initial cap is 2 candidates per slot before human escalation.
8. Phase 7 — optional single canonical-derived local detail crop only for persistent localized drift.
9. Phase 8 — Branch -> Thinking later as an execution-strategy comparison, not an identity-conditioning method.

### NEXT ONLY — `POSTGEN-G1`

Do not change Worker Orchestrator v0.5.0 code or the production worker before this runtime gate.

POSTGEN-G1 must determine:
- whether generated image and audit text live in the same assistant turn or separate turns;
- when the current terminal monitor marks COMPLETE;
- whether current `image_collector.js` still identifies/recover the correct generated image;
- whether a narrow read-only text/JSON Action can run after generation;
- optionally, whether Code Interpreter can access the generated image as a usable file.

Only evidence from this gate can justify a collector/state-machine patch.

## Source-of-truth order

1. `research/PROJECT-HANDOFF.md`
2. current execution plan when one is explicitly marked CURRENT
3. `research/KNOWN-ISSUES.md`
4. latest applicable `research/decisions/` and current checkpoint
5. related `research/experiments/` / `research/incidents/` / `research/audits/`
6. `research/SEARCH-INDEX.md` for external examples / prior art
7. `research/reference/README.md` and referenced implementation maps
8. historical `research/handoffs/`
9. frozen legacy assets only when comparison or reproductionに必要

`research/handoffs/` は履歴保存用。CURRENTを決める文書ではない。
`research/plans/` はhistorical planも含むが、**CURRENT EXECUTION PLANと明示された計画は実行順の正本**として扱う。

## Repository areas

- `extensions/` — browser automation実装
- `audit/scripts/` — chroma removal / compose / machine audit
- `research/decisions/` — 採用済み方針とsupersession
- `research/plans/` — gated execution plan / historical plans
- `research/experiments/` — PASS/FAIL実験記録とcheckpoints
- `research/incidents/` — 不具合・失敗原因の詳細記録
- `research/chatgpt-project-practices/` — Web検索台帳、Projects/imagegen調査、中国語圏調査、planner-worker既存例
- `research/prior-art/` — 論文・先行研究・browser implementation prior art
- `research/public-image-gpt-reuse/` — 公開画像生成GPTのhistorical調査
- `research/audits/` — source / architecture監査
- `research/reference/` — 再利用・検索用implementation map
- `research/runtime/` — 実機設定snapshot
- `research/handoffs/` — 過去チャット時点の引継ぎsnapshot

`research/**` はCONTROL / EVIDENCEであり、generation workerへそのまま露出しない。

## Maintenance rule

GitHub `main` は会話記憶より優先されるdurable stateである。実機PASS/FAIL、CURRENT architecture、既知不具合、検索上の重要発見、実装baseline、CURRENT execution planが変わった場合、ユーザーから毎回「GitHub更新」と明示されなくても、作業の区切りで関連する正本・索引・checkpointの整合を確認し、必要なものを同じ作業単位で更新する。

更新トリガー:
- CURRENT architecture / 次作業 / frozen boundary変更 → `research/PROJECT-HANDOFF.md`
- CURRENT execution sequence / gate / sample count / stop condition変更 → 該当CURRENT plan + `PROJECT-HANDOFF.md`
- 再発性bug・制約・workaround・解決状態変更 → `research/KNOWN-ISSUES.md`
- 実機PASS/FAIL・version acceptance・operational milestone変更 → 該当 `research/experiments/*checkpoint*.md` と必要なら extension README
- generation方式の本線・重要な棄却理由・実験遷移変更 → `research/MOTION-GENERATION-EXPERIMENT-LOG.md`
- 新しいdecisionまたは旧decisionの撤回 → `research/decisions/` と、古い文書側のsupersession表示
- 外部検索の新しい軸・既存例・中国語圏/community/prior-artの重要発見 → `research/SEARCH-INDEX.md` + `research/chatgpt-project-practices/search-ledger.md` または該当topic note
- 実装再利用・selector・内部構造・extension sourceの調査結果変更 → `research/reference/README.md` と該当reference/audit
- live Custom GPT / browser runtime設定変更 → `research/runtime/` の該当snapshot
- rootで見えるCURRENT statusまたは入口が変わる変更 → この `README.md`

運用ルール:
1. 詳細をindexへ重複コピーせず、詳細記録を1か所に置いてindex/handoffからリンクする。
2. 古いhandoff・incident・experimentは履歴として残し、後続証拠で結論が変わった場合は削除よりsupersessionを明示する。
3. `CURRENT` と書かれた文書が後続実機結果と衝突していないか、節目ごとに確認する。
4. 新しいWeb検索を始める前に `research/SEARCH-INDEX.md` と search ledgerを確認し、既調査の一般検索を無意味に繰り返さない。
5. source codeの成功済み経路は、文書整備のためだけには変更しない。
6. チャット終了時だけ更新するのではなく、実機acceptanceや設計判断が確定した時点でもdurable stateへ反映する。

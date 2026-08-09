# MYGPT — Character Motion Production / Research

ChatGPT Plus上でcanonical character imageからモーション用keyposeを生成し、隔離workerでF2/F3/F4を独立生成し、Pythonでboard / stripへ決定論的に組み立てて監査するプロジェクト。

GitHub `main` を正本とする。古い実験記録や過去handoffより、CURRENT文書と最新decision/checkpointを優先する。

## Start here

1. `research/PROJECT-HANDOFF.md` — **現在地・次にやること・凍結済み方針**
2. `research/KNOWN-ISSUES.md` — **既知不具合 / 制約 / 回避策 / 解決済み問題の索引**
3. `research/SEARCH-INDEX.md` — **既存例検索 / 中国語圏調査 / prior art / community browser automation / 公開GPT調査の入口**
4. `research/README.md` — **research全体の資料地図と読み順**
5. `extensions/mygpt-worker-fanout-v3/README.md` — **Worker Orchestrator現行実装**

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

v0.5.0 follows the reviewed Chrome / VS Code Web File System Access lifecycle:

```text
Run click
-> queryPermission({mode:"readwrite"})
-> if needed requestPermission({mode:"readwrite"}) while user gesture exists
-> granted: start proven fresh-chat fanout
-> recovery
-> verified relocation to selected directory
```

The successful v4 generation/recovery core remains unchanged. In particular, `background.js`, `image_collector.js`, `output_relocator.js`, attachment, paste, native send, submit evidence and completion monitoring were not redesigned for v0.5.0.

Prior-art record:
- `research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md`

Operational checkpoint:
- `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md`

### Session strategy boundary

v0.5.0 introduces an explicit session strategy registry:
- `fresh-chat` — SUPPORTED / LIVE PASS; routes to the proven v4 run engine
- `branch-thinking` — RESERVED / `supported:false`; future only

Future `Instant preparation -> Branch -> Thinking -> generation` work should be implemented as a separate session engine rather than by inserting a large conditional chain into the proven fresh-chat engine.

Architecture record:
- `research/plans/2026-08-09-worker-orchestrator-v5-architecture.md`

### Remaining edge cases

The successful selected-folder path is accepted. These defensive cases are not yet separately exercised:
- explicit permission denial before Run
- permission revocation during an active long run

They do not block the current successful selected-folder baseline.

## Next main topic

Worker output-folder development is closed for now after the v0.5.0 live pass.

Return to the paused **image-difference analysis**. Do not expand Branch/Thinking automation unless its priority is explicitly raised or new evidence requires it.

## Source-of-truth order

1. `research/PROJECT-HANDOFF.md`
2. `research/KNOWN-ISSUES.md`
3. latest applicable `research/decisions/` and current checkpoint
4. related `research/experiments/` / `research/incidents/` / `research/audits/`
5. `research/SEARCH-INDEX.md` for external examples / prior art
6. `research/reference/README.md` and referenced implementation maps
7. historical `research/handoffs/`
8. frozen legacy assets only when comparison or reproductionに必要

`research/handoffs/` は履歴保存用。CURRENTを決める文書ではない。
`research/plans/` は過去時点の計画を含むため、`CURRENT`表記が残っていても後続handoff/decision/checkpointと照合する。

## Repository areas

- `extensions/` — browser automation実装
- `audit/scripts/` — chroma removal / compose / machine audit
- `research/decisions/` — 採用済み方針とsupersession
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

GitHub `main` は会話記憶より優先されるdurable stateである。実機PASS/FAIL、CURRENT architecture、既知不具合、検索上の重要発見、実装baselineが変わった場合、ユーザーから毎回「GitHub更新」と明示されなくても、作業の区切りで関連する正本・索引・checkpointの整合を確認し、必要なものを同じ作業単位で更新する。

更新トリガー:
- CURRENT architecture / 次作業 / frozen boundary変更 → `research/PROJECT-HANDOFF.md`
- 再発性bug・制約・workaround・解決状態変更 → `research/KNOWN-ISSUES.md`
- 実機PASS/FAIL・version acceptance・operational milestone変更 → 該当 `research/experiments/*checkpoint*.md` と必要なら extension README
- generation方式の本線・重要な棄却理由・実験遷移変更 → `research/MOTION-GENERATION-EXPERIMENT-LOG.md`
- 新しいdecisionまたは旧decisionの撤回 → `research/decisions/` と、古い文書側のsupersession表示
- 外部検索の新しい軸・既存例・中国語圏/community/prior-artの重要発見 → `research/SEARCH-INDEX.md` + `research/chatgpt-project-practices/search-ledger.md` または該当topic note
- 実装再利用・selector・内部構造・extension sourceの調査結果変更 → `research/reference/README.md` と該当reference/audit
- live Custom GPT / browser runtime設定変更 → `research/runtime/` の該当snapshot
- rootで見えるCURRENT statusや入口が変わる変更 → この `README.md`

運用ルール:
1. 詳細をindexへ重複コピーせず、詳細記録を1か所に置いてindex/handoffからリンクする。
2. 古いhandoff・incident・experimentは履歴として残し、後続証拠で結論が変わった場合は削除よりsupersessionを明示する。
3. `CURRENT` と書かれた文書が後続実機結果と衝突していないか、節目ごとに確認する。
4. 新しいWeb検索を始める前に `research/SEARCH-INDEX.md` と search ledgerを確認し、既調査の一般検索を無意味に繰り返さない。
5. source codeの成功済み経路は、文書整備のためだけには変更しない。
6. チャット終了時だけ更新するのではなく、実機acceptanceや設計判断が確定した時点でもdurable stateへ反映する。

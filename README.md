# MYGPT — Character Motion Production / Research

ChatGPT Plus上でcanonical character imageからモーション用keyposeを生成し、隔離workerでF2/F3/F4を独立生成し、Pythonでboard / stripへ決定論的に組み立てて監査するプロジェクト。

GitHub `main` を正本とする。古い実験記録や過去handoffより、CURRENT文書と最新decision/checkpointを優先する。

## Start here

1. `research/PROJECT-HANDOFF.md` — **現在地・次にやること・凍結済み方針**
2. `research/KNOWN-ISSUES.md` — **既知不具合 / 制約 / 回避策 / 解決済み問題の索引**
3. `research/README.md` — **research全体の資料地図と読み順**
4. `extensions/mygpt-worker-fanout-v3/README.md` — **Worker Fanout現行実装**

実装資料を探す場合は `research/reference/README.md` から入る。

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

### Worker Fanout

Current extension:
- `extensions/mygpt-worker-fanout-v3/`

Current proven boundary:
- **v0.4.4** — sequential isolated F2/F3/F4 fanout: LIVE PASS
- **v0.4.5** — generated-image recovery: LIVE PASS
- **v0.4.6** — user-selectable output folder: STATIC PASS / LIVE PENDING

Operational checkpoint:
- `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md`

v0.4.4/v0.4.5で実機成功した生成・送信・回収経路は、新しい失敗証拠がない限り変更しない。

## Source-of-truth order

1. `research/PROJECT-HANDOFF.md`
2. `research/KNOWN-ISSUES.md`
3. latest applicable `research/decisions/` and current checkpoint
4. related `research/experiments/` / `research/incidents/` / `research/audits/`
5. `research/reference/README.md` and referenced implementation maps
6. historical `research/handoffs/`
7. frozen legacy assets only when comparison or reproductionに必要

`research/handoffs/` は履歴保存用。CURRENTを決める文書ではない。

## Repository areas

- `extensions/` — browser automation実装
- `audit/scripts/` — chroma removal / compose / machine audit
- `research/decisions/` — 採用済み方針とsupersession
- `research/experiments/` — PASS/FAIL実験記録とcheckpoints
- `research/incidents/` — 不具合・失敗原因の詳細記録
- `research/audits/` — source / architecture監査
- `research/reference/` — 再利用・検索用implementation map
- `research/runtime/` — 実機設定snapshot
- `research/handoffs/` — 過去チャット時点の引継ぎsnapshot

`research/**` はCONTROL / EVIDENCEであり、generation workerへそのまま露出しない。

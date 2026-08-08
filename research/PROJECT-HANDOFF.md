# MYGPT調整プロジェクト 引継ぎ

更新日: 2026-08-08 19:40 JST

GitHub `main` を正本とし、チャット記憶だけで過去方式へ戻さない。

## 最初に読む

1. `research/decisions/2026-08-08-identity-continuity-direction.md`
2. `research/audits/2026-08-08-c0-final-candidate-composed-audit.md`
3. `research/experiments/2026-08-08-w4-endpoint-and-final-candidate-result.md`
4. `research/experiments/2026-08-08-w3-ab-spatial-overconstraint-result.md`
5. `research/experiments/2026-08-08-w2-hand-shape-position-result.md`
6. `research/experiments/2026-08-08-w1-targeted-sleeve-invariant-result.md`
7. `research/audits/2026-08-08-n1-raw-identity-continuity-audit.md`
8. `research/experiments/2026-08-08-native-chat-worker-isolation-plan.md`
9. `research/incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`

Web調査前:
- `research/chatgpt-project-practices/search-ledger.md`
- `research/chatgpt-project-practices/native-chat-context-isolation.md`
- `research/chatgpt-project-practices/custom-gpt-thinking-imagegen-known-issue.md`
- `research/chatgpt-project-practices/china-imagegen-practices.md`

---

## 0. 最重要制約

- repo: `kaillebidan-byte/MYGPT`
- ユーザー環境: ChatGPT Plus
- Work / Codex系の週間agentic allowanceやOpenAI API別課金をproduction前提にしない。
- 「画像生成するな」「画像生成依頼ではありません」と明示されたturnでは画像生成を絶対に起動しない。
- 設計判断前にGitHub mainをfetchする。
- 実画像 / ログ / repoで確認可能なことを確認してから答える。
- ユーザー側の次作業を回答先頭に出す。確定済みなら説明だけで止めず、そのturnで実行可能な作業を進める。

---

## 1. canonical

- `kokyo_base_20260805.png`
- 1024x1536
- 緑背景

各generation worker conversationへ直接添付する。
generated frameをcanonicalへ昇格させない。

---

## 2. carrier / context isolation — 解決済み

失敗:
- direct 2x2 generation
- visible four-state planをgeneration-facing contextへ入れる
- `four-pose-portrait.png`をgeneration referenceにする
- global motion planとsingle-frame generationを同じconversationへ置く
- full-board repair
- generated-frame identity chaining

実機で通った境界:
- minimal Custom GPT
- Instant
- fresh conversation per frame
- canonical直接添付
- current single static poseだけを見る
- Knowledgeなし / Webなし / Codeなし / Actionsなし / Appsなし

N1結果:
- 4/4 standalone portrait
- 2x2 / labels / dividersなし
- right-hand progression成立

Custom GPT / Thinkingは画像生成tool availability FAIL。現行workerでは使わない。

---

## 3. identity / continuity — W1-W4で必要箇所だけ改善

N1 raw audit:
- regenerated neutral startは全身再解釈が大きい -> 不採用
- moving framesのglobal identityは概ね良好
-主問題はactive anatomical-right large sleeveとvisible hand articulation

W1:
- workerへactive large sleeveの短い不変条件だけ追加
- opening / gold trim / grey lining / motifを同じ袖構造として維持
- PASS

W2:
- local packetへneutral hand articulationを追加
- hand shape改善

W3:
- `entire hand below flower + gap`はF3ではなくF2相当を記述していた
- BをF2候補へ転用

W4:
- hand over chest flower endpoint
- endpoint / sleeve / carrier PASS

W-series prompt tuningは終了。

---

## 4. CURRENT final candidate

- F1 = canonical `kokyo_base_20260805.png`
- F2 = W3-B `19_12_14 (2)`
- F3 = W2 `19_07_53`
- F4 = W4 `19_17_55`

時間進行:
1. neutral start
2. upper-waist / lower-torso early raise
3. near-flower late raise
4. hand over chest flower endpoint

side swapなし、endpoint reversionなし。

---

## 5. C0 deterministic composed audit — PASS

`research/audits/2026-08-08-c0-final-candidate-composed-audit.md`

実行済み:
- chroma removal
- common scale / baseline normalization
- deterministic 2x2 board
- chronological strip
- mechanical geometry/chroma audit
- visual identity/motion audit

2x2 boardのmachine audit全flag false:
- wrong_aspect false
- outer_edge_contact false
- center contamination false
- divider-like white band false
- border/background uniformity failure false
- shadow-like background false

Visual:
- right hand monotonic progression PASS
- endpoint PASS
- active sleeve topology PASS
- hand articulation PASS / minor redraw only
- hat/hair / non-active sleeve / chest flower / waist medallion / major tassel-cord layout / lower garment / shoesにproduction-blocking failureなし

F4はF2/F3よりindependent-redraw差がやや大きいが、visible identity/topologyは維持されている。これを理由にgeneration tuningへ戻らない。

---

## 6. CURRENT production architecture

```text
natural motion request
        ↓
planner understands full motion
        ↓
F1 = canonical
        ↓
planner emits F2/F3/F4 independent local static packets
        ↓
F2/F3/F4 = separate fresh Custom GPT / Instant conversations
             same canonical + one current pose only
        ↓
identity / continuity audit
        ↓
remove_chroma_key.py
        ↓
common scale / baseline normalization
        ↓
compose_keypose_board_from_frames.py / build_motion_strip.py
        ↓
visual identity/motion audit + machine geometry/chroma audit
```

4 keyposesを3 image generationsで作る。

Worker設定:
- Instant
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- Knowledge NONE
- fresh conversation per generated frame
- canonical直接添付
- full motion / other packets / progress% / F1-F4 / sequence / board / sheetを見せない
- proven targeted active-sleeve invariantだけ追加

visible handは各local packetへabsolute articulation / palm orientationを書く。

---

## 7. 現在残っている技術課題 — chroma edgeだけ

透明PNG化すると、一部のanti-aliased輪郭に薄い緑フリンジが残る。

これはgeneration / identity / motion問題ではない。
`audit/scripts/remove_chroma_key.py`側のedge despill / threshold問題として扱う。

raw green-background framesとdeterministic green boardはmechanical chroma/background auditを通っている。

次にコードを触るなら、Custom GPTではなく`remove_chroma_key.py`だけ。

---

## 8. その後

chroma edge処理が許容になった後、必要ならBranchを操作省力化として試す。

- clean pre-motion seedのみ
- global motion contextを継承させない
- canonical添付の継承可否
- Instant/model configuration維持

zero-click multiple worker spawnはnormal Chatで未確認。
Work/APIは元制約外。

---

## 9. やらないこと

- W-series生成調整を再開しない
- broad identity Knowledgeを追加しない
- global worker proseを増やさない
- F2/F3/F4を微差だけのため再生成しない
- direct 2x2 generationへ戻さない
- generated-frame identity chainingをしない
- full-board repairへ戻さない
- Custom GPT Thinkingをprompt repairしない
- transparent green fringeをgeneration問題と混同しない

---

## 10. 運用反省

「答えてから調べて訂正」ではなく:
1. GitHub CURRENT確認
2. 実画像 / ログ確認
3. 問題局所化
4. 既存方針との整合確認
5. 必要最小限の変更
6. 確定済みならそのturnで実行
7. ユーザー作業を回答先頭に提示

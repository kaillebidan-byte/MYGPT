# MYGPT調整プロジェクト 引継ぎ

更新日: 2026-08-08 19:20 JST

この文書はMYGPT調整の新しい会話を開始するときの最新作業コンテキスト。
ChatGPT Project本番へ投入するProject Instructionsではない。

GitHub `main` の記録を正本とし、チャット記憶だけで過去方式へ戻さない。

## 作業開始前に必ず読む

1. `research/decisions/2026-08-08-identity-continuity-direction.md`
2. `research/experiments/2026-08-08-w4-endpoint-and-final-candidate-result.md`
3. `research/experiments/2026-08-08-w3-ab-spatial-overconstraint-result.md`
4. `research/experiments/2026-08-08-w2-hand-shape-position-result.md`
5. `research/experiments/2026-08-08-w1-targeted-sleeve-invariant-result.md`
6. `research/audits/2026-08-08-n1-raw-identity-continuity-audit.md`
7. `research/experiments/2026-08-08-native-chat-worker-isolation-plan.md`
8. `research/incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`
9. `research/MOTION-GENERATION-EXPERIMENT-LOG.md`

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
- ユーザーが「画像生成するな」「画像生成依頼ではありません」と明示したturnでは画像生成を絶対に起動しない。
- 設計判断前にGitHub mainの実ファイルをfetchする。
- ユーザーへの報告は「次にユーザーがやる作業」を最初に出す。ユーザー側作業がなければ明記する。
- 実画像・ログ・repoで確認可能なことを確認せず、直近発言だけで即断しない。

---

## 1. canonical

現行正本:
- `kokyo_base_20260805.png`
- 1024x1536
- 緑背景

ルール:
- 各generation worker conversationへ直接添付する。
- generated frameをcanonicalへ昇格させない。
- Project Source画像だけをidentity経路にしない。

---

## 2. carrier / context問題

### 確定した失敗

- direct 2x2 generation
- visible four-state planをgeneration-facing contextへ入れる
- `four-pose-portrait.png`をgeneration referenceとして使う
- global motion planとsingle-frame generationを同じconversationへ置く
- full-board repair
- generated-frame identity chaining
- M2c-Rの広域crossfade/morphをarticulated motionとして採用する

### 解決した境界

N1で実機確認:
- minimal Custom GPT
- Instant
- fresh conversation per frame
- canonical直接添付
- workerはcurrent single static poseだけを見る
- Knowledgeなし / Webなし / Codeなし / Actionsなし / Appsなし

結果:
- 4/4 standalone portrait
- 2x2 / labels / dividersなし
- right-hand progression成立

結論:
**fresh Custom-GPT / Instant conversationで「今はこの1姿勢だけ考えろ」の境界をPlus内に作れる。**

Custom GPT / Thinkingは画像生成tool availability FAIL。現行workerでは使わない。

---

## 3. identity / continuityの実画像監査

N1 raw auditで確定:
- regenerated neutral frameはcanonicalより全身再解釈が大きい -> F1として不採用
- moving framesのglobal identityは概ね安定
- 主問題はactive anatomical-right large sleeveとvisible hand articulation
- broad identity Knowledge追加は過剰修正

したがってF1はcanonicalそのものを使う。

---

## 4. W1-W4で行った最小調整

### W1 — targeted active-sleeve invariant

workerへ大袖だけの短い不変条件を追加。

要点:
- 腕に伴うたわみ / 向き変更は許可
- 正本の大袖としての基本構造を維持
- sleeve opening / gold trim / grey lining / motifを別構造へ描き替えたり消したりしない

結果: PASS。旧N1よりactive sleeve continuityが改善。

### W2 — hand shape packet

worker設定は変更せず、local packetへneutral hand articulationを明示。

結果:
- sleeve improvement維持
- hand shape改善
- hand positionはF3として高め

### W3 — A/B spatial constraint

`entire hand below flower + visible gap`を要求。

A/Bとも同じ方向へ手が下がった。
解釈:
- prompt ignoringではない
- text-only placement failureとも断定しない
- packet自体がF3ではなくF2相当のgeometryを記述していた

BをF2候補として採用。

### W4 — endpoint

hand over chest flowerを要求。

結果: PASS。
- endpoint明確
- neutral hand shape概ね維持
- W1 active-sleeve structure維持
- carrier regressionなし

W-series generation tuningは終了。

---

## 5. CURRENT final candidate

使用する4状態:
- F1 = canonical `kokyo_base_20260805.png`
- F2 = W3-B `19_12_14 (2)`
- F3 = W2 `19_07_53`
- F4 = W4 `19_17_55`

時間進行:
1. F1 neutral start
2. F2 upper-waist / lower-torso early raise
3. F3 near-flower late raise
4. F4 hand over chest flower endpoint

目視結果:
- right handは単調に上がる
- endpoint reversionなし
- side swapなし
- moving large sleeveはopen/lining/trim/motifを同じ衣装構造として維持
- handはnear-fist -> wide-palmの余計なgesture変化を大幅に解消
- non-active sleeve / hat / hair / waist / lower garment / shoesはproduction-blockingな崩れなし

細かなindependent-redraw差は残るので、pixel一致とは扱わない。

---

## 6. CURRENT production candidate architecture

```text
natural motion request
        ↓
planner: global motionを理解
        ↓
F1 = canonicalそのもの
        ↓
plannerがF2/F3/F4のlocal static packetを個別作成
        ↓
各frame = fresh Custom GPT / Instant conversation
          canonical + current one pose only
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

4 keypose one-shotを3 image generationsで作る。

---

## 7. worker設定 — 現状を維持

- Instant
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- Knowledge NONE
- fresh conversation per generated frame
- same high-resolution canonical directly attached every time
- generated frameを次のidentity sourceへしない
- full motion / other packets / progress% / F1-F4 / sequence / board / sheetをworkerへ見せない
- worker promptは短く保つ
- 追加するidentity ruleは現時点ではproven targeted active-sleeve invariantのみ

`project/sources/production/01-character-identity.md`全文をworker promptやKnowledgeへ入れない。監査契約として使う。

visible handについては各local packetへabsolute hand-shape / palm-orientationを書く。別frameとの比較をworkerへ要求しない。

---

## 8. 次にやること — C0 deterministic post-processing

**新規画像生成なし。**

final candidateの4枚を使い:
1. `audit/scripts/remove_chroma_key.py`
2. common scale / baseline normalization
3. `audit/scripts/build_motion_strip.py` または `compose_keypose_board_from_frames.py`
4. `machine_audit_board.py`でgeometry/chromaのみ監査
5. `01-character-identity.md`基準でvisual identity/motion監査

重点:
- active sleeve opening / grey lining / gold trim / motif
- hand articulation / arm-torso occlusion
- non-active sleeve
- hat/hair boundary
- waist medallion / tassel / cord / fastener
- lower garment / shoes
- monotonic motion / endpoint

C0 composed candidateが許容なら、generation-control追加はしない。

---

## 9. C0が失敗した場合だけ

C2 local edit diagnostic、さらに必要ならC3 canonical identity + one single-pose visual guideを検討。

今は:
- broad identity Knowledgeを追加しない
- pose guideを追加しない
- F2/F3を微差だけのため再生成しない
- direct 2x2へ戻さない
- Branch testへ進まない

Branch / automationはcomposed candidate品質が通った後の操作省力化フェーズ。

---

## 10. 直近の重要な運用反省

この案件では「答えてから調べて訂正する」順序を取らない。

正しい順序:
1. GitHub CURRENT確認
2. 実画像 / ログ確認
3. 問題を局所化
4. 既存方針との整合確認
5. 必要最小限の変更を提案
6. ユーザー作業を回答先頭に提示

ユーザーの指摘へ単純に迎合して結論を反転させず、誤っていた前提を特定して証拠から再判断する。

# MYGPT調整プロジェクト 引継ぎ

更新日: 2026-08-08 18:24 JST

この文書はMYGPT調整の新しい会話を開始するときの最新作業コンテキスト。
ChatGPT Project本番へ投入するProject Instructionsではない。

GitHub `main` の記録を正本とし、チャット記憶だけで過去方式へ戻さない。

## 作業開始前に必ず読む

1. `research/MOTION-GENERATION-EXPERIMENT-LOG.md`
2. `research/decisions/2026-08-08-identity-continuity-direction.md`
3. `research/experiments/2026-08-08-n0-custom-gpt-thinking-instant-result.md`
4. `research/experiments/2026-08-08-n1-fresh-custom-gpt-instant-four-frame-result.md`
5. `research/experiments/2026-08-08-native-chat-worker-isolation-plan.md`
6. `research/incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`

Web調査前:
- `research/chatgpt-project-practices/search-ledger.md`
- `research/chatgpt-project-practices/imagegen-orchestration-context.md`
- `research/chatgpt-project-practices/china-imagegen-practices.md`
- `research/chatgpt-project-practices/custom-gpt-thinking-imagegen-known-issue.md`
- `research/chatgpt-project-practices/native-chat-context-isolation.md`

---

## 0. 最重要制約

- repo: `kaillebidan-byte/MYGPT`
- ユーザー環境: ChatGPT Plus
- 元の狙いは、Work / Codex系の週間agentic allowanceやOpenAI API別課金を前提にせず、通常Chat / Project / Custom GPT側の機能差分で成立させられるかを検証すること。
- Work / Codex / Agents SDK / OpenAI APIをproduction前提にしない。
- ユーザーが「画像生成するな」「画像生成依頼ではありません」と明示したturnでは画像生成を絶対に起動しない。
- GitHub mainの実ファイルを直接fetchしてから設計判断する。
- production Instructions / Sourcesは、現在のidentity/continuity方針が固まるまで変更しない。
- 既知の失敗方式へ戻す場合は、過去の棄却理由を解消する新証拠が必要。

---

## 1. canonical

現行正本:
- `kokyo_base_20260805.png`
- 1024x1536
- 緑背景

ルール:
- 画像生成を行う現在のworker conversationへ直接添付する。
- Project Source画像だけをidentity経路にしない。
- generated frameをcanonicalへ昇格させない。
- 高解像度canonicalは旧低解像度派生版よりidentity fidelityが明確に良い。

---

## 2. sheet / carrier問題の確定事項

### 失敗

- direct 2x2 generation
- `four-pose-portrait.png`のgeneration reference利用
- visible 4-state exposure（POSE A/B/C/D等を同時に見せる）
- Project内でglobal 4-state intentを強く保持したままsingle-frame generationをさせる方式
- full-board repair
- 4独立repair boardから象限を寄せ集める方式
- M2c-Rの広域mask crossfade / morphをarticulated motionの代用にすること

### 実機で確認した切り分け

- STATIC CONTROL: 1人物・1姿勢portrait PASS
- M1: motion request + 1 image callでもsingle portrait PASS
- M2a: visible 4 states -> 2x2 sheet FAIL
- M2b: 同じchatでも各turnをlocal static poseだけにすれば4/4 single portrait PASS
- M2c-R: hidden orchestrationはPython/OpenCV/ffmpeg routeへ逸脱
- M2d: standalone carrierは改善したが時間状態がendpoint寄り
- M2e: 0/35/70/100の時間役割は効いたが2x2 sheet化が再発。再送でも再現

強い結論:
**4状態を十分に理解させるglobal contextと、1枚だけを描かせるgeneration-facing contextを同じconversationへ置くとsheet化しやすい。**

---

## 3. Custom GPT workerの切り分け

旧Custom-GPT本番 architecture（Actions / Knowledge / GitHub / file-transfer orchestration）は復活させない。

今回使ったのは別物:
- image generationだけON
- Actionsなし
- Appsなし
- Knowledgeなし
- Webなし
- Code/Data Analysisなし
- 1 current static poseだけを見るstateless worker

### N0 — Thinking vs Instant

Custom GPT / Thinking:
- image generation途中で停止
- `画像生成ツールがこの環境で利用できないため、画像ファイルを返せません。`
- tool availability FAIL
- context-isolation architectureの失敗とは数えない

Custom GPT / Instant:
- single portrait generation成功
- anatomical right arm、みぞおち付近のpose精度、主要identityを維持
- N0 PASS

現行workerはInstantを使う。
Thinkingの再repair試験を繰り返さない。

---

## 4. N1 — fresh Custom-GPT conversations

条件:
- 同じminimal worker GPT
- Instant
- 各frameごとに完全な新規conversation
- canonicalを毎回直接添付
- 各workerにはその回の1 static poseだけを見せる
- full motion / 他3姿勢 / progress% / F1-F4 / sequence / board / sheetを見せない

結果:
- 4/4 standalone portrait
- 2x2 / divider / labelなし
- right-hand motionは時間順に進行

結論:
**Plus内のfresh Custom-GPT conversationで「今はこの1姿勢だけ考えろ」というcontext boundaryを実機で作れた。**

carrier/context isolationは現在の第一問題ではない。

---

## 5. 現在の主問題 — identity / temporal continuity

N1で残った問題:
- independent redrawによるproportion drift
- active right sleeveのsilhouette / opening / fold / motif位置の揺れ
- hand shape / local occlusionの揺れ
- waist ornament / tassel / cord / fastener等は厳密監査が必要

特にneutral startを再生成したframeは、canonicalより細身・縦長へ全身再解釈された。

したがって開始姿勢を再生成しない。

---

## 6. CURRENT production candidate

one-shotでcanonical自体が開始姿勢の場合:

```text
natural motion request
        ↓
planner: global motionを理解し、生成対象の3 local pose packetを作る
        ↓
F1 = canonicalそのもの（生成しない）
F2 = fresh Custom GPT / Instant conversation
F3 = fresh Custom GPT / Instant conversation
F4 = fresh Custom GPT / Instant conversation
        ↓
各workerは canonical + その1 local poseだけを見る
        ↓
identity / continuity audit
        ↓
remove_chroma_key.py
        ↓
common scale / baseline normalization
        ↓
compose_keypose_board_from_frames.py または build_motion_strip.py
        ↓
machine geometry/chroma audit + visual identity/motion audit
```

4 keypose one-shotを3 image generationsで作る候補。

生成promptは短く保つ。
`project/sources/production/01-character-identity.md`の詳細contract全文をworker promptへ貼らない。
canonicalを主anchorとし、詳細contractは監査に使う。

---

## 7. 次にやること — C0 / C1

### C0 — 新規画像生成なし

現在すでにある:
- F1 = canonical
- N1のmoving 3 frames

を使ってcandidate 4-state sequenceを作る。

再稼働する既存資産:
- `audit/scripts/remove_chroma_key.py`
- `audit/scripts/compose_keypose_board_from_frames.py`
- `audit/scripts/build_motion_strip.py`
- `audit/scripts/machine_audit_board.py`（geometry/chroma専用）

監査対象:
- proportions
- silhouette
- topology
- part count
- attachment positions
- left/right
- overlap order
- occlusion map
- hat/hair boundary
- chest flower emblem
- large sleeves
- waist circular medallion
- tassel/cord/fastener count/connectivity
- lower garment
- shoes

### C1 — identity/continuity machine assistance

既存`machine_audit_board.py`はidentityを扱わない。
次にコードを追加するならgenerator promptではなくadvisory continuity audit。

候補metric:
- foreground bbox / center
- normalized width-height ratio
- silhouette overlap after alignment
- stable-region structural similarity
- canonical / adjacent-frame comparison

単一SSIMやpixel一致率だけでidentity PASSを決めない。
topology / attachment / occlusionはvisual auditを残す。

---

## 8. C0が許容外だった場合だけ行う改善

### C2 — local edit diagnostic

canonicalを基準にanatomical-right arm/sleeve周辺だけを局所編集し、whole-body redraw driftが減るかを見る。

注意:
- manual editor selectionはautomation前提にしない
- selected area外へ変更が漏れる可能性あり
- まず品質診断であり、production architecture確定ではない

### C3 — role-separated two-reference

C2でも不足する場合のみ:
- Reference A = canonical identity / costume / proportions / topology
- Reference B = 1枚だけのsingle-pose visual guide
- local text = current still pose

Bはskeletal / mannequin / silhouette等、identity情報の少ないguideを優先。
4 pose guideを同時に渡さない。
`four-pose-portrait.png`は戻さない。

---

## 9. Branch / automationは後回し

N1でmanual fresh-conversation boundaryは証明済み。

ただし今はN2 Branch testを進めない。
identity/continuity品質がC0/C1で成立してから、操作省力化として:
- clean seedからBranch
- canonical添付の継承可否
- model mode維持
を調べる。

通常Chatが親chatから4つの独立worker conversationをzero-clickでspawnする機能は確認できていない。
Work/APIは元制約外。

---

## 10. やらないこと

- 明示なしに画像生成しない。
- direct 2x2へ戻さない。
- visible four-state planをgeneration-facing contextへ入れない。
- `no 2x2 / no sheet`を大量追加してrepairループしない。
- low-resolution canonicalへ戻さない。
- generated frameを次のidentity sourceへしない。
- full-board repairへ戻さない。
- M2c-R morph/crossfadeをmotion productionに使わない。
- Custom GPT Thinkingをprompt修正で何度も再試験しない。
- identity driftをcarrier failureと混同しない。
- C0前にpose reference等の新変数を増やさない。
- search ledgerでDONEのWeb検索を言い換えだけで繰り返さない。

---

## 11. Web調査ルール

外部検索する前に`research/chatgpt-project-practices/search-ledger.md`を読む。

現時点で既に調査済み:
- Project context / memory
- image-generation multi-panel誘発
- canonical直接添付
- China-region identity/pose role separation
- Custom GPT fresh conversation boundary
- Custom GPT Thinking imagegen known issue
- reference start-frame / continuity方向

次に検索するなら新しい因果仮説に限定する。
候補:
- ChatGPT Imagesでidentity reference + single-pose guideを役割分離した実機例
- local editによるunchanged-region preservationの実例
- garment/accessory topologyを測るfine-grained consistency手法

---

## 12. 報告順

ユーザーへの報告は:
1. 次にやる作業
2. 結果
3. 解釈
4. GitHub変更

ユーザー側作業がない場合は「ユーザー側の作業なし」と明記する。

# MYGPT調整プロジェクト 引継ぎ

更新日: 2026-08-08 16:27 JST

この文書はMYGPT調整の新しい会話を開始するときの作業コンテキスト。
ChatGPT Project本番へ投入するProject Instructionsではない。

**作業開始前に必ず読む:**
1. `research/MOTION-GENERATION-EXPERIMENT-LOG.md`
2. `research/incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`

**Web調査を行う前に読む:**
3. `research/chatgpt-project-practices/search-ledger.md`
4. 該当topic note。現行motion問題は`research/chatgpt-project-practices/imagegen-orchestration-context.md`

失敗方式・解釈変更・確定事項はGitHub記録を正本とし、チャット記憶だけで過去方式へ戻さない。
同じWeb検索も繰り返さず、既調査論点を確認してから未調査角度を検索する。

---

## 0. 最重要事項

- 本番環境: ChatGPT Project「MYGPT」
- repo: `kaillebidan-byte/MYGPT`
- Custom GPTは本番経路ではない。
- ユーザーが「画像生成するな」「画像生成依頼ではない」と明示した投稿では画像生成を絶対に起動しない。
- GitHub上で確認できることをユーザーへ再提示要求せず、mainの実ファイルを直接fetchしてから判断する。
- 既知の失敗方式を再提案する場合は、過去の棄却理由を解消する新証拠を示す。
- Web調査は`search-ledger.md`へ検索済み論点、主要検索語、確認済み資料、未解決角度を残す。

---

## 1. 現在の目的

直接添付された高品質canonical character imageから、one-shot / loopの主要4時点を作り、最終的にidentity / motion semantics / continuity / endpoint / layout / chroma / unintended outputを監査する。

現在のcanonical候補:
- `kokyo_base_20260805.png`
- 1024x1536
- 加工前候補

以前使っていた約164x372版よりidentity fidelityが明確に良い。

canonicalは生成する現在のチャットへ直接添付する。Project Source内画像、過去生成frameをidentity正本へ昇格させない。

---

## 2. 現在までに確定した重要事項

### A. direct 2x2 generationは問題が多い

過去に確認:
- active limbの左右交換
- one-shot endpointが開始姿勢へ戻る
- walk cycle化
- identity drift
- shadow / divider / number / label
- center gap侵入
- chroma不均一

full-board repairもPASS項目をregressionさせた。
4独立repair boardから象限を寄せ集める方式もcontinuity/identityを壊した。

### B. `four-pose-portrait.png`はProject Sourceから退役

過去にKラベル、枠、divider等の模倣を誘発した。
GitHubのSVG/generatorは過去仕様・デバッグ用に残すが、画像生成モデルへ参照させない。

### C. 高解像度canonicalは有効

164x372版より1024x1536版で以下が改善:
- 帽子形状
- 帽子と髪の重なり
- 前髪
- 胸部意匠
- 袖silhouette
- 腰飾り
- 下衣
- 靴
- 頭身

完全一致ではなく房・紐・細部接続にはdriftが残る。

### D. 新規Projectでもfull motion workflowは2x2化した

旧Projectには昔の2x2/chibi生成チャットが残っていたため一度疑ったが、それを削除しても再現。
さらに**完全新規Project**でも、現行frame-first Instructions + Sources 01-05 + one-shot motion requestでsequence sheet / 2x2化が再現した。

よって旧Project memory / 過去チャットは主因ではない。

### E. 同じ新規Projectで静止ポーズ1回は成功

同じ高解像度canonical、同じ新規Projectで次を単発依頼:

`このキャラクターが、正面を向いたまま右手を胸の高さに置いている全身画像を1枚作ってください。`

結果:
- 1画像
- 人物1体
- 1ポーズ
- portrait 1024x1536
- 2x2なし
- label/dividerなし
- 右手を胸へ置く姿勢成立

したがって以下は否定できる:
- canonical自体が2x2を誘発する
- 新規Project自体が2x2を誘発する
- Sourcesが存在するだけで常時2x2になる

問題は**motion orchestration context**側にある。

### F. same-turnでも単独frameは絶対不可能ではない

旧Projectのrepair F4では、同じmotion turn中でも1回だけ単独portraitが生成された。
正本の単純コピーではなく再描画だった。

したがって「motion turnなら必ず2x2」というhard ruleではない。context-sensitive / probabilisticな挙動。

### G. 外部公式資料からprompt rewrite仮説が強まった

2026-08-08にOpenAI現行資料を再調査。

確認済み:
- Responses APIの会話型image generationはconversation / multi-step flow内で動く。
- mainline modelがimage generation用promptを自動的にreviseし、APIでは`revised_prompt`として観測できる。
- GPT Image prompting guideはmulti-panel compositionを対応用途として明示し、story/comicでは時系列visual beatをpanelへ割り当てる例を持つ。
- 同guideはclean base promptからsmall / single-change iterationを行う方がdebugしやすいとしている。
- ChatGPT Projectsはchat / files / Project Instructionsを共有contextとして使う。

重要な解釈:
- ChatGPT Project内部がResponses APIと完全に同じ実装だとは確認できない。
- しかし「画像生成callに短いlocal pose文だけ書けば、global motion contextはgeneration-facing promptへ入らない」と仮定する根拠もない。
- local promptが具体的だったのにsheet化した実機結果と、conversation-level prompt rewrite仮説は整合する。

詳細:
`research/chatgpt-project-practices/imagegen-orchestration-context.md`

---

## 3. 現行GitHub構成の注意

Project Instructions:
- `project/instructions/project-instructions.md`
- 実験: `project/instructions/post-generation-review-test.md`

Production Sources:
- `01-character-identity.md`
- `02-motion-design.md`
- `03-keypose-board-spec.md`
- `04-imagegen-workflow.md`
- `05-post-generation-audit.md`

主要Python:
- `compose_keypose_board_from_frames.py`
- `machine_audit_board.py`
- `remove_chroma_key.py`
- `build_motion_strip.py`

Research persistence:
- `research/chatgpt-project-practices/search-ledger.md`
- `research/chatgpt-project-practices/imagegen-orchestration-context.md`

**注意:** 現行`post-generation-review-test.md`は生成前から、motion contract / 4 states / 4 jobs / compose / audit / repair等のglobal workflowを全文脈へ置く。
また否定形を含め`board / sheet / 2x2 / panel`等の語も多数含む。

新規Projectでもfull workflowだけがsheet化し、静止単発は成功したため、このglobal motion contextが有力な原因候補。

ユーザーからの重要な指摘も維持する:
- 短い自然言語motionだけなら画像モデルが動作全体を1枚へまとめる解釈をするのは自然。
- 1枚ごとのposeは具体的な静止姿勢として定義する。

ただし次回は、最初から4状態を計画すること自体がprompt rewriteへ漏れる可能性も切り分ける。

---

## 4. 次回最優先テスト — M1 → M2 ladder

**GitHub productionはまだ追加変更しない。まず隔離実験。repair / audit / Python composeも走らせない。**

旧案の「いきなりsame-turn 4call」から変更した。
まず`motion request + 1 image call`だけでsheet化するかを確認し、その後に4callへ進む。

また、**1 condition = 1完全新規Project**とする。
同じ隔離Project内で複数条件を順番に試さない。Project内chat historyが次条件へcontextとして影響する可能性を残さないため。

### CONTROL-STATIC — 既実施、再実行しない

高解像度canonical + 単発静止ポーズは単独portrait PASS済み。
新証拠がない限り同じcontrolを繰り返さない。

### TEST M1 — motion context + 1 image call only

目的:
`userがmotionを要求した`というconversation contextだけで、単独静止frameがsequence sheetへ再解釈されるか確認する。

専用の完全新規Project:
- old chats 0
- Project Sources 0
- `four-pose-portrait.png`なし
- 高解像度canonicalだけを生成chatへ直接添付
- minimal Instructions
- board / sheet / panel / 2x2 / compose / audit / repair / Python等を書かない

ユーザー依頼:
`このキャラクターが、右手を胸の高さまで上げて、その位置で止まるone-shotモーションを作ってください。`

M1ではassistantは:
- 4状態workflowを計画しない
- 4枚作ることを考えない
- motion中の**1つの具体的静止時点だけ**を選ぶ
- image generationは1回だけで終了

推奨する1時点:
- 正面直立
- 左腕・両脚・体幹・頭はcanonical基準
- キャラクター自身の右肘を軽く曲げる
- 右手を上腹部 / みぞおち付近まで上げる
- 右の長袖だけが腕に追従
- 直接添付canonicalと同一人物
- 人物1体、全身、portrait、均一な高彩度magenta背景
- canonicalの表情・体格・帽子/髪・胸紋・腰飾り・房/紐・袖・裾・靴を維持

M1判定:
- **sheet化** → same-turn 4call以前に、motion request + conversational prompt rewriteだけでsequence表現を誘発する候補。M2をすぐ行わず原因を再整理する。
- **単独portrait** → motion request単独では十分条件でない。M2へ進む。

### TEST M2 — motion context + same-turn 4 calls

**M1とは別の完全新規Project。**

環境はM1と同じ。

会話モデル側で4つの具体的静止poseを内部で決める:

POSE A:
- 正面直立
- 両腕を自然に下げる
- 開始姿勢

POSE B:
- 正面直立
- 左腕・両脚・体幹・頭は開始姿勢維持
- キャラクター自身の右肘を軽く曲げる
- 右手を上腹部 / みぞおち付近まで上げる

POSE C:
- 正面直立
- 左腕・両脚・体幹・頭は維持
- 右肘をさらに曲げる
- 右手を胸の花紋の少し下まで上げる
- まだ最終位置ではない

POSE D:
- 正面直立
- 左腕・両脚・体幹・頭は維持
- 右肘を自然に曲げる
- 右手を胸の花紋付近まで上げて停止

重要:
- 生成前に4pose全部を可視テキストとして列挙しない。
- 各image generation時には現在の具体的静止poseだけを扱う。
- one-shot / motion / sequence / 他3pose / 4状態 / F1-F4 / board / sheet / panel / 2x2 / compose / audit / repair / comparisonをgeneration-facing local descriptionへ持ち込まない。
- `no sheet / no 2x2`の大量否定で解決しようとしない。

M2判定:
- call 1からsheet → 4-state orchestration plan自体がgeneration-facing rewriteへ漏れる候補。
- call 1は単独、後続だけsheet → repeated call / accumulating conversation context候補。
- 4回とも単独portrait → full current Instructions/Sourcesのglobal workflow contamination候補が強い。
- 混在 → hard ruleではなく確率的context contamination。崩れたcall番号を記録する。

### TEST S4 — fresh static-pose controls

M2がFAILし、個別pose自体の難しさを切り分ける必要がある場合だけ実施。

A/B/C/Dをそれぞれ完全に独立したfresh contextで単発静止ポーズとして生成する。
4pose全部が単独portraitならorchestration問題が強い。
特定poseだけ崩れるならpose complexity / identity bindingを別問題として扱う。

### 実験順

```text
existing STATIC control PASS
        ↓
M1: motion request + 1 call
        ↓
M1 PASSなら
M2: motion request + 4 calls in another clean Project
        ↓
M2 FAIL時に必要なら
S4: each pose in fresh context
```

---

## 5. identity監査基準

「同じキャラっぽい」でPASSにしない。

最低限:
- proportions
- silhouette
- topology
- part count
- attachment position
- left/right relation
- overlap order
- occlusion map

特に現在キャラ:
- 帽子と髪の境界 / 髪がどこから出るか
- 胸の花紋
- 大袖のsilhouette
- 腰円形飾り
- 房・紐・留め具の本数と接続
- 下衣
- 靴

sequence sheet化を止める問題とidentity / continuity問題は分ける。
まずsingle-frame carrierを成立させ、その後に独立frame間のidentityを評価する。

---

## 6. やらないこと

- 画像生成するなと明示されたturnで画像生成しない。
- 同じ4 INITIAL + 4 REPAIRを禁止文だけ強くして再試行しない。
- `four-pose-portrait.png`をProject Sourceへ戻さない。
- 低解像度canonicalへ戻さない。
- 4独立repair boardから象限を寄せ集める方式へ戻さない。
- generated imageのsame-turn automatic editを必須前提にしない。
- `no sheet / no 2x2`を大量追加して解決しようとしない。
- static control PASSを無視して「Project全体が壊れている」と結論しない。
- M1とM2を同一Projectで実施しない。
- 既に`search-ledger.md`でDONEのWeb論点を、言い換えただけで再検索しない。

---

## 7. Web調査の保存方法

Web検索を行ったら、回答に使って終わりにしない。

保存先:
- 検索履歴・検索済み論点: `research/chatgpt-project-practices/search-ledger.md`
- topic別の詳細整理: 同ディレクトリのtopic note

最低限残す:
- 調査日
- 調査目的
- 主要検索語
- 一次資料 / 補助資料
- 確認できたこと
- 確認できなかったこと
- MYGPTへの意味
- 次に検索する別角度

現在のmotion問題で次に検索する優先角度:
1. ChatGPT UIでimage generationの`revised prompt`相当を観測できるか。
2. Responses APIのconversation state / `previous_response_id`がimage prompt rewritingへ与える影響。
3. GPT Image 2でsingle-character motion wordingがunintended character sheet / contact sheetへ崩れる最新事例。
4. identityを維持しつつposeだけ変えるreference-image / pose-conditioned generation研究。

---

## 8. 報告順

ユーザーへの報告はまず**ユーザーが次にやる作業**を先頭に置く。
その後にテスト条件、結果、GitHub変更、コミット等を書く。
ユーザー側作業がない場合は「ユーザー側の作業なし」と明記する。

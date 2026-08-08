# MYGPT調整プロジェクト 引継ぎ

更新日: 2026-08-08 17:10 JST

この文書はMYGPT調整の新しい会話を開始するときの作業コンテキスト。
ChatGPT Project本番へ投入するProject Instructionsではない。

**作業開始前に必ず読む:**
1. `research/MOTION-GENERATION-EXPERIMENT-LOG.md`
2. `research/incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`
3. 最新の隔離実験:
   - `research/experiments/2026-08-08-m1-motion-context-single-call.md`
   - `research/experiments/2026-08-08-m2a-visible-four-state-sheet-collapse.md`
   - `research/experiments/2026-08-08-m2b-repeated-static-calls-pass.md`

**Web調査を行う前に読む:**
4. `research/chatgpt-project-practices/search-ledger.md`
5. `research/chatgpt-project-practices/imagegen-orchestration-context.md`
6. 中国語圏の別角度: `research/chatgpt-project-practices/china-imagegen-practices.md`

失敗方式・解釈変更・確定事項はGitHub記録を正本とし、チャット記憶だけで過去方式へ戻さない。
同じWeb検索も繰り返さず、既調査論点を確認してから未調査角度を検索する。

---

## 0. 最重要事項

- 本番環境: ChatGPT Project「MYGPT」
- repo: `kaillebidan-byte/MYGPT`
- Custom GPTは本番経路ではない。
- ユーザーが「画像生成するな」「画像生成依頼ではない」と明示した投稿では画像生成を絶対に起動しない。
- GitHub mainの実ファイルを直接fetchしてから判断する。
- 既知の失敗方式を再提案する場合は、過去の棄却理由を解消する新証拠を示す。
- production Instructions / Sourcesは隔離実験が終わるまで追加変更しない。

---

## 1. 現在の目的

直接添付された高品質canonical character imageから、one-shot / loopの主要4時点を作り、最終的にidentity / motion semantics / continuity / endpoint / layout / chroma / unintended outputを監査する。

canonical候補:
- `kokyo_base_20260805.png`
- 1024x1536
- 加工前候補

以前の約164x372版よりidentity fidelityが明確に良い。
canonicalは生成する現在のチャットへ直接添付する。Project Source画像や過去生成frameをidentity正本へ昇格させない。

---

## 2. 確定した失敗方式

### direct 2x2 generation

過去に確認:
- active limb左右交換
- one-shot endpointが開始姿勢へ戻る
- walk cycle化
- identity drift
- shadow / divider / number / label
- chroma不均一
- center gap侵入

full-board repairもPASS項目をregressionさせた。
4独立repair boardから象限を寄せ集める方式もcontinuity / identityを壊した。

### `four-pose-portrait.png`

Project Sourceから退役済み。
Kラベル、枠、divider等の模倣を誘発した。

### same-turn generated-image edit

必須production前提にしない。テスト経路ではedit targetとして確実に再投入できなかった。

---

## 3. sheet化問題の現在の切り分け

### 旧Project / full production context

frame-firstへ変更後も、INITIAL 4 + REPAIR 4の8/8がmulti-pose 2x2 sheet化。
旧Project chat削除後も継続。

### 完全新規Project + current full Instructions/Sources

2x2化を再現。
したがって旧Project memory / 過去チャットだけが主因ではない。

### STATIC CONTROL

同じ高解像度canonicalで単発静止ポーズ依頼:
`このキャラクターが、正面を向いたまま右手を胸の高さに置いている全身画像を1枚作ってください。`

結果:
- 1画像
- 1人物
- 1ポーズ
- portrait
- 2x2なし
- label/dividerなし

canonical自体、新規Project自体、Sourcesの存在自体が常時sheet化するわけではない。

### M1 — motion request + 1 image call

完全新規隔離Project、Sources 0、minimal Instructions。
自然言語motion依頼は存在するが画像生成は1回だけ。

結果: PASS
- 単独portrait
- 1人物 / 1ポーズ
- 2x2なし
- anatomical right armがactive

結論:
**motionという依頼があるだけでは最初の1callはsheet化しない。**

### M2a — visible four-state exposure

別の完全新規Project。
誤ってPOSE A/B/C/Dを全部同じユーザー投稿へ可視提示してから生成した。

結果: FAIL
- 最初の生成群で明確な2x2を複数回生成
- dividerあり
- `POSE A/B/C/D`ラベルまで画像内へ取り込んだ
- 後半は強い禁止文や象限切り出し指示で単独portraitへ回復したが、これはM2成功とは数えない

結論:
**4つのnamed chronological statesを生成前に同時露出するとmulti-panel表現を強く誘発する。**

### M2b — repeated same-chat static calls without global plan

さらに別の完全新規Project。
同じチャットで4回、各回は1静止ポーズだけを依頼。
`motion / one-shot / sequence / 4状態 / POSE A-D`等は生成依頼へ入れない。
canonicalは各回で再添付し、generated frameを正本へしない。

時系列:
1. 両腕下げた開始姿勢
2. anatomical right handを上腹部方向へ上げる
3. 胸紋の少し下
4. 胸紋付近

結果: PASS
- 4/4単独portrait
- 4/4人物1体・1ポーズ
- 2x2なし
- divider / labelなし
- active limb左右交換なし

注意:
- 2枚目の手位置はみぞおち指定よりやや低く、waist寄り
- body proportionsがcanonicalよりやや細長い
- sleeve silhouette、手の見え方、腰の房/紐、attachment / occlusionにframe間driftあり
- 背景は白へ変わったがM2bではchromaを制御変数にしていない

結論:
**同一チャットで4回生成すること自体はsheet化の十分条件ではない。**

M2aとM2bの差から、現時点の最有力原因は:

> global four-state / sequence-level intentが、個々のgeneration-facing contextへ見えていること。

---

## 4. 次回最優先テスト — M2c

**別の完全新規Projectを使う。productionは変更しない。**

目的:
ユーザーは自然言語motionを1回だけ依頼する。
会話モデルは内部で4静止状態へ分解して4回画像生成するが、**4状態一覧を生成前に可視化しない**。

条件:
- Project Sources 0
- `four-pose-portrait.png`なし
- 高解像度canonicalを生成chatへ直接添付
- minimal Instructions
- repair / audit / Python composeなし
- generation中にboard / sheet / panel / 2x2 / compose / audit / repair等の語を使わない
- generated frameをidentity canonicalへ昇格させない

ユーザー依頼:
`このキャラクターが、右手を胸の高さまで上げて、その位置で止まるone-shotモーションを作ってください。`

会話モデル内部では4状態を作る:
- state 1: 両腕下げた開始姿勢
- state 2: anatomical right handを上腹部 / みぞおち付近
- state 3: 胸紋の少し下、まだendpointではない
- state 4: 胸紋付近で停止

重要:
- 4状態をユーザーへ一覧表示してから生成しない。
- image call 1にはstate 1だけの静止画内容。
- call 2にはstate 2だけ。
- call 3にはstate 3だけ。
- call 4にはstate 4だけ。
- 各callのgeneration-facing local descriptionへ他の3状態やsequence概念を持ち込まない。

判定:
- **4/4単独portrait** → hidden/local frame-first orchestrationは成立。full current Instructions/Sourcesのglobal workflow contaminationが主因候補としてさらに強くなる。productionをgeneration phaseとpost-generation phaseへ分離する設計へ進む。
- **sheet化再発** → assistant内部の4-state plan自体がconversation-level prompt rewrite経由で画像側へ漏れる可能性が高い。true isolated worker相当の境界を検討する。

M2cが終わるまでchroma、audit、repair、Python composeを戻さない。

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

特に:
- 帽子と髪の境界 / 髪がどこから出るか
- 胸の花紋
- 大袖silhouette
- 腰円形飾り
- 房・紐・留め具の本数と接続
- 下衣
- 靴

sheet carrier問題とidentity / continuity問題は分ける。
まず1 call = 1 portraitを成立させ、その後でidentity改善を行う。

---

## 6. 中国語圏Web調査から追加された別角度

詳細:
`research/chatgpt-project-practices/china-imagegen-practices.md`

新しい知見:
- 中国圏AIGC実務ではidentity / pose / scene / styleを別referenceへ分離する運用が強い。
- Seedream / Kling / Vidu等では複数referenceやpose/sketch controlを明示的に扱う。
- `分镜 / 组图 / 四宫格`は成功用途として一般的で、複数状態の同時提示がmulti-panel表現へ寄ること自体は不自然ではない。
- multi-round image editingではconsistency低下を別問題として扱う研究・実務知見がある。

MYGPTへの未採用候補:
M2c後もtext-only pose controlが不安定なら、
**canonical identity image 1枚 + そのcall専用single-pose visual guide 1枚**
という二入力を別実験する。
4ポーズsheetをreferenceへ戻す案ではない。

---

## 7. やらないこと

- 画像生成するなと明示されたturnで画像生成しない。
- direct 2x2へ戻さない。
- `four-pose-portrait.png`をProject Sourceへ戻さない。
- 低解像度canonicalへ戻さない。
- 4独立repair boardから象限を寄せ集めない。
- `no sheet / no 2x2`を大量追加して同じ構造を再試行しない。
- M2aの回復portraitをvisible-four-state方式の成功証拠にしない。
- M2bのidentity driftをsheet化と混同しない。
- M2cで4状態一覧を生成前にユーザーへ表示しない。
- `search-ledger.md`でDONEのWeb論点を言い換えだけで再検索しない。

---

## 8. Web調査の保存方法

Web検索したらGitHubへ残す。

- 検索済み論点 / 検索語 / 未調査角度: `research/chatgpt-project-practices/search-ledger.md`
- topic詳細: 同ディレクトリのtopic note

現在の未調査優先角度:
1. ChatGPT UIでimage generationのrevised prompt相当を観測できるか。
2. Responses API conversation state / `previous_response_id`とimage prompt rewrite。
3. single-character motionがunintended contact sheetへ崩れる最新事例。
4. identity reference + single-pose visual referenceをChatGPT Imagesで併用した実機例。

---

## 9. 報告順

ユーザーへの報告はまず次にやる作業を先頭に置く。
その後に結果、解釈、GitHub変更を書く。
ユーザー側作業がない場合は「ユーザー側の作業なし」と明記する。

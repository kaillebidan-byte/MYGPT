# MYGPT調整プロジェクト 引継ぎ

更新日: 2026-08-08 15:53 JST

この文書はMYGPT調整の新しい会話を開始するときの作業コンテキスト。
ChatGPT Project本番へ投入するProject Instructionsではない。

**作業開始前に必ず読む:**
1. `research/MOTION-GENERATION-EXPERIMENT-LOG.md`
2. `research/incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`

失敗方式・解釈変更・確定事項はGitHub記録を正本とし、チャット記憶だけで過去方式へ戻さない。

---

## 0. 最重要事項

- 本番環境: ChatGPT Project「MYGPT」
- repo: `kaillebidan-byte/MYGPT`
- Custom GPTは本番経路ではない。
- ユーザーが「画像生成するな」「画像生成依頼ではない」と明示した投稿では画像生成を絶対に起動しない。
- GitHub上で確認できることをユーザーへ再提示要求せず、mainの実ファイルを直接fetchしてから判断する。
- 既知の失敗方式を再提案する場合は、過去の棄却理由を解消する新証拠を示す。

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

**注意:** 現行`post-generation-review-test.md`は生成前から、motion contract / 4 states / 4 jobs / compose / audit / repair等のglobal workflowを全文脈へ置く。
また否定形を含め`board / sheet / 2x2 / panel`等の語も多数含む。

新規Projectでもfull workflowだけがsheet化し、静止単発は成功したため、このglobal motion contextが有力な原因候補。

ただし、ユーザーから重要な指摘あり:
- ユーザーの自然言語motion要求が短い場合、画像モデルが「動作全体を1枚にまとめる」解釈をするのは自然。
- 次回は単に「内部で4状態へ分ける」だけでなく、**各画像生成前に4枚それぞれの具体的な静止ポーズを明示確定**する。

なお前回実験のF2/F3/F4 local prompt自体はかなり具体的だったのにsheet化したため、「短いユーザー依頼だけ」が原因とは断定しない。global workflow contextとの複合を疑う。

---

## 4. 次回最優先テスト

**GitHub productionはまだ追加変更しない。まず隔離実験。repair / audit / Python composeも走らせない。**

目的:
`明示的な1枚ごとの静止ポーズ指定 + generation-facing context最小化`で、same-turn 4callが単独画像になるか確認する。

### テストProject

新規または隔離用Project。

推奨条件:
- Project Sources: 0
- `four-pose-portrait.png`: なし
- 高解像度canonicalだけを生成チャットへ直接添付
- Instructionsにはboard / sheet / 2x2 / compose / audit / repair / Python等を書かない
- 生成は4回だけ。repairなし。

### ユーザー依頼

`このキャラクターが、右手を胸の高さまで上げて、その位置で止まるone-shotモーションを作ってください。`

### 会話モデル側で先に確定する4つの静止ポーズ

#### POSE A — start
- 正面直立
- 両腕を自然に下げる
- 右手も下位置
- 両脚、体幹、頭、表情はcanonical基準

#### POSE B — early
- 正面直立
- 左腕・両脚・体幹・頭は開始姿勢を維持
- キャラクター自身の右肘を軽く曲げる
- 右手を上腹部 / みぞおち付近まで上げる
- 右の長袖だけが腕に追従

#### POSE C — late
- 正面直立
- 左腕・両脚・体幹・頭は維持
- 右肘をさらに曲げる
- 右手を胸の花紋の少し下まで上げる
- 最終停止位置にはまだ届かせない

#### POSE D — endpoint
- 正面直立
- 左腕・両脚・体幹・頭は維持
- 右肘を自然に曲げる
- 右手を胸の花紋付近まで上げて停止

### 画像生成callへ渡す内容

各callには**その1ポーズの静止画説明だけ**を渡す。

共通:
- 直接添付canonicalと同一人物
- 人物1体
- 全身
- 正面基準
- portrait
- 均一な高彩度magenta背景
- canonicalの表情・体格・帽子/髪・胸紋・腰飾り・房/紐・袖・裾・靴を維持

画像生成callへ渡さない:
- one-shot / motion / sequence
- 他の3ポーズ
- 4状態という説明
- F1/F2/F3/F4
- board / sheet / panel / 2x2
- compose / audit / repair / comparison

**否定語を大量に重ねない。そもそも生成callへmulti-frame概念を見せない。**

### 判定

- 4回とも単独portrait → full current Instructions/Sourcesのglobal workflow contextがsheet化を誘発していた可能性が高い。productionを「generation phase」と「post-generation phase」に分離する設計へ進む。
- 1回目からsheet → 明示静止ポーズでもsame-turn 4-state orchestrationがsequence表現を誘発。true isolated workerなしでは同turn per-frame automationが不安定。
- 1回目単独、後続でsheet → 同じチャット内で先行call / global 4-state planが後続へ蓄積する可能性。
- 混在 → hard ruleではなく確率的context contamination。どのcallから崩れたか記録する。

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

---

## 7. 報告順

ユーザーへの報告はまず**ユーザーが次にやる作業**を先頭に置く。
その後にテスト条件、結果、GitHub変更、コミット等を書く。
ユーザー側作業がない場合は「ユーザー側の作業なし」と明記する。

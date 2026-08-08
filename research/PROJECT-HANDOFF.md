# MYGPT調整プロジェクト 引継ぎ

更新日: 2026-08-08 17:22 JST

この文書はMYGPT調整の新しい会話を開始するときの作業コンテキスト。
ChatGPT Project本番へ投入するProject Instructionsではない。

**作業開始前に必ず読む:**
1. `research/MOTION-GENERATION-EXPERIMENT-LOG.md`
2. `research/incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`
3. 最新の隔離実験:
   - `research/experiments/2026-08-08-m1-motion-context-single-call.md`
   - `research/experiments/2026-08-08-m2a-visible-four-state-sheet-collapse.md`
   - `research/experiments/2026-08-08-m2b-repeated-static-calls-pass.md`
   - `research/experiments/2026-08-08-m2c-routing-divergence-hybrid-motion.md`

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
旧Project memory / 過去チャットだけが主因ではない。

### STATIC CONTROL

同じ高解像度canonicalで単発静止ポーズ依頼。

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
- 後半は強い禁止文や象限切り出し指示で単独portraitへ回復したが、これは成功とは数えない

結論:
**4つのnamed chronological statesを生成前に同時露出するとmulti-panel表現を強く誘発する。**

### M2b — repeated same-chat static calls without global plan

さらに別の完全新規Project。
同じチャットで4回、各回は1静止ポーズだけを依頼。
`motion / one-shot / sequence / 4状態 / POSE A-D`等は生成依頼へ入れない。
canonicalは各回で再添付し、generated frameを正本へしない。

結果: PASS
- 4/4単独portrait
- 4/4人物1体・1ポーズ
- 2x2なし
- divider / labelなし
- active limb左右交換なし

注意:
- 2枚目の手位置はみぞおち指定よりやや低くwaist寄り
- body proportionsがcanonicalよりやや細長い
- sleeve silhouette、手、腰の房/紐、attachment / occlusionにframe間driftあり
- 背景は白へ変わったがM2bではchromaを制御変数にしていない

結論:
**同一チャットで4回生成すること自体はsheet化の十分条件ではない。**

### M2c-R — hidden orchestration caused tool-routing divergence

別の完全新規Project。
ユーザーは自然言語motionを1回だけ依頼。
Instructionsでは内部4状態化と4回生成を意図したが、実際の会話モデルは予定した4 image callsをそのまま実行しなかった。

観測された思考/処理:
- motionを「アニメーションを完成させる問題」として再解釈
- PILでcanonicalを読み込み
- ffmpeg確認
- anatomical right arm / viewer-left sleeveのmanual mask作成
- rotation / coordinate transform / warp / inpaintを検討
- 別途生成されたpose imageを素材に採用
- canonicalとpose imageをviewer-left領域でmask blend
- smoothstep + Gaussian blurで中間frameを合成
- ffmpegでMP4化
- final-pose PNGも出力

ユーザー提供の思考ログ最終コード:
- 30 fps
- move 0.55 sec
- final hold 0.70 sec
- output `right_hand_raise_oneshot.mp4`
- output `right_hand_raise_final_pose.png`

添付された生成画像は3枚とも単独portraitでsheetではないが、意図した4 chronological raw framesではない。
neutral startも生成画像群には含まれず、手形状もclosed/openで揺れている。

結論:
**M2cは4-call hidden orchestrationのPASS/FAIL判定には使えない。main modelが別のtool routeへ逃げた。**

新しい重要事項:
> Project Instructionsで最終目的だけを強く示すと、main modelは要求された中間artifactを省略してPython/OpenCV/ffmpeg等で最終成果物を直接作ろうとすることがある。

したがってsheet contaminationだけでなく**tool-routing / execution-boundary**もproduction設計上の問題。

M2a / M2b / M2c-Rから現在の整理:

1. motion request alone -> single portrait可能
2. repeated same-chat calls alone -> 4/4 single portrait可能
3. visible four-state plan -> sheet化強い
4. hidden orchestration instructions -> sheet化以前に別tool routeへ分岐し得る

---

## 4. 次回最優先テスト — M2d

**別の完全新規Projectを使う。productionは変更しない。**

目的:
M2c-Rのtool-routing divergenceを塞ぎつつ、4状態一覧を可視露出せずに4回のimage generationを実行できるか確認する。

条件:
- Project Sources 0
- `four-pose-portrait.png`なし
- 高解像度canonicalを生成chatへ直接添付
- minimal Instructions
- generated frameをidentity canonicalへ昇格させない
- generation phaseではrepair / audit / compose / video化をしない

M2d Instructionsで明示する実行境界:
- generation phaseは**image generationを4回呼び、4つの別々のstill image outputを作ることが必須**
- 4枚が揃う前にPython / OpenCV / ffmpeg / image warping / crossfade / direct MP4/GIF constructionへ置き換えない
- concreteな4状態一覧は画像生成前にユーザーへ表示しない
- 各call直前に、そのcallの1静止姿勢だけを内部で決める
- 各image callにはcanonical identity rule + そのcallの1姿勢だけを渡す
- 他の3状態やsequence-level説明を各image callへ渡さない
- 4枚生成したら停止する。M2d中はcompose / audit / repair / video化しない

ユーザー依頼:
`このキャラクターが、右手を胸の高さまで上げて、その位置で止まるone-shotモーションを作ってください。`

判定:
- **4/4単独portrait** -> hidden/local 4-call orchestrationは実行境界を強制すれば成立する可能性が高い
- **sheet化** -> internal multi-state planの漏出が依然強い
- **再びtool route分岐** -> Project自然言語Instructionsだけでは4 image-call execution boundaryを十分に強制できない。外部orchestrator等を検討

M2dが終わるまでchroma、audit、repair、Python composeは戻さない。

---

## 5. M2c-RのMP4方式をproduction採用しない理由

M2c-R最終コードは、4つの実画像poseから関節運動を作ったものではない。
canonicalと1つのpose imageを大きなviewer-left領域で画像空間blendしている。

そのため:
- articulated motionではなくmorph / crossfadeに近い
- mask内の袖、胴、腰、手の非一致pixelまで同時変形する
- Gaussian blurはtransition artifactを隠すだけでtopology continuityを保証しない
- canonical非mask領域を維持しやすい利点はあるが、motion semantics / topology面でproduction要件を満たさない

この経路はtool-routing挙動の証拠として保存するが、本番motion architectureには採用しない。

---

## 6. identity監査基準

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

sheet carrier問題、tool-routing問題、identity / continuity問題は分ける。
まず1 call = 1 portraitの実行境界を成立させ、その後でidentity改善を行う。

---

## 7. 中国語圏Web調査から追加された別角度

詳細:
`research/chatgpt-project-practices/china-imagegen-practices.md`

新しい知見:
- 中国圏AIGC実務ではidentity / pose / scene / styleを別referenceへ分離する運用が強い
- Seedream / Kling / Vidu等では複数referenceやpose/sketch controlを明示的に扱う
- `分镜 / 组图 / 四宫格`は成功用途として一般的で、複数状態同時提示がmulti-panelへ寄ること自体は不自然ではない
- multi-round image editingではconsistency低下を別問題として扱う研究・実務知見がある

MYGPTへの未採用候補:
M2d後もtext-only pose controlが不安定なら、
**canonical identity image 1枚 + そのcall専用single-pose visual guide 1枚**
という二入力を別実験する。
4ポーズsheetをreferenceへ戻す案ではない。

---

## 8. やらないこと

- 画像生成するなと明示されたturnで画像生成しない。
- direct 2x2へ戻さない。
- `four-pose-portrait.png`をProject Sourceへ戻さない。
- 低解像度canonicalへ戻さない。
- 4独立repair boardから象限を寄せ集めない。
- `no sheet / no 2x2`を大量追加して同じ構造を再試行しない。
- M2aの回復portraitをvisible-four-state方式の成功証拠にしない。
- M2bのidentity driftをsheet化と混同しない。
- M2c-RのMP4/Python routeを4-call frame-first成功として扱わない。
- M2dで4状態一覧を生成前にユーザーへ表示しない。
- `search-ledger.md`でDONEのWeb論点を言い換えだけで再検索しない。

---

## 9. Web調査の保存方法

Web検索したらGitHubへ残す。

- 検索済み論点 / 検索語 / 未調査角度: `research/chatgpt-project-practices/search-ledger.md`
- topic詳細: 同ディレクトリのtopic note

現在の未調査優先角度:
1. ChatGPT UIでimage generationのrevised prompt相当を観測できるか。
2. Responses API conversation state / `previous_response_id`とimage prompt rewrite。
3. single-character motionがunintended contact sheetへ崩れる最新事例。
4. identity reference + single-pose visual referenceをChatGPT Imagesで併用した実機例。

---

## 10. 報告順

ユーザーへの報告はまず次にやる作業を先頭に置く。
その後に結果、解釈、GitHub変更を書く。
ユーザー側作業がない場合は「ユーザー側の作業なし」と明記する。

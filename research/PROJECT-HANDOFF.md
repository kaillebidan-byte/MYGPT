# MYGPT調整プロジェクト 引継ぎ

更新日: 2026-08-08

この文書はMYGPT調整の新しい会話を開始するときの短い作業コンテキストである。
ChatGPT Project本番へ投入するProject Instructionsではない。

**作業を始める前に必ず次を読む。**

1. `research/MOTION-GENERATION-EXPERIMENT-LOG.md`
2. `research/incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`

失敗方式・解釈変更・確定事項はGitHub記録を正本とし、チャット記憶だけで過去方式へ戻さない。

---

## 0. 最重要事項

本番環境はChatGPT Project「MYGPT」。
GitHub repositoryは`kaillebidan-byte/MYGPT`。
Custom GPTは本番経路ではなく、`legacy/custom-gpt/`は過去設定。

ユーザーが「画像生成依頼ではない」「画像生成するな」と明示した投稿では画像生成を起動しない。

GitHub上で確認できることをユーザーへ再提示要求しない。まずmainの実ファイルを直接fetchしてから判断する。

既知の失敗を再提案する場合は、実験ログ/incidentの棄却理由を解消する新証拠があることを示す。

---

## 1. 現在の目的

直接添付された高品質canonical character imageから、one-shot / loopの主要4時点を生成し、identity、motion semantics、continuity、endpoint、layout、chroma、unintended outputを監査する。

高解像度canonical（1024x1536加工前候補）は、以前の約164x372派生版よりidentity fidelityが明確に良い。

ただし、2026-08-08に導入した**same-turn frame-first方式は実機で失敗した**。

失敗した方式:

```text
motion request
  -> F1 single-frame generation
  -> F2 single-frame generation
  -> F3 single-frame generation
  -> F4 single-frame generation
  -> Python compose
  -> failed-frame repair
```

実機ではINITIAL 4回 + REPAIR 4回 = **8回すべてが単独frameではなくmulti-pose sequence sheet**になった。

そのため、現行GitHubのframe-first Project設定を「実証済み本番方式」と扱わない。

詳細:
`research/incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`

---

## 2. 現行GitHub構成と注意

Project Instructions:
- `project/instructions/project-instructions.md`
- 実験時: `project/instructions/post-generation-review-test.md`

Project Sources:
- `project/sources/production/01-character-identity.md`
- `project/sources/production/02-motion-design.md`
- `project/sources/production/03-keypose-board-spec.md`
- `project/sources/production/04-imagegen-workflow.md`
- `project/sources/production/05-post-generation-audit.md`

主要Python:
- `audit/scripts/compose_keypose_board_from_frames.py`
- `audit/scripts/machine_audit_board.py`
- `audit/scripts/remove_chroma_key.py`
- `audit/scripts/build_motion_strip.py`

`four-pose-portrait.png`はChatGPT Project Sourceから退役。
GitHubのSVG/generatorは過去仕様・デバッグ用に残す。

**重要:** 上記Project Instructions/Sourcesは現在frame-firstを記述しているが、そのsame-turn 4-job実装は直近実験で失敗済み。次の切り分け前に「CURRENTで成功している」と解釈しない。

---

## 3. canonical / identityの確定事項

canonicalは生成する現在のチャットへ直接添付する。
Project Source内画像、別チャット画像、過去生成frameをidentity正本へ昇格させない。

複数候補がある場合はユーザー指定を優先。指定がない場合は、加工前に近く、全身が見え、固有ディテールを読み取れる最高品質・高解像度画像を使う。

現在のキャラクターでは1024x1536の`kokyo_base_20260805.png`相当の高解像度正本候補を使う。

identityは雰囲気一致でPASSにしない。少なくとも以下を確認する。
- proportions
- silhouette
- topology
- part count
- attachment position
- left/right relation
- overlap order
- occlusion map

帽子と髪のように「どの部品がどこを覆い、どの境界から見えるか」もidentityに含める。

---

## 4. 確認済みの実機事項

- 生成後の対話モデルによる実画像レビューは動作した。
- 生成画像実ファイルをPythonへ渡してmachine auditできた。
- GitHubから監査scriptを取得して同一turnで実行できた。
- direct 2x2生成ではactive limb交換、one-shot endpoint復帰、identity drift、shadow/divider/label等が頻発した。
- full-board repairはlayoutを直す代わりにendpoint/chroma等をregressionさせた。
- 4独立repair boardから象限を寄せ集める方式はcontinuity/identityを壊した。
- generated INITIALを同一turnで確実なimage edit targetへ再投入する経路は確認できなかった。
- 空Projectの単独静止ポーズ依頼では人物1人1枚が成立した。
- 高解像度canonicalでidentityが改善した。
- `four-pose-portrait.png`を除去しSourcesをframe-firstへ書き換えても、motion request内のsame-turn 4 image-generation jobsは8/8でsequence sheet化した。
- repair promptで`no sheet / no 2x2 / one person only`をさらに強化してもsheet化は止まらなかった。

したがって、単純な禁止文追加でsame-turn frame isolationを実現できるとは考えない。

---

## 5. 次に行う切り分け

**次は大量生成しない。1 image generationだけでよい。**

実際のMYGPT Projectで、現在の高解像度canonicalを直接添付して、motionではなく静止ポーズとして次だけを依頼する。

> このキャラクターが、正面を向いたまま右手を胸の高さに置いている全身画像を1枚作ってください。

条件:
- F1/F2/F3/F4を作らない
- motion contractを画像生成へ展開しない
- repairなし
- Python composeなし
- image generationは1回だけ

判定:

### 単独人物1枚になる

Project Sourcesそのものは静止ポーズ生成を阻害していない。
失敗原因はmotion-level context / same-turn multi-job architecture側と判断する。
`4 same-turn image-generation jobs = isolated frames`をREJECTEDにする。

次の設計候補は:
- 1回のsequence-source生成 + Pythonで人物セル抽出/再構成
- 1 user/assistant turnにつき1 raw frame
- 真のisolated worker/subagentを使える別実行環境

### またsequence sheetになる

現在のProject Instructions/Sourcesのどこかが静止ポーズまでsequence化している。
再度Source構成を切り分ける。

---

## 6. やらないこと

- 同じ4 INITIAL + 4 REPAIRを、禁止文だけ強くして再試行しない。
- 8/8 sheet化したsame-turn frame-first方式を成功済みとして扱わない。
- `four-pose-portrait.png`をProject Sourceへ戻さない。
- 低解像度canonicalへ戻さない。
- 4独立boardの象限寄せ集めrepairへ戻さない。
- same-turn generated image editを必須前提にしない。
- identityを色・雰囲気だけでPASSにしない。

---

## 7. 作業時の報告順

ユーザーへの報告は、まずユーザーが次に行う必要がある作業を先頭に置く。
その後にテスト条件、変更内容、コミット等の技術詳細を書く。

ユーザー側作業がない場合は「ユーザー側の作業なし」と明示してから技術内容を書く。

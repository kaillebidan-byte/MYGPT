# MYGPT調整プロジェクト 引継ぎ

更新日: 2026-08-08

この文書はMYGPT調整の新しい会話を開始するときの短い作業コンテキストである。
ChatGPT Project本番へ投入するProject Instructionsではない。

**作業を始める前に必ず `research/MOTION-GENERATION-EXPERIMENT-LOG.md` を読む。**
失敗方式・解釈変更・確定事項は同ログを正本とし、チャット記憶だけで過去方式へ戻さない。

---

## 0. 最重要事項

本番環境はChatGPT Project「MYGPT」。
GitHub repositoryは`kaillebidan-byte/MYGPT`。
Custom GPTは本番経路ではなく、`legacy/custom-gpt/`は過去設定。

ユーザーが「画像生成依頼ではない」「画像生成するな」と明示した投稿では画像生成を起動しない。

GitHub上で確認できることをユーザーへ再提示要求しない。まずmainの実ファイルを直接fetchしてから判断する。

既知の失敗を再提案する場合は、`MOTION-GENERATION-EXPERIMENT-LOG.md`の棄却理由を解消する新証拠があることを示す。

---

## 1. 現在の目的

直接添付された高品質canonical character imageから、one-shot / loopの主要4時点を生成し、identity、motion semantics、continuity、endpoint、layout、chroma、unintended outputを監査する。

現在は**frame-first方式**を検証中。

```text
high-quality canonical directly attached
        |
        v
motion contract F1 -> F2 -> F3 -> F4
        |
        v
4 visual jobs
(one person / one pose / one image each)
        |
        v
compose_keypose_board_from_frames.py
        |
        v
raw 1024x1536 2x2 board
        |
        +--> visual review
        +--> machine_audit_board.py
        |
        v
failed frames only: one repair round
        |
        v
recompose / re-audit / select
```

画像生成モデルへ2×2 boardを直接描かせない。
2×2 geometry、共通倍率、baseline、safe gap、外周余白、board key色統一はPythonの責務。

---

## 2. 現行GitHub構成

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

`four-pose-portrait.png`は**ChatGPT Project Sourceから退役**。
GitHubの`audit/references/layout-guides/four-pose-portrait.svg`とguide generatorは過去仕様・デバッグ用に残すが、画像生成モデルへ参照させない。

---

## 3. canonicalの現在ルール

canonicalは生成する現在のチャットへ直接添付する。
Project Source内画像、別チャット画像、過去生成frameをidentity正本へ昇格させない。

複数候補がある場合はユーザー指定を優先。指定がない場合は、加工前に近く、全身が見え、固有ディテールを読み取れる最高品質・高解像度画像を使う。

現在のキャラクターでは、以前使っていた約164×372版より、加工前候補の1024×1536版でidentity fidelityが明確に改善した。

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

- 生成後の対話モデルによる実画像レビューは実際に動作した。
- 生成画像実ファイルをPythonへ渡してmachine auditできた。
- GitHubから監査scriptを取得して同一turnで実行できた。
- direct 2×2生成ではactive limb交換、one-shot endpoint復帰、identity drift、shadow/divider/label等が頻発した。
- full-board repairはlayoutを直す代わりにendpoint/chroma等をregressionさせた。
- 4独立repair boardから象限を寄せ集める方式はcontinuity/identityを壊した。
- generated INITIALを同一turnで確実なimage edit targetへ再投入する経路は確認できなかった。
- 空Projectでは単独ポーズ指示が人物1人1枚として成立した。
- したがってMYGPTでの2×2化はcanonical画像そのものよりProject Instructions/Sourcesの条件付けが主因候補だった。
- 高解像度canonicalでidentityが改善した。

詳細な遷移と棄却理由は`research/MOTION-GENERATION-EXPERIMENT-LOG.md`を正本とする。

---

## 5. 現在の次テスト

ChatGPT Project側で事前に行うこと:
1. `four-pose-portrait.png`をProject Sourceから削除する。
2. Project InstructionsをGitHub最新版の`post-generation-review-test.md`へ置き換える。
3. Production Sources 01〜05をGitHub最新版へ差し替える。

新しいチャットへ1024×1536の高解像度canonicalだけを直接添付する。

テスト依頼:

> このキャラクターが、右手を胸の高さまで上げて、その位置で止まるone-shotモーションを作ってください。

期待する生成:

```text
F1: 人物1体の単独画像
F2: 人物1体の単独画像
F3: 人物1体の単独画像
F4: 人物1体の単独画像
```

画像生成モデルが作る2×2画像は0枚。
最終2×2は`compose_keypose_board_from_frames.py`によるPython合成物だけ。

確認項目:
- 4 jobとも1人物1画像か
- 4 jobとも同じcanonicalへ再アンカーできているか
- 帽子/髪/袖/腰装飾/下衣/靴のidentity
- 同じ右腕をF2→F3→F4で追えるか
- F4が指定位置で停止しているか
- Python合成後にlayout/chromaが機械監査PASSするか

---

## 6. 作業時の報告順

ユーザーへの報告は、まず**ユーザーが次に行う必要がある作業**を先頭に置く。
その後にテスト条件、変更内容、コミット等の技術詳細を書く。

ユーザー側作業がない場合は「ユーザー側の作業なし」と明示してから技術内容を書く。

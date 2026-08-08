# Web調査検索台帳

更新日: 2026-08-08 JST

このファイルは、MYGPT調整で同じWeb検索を何度も繰り返さないための検索台帳。

新しいWeb調査を始める前に、まずこのファイルと該当topic noteを読む。
既に確認済みの論点は、次のいずれかがある場合だけ再検索する。

- 公式仕様・モデル・ChatGPT UIが更新された
- 新しい実機結果が既存解釈と衝突した
- 前回は一次資料へ到達できなかった
- 前回とは異なる因果仮説を検証する
- 前回検索から時間が経ち、変化し得る情報の再確認が必要

単に言い換えただけの検索を繰り返さない。

---

## 記録形式

各調査は最低限、次を残す。

- `ID`
- 調査日
- 調査目的
- 実際に使った主要検索語
- 確認した一次資料 / 補助資料
- 確認できたこと
- 確認できなかったこと
- MYGPTへの意味
- 次に検索するならどの別角度か

状態:

- `DONE`: 現在の問いには十分な資料がある。新証拠なしに同じ検索を繰り返さない。
- `PARTIAL`: 一部だけ確認。未解決角度が明記されている。
- `STALE`: 時点依存で再確認が必要。
- `NO-HIT`: 有用な資料へ到達できなかった。検索語を変える。

---

## Topic index

### R01 — ChatGPT Projectsのcontext / memory / Instructions / Sources
Status: DONE for basic Project behavior

保存先:
- `reading-list.md`
- `patterns-and-pitfalls.md`

既確認:
- Projectはchat / files / Project Instructions / memoryを共通作業contextとして扱う。
- 同じProject内の過去chatやfilesが将来chatのcontextになり得る。
- Project InstructionsはProject内で適用される。
- 長期作業ではGitHub等をdurable stateとして使い、会話履歴だけを正本にしない運用が有効。

今後同じ一般論を再検索しない。
再検索するなら「image generation toolへProject contextのどの部分が実際に渡るか」のような、より狭い実装境界を調べる。

---

### R02 — Project内画像参照 / character identity
Status: DONE for current production decision

保存先:
- `image-reference-notes.md`
- `MOTION-GENERATION-EXPERIMENT-LOG.md`

既確認:
- Project Source画像だけのidentity経路はMYGPT実機で安定しなかった。
- canonicalは生成する現在のchatへ直接添付する。
- 高解像度canonical 1024x1536は低解像度派生版よりidentity fidelityが明確に良かった。
- generated frameをcanonicalへ昇格させない。

今後同じ「Project file画像か直接添付か」の一般検索を繰り返さない。
再検索するなら、最新GPT Imageのreference-image fidelity、複数referenceのidentity binding、pose transferなど別角度にする。

---

### R03 — motion orchestration contextによるmulti-panel / sequence-sheet化
Status: PARTIAL — 原因候補は絞れたがChatGPT Project内部境界は未公開

詳細:
- `imagegen-orchestration-context.md`
- `../incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`

2026-08-08の主要検索語:

```text
site:openai.com image generation API prompt input images GPT Image multi image instruction following
site:platform.openai.com/docs image generation images input prompt reference image instructions
site:help.openai.com ChatGPT Projects instructions files image generation project context
site:developers.openai.com image generation gpt-image-1.5 prompt image input reference editing
site:developers.openai.com/api/docs/guides image generation tool responses input_fidelity image references
text to image sequence storyboard multi panel prompt image model compositional bias montage benchmark
site:arxiv.org text-to-image multi-panel storyboard single image sequence prompt compositional generation panels
site:community.openai.com image generation storyboard multiple panels one prompt ChatGPT Images
```

確認済み一次資料:

1. OpenAI Help — Projects in ChatGPT
   - https://help.openai.com/en/articles/10169521-projects-in-chatgpt
2. OpenAI API — Image generation
   - https://developers.openai.com/api/docs/guides/image-generation
3. OpenAI Cookbook — GPT Image Generation Models Prompting Guide
   - https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
4. OpenAI — ChatGPT Images 2.0 System Card
   - https://deploymentsafety.openai.com/chatgpt-images-2-0
5. OpenAI Help — Images in ChatGPT
   - https://help.openai.com/en/articles/11084440-chatgpt-images-faq

補助資料:

- OpenAI Developer Community — multiple separate images become one multi-panel image
  - https://community.openai.com/t/prompting-issue-multiple-separate-images-become-one-multi-panel-image/1380708
- T2I-CompBench
  - https://arxiv.org/abs/2307.06350
- GenAI-Bench
  - https://arxiv.org/abs/2406.13743
- TheaterGen
  - https://arxiv.org/abs/2404.18919
- Make-A-Storyboard
  - https://arxiv.org/abs/2312.07549

現在の要点:

- OpenAIのResponses API画像生成はconversation / multi-step flow内で動き、mainline modelが画像生成用promptを自動改稿する仕様が公開されている。
- APIで`n`未指定なら返る画像オブジェクト数は1。したがって「1画像オブジェクト内部が2x2になる」現象と「4画像を生成する」機能は別問題。
- GPT Image prompting guideはmulti-panel compositionを明示的な対応用途として挙げ、story/comicではsequenceのvisual beatをpanelへ割り当てる例を示す。sequence / storyboard / panel等はmulti-panel表現と強く結び付く語彙。
- 同guideは、長いpromptを一度に詰め込むよりclean base promptからsmall single-change iterationを行う方がdebugしやすいとしている。
- 人物pose/actionはfull body、gaze、hands、interaction等を具体的に書くことが推奨される。
- ChatGPT Projects自体がfiles / instructions / chatsを共有contextとして使うため、同じ隔離Project内で複数条件を順番に試すとcross-test contaminationを排除できない。

未確認:

- ChatGPT Projectの画像生成時に、Project Instructions / Sources / user motion request / assistant planningのどこまでが実際のgeneration-facing revised promptへ入るか。
- ChatGPT UIで内部のrevised promptを観測する方法があるか。
- same-turnの複数image generation call間で、先行callのsemantic planがどの程度後続callへ保持されるか。
- ChatGPT Images 2.0 thinking経路と通常画像生成経路でsheet化確率が異なるか。

次にWeb検索するなら:

1. `ChatGPT revised prompt image generation inspect` / `image generation revised prompt ChatGPT UI` の実装境界。
2. `GPT Image 2 single character sequence unintended contact sheet` の最新Developer Community実例。
3. `conversation context image_generation tool prompt rewrite previous_response_id` のResponses API挙動。
4. character consistencyではなく、`pose-conditioned identity preservation single frame`の研究。

上の4角度以外では、まず既存資料を再利用する。

---

## Web調査運用ルール

今後Web検索したturnでは、MYGPTの設計判断に使った情報だけをこの台帳かtopic noteへ追記する。
検索結果を大量保存せず、次の調査者が「何をもう調べなくてよいか」と「次に何を調べるべきか」を判断できる密度にする。

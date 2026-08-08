# Image generation orchestration context調査

更新日: 2026-08-08 JST

対象:
ChatGPT Projectで、1つのone-shot motion要求から4回の単独frame生成を行おうとすると、各callが単独portraitではなく2x2 sequence sheetへ崩れる現象。

実機正本:
- `../incidents/2026-08-08-frame-first-same-turn-sheet-collapse.md`
- `../MOTION-GENERATION-EXPERIMENT-LOG.md`

この文書は外部資料側の根拠をまとめる。実機結果を外部資料で上書きしない。

---

## 1. 現在の実機事実

MYGPT実機では以下が成立している。

- 高解像度canonicalを直接添付した単発静止ポーズ要求は、1人物・1ポーズ・1 portraitとして成功。
- 同じcanonicalでfull motion workflowを走らせると、旧Projectでも完全新規Projectでも各frame callがsequence sheet / 2x2へ崩れた。
- 旧Project chat削除後も再現したため、旧chat historyだけが主因ではない。
- full motion workflow内でも1回だけ単独portraitが出たためhard ruleではなくcontext-sensitive / probabilistic。

したがって外部調査では、canonical品質ではなく`conversation context / prompt rewriting / multi-panel affordance / orchestration`を優先して調べる。

---

## 2. OpenAI公式: 会話型画像生成はconversation context内で動く

Source:
https://developers.openai.com/api/docs/guides/image-generation

OpenAI APIのImage generation guideでは、Responses APIの画像生成はconversationやmulti-step flowの一部として動き、image inputs / outputsをcontext内で扱えると説明されている。

またmulti-turn image generationでは、前のimage generation outputや`previous_response_id`をcontextとして次の生成へつなげられる。

### MYGPTへの意味

ChatGPT Project内部実装がResponses APIと完全に同一だとは断定できない。
ただし、OpenAIが会話型画像生成を「そのcallの短い文字列だけで独立する画像API」としてではなく、conversation contextを利用する系として公式に提供していることは確認できる。

そのため、same-turn 4call試験で「各callに1ポーズの文しか書かなければglobal motion contextは画像生成側から見えない」と仮定するのは危険。

---

## 3. OpenAI公式: mainline modelが画像用promptを自動改稿する

Source:
https://developers.openai.com/api/docs/guides/image-generation

Responses APIのimage generation toolでは、mainline modelがimage generation用promptを自動的にrewrite / reviseし、結果には`revised_prompt`フィールドが存在する。

### MYGPTへの意味

これは今回のsheet化原因候補として重要。

仮に会話モデル側でlocal instructionを

```text
人物1体。正面。右手をみぞおちまで上げた静止画。
```

まで短くしても、generation-facing promptがその文字列と完全一致する保証はない。
mainline modelがuserのmotion要求、Project Instructions、会話内plan等を踏まえて「意図を満たす」promptへ拡張する可能性がある。

この公式仕様は、MYGPTで観測した

- local prompt自体はかなり具体的
- それでも2x2 sequence sheet化

という実機結果と整合する。

ただし、ChatGPT Project内部で同じ`revised_prompt`機構がそのまま使われていることまでは公開資料から確認できない。

---

## 4. OpenAI公式: 1 image objectとmulti-panel imageは別

Source:
https://developers.openai.com/api/docs/guides/image-generation

Image APIでは`n`で一度に複数画像を要求でき、defaultでは1 imageが返る。

一方、GPT Image prompting guideは`multi-panel compositions`をモデルの対応用途として挙げている。

Source:
https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide

同guideのstory-to-comic例では、1つの生成画像の内部に4 panelsを作り、各panelへ時系列のvisual beatを割り当てている。

### MYGPTへの意味

MYGPTで起きている「1生成結果が2x2になる」は、4 image objectsを返したのではなく、1 image object内部でmulti-panel compositionを生成している。

つまり対策対象は「生成枚数」だけではなく、画像モデルがprompt/contextを`sequenceを一枚へ可視化する構図`として解釈すること。

また、`motion / sequence / four chronological states / storyboard / panel / board`のような概念をgeneration-facing contextへ大量に置くことは、モデルが公式に得意とするmulti-panel representationを呼び出す方向へ働く可能性がある。

---

## 5. OpenAI公式: promptを詰め込み過ぎず、人物poseを具体化する

Source:
https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide

Prompting guideでは次の方針が示されている。

- 長いprompt自体は扱えるが、debugのためにはclean base promptからsmall / single-change follow-upでiterativeに進める方がよい。
- 人物ではbody framing、gaze、object interaction、full body visibility、hands等を具体的に指定する。
- framing / viewpoint / perspective / placementを明示するとcomposition controlに有効。
- preserveすべきものは明示する。

### MYGPTへの意味

ユーザー指摘の

> 短い自然言語motionだけでなく、1枚ごとの具体的な静止ポーズを入れる

は公式prompting guidanceとも整合する。

ただし、今回の本質は「local pose detailを増やす」だけではない。
同じgeneration-facing contextに4状態・board・repair等のglobal概念が残っていれば、詳細化した1ポーズとsequence全体の両方を満たすためにsheet化する可能性が残る。

---

## 6. OpenAI公式: ChatGPT Projectは共有contextを持つ

Source:
https://help.openai.com/en/articles/10169521-projects-in-chatgpt

Projectsは関連するchat、files、Project Instructionsを一つのworkspaceへまとめ、Project memoryは同Project内のchatやfilesを利用できる。

### MYGPTへの意味

隔離実験で「完全新規Project」を使った判断は正しい。

さらに次の実験では、同じ隔離Project内でTest A、Test B、Test Cを順番に行うことも避ける。
前のtest chatが後のtestへ参照され得るため、条件間の独立性が落ちる。

**今後の比較実験は原則として1 condition = 1 clean Projectとする。**

---

## 7. OpenAI公式: ChatGPT Images 2.0には複数画像生成能力がある

Sources:
- https://deploymentsafety.openai.com/chatgpt-images-2-0
- https://help.openai.com/en/articles/11084440-chatgpt-images-faq

ChatGPT Images 2.0のsystem cardでは、thinking modeがreasoning / tool useを画像生成へ統合し、単一promptから複数画像を生成する能力も説明されている。

### MYGPTへの意味

ChatGPT UI側が「1 user intentから複数のvisual outputsを組み立てる」能力を持つこと自体は確認できる。
しかし、MYGPTの失敗は4 separate image objectsではなく1枚内部の2x2なので、これを直接の原因証拠とはしない。

モデル/UI更新でorchestration behaviorが変わり得ることを示す時点依存情報として扱う。

---

## 8. OpenAI Developer Community: 別用途でもmulti-image要求が1 multi-panelへ潰れる報告

Source:
https://community.openai.com/t/prompting-issue-multiple-separate-images-become-one-multi-panel-image/1380708

2026-05のDeveloper Communityには、4 separate image objectsを要求したのに1 multi-panel imageへ統合される問題の報告がある。
OpenAI_Support名義の回答では、collage / grid / split-screenは1 image objectであり、4 separate image objectsとは別だと説明されている。

### MYGPTへの意味

MYGPT固有ではない類似現象が少なくとも利用者側でも報告されている。

ただし回答の回避策は「4 separate imagesを明示する」というprompt-level対策であり、MYGPTでは`no sheet / no 2x2`等を強化しても8/8 sheet化した実機結果がある。
したがってこのcommunity workaroundをそのままproductionへ採用しない。

---

## 9. 学術資料: compositional / multi-turn / story consistencyは独立した難題

### T2I-CompBench
https://arxiv.org/abs/2307.06350

複数object、attribute、relationshipを持つcomplex compositional promptでT2Iモデルが苦戦することを評価。

### GenAI-Bench
https://arxiv.org/abs/2406.13743

attribute / relationship / higher-order compositional instructionの難しさを評価。

### TheaterGen
https://arxiv.org/abs/2404.18919

multi-turn image generationでsemantic consistencyとsame-subject contextual consistencyが課題であることを扱う。

### Make-A-Storyboard
https://arxiv.org/abs/2312.07549

story visualizationでは、独立image同士のcharacter / scene consistencyを維持するため専用のcontrol architectureを提案。

### MYGPTへの意味

4frameを完全独立にすればすべて解決する、とは言えない。
sequence sheet化を止めても、独立生成間のidentity / continuityは別問題として残る。

よって現在の優先順位は:

1. まず1 image call = 1 portraitを成立させる。
2. その後に4 independent outputs間のidentity / continuityを評価する。
3. sheet化対策とidentity対策を同時に混ぜない。

---

## 10. 次回隔離テストを変更する

旧案:
- 1 clean Projectでmotion requestを受ける
- 内部で4 statesを作る
- same-turnで4 image calls

新案では、因果を一段ずつ分ける。

### CONTROL-STATIC — 既実施、再実行しない

同じ高解像度canonicalで静止ポーズ1回は単独portrait PASS済み。
新証拠がない限り同じcontrolを繰り返さない。

### TEST M1 — motion context + 1 image call only

**専用の完全新規Projectを1つ作る。**

条件:
- Sources 0
- old chats 0
- high-resolution canonicalを直接添付
- board / sheet / panel / 2x2 / compose / audit / repair語彙なし
- userは自然なmotion要求を1回だけ行う
- assistantは4状態workflowを計画しない
- assistantはmotion中の具体的な1静止時点だけを選び、画像生成は1回だけで終了

例としてearly state:
- 正面直立
- 左腕・脚・体幹・頭はcanonical基準
- キャラクター自身の右肘を軽く曲げる
- 右手をみぞおち付近
- 右袖だけ追従

判定:
- M1がsheet化 → `motion requestそのもの + conversational prompt rewrite`だけでもsequence表現を誘発し得る。same-turn 4call以前の問題。
- M1が単独portrait → motion request単独では十分条件でない。4-state planning / repeated calls / Project global workflowへ進む。

### TEST M2 — motion context + same-turn 4 calls

**M1とは別の完全新規Project。**

条件:
- M1と同じ最小環境
- user motion requestは同じ
- assistantは4具体poseを内部で決める
- 生成前に4つ全部を可視列挙しない
- image generationを4回
- 各時点ではそのposeだけを具体的に扱う
- repair / audit / composeなし

判定:
- call 1からsheet → 4-state orchestration plan自体がgeneration-facing rewriteへ漏れる候補。
- call 1は単独、後続だけsheet → repeated call / accumulating context候補。
- 4回単独 → full production Instructions/Sourcesのglobal workflow contamination候補が強い。

### TEST S4 — 4 fresh static-pose chats

M2が失敗した場合にだけ行う。

4つの完全新規Projectまたは完全に独立したcontextで、A/B/C/Dをそれぞれ単発の静止ポーズ要求として1回ずつ生成する。

目的:
- 各poseそのものの難しさとmotion orchestration問題を分離する。
- 特定poseだけsheet / identity破綻する場合、orchestrationではなくpose complexityの問題を疑う。

### 実験順序

```text
existing STATIC control PASS
        ↓
M1: motion request + 1 call
        ↓
M1 PASSなら M2: motion request + 4 calls
        ↓
M2 FAILなら必要に応じて S4: each pose in fresh context
```

M1でFAILした場合、M2をすぐ実行しても原因分離に寄与しにくいため一旦止める。

---

## 11. 現在の最有力仮説

まだCONFIRMEDではない。

### H1 — conversation-level prompt rewrite contamination

userのmotion intentやProject global workflowがmainline modelのprompt rewriteへ入り、local 1-pose requestを「motion sequenceを可視化する画像」として再解釈している。

支持:
- static control PASS
- local pose promptが具体的でもsheet化
- OpenAI Responses APIではmainline modelによるrevised promptが公式仕様
- GPT Image自体はmulti-panel compositionに対応

未確認:
- ChatGPT Project内部が同じrewrite経路か

### H2 — repeated/same-turn image-call semantic accumulation

1 call目の意図や4-state planが後続callへ残り、後続ほどsequence representationへ寄る。

支持:
- conversation-based image generationはmulti-turn contextを扱う

反証候補:
- 過去はINITIAL 4/4がsheet化しており、1 call目から崩れているrunもある

### H3 — full Project Instructions / Sources vocabulary contamination

board / 4 states / compose / audit / repair等のglobal workflow vocabularyがgeneration-facing contextへ混入する。

支持:
- full new Projectではsheet化
- 同じProjectでstatic single poseはPASS

次のM1/M2でH1/H2と分離する。

---

## 12. 今はやらない

- `no sheet / no 2x2`をさらに大量追加する。
- 旧direct 2x2へ戻る。
- one-shot endpoint等、別問題を同じtestへ混ぜる。
- M1とM2を同一Projectで実施する。
- static controlを理由なく再生成する。
- community prompt templateだけを根拠にproductionへ反映する。

---

## 13. 次にWeb検索する角度

同じ一般検索を繰り返さず、次は以下だけを優先する。

1. ChatGPT UIでimage generationの`revised prompt`相当を観測できるか。
2. Responses APIの`previous_response_id` / conversation stateがimage prompt rewritingへ与える具体的影響。
3. GPT Image 2で`single character + motion wording`がcharacter sheet / contact sheetへ崩れる最新事例。
4. identityを維持しつつposeだけ変えるreference-image / pose-conditioned generation研究。

これらを調べたら`search-ledger.md`へ検索語・結論・未解決点を追記する。

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

### R04 — 中国語圏の角色一致性 / 姿势控制 / 分镜 / 多图参考
Status: DONE for first China-region sweep / PARTIAL for ChatGPT-specific pose-reference binding

詳細:
- `china-imagegen-practices.md`

2026-08-08の主要検索語:

```text
GPT-4o 生图 角色一致性 参考图 姿势 动作 多轮 经验
ChatGPT 项目 Projects 图片 参考图 文件 角色一致性 项目指令
GPT Image 四宫格 分镜 多图 合成 单图 提示词 角色 一致性
GPT-4o 生图 角色一致性 三视图 九宫格 参考图 动作
角色一致性 姿势草图 参考图 动作 控制 多图参考
GPT4o 多轮编辑 一致性 角色 图片 退化
即梦 AI 图片4.0 多图参考 角色一致性 动作 草图
Seedream 4.0 多图参考 角色一致性 动作 参考图
可灵 AI 多图参考 角色一致性 姿势 动作
Vidu 参考生图 / 参考生视频 一致性 动作
```

新しく確認した一次資料:

1. ByteDance Seed — Seedream 4.0
   - https://seed.bytedance.com/zh/seedream4_0
2. 火山引擎 — Seedream 4.0 release / technical introduction
   - https://developer.volcengine.com/articles/7599494661565005870
3. 快手科技 — 可灵AI「多图参考」
   - https://ir.kuaishou.com/zh-hans/news-releases/news-release-details/kuaishoukelingaituichuduotucankaogongneng/
4. Vidu — 参考生视频
   - https://www.vidu.com/zh/ai-reference-to-video
5. GPT-ImgEval
   - https://arxiv.org/abs/2504.02782
6. I2EBench2.0
   - https://arxiv.org/abs/2606.15570

補助的な実務資料:
- Bilibili / RunningHubの角色一致性、草图动作、姿势参考、ComfyUI workflow
- 掘金 / 53AI / 知乎のGPT-4o / 国内画像モデル実践記事

中国語圏で英語圏調査より目立った違い:

- `identity / pose / scene / style / structure`を自然言語一つへ詰めず、**複数referenceやvisual control channelへ役割分離する**発想が強い。
- Seedream 4.0公式は多图输入に加え、草图・涂鸦・辅助线をvisual control signalとして明示している。
- 可灵 / Viduも複数referenceを角色、服装、场景、动作、构图等の制御に使うproduct architectureを前面に出している。
- 中国の分镜 / 短剧 / ComfyUI実務では`草图动作`、`姿势参考`、OpenPose等を使い、角色一致性とpose controlを別工程として扱う例が多い。
- 一方で`分镜 / 组图 / 四宫格 / 九宫格`は積極的な成功ユースケースでもあるため、これらの語彙をsingle-frame生成contextへ置くとmulti-panel表現へ寄る警告としても読める。
- 中国研究チームもmulti-round editingをsingle-roundとは別のstability問題として評価しており、generated frameを次roundのidentity正本に連鎖させないMYGPT方針と整合する。

MYGPTへの新候補仮説:

- `H-CN1`: text poseだけで不安定なら、**canonical identity image + single-pose visual guide**を別referenceにする試験価値がある。
- `H-CN2`: 複数referenceを使う場合はidentity / pose / color-material等の役割を明示的に分ける。ただしChatGPT Imageでrole bindingが成立するかは未検証。
- `H-CN3`: multi-round generated-image chainはidentity pathにしない。各generationでcanonicalへ戻る。

現在のM2b / M2cより前にH-CN1/H-CN2をproductionへ入れない。

次に中国語圏だけで検索するなら:

1. ChatGPT Images / GPT Image 2で`参考图 + 姿势图`を同時入力した実機例。
2. `角色参考 + 动作参考`間のidentity/pose混線失敗例。
3. 中国AIGC短剧で4 keyframesを独立生成する方式と一括分镜方式のproduction比較。
4. 可灵 / Vidu / Seedreamのreference-role binding仕様。
5. garment accessory topologyまで見るfine-grained identity consistency benchmark。

同じ`GPT-4o角色一致性很强`という一般検索は繰り返さない。

---

### R05 — single-frame hand placement relative to a visible landmark
Status: PARTIAL — no documented guarantee found

調査日: 2026-08-08

調査目的:
W2でhand shapeは改善したが、`胸の花紋の少し下 / 明確な隙間 / 重ねない`というtext-only spatial constraintでも指先が花紋へ近づきすぎたため、次のlocal-packet refinement前に公式OpenAI資料で既存の位置指定原則を確認する。

主要検索語:

```text
site:developers.openai.com/cookbook image generation prompting guide spatial relationship hands relative position landmark
site:developers.openai.com image generation prompt explicit spatial relationship position relative to object hands
site:developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide hands pose spatial relationship exact placement
```

確認した一次資料:
- OpenAI Developers / GPT Image 2 entry and image-generation guidance
- 既にR03で確認済みの OpenAI Cookbook `GPT Image Generation Models Prompting Guide`

確認できたこと:
- 既存OpenAI guidanceは、長い複雑promptへ一度に条件を積むより、working promptからsmall/single-change iterationで評価する方向を支持する。
- 人物のpose/action/handsは具体的に書く方針と整合する。
- GPT Image 2はinstruction followingとhigh-fidelity image inputを主要能力としている。

確認できなかったこと:
- ChatGPT / GPT Imageで、textだけから「手の最上端を胸紋の最下端より一定距離下へ置く」といった厳密なlandmark spacingを保証する公式機構。
- `明確な隙間`や自然言語距離表現のどれが最も再現性が高いかという公式best practice。

MYGPTへの意味:
- W2の位置FAILに対してworker architectureやKnowledgeを変える根拠はない。
- 次に試すなら、local packetのspatial relationだけをより強いwhole-hand / non-overlap / visible-gap表現へ変更するsingle-variable testが妥当。
- それでも位置精度が足りなければ、textをさらに積むよりsingle-pose visual guide / local edit等の別control channelへ移る判断材料になる。

同じ一般検索は繰り返さない。
次に検索するなら、ChatGPT Imagesでlandmark-relative poseをvisual guideで制御した実機例という別角度にする。

---

## Web調査運用ルール

今後Web検索したturnでは、MYGPTの設計判断に使った情報だけをこの台帳かtopic noteへ追記する。
検索結果を大量保存せず、次の調査者が「何をもう調べなくてよいか」と「次に何を調べるべきか」を判断できる密度にする。

# 中国語圏 AI画像生成・一致性運用調査

更新日: 2026-08-08 JST

目的:
既存の英語圏中心のWeb調査を繰り返すのではなく、中国大陸・中国語圏のAI利用者、国内モデル提供者、研究者が「角色一致性 / 姿势控制 / 多轮编辑 / 分镜 / 多图参考」をどう扱っているかを確認し、MYGPTに新しい切り分け角度があるか探す。

この文書は外部知見メモ。MYGPTのproduction正本は`research/PROJECT-HANDOFF.md`、`research/MOTION-GENERATION-EXPERIMENT-LOG.md`、各incident / experiment記録を優先する。

---

## 1. 検索範囲

主要検索語:

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

主に確認した中国語圏ソース:
- 字节跳动 Seed / 火山引擎 Seedream 4.0公式
- 快手科技 可灵AI公式
- Vidu / 生数科技の中国語公式
- BilibiliのAIGC実務・ComfyUI・分镜制作者
- RunningHubの公開workflow
- 掘金 / 53AI / 知乎の実践記事
- 中国研究者によるGPT-ImgEval、I2EBench2.0等の論文

---

## 2. 新知見A — 中国圏では「参照情報の役割分離」が強い

### 公式資料

#### Seedream 4.0 — ByteDance Seed / 火山引擎

Sources:
- https://seed.bytedance.com/zh/seedream4_0
- https://developer.volcengine.com/articles/7599494661565005870

公式説明では、単なるtext + one referenceだけでなく以下を明示的な生成入力として扱う。

- 多图输入 / 多图融合
- 人物身份
- 艺术风格
- 物体结构
- 草图
- 涂鸦
- 辅助线
- 时间约束
- 三维空间等のcontext

つまり中国側のproduction-oriented modelは、`identity / style / structure / pose-composition signal`を一つの自然言語文へ詰め込むより、複数のvisual inputsへ役割分担させる方向へ進んでいる。

#### 可灵AI — 快手

Source:
- https://ir.kuaishou.com/zh-hans/news-releases/news-release-details/kuaishoukelingaituichuduotucankaogongneng/

多图参考では、複数画像から人物、服装、物体、场景、动作を組み合わせる例を公式に示している。

#### Vidu

Source:
- https://www.vidu.com/zh/ai-reference-to-video

Viduは`参考生视频`と`图生视频`を別モードとして説明し、reference側では角色、风格、构图、镜头运动、场景、特效を別の制御対象として扱う。複数referenceも明示的にサポートする。

### MYGPTへの意味

これは現行MYGPTの重要な別角度。

現在は:

```text
canonical identity image
+ text pose description
```

でsingle-frame生成を試している。

中国圏の設計思想からは将来、次の隔離試験が候補になる。

```text
identity canonical image
+ single-pose visual guide（骨格 / 草图 / silhouette等）
+ local text only
```

重要:
- 4pose sheetをpose guideへ戻すという意味ではない。
- `four-pose-portrait.png`は引き続き退役。
- 試すなら**1 generation = 1 single-pose visual guide**。
- ChatGPT Imageが複数referenceをどのようにbindingするかは別途実機確認が必要。

この案はM2b等の現行切り分けを終える前にproductionへ入れない。

---

## 3. 新知見B — 「姿勢は文章だけでなくvisual signalで制御」が実務では普通

中国語圏のBilibili / RunningHub / ComfyUI実務では、角色一致性と姿势控制を別問題として扱う例が多い。

Examples:
- Bilibili: Nano Banana系実演で`草图动作`から人物指定动作を生成する例
- Bilibili: Leonardo AIの角色参考 + 姿势参考を別入力で扱う実演
- RunningHub: `角色+姿势一致性` workflowとして、人物referenceとpose referenceを分ける
- ComfyUI系: OpenPose / lineart / depth等をpose / composition controlへ使う

Sources:
- https://www.bilibili.com/video/BV1kpagzFEuK/
- https://www.bilibili.com/video/BV1yn4y197Dr/
- https://www.runninghub.cn/post/1905189470482649090

### MYGPTへの意味

現在の問題を

`identity promptが弱い`

とだけ見るべきではない。

実務では:
- identity lock
- pose control
- layout / composition control

を別のチャネルへ分ける発想が一般的。

MYGPTでidentityは高解像度canonicalによりかなり改善済みなので、今後もしtext poseだけで腕位置・袖topology・occlusionが不安定なら、single-pose visual controlを試す根拠になる。

---

## 4. 新知見C — 中国モデルでは「组图 / 分镜」が第一級機能になっている

Seedream 4.0公式は:
- 批量输出
- 组图生成
- 多图融合
- 时间约束を理解するcontext reasoning

を明示している。

中国圏のBilibili / 53AI / 掘金でも、`漫画分镜`、`故事板`、`一次生成多张角色一致图片`を積極的な成功ユースケースとして紹介する記事が多い。

### MYGPTへの意味

これは一見よい知見だが、現行問題には逆方向の警告になる。

中国語圏でも`分镜 / 组图 / 四宫格 / 九宫格`は「複数の時点や構図をまとめて表現する」語彙として強く定着している。

したがってGPT Image側でも、

- motion
- four chronological states
- storyboard / 分镜
- board / sheet / 2x2

を同時に見せれば、single portraitよりmulti-panel representationへ寄るのは自然な挙動として理解できる。

M2aで`POSE A/B/C/D`を同時に露出したところ、実際に3回の2x2 sheetとPOSEラベル描画へ崩れた実機結果と整合する。

---

## 5. 新知見D — 中国研究チームも「multi-roundはsingle-roundより別の難題」と扱う

### GPT-ImgEval

Source:
- https://arxiv.org/abs/2504.02782
- https://github.com/PicoTrex/GPT-ImgEval

中国研究者中心のGPT-4o画像生成評価。multi-round editingを独立項目として比較している。
論文ではGPT-4oにもoriginal content preservation inconsistency、cropping、color bias等の失敗を記録している。
補足結果では編集回数が増えるほどconsistencyが低下すると報告している。

### I2EBench2.0

Source:
- https://arxiv.org/abs/2606.15570

厦门大学 / NUSの研究チーム。single-roundとmulti-round instruction-based image editingを明示的に分けて評価する。
論文本文ではmulti-round editingは「前roundの結果を基に次を編集するため、高いstabilityが必要」と定義している。

### MYGPTへの意味

MYGPTの既存方針:

`generated frameを次generationのidentity canonicalへ昇格させない`

を支持する外部根拠になる。

multi-round editの連鎖は、1roundで小さく生じたidentity / topology / occlusion誤差を次roundへ渡す構造を持つ。

したがってM2bで毎回canonicalを再添付する条件は合理的。

---

## 6. 中国圏で見つかったが、MYGPTへそのまま採用しない知見

### A. 「多轮对话で角色一致性はほぼ解決」という初期レビュー

掘金、53AI、Bilibiliの2025年初期GPT-4oレビューには、`动态记忆`や`多轮一致性很好`という評価が多い。

Examples:
- https://juejin.cn/post/7486873200824778778
- https://www.53ai.com/news/MultimodalLargeModel/2025032667513
- https://www.bilibili.com/video/BV19qoiYkELq/

これは当時の紹介・デモとしては有用だが、MYGPTの構造監査基準より粗い。

MYGPT実機では:
- 房・紐・留め具
- attachment topology
- overlap / occlusion
- sleeve silhouette

まで見るとdriftが残る。

したがって「同じキャラに見える」成功例をproduction判定へそのまま使わない。

### B. 生成物からcharacter sheetを作り、それを次の正本にする方法

中国語圏でも角色设定图 / 三视图 / 多角度sheetを作るworkflowは多い。
しかしMYGPTでは未検証生成物をidentity正本へ昇格させない方針が実機結果から成立している。

新しい高品質canonicalよりgenerated sheetを優先する根拠はない。

---

## 7. 実務文化としての違い

英語圏のChatGPT power-user記事では、自然言語Instructions / Projects / memory / workflow organizationが中心だった。

今回の中国語圏検索では、それよりも:

- 多图参考
- 垫图
- 草图动作
- 姿势参考
- ControlNet / OpenPose
- 主体库
- 分镜管理
- workflow graph

のような**visual control channelを分ける実務語彙**が明らかに多かった。

中国のAIGC利用者、とくに短剧、分镜、电商、数字人、ComfyUI層では「LLMへ全部自然言語で任せる」より、生成工程を分解して制御信号を挿す文化が強い。

これはMYGPTの方向性である:
- generationとpost-processingを分離
- canonicalをdurable identity sourceにする
- Pythonでdeterministic geometryを担当する

と相性がよい。

---

## 8. 現時点でMYGPTへ追加する候補仮説

### H-CN1 — single-pose visual guide仮説

textだけのpose controlが不安定な場合、1枚のcanonical identity + 1枚のsingle-pose skeletal / silhouette guideを別referenceとして渡すと、identityとposeの役割競合を減らせる可能性。

未検証。
M2b / M2cより先に試さない。

### H-CN2 — reference-role separation仮説

将来的に複数referenceを使うなら、各画像を「何の正本か」明確にする:

- identity reference
- pose reference
- color/material reference

ただしChatGPT Imageがrole bindingを確実に守る保証はないため実機検証が必要。

### H-CN3 — multi-round chainをproduction identity pathにしない

中国研究チームのmulti-round benchmarkも、複数roundが別のstability問題を持つと扱っている。

MYGPTの`each generation resets to canonical`方針を維持する。

---

## 9. 次に中国圏だけで検索するなら

今回とは別角度だけを検索する。

1. ChatGPT Images / GPT Image 2で`参考图 + 姿势图`を同時入力した中国語圏実機例。
2. `角色参考 + 动作参考`でidentityとposeが混線した失敗例。
3. 中国AIGC短剧制作で、4 keyframesを独立生成するか一括分镜生成するかのproduction比較。
4. 可灵 / Vidu / Seedreamのreference-role bindingが、複数reference間でどこまで明示可能か。
5. 中国の研究論文でidentity topology / garment accessory consistencyを細粒度に評価するbenchmark。

同じ`GPT-4o角色一致性很强`一般検索は繰り返さない。

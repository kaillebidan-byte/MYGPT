# 中国圏のcharacter consistency先行研究 — 回収メモ

Date: 2026-08-08 JST
Status: RECOVERED PRIOR ART / QUALITY-RESEARCH INPUT

## Why this file exists

この案件では、検索結果をGitHubへ体系的に集積する前に、中国圏のcharacter / identity consistency研究を調べていた形跡が会話側にあるが、current mainから旧検索メモそのものは回収できなかった。

そのため、2026-08-08時点でprimary / official project sourcesを再確認し、MYGPTの品質研究に直接関係する部分だけを再構成する。

これはCURRENT production workerへそのまま追加するKnowledge / promptではない。
既存R0-R2のvalidated architectureを壊さず、次のsingle-variable quality experimentsを設計するためのprior-art noteである。

---

## 1. ByteDance XVerse — identityとpose/style/lightingを分離して扱う

Primary:
- NeurIPS 2025: `XVerse: Consistent Multi-Subject Control of Identity and Semantic Attributes via DiT Modulation`
- ByteDance Intelligent Creation Team
- https://bytedance.github.io/XVerse/
- https://proceedings.neurips.cc/paper_files/paper/2025/hash/0b0153a91f827b14e8bfea4e211362f3-Abstract-Conference.html

Relevant idea:
- subject identityとsemantic attributes（pose / style / lighting）を独立に制御することを研究課題として明示
- reference image由来のidentity情報を、pose等のsemantic controlとentangleさせない方向

MYGPTとの対応:
- canonical = identity anchor
- local static pose packet = pose / semantic state
- workerへ他frame / full motionを見せない

この分離は、MYGPTでcarrier問題を解いた「identity sourceとpose instructionの分離」と方向が一致する。

---

## 2. CharaConsist — 大きな動きでidentity / clothing detailが崩れることを正面から扱う

Primary:
- ICCV 2025: `CharaConsist: Fine-Grained Consistent Character Generation`
- Beijing Jiaotong University / Fudan Universityほか
- https://murray-wang.github.io/CharaConsist/
- https://openaccess.thecvf.com/content/ICCV2025/html/Wang_CharaConsist_Fine-Grained_Consistent_Character_Generation_ICCV_2025_paper.html

Relevant finding:
- foreground characterのmotion variationが大きくなるとidentityやclothing detailsの不一致が顕在化すると明記
- training-freeでpoint-tracking attention / adaptive token merge / foreground-background decouplingを用い、fine-grained character consistencyを狙う

MYGPTとの対応:
- 実機でも全身identity全体ではなく、動く大袖とvisible handにdriftが局所化した
- broad prompt追加ではなく、active sleeve topologyとhand articulationだけを局所制約したW1-W4方針と整合

示唆:
- quality改善は「character descriptionを長くする」より、動作で壊れる局所部位を特定してidentity constraintを局所化する方が筋が良い

---

## 3. Zhejiang University ContextGen — identity preservationとlayout controlの分離

Primary:
- ICLR 2026: `ContextGen: Contextual Layout Anchoring for Identity-Consistent Multi-Instance Generation`
- ReLER Lab, CCAI, Zhejiang University
- https://github.com/nenhang/ContextGen

Relevant idea:
- user-provided reference imageによるidentity preservationと、instance position / layout controlを同時に扱う
- identityとspatial/layout controlを別問題として設計する

MYGPTとの対応:
- canonical参照とlocal spatial packetを分離
- B/F3の失敗をidentity failureではなくhand-to-landmark spatial compliance failureとして扱ったR1方針と一致

示唆:
- spatial failureをidentity promptで直さない
- landmark / absolute pose packet側を修正し、identity layerを固定する

---

## 4. ByteDance UMO — multi-referenceは自動的に良いわけではなくidentity confusionを起こす

Primary:
- CVPR 2026: `Scaling Multi-Identity Consistency for Image Customization via Multi-to-Multi Matching Paradigm`
- ByteDance Intelligent Creation Lab / UXO Team
- https://bytedance.github.io/UMO/
- https://openaccess.thecvf.com/content/CVPR2026/html/Cheng_Scaling_Multi-Identity_Consistency_for_Image_Customization_via_Multi-to-Multi_Matching_Paradigm_CVPR_2026_paper.html

Relevant finding:
- multi-reference identity conditioningではidentity confusionが問題になる
- reference数を増やすだけではなく、referenceとidentityの対応付け自体を解く必要がある

MYGPTとの対応:
- `four-pose-portrait`やboardをgeneration referenceへ戻さない
- regenerated neutralをcanonicalへ昇格しない
- generated frame chainingをしない

示唆:
- `referenceを増やせばidentityが上がる`とは扱わない
- auxiliary referenceを試す場合も、同一canonicalから切り出した局所detailなど、identity ambiguityを増やさない形でsingle-variable testする

---

## 5. 中国圏production heuristic — identity anchor first

Secondary but operationally relevant:
- Alibaba Cloud developer article: `角色设计功能：从一张图，生成一整套角色一致性资产包`
- https://developer.aliyun.com/article/1740784

It explicitly uses:
- 正面全身・自然立位・中立表情を`身份锚点`として先に固定
- そのanchorから三視図・表情表・姿勢等を派生

MYGPTとの対応:
- `kokyo_base_20260805.png`をF1かつ唯一のcanonical identity sourceにした判断と一致
- regenerated neutralを不採用にしたこととも整合

ただし、MYGPTでは生成した三視図 / sheetをそのままworker referenceへ戻すことはしない。
過去にmulti-pose / sheet conditioningがcarrier collapseを誘発しているためである。

---

## 6. CURRENT architectureに対する結論

中国圏の先行研究から強く支持される方向は、**referenceを増やすことそのものではなく、identityとpose/layoutを分離すること**。

CURRENTの次の式は維持する:

```text
canonical identity anchor
        +
one isolated absolute pose state
        ↓
one generated frame
```

Do not regress to:

```text
identity + multiple poses + board context + previous generated frames
```

---

## 7. Quality-research candidates derived from prior art

R0-R2 production v0は既にgeneralized PASSしているため、以下はproduction fixではなくoptional quality researchとして扱う。

### Q1 — canonical-derived local detail reference

目的:
- large sleeve / waist ornamentなど、全身canonicalでは画素数が少ない局所identity detailを補助できるか

Single-variable A/B:
- A: canonical only
- B: canonical + **canonicalそのものから切り出した1つのdetail crop**
- same worker / same pose packet / same mode

重要:
- generated crop / regenerated viewを使わない
- sheet化しない
- motion情報を含めない
- 1回に1部位だけ

最初の候補はactive large sleeve detail。
W1で局所課題だったうえ、canonicalからlossless crop可能で、new identity interpretationを追加しない。

### Q2 — region-specific identity audit

Chinese consistency researchはfine-grained identity / clothing driftを明示的に扱う。
MYGPTでもwhole-image similarityだけでなく、固定region / topology checklistを標準化する余地がある。

候補region:
- hat / hair
- active sleeve opening / gold trim / grey lining / motif
- non-active sleeve
- waist medallion / cords
- lower garment / shoes

これはgeneration promptを変えずに品質判定を強くできる。

### Q3 — multi-view referenceは後順位

正面以外のviewpointへv0 scopeを広げる段階ではmulti-view identity assetが有用になる可能性がある。

ただしCURRENTでは:
- front-facing baseline camera
- generated neutral already showed reinterpretation drift
- multi-reference identity confusionの先行研究
- sheet conditioning failure history

があるため、今すぐgenerated三視図をproduction referenceへ追加しない。

---

## 8. Decision boundary

このprior artからCURRENT worker instructionを長文化しない。

新しいquality experimentを行う場合:
1. current failure / improvement targetを1つ指定
2. identity layerかpose/spatial layerかを分類
3. one variable only
4. R0/R1/R2のknown-hard poseでA/B
5. carrier / identity / motion / machine auditを同じ基準で比較
6. improvementがなければ追加referenceを撤回

中国圏の研究は、CURRENT isolation architectureを否定する材料ではなく、むしろidentity / pose / layout decouplingの方向を補強する材料として扱う。

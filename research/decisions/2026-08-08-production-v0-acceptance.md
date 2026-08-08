# Production v0 acceptance gate

Date: 2026-08-08 JST
Status: CURRENT ACCEPTANCE CONTRACT

## Purpose

C0で1つのone-shotモーションが通ったことと、MYGPTのproduction成立を同一視しない。
この文書は、現在の実機証拠から無理なく言えるproduction v0の対象範囲とPASS条件を固定する。

## Production v0 scope

対象:
- 1人のcanonical character
- canonical画像の静止姿勢を開始状態とする
- one-shot motion
- 4 keyposes
- F1はcanonical画像そのもの
- F2/F3/F4のみ生成
- 正面基準の共通カメラ
- 均一な高彩度クロマ背景
- 最終成果物はdeterministic post-processingでboard / stripへ構成可能

このv0ではまだproduction成立を主張しない対象:
- loop motion
- canonicalと異なる開始姿勢
- 複数人物
- 大きなカメラ移動 / 視点変更
- 複雑な外部prop / environment interaction
- Thinkingをproduction defaultにすること
- zero-click worker fan-out

対象範囲を広げる場合は、別acceptance gateを追加する。

## A. Input gate

PASS条件:
- 高品質・高解像度canonicalを現在のworker起点へ直接添付する
- generated frameをidentity sourceへ昇格しない
- natural-language motion requestからplannerがmotion全体を理解できる
- F1としてcanonicalをそのまま利用できるmotionである

## B. Planner / isolation gate

Plannerはfull motionを理解してよい。
Workerへ渡すのはF2/F3/F4それぞれの独立local static pose packetだけとする。

各workerに見せない:
- full motion request
- 他のpose packet
- F1/F2/F3/F4というsequence構造
- progress percentage
- board / sheet / storyboard / 2x2
- 他frameの生成画像

各local packetは、そのframeで必要な姿勢をabsolute stateとして記述する。
他frameとの比較表現で姿勢を定義しない。

## C. Worker gate

Validated default:
- minimal Custom GPT
- Instant
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- Knowledge NONE
- canonical直接参照
- current single static poseのみ

Isolation起点は次のどちらでもよい:
1. fresh conversation + canonical再添付
2. clean pre-motion seedからBranch

BranchはN2でcanonical参照継承までPASS済みだが、zero-click orchestrationとは扱わない。

Worker出力PASS条件:
- 1 image
- 1 person
- 1 pose
- full body
- portrait
- no panel / grid / divider / label / number / UI
- requested anatomical side is correct

## D. Identity / continuity gate

Production-blocking failureなしを要求する対象:
- proportions / major silhouette
- hat / hair relation
- non-active sleeve topology
- active sleeve topology
- chest emblem
- waist medallion
- major tassel / cord attachment layout
- lower garment
- shoes
- left/right relation
- overlap / occlusion order

Active anatomical-right large sleeveについては、W1で確認したtargeted invariantを維持する:

`動かす腕の大袖は、腕の屈曲に伴ってたわみ・向きが変わってよいが、基準画像の大袖としての基本構造を維持する。袖口の開口、金色の縁取り、灰色の内側、袖の模様を、別構造へ描き替えたり消したりしない。`

Visible handが重要なframeではlocal packetへabsoluteに書く:
- fingers naturally together and lightly extended
- not a fist
- not dramatically splayed
- palm orientation when needed

## E. Motion semantics gate

PASS条件:
- time orderが自然に読める
- active limb side swapなし
- one-shot endpoint reversionなし
- endpointが依頼された終了状態を満たす
- 意図していないsecondary gestureを追加しない
- unchanged roleの手足 / 接触対象を途中で入れ替えない

## F. Post-processing gate

Current active path:
1. `audit/scripts/remove_chroma_key.py` — despill enabled
2. common scale normalization
3. common foot baseline
4. `audit/scripts/compose_keypose_board_from_frames.py` または `audit/scripts/build_motion_strip.py`
5. visual identity / motion audit
6. `audit/scripts/machine_audit_board.py`

Machine auditでは少なくともC0で使用したflagがすべてfalse:
- wrong_aspect
- outer_edge_contact
- center_vertical_contamination
- center_horizontal_contamination
- divider_like_vertical_white_band
- divider_like_horizontal_white_band
- border_not_uniform
- background_not_uniform
- shadow_like_background

Transparent outputはwhite / black composite上でproduction-blocking chroma fringeを残さない。

## G. Operational constraints

Production前提にしない:
- ChatGPT Work
- Codex系週間agentic allowance
- OpenAI API別課金

Generation tuningでやらない:
- broad identity Knowledge追加
- global worker proseの継続的積み増し
- direct 2x2 generation
- generated-frame identity chaining
- full-board repair
- layout guideをgeneration referenceへ戻す

## H. Failure accounting

P1一般化試験ではfirst-pass failureを記録から消さない。
失敗frameだけをisolated workerで再試行することは可能だが、retry成功をfirst-pass PASSへ書き換えない。

Production v0を成立させるために、モーションごとにworker global instructionを変更する必要が出た場合はFAILとする。
局所pose packetの内容が誤っていた場合はplanner/local-state design failureとしてgeneration architecture failureと分離する。

## P1 generalization gate

既存C0モーションをregression case R0として保持する。
追加で、異なるfailure surfaceを持つ2モーションを同じworker global configurationで試す。

### R0 — existing regression

右手をcanonical neutralから上げ、胸花紋へ到達するone-shot。
Status: C0 PASS済み。

### R1 — mirrored unilateral motion

解剖学的左手をcanonical neutralから上げ、上腹部から胸部付近へ到達させるone-shot。
右腕は非可動側としてcanonical基準を維持する。

目的:
- anatomical side selection
- opposite active sleeve
- non-active sleeve preservation
- hand articulation
- endpoint monotonicity

### R2 — torso-dominant motion

canonical立位から浅く礼をし、両足を接地したまま上体を前傾して止まるone-shot。
腕は新しい独立gestureを作らず、衣装と一緒に受動的に追従する。

目的:
- torso / proportion continuity
- hat / hair relation under pose change
- both large sleeves as passive structures
- waist / tassel / lower garment continuity
- foot baseline and endpoint readability

## Production v0 verdict rule

Production v0 PASSに必要:
- R0の既存C0 PASSを維持
- R1とR2が同じworker global configurationで最終PASS
- 新しいbroad Knowledge / global prompt tuning不要
- deterministic post-processing / machine audit PASS
- failureが出た場合も原因をframe/local packet/post-processingへ局所化できる

R1/R2の結果が出るまでは、`current candidate passed`とは言えても`production v0 generalized`とは記録しない。

# Post-generation Audit

この資料は、主要モーションボードを実画像として確認した後、repairの内容を決めるためだけに使う。

生成前のmotion contract設計や通常の画像生成プロンプトへ全文を混ぜない。

## 1. 監査の前提

監査対象は実際に生成されたboardである。

次を同時に参照する。

- 現在のチャットへ直接添付されたcanonical identity reference
- 生成前に決めたmotion contract、identity anchors、slot state plan、active/support limb、end
- 実際に生成されたboard

生成前の計画が正しいことを、生成画像が正しいことの根拠にしない。

## 2. 7項目

必ず次を独立して判定する。

- `identity`
- `motion_semantics`
- `continuity`
- `endpoint`
- `layout`
- `chroma`
- `unintended_output`

重要なFAILが1つでもあればoverallはFAIL。

## 3. identity

canonical identity referenceを正本とする。

顔、目、髪、頭部固有パーツ、体格、胴体シルエット、袖、襟、裾、靴、模様、縁取り、腰飾り、房、紐、留め具、左右非対称要素を比較する。

特にidentity anchorsは優先して確認する。

ポーズ変更による自然な変形と、部品の増減・接続変更・別形状化を区別する。

4ポーズ間で同じ部品構成が維持されていなければFAIL。

## 4. motion semantics

左上 → 右上 → 左下 → 右下を時間順として読む。

各slotがslot state planに対応し、ユーザー要求の開始から終了までを最小の飛躍で表しているか確認する。

continuityまたはendpointの失敗によって要求動作全体が成立しない場合はmotion_semanticsもFAIL。

## 5. continuity

時間をまたいで同じ役割を持つ身体部位を追跡する。

正面主体で身体反転を伴わない場合は、解剖学的な左右だけでなくviewer-space上の対応も使う。

`leg_A`などのactive limbをK2で選んだ後、K3/K4で別の脚へ役割を移してはいけない。

前に出ている足だけを見て同一脚と推測せず、股関節から足先までの接続関係を追う。

確実に同一脚と追跡できない場合はPASSにしない。

## 6. endpoint

one-shotの最後は`end`を満たす必要がある。

開始姿勢へ戻ることがendに含まれていない限り、K4をK1へ戻さない。

「一歩前へ踏み出して停止」なら、active limbの足先がsupport limbより前方へ残り、重心がsettleしている必要がある。

## 7. layout

主要boardはportrait 2:3相当の2x2。

全身、共通縮尺、中央safe gap、外周safe marginを維持する。

crop、セル越境、正方形boardはFAIL。

## 8. chroma

キャラクター以外は均一な単色クロマ背景であること。

接地影、ドロップシャドウ、床、グラデーション、光だまり、背景模様、局所的な明度差があればFAIL。

## 9. unintended output

文字、K1-K4ラベル、説明文、UI、枠線、矢印、モーションライン、記号、未指定エフェクトがあればFAIL。

## 10. repair方式

初回レビューで確認したFAILだけを修正対象にする。

### motion-critical

`motion_semantics`、`continuity`、`endpoint`のどれかがFAILなら、局所編集で姿勢を継ぎ足さずboard全体を1回だけ再生成する。

repair時もcanonical identity referenceをidentityの正本とし、active/support limb、slot state plan、endを保持する。

左右を曖昧な「同じ足」だけで書かず、論理ID、必要なら解剖学的左右とviewer-space対応を併用する。

### non-motion only

motion系3項目がすべてPASSで、それ以外だけFAILなら、初回boardを編集対象として使い、PASSだったmotion状態を再設計しない。

## 11. repair note

repair noteは実画像で確認したFAILだけを短く列挙する。

一般論、未確認の問題、別案、新しい演出を追加しない。

修正後は同じ7項目を実画像で再監査する。

修正後がFAILでも追加repairは行わない。

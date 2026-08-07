# Image Generation Workflow

この資料は、ChatGPT Projectでモーション画像を生成するときの画像生成ジョブの組み方を定義する。

キャラクター同一性そのものは`01-character-identity.md`、動作設計は`02-motion-design.md`、2×2ボードの幾何条件は`03-keypose-board-spec.md`を優先する。

## 1 visual job = 1 motion board

1つの主要モーション依頼では、4つの主要キーポーズを1枚の2×2ボードとして生成する。

K1、K2、K3、K4を4つの別画像生成ジョブへ分解しない。K1〜K4は1つのvisual jobの内部状態であり、最初の生成物は2×2主要ボード1枚だけとする。

同じユーザー依頼の中で、別案、比較案、横4枚版、追加の2×2版、K1〜K4個別画像、summary sheetを自動生成しない。

生成結果が不合格でも、同一応答内で自動再生成しない。修正は失敗原因を確認した後の別visual jobとして行う。

## natural-language motion request

ユーザーは既定モーション名を選ぶ必要はない。

「丁寧にお辞儀する」「片手で小さく合図する」「一歩下がって身構える」などの自然言語要求を、そのまま`02-motion-design.md`のmotion contractへ変換する。

既存のモーション名一覧へ依頼を無理に当てはめない。速度、強さ、方向、使用する手足、丁寧さ、反復など、依頼文の修飾を落とさない。

## canonical identity reference

キャラクターの正本は、現在の画像生成チャットへユーザーが直接添付した基準画像とする。

Project Sources内の画像、別チャットの画像、今回より前に生成したモーション画像をcanonical identity referenceへ昇格させない。

新しいモーションでは毎回、直接添付された元の基準画像へ戻る。

同一motionの中割りやrepairで生成済みboardを参照する場合も、そのboardはmotion referenceまたはrepair targetであり、identityの正本ではない。

## job isolation

新しいモーションは、新しいチャットへ元の基準画像を直接添付して1モーションだけ依頼する運用を隔離されたvisual jobの開始点として扱う。

別モーションの生成物を次のモーションへ連鎖させない。

同じモーションの主要ボードが合格した後に中割りを作る場合は、同じチャット内の後続ターンを別visual jobとして使ってよい。この場合も、最初に直接添付された元の基準画像がidentity referenceであり、合格済み主要ボードは時間上のendpointを示すmotion referenceに限定する。

## layout guide

`project/sources/layout-guides/four-pose-portrait.png`がProject Sourceとして利用可能な場合は、4スロットの位置、中央の空き、外周safe marginだけを判断するlayout referenceとして使う。

layout guideはProject Source専用とし、基準キャラクター画像と一緒に生成チャットへ直接添付しない。直接添付されたlayout画像は、枠、K1〜K4ラベル、背景表現などを完成画像の見本として模倣される可能性がある。

layout guideはキャラクター、画風、色、衣装、表情の正本ではない。

ガイド内の枠、K1〜K4ラベル、線、灰色領域を最終画像へ描き写さない。

layout guideを画像生成側が利用できない場合でも、ユーザーへ追加添付を要求しない。`03-keypose-board-spec.md`の2×2幾何条件だけで生成を続行する。

## chroma-key background

画像生成段階では真の透明背景を必須にしない。1枚のボード全体を、均一な単色クロマキー背景で生成する。

既定候補は高彩度のmagentaとする。キャラクター本体にmagentaが明確に使われている場合は、cyan、blue、greenなど、キャラクター本体と十分に離れた高彩度色へ変更する。

元の基準画像に背景色が存在していても、その背景色をキャラクター固有色とはみなさない。クロマ色はキャラクター本体の配色との衝突を避けて選ぶ。

ボード全域で同じ背景色を使い、グラデーション、床、接地影、ドロップシャドウ、背景模様、光だまりを加えない。

生成後に`audit/scripts/remove_chroma_key.py`で背景をalphaへ変換する。クロマ色は画像外周から自動検出できるため、生成時の色を後処理コードへ手入力することを必須にしない。

## concise generation prompt

画像生成モデルへ渡す内部指示は、長い規則全文の貼り直しではなく、今回の状態に必要な情報だけへ圧縮する。

主要ボードでは次を含める。

1. 直接添付された基準画像がcanonical identity referenceであること
2. layout guideがある場合は配置だけに使うこと
3. motion contractから得た今回のK1〜K4
4. 顔、髪、体格、胸部・胴体シルエット、衣装、模様、装飾、表情を維持すること
5. 2×2 portrait、全身、共通縮尺、中央と外周のsafe space
6. 均一な単色クロマ背景
7. 影、文字、ラベル、UI、モーションライン、未指定エフェクトを描かないこと

`01`〜`04`の文書を画像生成用プロンプトへ逐語的に貼り付けない。

## inbetween visual job

主要K1〜K4が合格し、ユーザーが中割りまたは8フレーム化を求めた場合だけ、後続の別visual jobでI1〜I4を1枚のportrait 2×2ボードとして生成する。

主要ボードと中割りボードを同一応答内で自動連続生成しない。

中割りvisual jobでは参照画像の役割を分離する。

- 元の直接添付基準画像: identity reference
- 合格済み主要ボード: K1〜K4の姿勢と時間上のendpointを示すmotion reference
- Project Sourceのlayout guide: 配置だけを示すlayout reference

主要ボードの衣装や体格にdriftがあっても、それをidentityの新しい正本として固定しない。中割りでは元の基準画像の同一性を優先する。

I1〜I4の配置先は固定の4区間ではない。`02-motion-design.md`のtiming planに従い、時間順の4つの補助姿勢として生成する。

loopなら通常はK1→K2、K2→K3、K3→K4、K4→K1へ1枚ずつ置ける。

one-shotではK4→K1を作らず、4枚目を必要な区間へ追加する。例えばK2→K3に2枚必要なら、I2とI3をその区間の早い時点・遅い時点として設計する。

最終frame orderは後処理へ明示的に渡す。

## repair

不合格画像を修正する場合は、正本画像と失敗したmotion boardを使い、確認できた失敗だけを短いrepair noteとして指定する。

修正対象以外のキャラクターデザイン、動作位相、レイアウトを再設計しない。

repairも1 visual job = 1 motion boardとし、同一応答内で複数の再試行や別案を生成しない。

## post-processing boundary

画像生成モデルの責務:

- 1枚の2×2主要モーションボード、または後続の1枚の2×2中割りボード
- キャラクター同一性
- motion contractに沿った時間差
- portrait構図
- 全身とsafe space
- 均一なクロマ背景

`audit/`の責務:

- クロマ背景のalpha化
- 2×2の機械分割
- alpha bbox
- セル端接触検査
- 共通倍率への正規化
- 明示されたframe planによる最終motion stripの組み立て
- メタデータとデバッグ素材の出力

画像生成モデルへ最終8フレーム横一列や巨大アトラスの厳密な組み立てを任せない。

# Motion Generation Experiment Log

更新日: 2026-08-08

この文書は、MYGPTのモーション画像生成について「何を試したか」「何が実機で起きたか」「なぜ次の方式へ移ったか」を残す永久ログである。

新しい調整チャットで生成方式・repair方式・Project Source構成を変更する前に、`research/PROJECT-HANDOFF.md`とこの文書を先に読む。

## ルール

- `CONFIRMED`: 実機で確認済み。別の失敗が出ても未検証扱いへ戻さない。
- `REJECTED`: 実機結果から現行経路では採用しない。
- `SUPERSEDED`: 当時は合理的だったが、後の切り分けで前提が変わった。
- `CURRENT`: 現在の本線。
- 新しい証拠がない限り、REJECTED/SUPERSEDED方式へ戻さない。
- prompt文言だけを足して同じ構造を再試行する前に、過去の失敗原因と条件を確認する。

---

## 現在の結論

### CURRENT: frame-first pipeline

```text
high-quality canonical image directly attached to current chat
        |
        v
motion contract: F1 -> F2 -> F3 -> F4
        |
        v
4 image-generation jobs
(one person / one pose / one image per job)
        |
        v
compose_keypose_board_from_frames.py
        |
        v
raw 1024x1536 2x2 board
        |
        +--> visual identity / motion review
        +--> machine_audit_board.py
        |
        v
failed frames only: one repair round
        |
        v
recompose / re-audit / select
```

画像生成モデルには2×2 board、Kラベル、panel、layout guideを見せない。2×2 geometry、共通倍率、baseline、safe gap、外周余白はPythonの責務。

Project Sourceに`four-pose-portrait.png`を置かない。

canonicalは、ユーザー指定がなければ利用可能な候補のうち加工前に近く、全身が見え、固有ディテールを読み取れる最高品質・高解像度画像を使う。

---

## 実験遷移

### E01 — Project Sourceだけのcanonical参照
Status: CONFIRMED / REJECTED as production identity path

Project Sourcesへ基準画像を置くだけの試験では静止画は生成できたが、モーション生成時に参照が切れて別キャラクターになるケースがあった。

結論:
- canonical character imageは生成する現在のチャットへ直接添付する。
- Project Source内画像、過去生成画像をcanonicalへ昇格させない。

---

### E02 — 正方形2×2 board
Status: REJECTED

1024×1024系の2×2では、縦長全身キャラクターを4象限へ置くと以下が頻発した。

- 全身crop
- 上段の足が中央横境界へ侵入
- 下段が外周へ接触
- raised arm等を含むポーズで余白不足

この結果から、当時のboard方式ではportrait 2:3、目安1024×1536へ移行した。

portrait geometry自体は、現在もPython合成boardの最終geometryとして維持する。

---

### E03 — `four-pose-portrait` layout guide
Status: SUPERSEDED -> Project Sourceから退役

layout guideを直接生成チャットへ添付した実機試験では、完成画像へ次が模倣された。

- K1〜K4ラベル
- 枠
- divider
- チェック柄/guide表現
- 正方形寄りのsheet表現

そのため一時期「Project Sourceとしてだけ置き、配置だけ参照させる」方式へ変更した。

しかし2026-08-08の隔離試験で、空Projectでは単独ポーズ指示が1人物1枚として成立する一方、MYGPT Projectでは2×2へ引っ張られることを確認。さらにProject Instructions、`03-keypose-board-spec.md`、`04-imagegen-workflow.md`とlayout guideが同時に2×2を強く条件付けしていた。

現行結論:
- `four-pose-portrait.png`をChatGPT Project Sourceから外す。
- GitHubのSVG/generatorは過去仕様・後処理デバッグ資料としてのみ残す。

---

### E04 — 1 motion = 1 direct 2×2 generation
Status: SUPERSEDED

長期間の本番候補として使用。

確認した代表的失敗:
- active limbの左右交換
- one-shot K4が開始姿勢へ戻る
- walk cycle化
- 帽子、袖、腰飾り、房、紐、留め具、裾のidentity drift
- 接地影
- chroma濃淡
- divider / label / number
- center safe gap侵入

利点:
- 1枚内で4ポーズの見かけの画風・キャラクターがある程度揃いやすい。

限界:
- identity、motion continuity、layout、chroma、4ポーズ相互関係を1 visual jobへ同時に背負わせるため、修正時にも別項目が再解釈されやすい。

2026-08-08のSource再点検と隔離試験を受け、direct 2×2 generationを現行本線から外した。

---

### E05 — post-generation review / Python audit
Status: CONFIRMED

ChatGPT Project内で実際に以下は動作した。

- 生成後、同一turn内で対話モデルが生成実画像を視覚レビュー
- 生成実ファイルをPython監査へ渡す
- GitHubから監査スクリプトを取得して実行
- FAIL後に追加visual jobを実行
- repair後の画像を再監査
- INITIAL/REPAIR比較

注意:
- 同一turn post-reviewは過去に不安定だった時期があり、常に走る保証とは扱わない。
- 「生成後に対話モデルへ戻れない」「生成画像をPythonへ渡せない」という一般化は実機結果と矛盾する。

---

### E06 — full-board repair + PASS preserve
Status: REJECTED as repair architecture

初回board全体をもう一度生成し、FAIL項目だけ直す方式を試した。

代表例:
- INITIAL: endpoint PASS / chroma PASS
- REPAIR: layout改善
- しかし endpoint PASS -> FAIL、chroma PASS -> FAILへregression

`REPAIR_PRESERVE`と`REPAIR_DELTA`を導入し、修正版だから自動採用しない規則を追加した。

この実験から確定したこと:
- FAIL項目だけ列挙しても、全board再生成ではPASS状態を再解釈して壊せる。
- INITIAL/REPAIR差分分類とregression検出は必要。

---

### E07 — split-cell repair: 4 repair jobs
Status: REJECTED

初回2×2を分割し、K1〜K4を個別repairして再合成する案を実装。

実機結果1:
- 単独セルを要求した4 repair jobが、すべて2×2画像を返した。
- split元cell比率0.75とrepair出力2:3が衝突しcompose ERROR。

adapterを追加して、2×2が返った場合は対象象限を抽出するようにした。

実機結果2:
- 4つの独立repair boardから別々の象限を抜いて合成すると、4frameが4回の独立生成由来になる。
- K2/K3でactive limbが入れ替わる等、continuityとidentityが悪化。

結論:
- 4つの独立board生成から象限を寄せ集めるrepairは使わない。

---

### E08 — generated INITIALを同一turnでimage edit targetへ再投入
Status: REJECTED / capability unavailable in tested Project path

「INITIAL boardそのものを編集targetにして1回だけ修正する」方式を試した。

実機結果:
`REPAIR_EDIT_UNAVAILABLE`

raw INITIAL_BOARDを画像生成toolの実際のedit targetとして使ったことを確認できなかった。

結論:
- 現行ChatGPT Project自動post-review経路で、同じassistant turnから生成済み画像を確実なedit inputへ再投入できることを前提にしない。
- 手動エディタ操作をproduction automationへ混ぜない。

---

### E09 — one coherent repair board + post-compare cell select
Status: SUPERSEDED

4独立repairをやめ、追加REPAIR_SOURCE_BOARDを1枚だけ生成し、INITIAL/REPAIRの対応セルを実画像比較してPython合成する方式を試した。

この方式でpipeline自体は最後まで通った。

しかし代表結果では:
- identity FAIL継続
- motion semantics FAIL継続
- continuity FAIL継続
- endpoint FAIL継続
- layoutのみ改善
- repair側に丸数字、divider、shadow等が新規発生するケースあり

確定したこと:
- repair採用元を生成前に決めてはいけない。
- repair sourceを7項目で先に監査し、INITIALと比較してから採用する必要がある。
- layout改善だけでidentity/motionが悪化したcellを採らない。

ただしdirect 2×2自体を本線から外したため、このrepair architectureも現行本線から外れた。

---

### E10 — machine audit source取得失敗
Status: CONFIRMED operational lesson

一度、`machine_audit_board.py`をrepository searchで見つけられず`EXECUTION_UNAVAILABLE`と報告した。

実際にはファイルはmainに存在し、正確なrepo/path指定なら取得できた。

結論:
- 既知ファイルはrepository searchで探さずexact pathでfetchする。
- `SOURCE_UNAVAILABLE`と`EXECUTION_UNAVAILABLE`を混同しない。

既知path例:
- `audit/scripts/machine_audit_board.py`
- `project/sources/production/05-post-generation-audit.md`

---

### E11 — identity監査の不足
Status: CONFIRMED

初期identity監査は「同じ髪色・同じ帽子・同じ衣装系」といったanchor中心で、構造差を拾い切れなかった。

実画像では以下がdriftしていた。
- 帽子側面・頂部形状
- 帽子と髪の重なり境界
- 髪がどこから見えるか
- 袖外形
- 腰メダリオン、房、紐の個数・接続・左右
- 下衣silhouette
- 頭身・体格

現行identity auditは以下を含む。
- proportions
- silhouette
- topology
- attachment positions
- left/right relation
- overlap order
- occlusion map

「雰囲気が似ている」だけではPASSにしない。

---

### E12 — 空Project隔離試験: 2×2化の切り分け
Status: CONFIRMED

MYGPT Projectで単独frame方式を試すと2×2へ戻る現象が続いたため、Project filesなしの空Projectで隔離試験を実施。

条件:
- Project-only memory
- Project filesなし
- 単独人物1枚だけを要求する最小Instructions
- canonicalを直接添付

結果:
- 人物1人の単独画像が生成された。

結論:
- canonical画像そのものが2×2を誘発するという仮説は弱い。
- MYGPT ProjectのInstructions / Sourcesによる2×2条件付けが主因候補。

---

### E13 — low-resolution canonical vs high-resolution canonical
Status: CONFIRMED

低解像度canonical:
- 約164×372

加工前とみられる高解像度canonical:
- 1024×1536

同じ空Project・同じ単独ポーズ依頼で比較したところ、高解像度版ではidentityが明確に改善した。

改善が見えた項目:
- 帽子基本形
- 帽子と髪の重なり
- 前髪
- 胸部意匠
- 袖silhouette
- 腰円形飾り
- 下衣
- 靴
- 全体頭身

なお完全一致ではなく、房・紐・細部接続などにはdriftが残った。

結論:
- 高解像度canonicalはidentity fidelityに重要。
- 利用可能なら低解像度派生版ではなく加工前の高品質正本を使う。

---

### E14 — 過去の「4frame個別生成は不採用」結論の再評価
Status: SUPERSEDED interpretation

過去の`hatch-pet-porting.md`では、K1〜K4個別生成実験で余計な2×2/横4枚が生成され、motion semanticsも安定しなかったため、1 board方式へ戻した。

2026-08-08にProject全体を読み直すと、その実験環境には同時に以下が存在していた。
- Project Instructions: 2×2を強制
- `03-keypose-board-spec.md`: direct 2×2を強制
- `04-imagegen-workflow.md`: 個別生成禁止
- `four-pose-portrait.png`: 2×2 visual source

つまり「4frame個別生成そのものが失敗した」とは切り分けられていなかった。

空Projectでは単独1枚が成立したため、過去の不採用理由をそのまま現行frame-first方式へ適用しない。

---

### E15 — frame-firstへ移行
Status: CURRENT

2026-08-08、Project構成を以下へ変更。

- `01-character-identity.md`: 高品質canonical優先、occlusion/attachment topology強化
- `02-motion-design.md`: F1〜F4を時間状態だけにし、2×2位置を除去
- `03-keypose-board-spec.md`: direct board生成を廃止、single-frame outputへ変更
- `04-imagegen-workflow.md`: `1 visual job = 1 frame`
- `05-post-generation-audit.md`: failed-frame repairへ変更
- `post-generation-review-test.md`: frame生成→Python compose→audit→failed-frame repairへ変更
- `four-pose-portrait.png`: Project Sourceから退役
- `compose_keypose_board_from_frames.py`: 4frameから1024×1536 boardを決定論的に構成
- README / CI / researchをframe-firstへ更新

次の実機試験では、高解像度canonicalを直接添付し、別モーションでF1〜F4が各1人物1画像として生成されるかを確認する。

---

## 何を再びやらないか

新しい証拠がない限り、以下へ戻さない。

- 低解像度canonicalを高解像度正本より優先する
- `four-pose-portrait.png`をProject Sourceへ戻す
- 画像生成モデルへ直接2×2 boardを作らせる
- 4つの独立repair boardから象限を寄せ集める
- 同一turn自動image editを必須前提にする
- repairだからという理由だけでREPAIRを採用する
- GitHubの既知scriptをrepository searchで探す
- identityを色・雰囲気・数個のanchorだけでPASSにする
- 一歩前進専用の文言を一般設計へ大量追加する

---

## 次回の開始時チェック

1. `README.md`でCURRENT pipelineを確認。
2. `research/PROJECT-HANDOFF.md`を読む。
3. この`MOTION-GENERATION-EXPERIMENT-LOG.md`のCURRENTとREJECTEDを確認。
4. GitHub mainの実ファイルを直接fetchしてから判断する。
5. Project側から`four-pose-portrait.png`が削除済みか確認する。
6. canonicalは1024×1536の高解像度加工前候補を使う。
7. 以前の失敗方式を提案する場合は、どの新証拠で過去の棄却理由が解消されたか明示する。

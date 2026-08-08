# hatch-pet設計からMYGPTへ移植する要素

この文書は調査記録でありProject Sourceではない。

## hatch-petから有効な原則

- canonical imageへ毎job再アンカーする
- identity referenceとlayout/post-processing責務を分離する
- 1 visual jobの画像生成条件を小さくする
- 長いQA規則をimage promptへ詰め込まない
- chroma key + deterministic post-processingを使う
- repairは失敗した最小単位だけcanonicalからやり直す

## 過去判断

以前、K1〜K4を個別生成した実験では、個別画像以外に2×2や横4枚が出る一方、identity保持自体は良好だった。この結果から一時的に`1 motion = 1 visual job = 1 direct 2x2 board`へ切り替えた。

その後、Project構成を再点検すると、当時のProject Instructions、`03-keypose-board-spec.md`、`04-imagegen-workflow.md`、Project Sourceの`four-pose-portrait.png`がすべて2×2を強く条件付けしていたことが分かった。

空Projectの単独ポーズ隔離試験では1人物1枚が正常に生成されたため、「個別jobそのものが2×2化を必然的に起こす」という過去結論は採用しない。

## canonical解像度の実機結果

同じ単独ポーズ条件で、低解像度の縮小canonicalと1024×1536の高解像度canonicalを比較した。

高解像度canonicalでは、帽子形状、帽子と髪の境界、頭身、袖、腰飾り、下衣、靴などのidentity fidelityが明確に改善した。

したがって現行方式では、利用可能なら加工前に近い高解像度canonicalを直接添付して使う。

## 現行移植方針

```text
direct canonical image
  |
  +--> visual job F1: one person / one pose
  +--> visual job F2: one person / one pose
  +--> visual job F3: one person / one pose
  +--> visual job F4: one person / one pose
             |
             v
compose_keypose_board_from_frames.py
             |
             v
canonical 2x2 board
             |
             +--> visual review
             +--> machine audit
             |
             v
failed frames only: one repair round
```

2×2 layout guideを画像生成モデルへ与えない。最終board geometryはPythonへ移す。

## Projectで完全再現できないもの

- hatch-petのworker/subagent isolationそのもの
- tool内部のimage input配列をProject Instructionsから強制制御すること

そのためMYGPTでは、新しいチャット + canonical直接添付 + 1モーション依頼を上位の隔離境界とし、その内部で4つの単独画像生成jobを順に実行する。

## 次の検証

高解像度canonicalを使った実Projectで、次を確認する。

1. 各画像生成jobが人物1体だけを返すか
2. 4frameのidentityがdirect 2×2方式より改善するか
3. motion continuityが許容範囲か
4. Python合成boardでlayout/chromaが安定するか
5. failed-frame repairが他frameを再設計せず改善できるか

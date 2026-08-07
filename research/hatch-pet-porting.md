# hatch-pet設計からMYGPTへ移植する要素

## 目的

OpenAI公式`hatch-pet` Skillで高いキャラクター同一性が得られる理由を、MYGPTのChatGPT Project構成へ移植可能な要素と、Projectからは再現できない要素に分ける。

この文書は調査・設計記録であり、ChatGPT Projectへ直接投入するProject Sourceではない。

## 参照

- OpenAI Skills / hatch-pet
  - https://github.com/openai/skills/blob/main/skills/.curated/hatch-pet/SKILL.md
- hatch-pet run preparation
  - https://github.com/openai/skills/blob/main/skills/.curated/hatch-pet/scripts/prepare_pet_run.py
- OpenAI imagegen skill sample
  - https://github.com/openai/codex/blob/main/codex-rs/skills/src/assets/samples/imagegen/SKILL.md

## hatch-petで重要な構造

### canonical imageへの再アンカー

hatch-petはcanonical baseを固定し、各animation rowをそこから生成する。直前のrowを次のrowの正本として世代継承しない。

### visual jobの隔離

複数のrowを同じworkerへまとめず、1 visual job = 1 workerとして扱う。

### identity referenceとlayout referenceの分離

キャラクター同一性を決める画像と、slot配置だけを伝えるlayout guideを別入力として扱う。

### concise state prompt

長いQA規則を画像生成promptへ詰め込まず、canonical reference、layout、今回の動作、主要禁止事項へ絞る。

### chroma key + deterministic post-processing

画像生成段階で最終alphaやatlasを完成させず、単色背景から後処理で背景除去、frame抽出、正規化、検査を行う。

### 最小単位のrepair

全成果物をやり直さず、失敗したvisual jobだけをcanonical imageから再生成する。

## MYGPTの実機結果との対応

ProjectでK1〜K4を4枚の独立画像として同一ユーザー依頼内に生成させる実験では、次を確認した。

- K1〜K4個別画像以外に、2×2や横4枚の複数ポーズ画像が複数生成された。
- 個別K1〜K4は共通ベースへの局所編集に近い結果になった。
- K1とK4はピクセル単位で完全一致した。
- K2/K3の差分は主に腕周辺へ限定された。
- 個別生成はidentity保持には有利だったが、4つの独立visual jobとしての制御とmotion semanticsを安定して両立できなかった。

したがって、Project-only構成では「K1、K2、K3、K4を4 visual jobs」とするのではなく、**1モーションボード全体を1 visual job**として扱う。

## MYGPTへ移植する方針

### 移植する

- 新しいチャット + 元の基準画像直接添付をjob isolationとして使う
- 1 motion = 1 visual job = 1 image generation
- 直接添付された元画像をcanonical identity referenceに固定
- 2×2 layout guideをidentityとは別のlayout-only sourceとして扱う
- 画像生成内部promptを短く状態固有にする
- 真の透明背景要求を外し、均一な単色chroma backgroundを使う
- `audit/`でchroma除去、2×2分割、bbox、正規化、strip化を行う
- 不合格時は同一応答内で自動再生成せず、失敗確認後に1 boardだけrepairする

### Projectからは移植できない

- hatch-petのlightweight worker/subagentそのもの
- manifestからworkerごとに入力画像を強制的に分離する実行基盤
- Project Instructionsから画像生成toolの内部入力配列を直接制御すること

その代わり、MYGPTでは「新しいチャットに1つのmotion依頼だけ」を隔離境界とする。

## 新しい責務分割

```text
current chat
  direct canonical character image
  + one motion request
  + optional Project layout guide
        |
        v
ChatGPT Project
  motion design K1-K4
  concise imagegen instruction
  exactly one 2x2 portrait board
  flat chroma background
        |
        v
audit/scripts/remove_chroma_key.py
        |
        v
audit/scripts/build_motion_strip.py
        |
        v
transparent normalized motion strip
```

## 次の実機テスト

依頼文は変更しない。

> このキャラクターが手を振るモーションを作ってください。

最初の判定はidentity細部ではなく、visual job境界を見る。

1. 画像生成結果が1枚だけか
2. その1枚に4ポーズだけあるか
3. 2×2 portraitか
4. 均一な単色chroma backgroundか
5. 全身とsafe gapがあるか
6. K1→K4が動作として読めるか
7. 表情、影、文字、effectの退行がないか
8. 最後に顔、体格、胸部、胸紋、腰飾りなどのidentity driftを見る

同一応答で複数画像や別案が再び生成された場合は、文言を追加して塞ぐ前に、Project側で1 visual jobを保証できる範囲を再評価する。

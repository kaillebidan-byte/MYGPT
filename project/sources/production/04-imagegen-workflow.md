# Image Generation Workflow

この資料はChatGPT Projectでモーション画像を生成するときのvisual job境界を定義する。

## 1 visual job = 1 frame

主要モーション依頼では、`02-motion-design.md`でF1〜F4の時間状態を設計した後、**4つの単独画像生成job**を順番に実行する。

1回の画像生成jobで複数ポーズ、2×2、sprite sheet、comparison sheetを作らない。

各jobは同じ直接添付canonical imageへ再アンカーする。直前に生成したframeはidentity正本にしない。

## job isolation

新しいモーションは、新しいチャットへcanonicalを直接添付して1モーションだけ依頼する運用を開始点とする。

同じユーザーturn内でF1〜F4を順次生成してよいが、各画像生成callは1姿勢だけを要求する。画像生成promptへ「4枚」「4フレームのsheet」「2×2」など複数画像を1枚へまとめる表現を入れない。

## concise frame prompt

各frameの内部指示には次だけを含める。

1. 直接添付canonicalと同一人物であること
2. canonicalを再設計しないこと
3. 今回のF状態とcontinuity invariant
4. 表情指定がなければcanonical表情
5. 人物1体、全身、portrait、正面基準
6. 均一な高彩度クロマ背景
7. 床、影、文字、番号、ラベル、枠、grid、UI、モーションライン、未指定effect禁止

`01`〜`04`全文や詳細audit contractを画像生成promptへ貼り付けない。

## canonical identity reference

同じキャラクター候補が複数直接添付されている場合は、ユーザー指定を優先する。指定がなければ加工前に近く、全身が見え、固有ディテールを読み取れる最高品質の画像をcanonicalとして選ぶ。

Project Source内画像、layout guide、過去生成frameをcanonicalへ昇格させない。

## chroma

各frameは均一な単色クロマ背景で生成する。既定は高彩度magenta。キャラクター色と衝突する場合だけ別の高彩度色へ変更する。

frame間でkey色が少し違っても最終boardではPythonが1色へ正規化する。ただし床、接地影、大きなgradient、背景模様は生成段階でも禁止する。

## deterministic compose

F1〜F4生成後、`compose_keypose_board_from_frames.py`へ4枚を渡して2×2を作る。

画像生成モデルの責務:
- canonical identity
- 1frameの姿勢
- 全身
- flat chroma

Pythonの責務:
- chroma抽出
- foreground bbox
- 共通倍率
- baseline
- 2×2配置
- safe gap / outer margin
- board key色統一

最終boardを`machine_audit_board.py`と視覚監査へ渡す。

## repair

FAIL時は1 repair roundだけ行う。

失敗原因をframeへ割り当て、必要なframeだけ各1回再生成する。repair frameもcanonicalから生成し、失敗frameをidentity正本にしない。

repair候補と初回frameをcanonical・motion contractへ照合して比較し、良い方をframe単位で選ぶ。選択列全体のcontinuity / endpointを確認してから再合成する。

追加repair roundは禁止する。

## inbetween

主要4frameが合格し、中割りが必要な場合だけ補助状態を個別生成する。各補助frameもcanonicalへ再アンカーする。

最終stripは`build_motion_strip.py --keypose-images ... --inbetween-images ... --frame-plan ...`で決定論的に組み立てる。

## layout guide

`four-pose-portrait.png`をProject Sourceとして画像生成側へ与えない。board geometryはPythonへ移したため不要である。

GitHubのlayout guide素材は後処理・デバッグ資料としてのみ保持する。

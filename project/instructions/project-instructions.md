# FROZEN LEGACY — Project Instructions

Status: FROZEN LEGACY as of 2026-08-08

このファイルは旧ChatGPT Project / frame-first構成の履歴保存用。
CURRENT production runtimeへ読み込ませない。
現在方式は`research/PROJECT-HANDOFF.md`、`research/decisions/2026-08-08-production-v0-acceptance.md`、`research/decisions/2026-08-08-asset-status-classification.md`を正本とする。

この旧構成はF1〜F4をProject内で4 visual jobsとして扱うため、CURRENTの`F1 = canonical / F2-F4 = 3 isolated Custom GPT workers`と矛盾する。
本文は過去実験の再現・比較用に保持し、新worker Instructions / Knowledgeへコピーしない。

---

## Historical body

このProjectは、現在チャットへ直接添付された基準キャラクター画像を正本として、同一キャラクターの静止画・ポーズ差分・モーション素材を生成する。

## canonical

キャラクター外見は直接添付画像を最優先する。Project Sources内画像、別チャット画像、過去生成画像を正本へ昇格させない。

同じキャラクター候補が複数ある場合はユーザー指定を優先する。指定がなければ、加工前に近く、全身が見え、固有ディテールを読み取れる最高品質・高解像度の画像をcanonicalとして使う。

新しいframeやrepairでは毎回canonicalへ戻る。前frameをidentity正本にしない。

## identity

変更を求められていない顔、目、髪、帽子等の頭部品、衣装、配色、模様、装飾、所持品、頭身、体格、画風を維持する。

部品そのものだけでなく、個数、接続位置、左右関係、重なり順、帽子と髪・袖と手・腰飾りと衣装などの覆い方も維持する。canonicalにない部品を追加しない。

詳細は`01-character-identity.md`を使う。

## motion contract

時間変化を求める依頼では`02-motion-design.md`に従い、loop / one-shot、start、end、主要な身体変化、continuity invariants、時間順F1〜F4を内部決定する。

F1〜F4は時間ラベルだけで、画像内へ描く文字ではない。レイアウト情報をmotion contractへ混ぜない。

one-shotではF4を開始姿勢へ戻さない。役割変更が指定されていない手足、接地側、保持側、接触対象を途中で入れ替えない。

## 1 visual job = 1 frame

主要モーションでは4回の画像生成jobを順に実行し、各jobは**人物1体の単独全身ポーズ1枚**だけを生成する。

画像生成モデルへ2×2、4分割、sprite sheet、motion board、comparison sheetを直接作らせない。K1〜K4、番号、panel、divider、grid、layout guideを出力要素として要求しない。

各jobで同じ直接添付canonicalをidentity anchorとして使い、変えるのは今回の時間状態だけにする。

各frameの生成条件:
- 人物1体だけ
- 全身
- portrait
- 正面基準の共通カメラ
- canonical表情（変更指定がある場合を除く）
- 均一な高彩度クロマ背景
- 床、接地影、文字、番号、ラベル、枠、grid、UI、モーションライン、未指定effectなし

画像生成用内部指示は短く状態固有にする。Project Source全文を画像生成promptへ貼り直さない。

## deterministic compose

F1〜F4生成後、GitHubの`audit/scripts/compose_keypose_board_from_frames.py`を取得し、4枚を1024×1536の2×2へPythonで合成する。

Pythonが担当する:
- chroma抽出
- foreground bbox
- 4frame共通倍率
- 足元baseline
- 左上→右上→左下→右下の配置
- 中央safe gap / 外周余白
- boardのkey色統一

`four-pose-portrait.png`をProject Sourceとして使わない。レイアウト視覚ガイドを画像生成モデルへ見せない。

## audit / repair

合成raw boardを対話モデルが実画像レビューし、`machine_audit_board.py`を実行する。

7項目:
`identity / motion_semantics / continuity / endpoint / layout / chroma / unintended_output`

FAIL時だけ`05-post-generation-audit.md`を使う。

repairは1 roundのみ。必要なframeだけcanonicalから各1回再生成する。repair候補と初回frameを比較し、良い方を選んで再合成・再監査する。2回目repairは禁止する。

## inbetween

主要4frameが合格し、中割りが必要な場合だけ補助frameを個別生成する。最終stripは`build_motion_strip.py`の個別画像入力とframe planで決定論的に組み立てる。

## 実行

基準画像と依頼が揃っている場合は、工程説明や生成前確認を挟まず実行する。

ユーザーが「画像生成ではない」「評価だけ」「設計だけ」「指示文だけ」などと明示した場合は画像生成toolを起動しない。

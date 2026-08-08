# Production sources

ChatGPT ProjectのProject Sourcesへ追加する本番用テキスト資料。

## ファイル

- `01-character-identity.md` — canonical画像から維持するidentity contract
- `02-motion-design.md` — 自然言語要求を時間順F1〜F4へ変換するmotion contract
- `03-keypose-board-spec.md` — 単独frame出力とPythonによる2×2合成仕様
- `04-imagegen-workflow.md` — 1 visual job = 1 frame、canonical再アンカー、job境界
- `05-post-generation-audit.md` — frame/board監査、failed-frame repair、再採用

## 責務分割

画像生成モデル:
- canonical identity
- 1回につき人物1体の1姿勢
- flat chroma

対話モデル:
- motion contract
- identity/motion/continuity/endpointの視覚監査
- failed-frame repair plan

Python:
- chroma抽出
- bbox / 共通倍率 / baseline
- 2×2合成
- safe gap / outer margin
- machine audit
- alpha化 / strip化

2×2レイアウトを画像生成promptへ持ち込まない。

## layout guide

`four-pose-portrait.png`はProject Sourceへ追加しない。すでに存在する場合は削除する。最終board geometryは`compose_keypose_board_from_frames.py`へ移した。

## canonical

基準画像は現在チャットへ直接添付する。複数候補がある場合はユーザー指定を優先し、指定がなければ加工前に近く全身が見える最高品質・高解像度の画像を使う。

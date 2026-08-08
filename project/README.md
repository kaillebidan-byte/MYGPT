# ChatGPT Project configuration

この領域はChatGPT Projectへ投入するInstructionsとProject Sourcesを管理する。

## 構成

- `instructions/project-instructions.md` — 本番Instructions
- `instructions/post-generation-review-test.md` — 現行実験Instructions
- `sources/production/01-character-identity.md` — canonical identity
- `sources/production/02-motion-design.md` — 時間構造F1〜F4
- `sources/production/03-keypose-board-spec.md` — 単独frameとPython合成board仕様
- `sources/production/04-imagegen-workflow.md` — 1 visual job = 1 frame
- `sources/production/05-post-generation-audit.md` — 実画像監査とfailed-frame repair
- `sources/reference-images/README.md` — canonical画像運用
- `sources/layout-guides/README.md` — 過去layout guideの退役方針

## 本番運用

1. 新しいチャットへ、利用可能な最高品質のcanonical character imageを直接添付する。
2. 1モーションだけ自然言語で依頼する。
3. `02-motion-design.md`でF1〜F4を時間順に設計する。
4. F1〜F4を4つの単独画像生成jobとして生成する。各jobは人物1体だけ。
5. `audit/scripts/compose_keypose_board_from_frames.py`で4枚を1024×1536の2×2へ合成する。
6. 対話モデルの実画像レビューと`machine_audit_board.py`で監査する。
7. FAIL時は必要frameだけcanonicalから1回repairし、再合成・再監査する。

画像生成モデルへ2×2、sprite sheet、divider、layout guideを直接描かせない。

## Project Sourcesから外すもの

`four-pose-portrait.png`はProject Sourceとして使わない。すでに追加されている場合は削除する。

GitHub内のlayout SVG/guide generatorは過去仕様の確認やデバッグ用としてだけ保持する。

## 後処理

- `compose_keypose_board_from_frames.py` — 4 raw chroma frame→canonical 2×2 board
- `machine_audit_board.py` — board geometry/chroma監査
- `remove_chroma_key.py` — 背景alpha化
- `build_motion_strip.py --keypose-images` — 個別透明frameからstrip化

中割りも個別生成し、`--inbetween-images`と明示frame planで最終stripへ組む。

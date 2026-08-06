# フォルダ再編の移動表

2026-08-07に、再編前の運用ファイルを次の場所へ移動した。

| 旧パス | 新パス | 扱い |
|---|---|---|
| `requirements.txt` | `audit/requirements.txt` | 監査依存関係 |
| `assets/sprite-template-8x9.svg` | `audit/assets/sprite-template-8x9.svg` | スプライト配置テンプレート |
| `assets/README.md` | `audit/assets/README.md` | テンプレート説明 |
| `assets/export-template.html` | `audit/assets/export-template.html` | PNG書き出し補助 |
| `scripts/audit_sprite.py` | `audit/scripts/audit_sprite.py` | 監査実装 |
| `scripts/normalize_sprite.py` | `audit/scripts/normalize_sprite.py` | 正規化実装 |
| `scripts/create_contact_sheet.py` | `audit/scripts/create_contact_sheet.py` | 一覧画像生成 |
| `scripts/create_preview.py` | `audit/scripts/create_preview.py` | GIFプレビュー生成 |
| `scripts/download_input.py` | `audit/scripts/download_input.py` | URL入力取得補助 |
| `specs/pet-atlas-8x9.json` | `audit/specs/pet-atlas-8x9.json` | 監査仕様 |
| `templates/README.md` | `audit/templates/README.md` | アトラステンプレート説明 |
| `templates/pet-atlas-template-8x9.json` | `audit/templates/pet-atlas-template-8x9.json` | 配置参照データ |
| `docs/audit-workflow.md` | `audit/docs/audit-workflow.md` | 監査文書 |
| `instructions/mygpt-instructions.md` | `legacy/instructions/mygpt-instructions.md` | 旧GPT設定 |
| `instructions/MYGPT_INSTRUCTIONS.md` | `legacy/instructions/MYGPT_INSTRUCTIONS.md` | 旧GPT設定の別版 |
| `knowledge/` | `legacy/knowledge/` | 旧Knowledge |
| `actions/github-audit-openapi.yaml` | `legacy/actions/github-audit-openapi.yaml` | 旧Actionスキーマ |
| `docs/setup.md` | `legacy/docs/setup.md` | 旧セットアップ |
| `PROJECT.md` | `legacy/docs/PROJECT.md` | 旧プロジェクト概要 |
| `examples/prompts.md` | `legacy/examples/prompts.md` | 旧プロンプト例 |

## 同じ場所へ残したファイル

GitHub Actionsは`.github/workflows/`に置く必要があるため、次のworkflowは同じ場所へ残した。

- `.github/workflows/audit-sprite.yml`
- `.github/workflows/test-audit-scripts.yml`

両workflowの依存先は`audit/requirements.txt`、`audit/scripts/`、`audit/specs/`へ変更した。

`PRIVACY.md`はAction公開時に参照しやすいようルートへ残し、監査連携が実験段階であることを追記した。

## 新設領域

- `gpt/production/` — 新しい本番GPT設定
- `gpt/knowledge/` — 新しい参照Knowledge
- `gpt/experimental-audit/` — 監査連携の実験設定
- `audit/` — GPTから独立した監査サブシステム
- `legacy/` — 再編前設定の保存領域

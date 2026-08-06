# フォルダ再編の移動表

2026-08-07に、再編前の運用ファイルを次の場所へ移動した。

| 旧パス | 新パス | 扱い |
|---|---|---|
| `requirements.txt` | `audit/requirements.txt` | 監査依存関係 |
| `assets/sprite-template-8x9.svg` | `audit/assets/sprite-template-8x9.svg` | 監査・スプライト資料 |
| `scripts/` | `audit/scripts/` | 監査実装 |
| `specs/` | `audit/specs/` | 監査仕様 |
| `docs/audit-workflow.md` | `audit/docs/audit-workflow.md` | 監査文書 |
| `instructions/mygpt-instructions.md` | `legacy/instructions/mygpt-instructions.md` | 旧GPT設定 |
| `knowledge/` | `legacy/knowledge/` | 旧Knowledge |
| `actions/github-audit-openapi.yaml` | `legacy/actions/github-audit-openapi.yaml` | 旧Actionスキーマ |
| `docs/setup.md` | `legacy/docs/setup.md` | 旧セットアップ |
| `examples/prompts.md` | `legacy/examples/prompts.md` | 旧プロンプト例 |

`.github/workflows/audit-sprite.yml`はGitHub Actionsの配置要件により同じ場所へ残した。内部の依存先は`audit/requirements.txt`、`audit/scripts/`、`audit/specs/`へ変更した。

## 新設領域

- `gpt/production/` — 新しい本番GPT設定
- `gpt/knowledge/` — 新しい参照Knowledge
- `gpt/experimental-audit/` — 監査連携の実験設定
- `audit/` — GPTから独立した監査サブシステム
- `legacy/` — 再編前設定の保存領域

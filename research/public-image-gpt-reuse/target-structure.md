# 再編後のリポジトリ構成

## 到着点

公開画像生成GPTの動作を生成コアとして流用し、MYGPT固有部分を薄い追加層にする。再編前の設定は削除せず`legacy/`へ退避し、監査実装は`audit/`へ分離する。

```text
MYGPT/
├─ gpt/
│  ├─ production/
│  │  ├─ README.md
│  │  ├─ instructions.md              # 次段階で作成
│  │  ├─ description.md               # 次段階で作成
│  │  ├─ conversation-starters.md     # 次段階で作成
│  │  └─ builder-settings.md          # 次段階で作成
│  ├─ knowledge/
│  │  ├─ README.md
│  │  ├─ character-identity-reference.md  # 次段階で作成
│  │  ├─ motion-vocabulary.md             # 次段階で作成
│  │  └─ sprite-output-spec.md            # 次段階で作成
│  └─ experimental-audit/
│     ├─ README.md
│     ├─ instructions-addon.md         # 次段階で作成
│     ├─ github-audit-openapi.yaml     # 次段階で作成
│     └─ test-cases.md                 # 次段階で作成
├─ audit/
│  ├─ README.md
│  ├─ assets/
│  ├─ docs/
│  ├─ scripts/
│  ├─ specs/
│  └─ requirements.txt
├─ legacy/
│  ├─ README.md
│  ├─ instructions/
│  ├─ knowledge/
│  ├─ actions/
│  ├─ docs/
│  └─ examples/
├─ research/
│  └─ public-image-gpt-reuse/
├─ .github/
│  └─ workflows/
│     └─ audit-sprite.yml
└─ README.md
```

## `gpt/production`

My GPTエディターへ実際に設定する内容だけを置く。

含める内容:

- 画像生成依頼では画像生成Capabilityを直接使う
- 添付画像をキャラクターデザインの正本にする
- 指定された動作、ポーズ、表情だけを変える
- 明示されていない要素を維持する
- 軽微な不足は合理的に補う
- 単発依頼は一枚の差分画像として扱う
- スプライト指定がある場合だけKnowledgeを参照する
- 修正時は指定部分だけを変更する

含めない内容:

- GitHub runの探索
- Issueとartifactの取得
- 内部パスの列挙
- Action失敗時の長い分岐
- 監査閾値

## `gpt/knowledge`

参照資料だけを置く。

- `character-identity-reference.md`: キャラクター同一性の比較観点
- `motion-vocabulary.md`: 状態名と視覚的な動作例
- `sprite-output-spec.md`: フレーム数、透明背景、セル、ループ要件

実行命令とAction手順は置かない。

## `gpt/experimental-audit`

生成後監査を本番生成版から隔離して検証する。

旧Actionスキーマは`legacy/actions/`に保存した。検証版では次の2案を比較する。

### 案A: GitHub APIへ直接dispatch

構成は少ないが、`openaiFileIdRefs`を`client_payload`へ入れ子にする必要があり、生成画像参照の安定性に問題がある。

### 案B: 監査受付API

GPT Actionはトップレベルの`openaiFileIdRefs`、`request_id`、`expected_states`を受付APIへ送る。受付APIが画像取得、保存、GitHub dispatch、runとの関連付けを行う。

## `audit`

画像生成GPTから独立した通常の監査ソフトウェアとして扱う。

移動済み:

- `scripts/` → `audit/scripts/`
- `specs/` → `audit/specs/`
- `assets/` → `audit/assets/`
- `requirements.txt` → `audit/requirements.txt`
- `docs/audit-workflow.md` → `audit/docs/audit-workflow.md`

GitHub Actionsの配置要件により、workflow本体は`.github/workflows/audit-sprite.yml`へ残している。内部参照は新しい`audit/`配下へ変更済み。

## `legacy`

再編前のInstructions、Knowledge、Action、導入文書、プロンプト例を保存する。履歴確認用であり、本番設定へ使わない。

## 実装順

1. フォルダ再編と旧構成の退避。完了。
2. `gpt/production/`へ公開GPT流用版の短いInstructionsを作る。
3. 単発画像でPreviewテストする。
4. 同一性、動作語彙、スプライト仕様を`gpt/knowledge/`へ分離する。
5. `gpt/experimental-audit/`でファイル受け渡しを再検証する。
6. 安定した場合だけ監査を本番GPTへ追加する。

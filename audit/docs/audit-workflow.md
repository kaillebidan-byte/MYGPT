# Experimental sprite audit workflow

この文書は、再編前に実装したGitHub監査フローを、画像生成GPTから独立した実験機能として記録する。

`openaiFileIdRefs`による生成画像の受け渡しは安定性を再検証する必要がある。現時点では本番GPTの必須処理にしない。

## Flow

```text
My GPTで画像生成
    ↓
生成画像をopenaiFileIdRefsでActionへ直接添付
    ↓
GitHub repository_dispatch
    ↓
GitHub Actionsが一時URLから画像を取得
    ↓
audit/scripts/のPython監査が検査・補正
    ↓
audit.json
contact-sheet.png
preview.gif
normalized-spritesheet.webp
    ↓
GitHub Issueに失敗行と修復指示を掲載
```

監査サブシステムは画像を生成しない。画像生成に成功したかどうかと、監査受付に成功したかどうかを別の状態として扱う。

## Action設定の現在位置

再編前のOpenAPIスキーマは次へ退避した。

```text
legacy/actions/github-audit-openapi.yaml
```

これは履歴確認用であり、本番GPTへそのまま設定しない。再検証版は次へ作る。

```text
gpt/experimental-audit/github-audit-openapi.yaml
```

再検証では、`openaiFileIdRefs`をGitHub APIの`client_payload`へ直接入れ子にする方式と、受付APIを挟んでトップレベルで受け取る方式を比較する。

## 現行workflow

GitHub Actionsの配置要件により、実行用workflowは次に残している。

```text
.github/workflows/audit-sprite.yml
```

workflowが参照する実装:

- 依存関係: `audit/requirements.txt`
- 監査スクリプト: `audit/scripts/audit_sprite.py`
- 既定仕様: `audit/specs/pet-atlas-8x9.json`

旧Actionから`specs/pet-atlas-8x9.json`が送られた場合は、workflow内で新しいパスへ変換する。

## 送信データ

旧方式の送信内容:

- `event_type`: `sprite_audit`
- `client_payload.openaiFileIdRefs`: 今回生成した画像1枚
- `client_payload.request_id`: 一意な値
- `client_payload.expected_states`: 使用状態を上から順にカンマ区切り
- `client_payload.spec_path`: `audit/specs/pet-atlas-8x9.json`
- `client_payload.normalize`: `true`
- `client_payload.publish_issue`: `true`

完全な公式9行なら`expected_states`は空欄でよい。4行だけ使う例:

```text
searching,validating,confused,completed
```

## 結果

workflow artifact `sprite-audit-<request_id>`に次が入る。

- `audit.json`
- `contact-sheet.png`
- `preview.gif`
- `normalized-spritesheet.webp`
- `issue-body.md`

`publish_issue=true`の場合、`[sprite-audit] <request_id>`というIssueを作成または更新する。

## 判定項目

- キャンバス寸法
- 透明画素のRGB残留
- 必須行の空フレーム
- 未使用行への描画
- セル端への接触
- 足元のばらつき
- 幅と高さの変動
- 近似重複フレーム
- 動きが小さすぎる可能性

画風、顔、衣装、手指、動作の意味は画素監査だけでは保証できない。`contact-sheet.png`と`preview.gif`による目視確認を併用する。

## 失敗時の扱い

生成画像をActionへ渡せなかった場合は、画像生成失敗へ戻さない。監査未実施として扱う。手動アップロードを本番の既定経路にしない。

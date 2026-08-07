# My GPT configuration

My GPTエディターへ設定する本番ファイルと、監査実験用の追加設定を置く領域。

再編前の文書を新しいパスへ移した領域ではない。`production/`、`knowledge/`、`experimental-audit/`は、それぞれの役割に合わせて白紙から作成している。

## 区分

### `production/`

画像生成を主処理にした本番設定。

- 短いInstructions
- GPTの説明
- 会話のきっかけ
- Builder設定

GitHub監査や外部API操作を含めない。

### `knowledge/`

本番GPTが参照する資料。

- キャラクター同一性
- 動作語彙
- スプライト出力仕様

Knowledgeには実行命令を置かない。

### `experimental-audit/`

生成後監査を検証する独立設定。

- 監査用Instructions add-on
- 監査受付APIのOpenAPI契約
- 実機試験項目

本番GPTへは接続しない。

## 旧構成

再編前の設定は`../legacy/`へ移動済み。

旧設定は比較と履歴確認だけに使い、新しいInstructionsやKnowledgeの元本文としてコピーしない。

# 現行MYGPTの調査結果

## 1. 生成コアが監査制御に埋もれている

`instructions/mygpt-instructions.md`は、次の役割を一つの文書で扱っている。

- 画像生成Capabilityの呼び出し
- 基準キャラクターの同一性維持
- 単一差分と複数差分の解釈
- スプライト配置規則
- GitHub Actionの呼び出し
- 非同期runの探索
- Issueからの結果取得
- 監査失敗時の応答
- 内部パスが返った場合の再試行

画像生成の主命令より、失敗状態や禁止事項の記述量が大きい。モデルが「画像を作る」より「失敗条件を判定する」処理へ寄りやすい構造になっている。

## 2. InstructionsとKnowledgeに規則が重複している

`instructions/mygpt-instructions.md`と`knowledge/hatch-pet-mygpt.md`の双方に、次の規則が重複している。

- 組み込み画像生成を使う
- 添付画像を正本にする
- キャラクターの特徴を維持する
- 確認質問を減らす
- 依頼された差分だけを作る
- 背景透過とスプライト配置を守る
- 修正対象だけを変更する

OpenAIの現行ガイドでは、動作、規則、ワークフローはInstructionsへ置き、Knowledgeは参照資料へ使うことが推奨されている。重複した命令は競合や優先順位の揺れを生むため、生成時の必須規則は短いInstructionsへ統合する。

## 3. 単発依頼とスプライト一式の境界が弱い

実際の主な利用は、基準画像に対して「手を振る」「振り返る」など一つの動作を作る単発依頼である。

現行Instructionsでは、差分、状態、ループ、複数行スプライト、公式9状態、8フレーム既定値が同じ階層で扱われている。そのため、単発依頼でも複雑なスプライト仕様を読み込み、生成条件を過剰に増やす可能性がある。

次段階では、最初に依頼を次の2モードへ分ける。

- `single-image`: 一つの画像または一つのポーズ差分
- `sprite`: 明示的にフレーム、ループ、スプライト、アニメーション素材を求められた場合

既定は`single-image`とする。

## 4. GitHub直結Actionはファイル受け渡し仕様と相性が悪い

現行ActionはGitHub APIの`repository_dispatch`を直接呼び、次の形を要求する。

```text
client_payload.openaiFileIdRefs
```

GitHub Actions側も`github.event.client_payload.openaiFileIdRefs`を読む。

一方、OpenAIのGPT Actionsファイル送信仕様では、POSTリクエスト内に`openaiFileIdRefs`という専用パラメータを定義し、ランタイムがファイル参照オブジェクトを注入する仕組みになっている。直接GitHub APIへ合わせるために専用パラメータを入れ子へ置く構成は、実機で安定動作する保証がない。

さらに2026年には、`openaiFileIdRefs`が空になる、生成画像だけ参照展開に失敗する、`download_link`が外部から読めないローカルパスになる、という既知問題がOpenAI Developer Communityで報告されている。

したがって、現行の「画像生成直後にGitHubへ自動送信」を本番必須経路にすると、生成そのものまで失敗扱いになりやすい。

## 5. Actionの役割が多すぎる

現在のOpenAPIは、次を一つのGPTへ公開している。

- 監査起動
- workflow run一覧
- 個別run取得
- artifact一覧
- Issue一覧
- Issue取得

画像を一枚作る依頼に対して、GPTは画像生成後に複数の非同期API操作を判断する必要がある。公開画像生成GPTの成功例と比べ、ツール選択の分岐が大幅に増えている。

本番版では、生成GPTのActionを次のどちらかへ限定する。

1. 監査を完全に別GPTまたは別工程へ分ける。
2. 一つの監査受付APIへ送り、受付APIがGitHub dispatchと結果管理を代行する。

GitHub APIを複数操作する現行形式は、デバッグ用構成として残す。

## 6. 内部パス対策が逆に内部パスを強調している

現行Instructionsは`/mnt/data`、`sandbox:`、CAAS、ファイルIDなどを多数列挙している。これは過去の失敗へ対処するための規則だが、画像生成依頼のたびにモデルへ内部ファイル処理の概念を強く意識させる。

運用版の生成コアでは、内部パスを説明しない。画像生成Capabilityを呼ぶという肯定的な命令だけを置く。例外処理は監査拡張側へ隔離する。

## 7. 監査スクリプト自体は再利用価値がある

次の部分は画像生成コアから独立しており、そのまま維持できる。

- `scripts/audit_sprite.py`
- `scripts/normalize_sprite.py`
- `scripts/create_contact_sheet.py`
- `scripts/create_preview.py`
- `specs/pet-atlas-8x9.json`
- `.github/workflows/audit-sprite.yml`の画像取得後の処理

問題は監査ロジックではなく、会話内の生成画像をGitHub Actionsへ渡す入口にある。

## 判定

再編時は、監査コードを捨てず、画像生成GPTから分離する。

- 公開画像生成GPTの短いInstructionsを生成コアにする。
- MYGPT固有のキャラクター維持規則を生成コアへ追加する。
- スプライト仕様を明示モード時だけ参照する。
- GitHub監査を実験的な独立拡張へ移す。
- `openaiFileIdRefs`直結を実機で再検証する。

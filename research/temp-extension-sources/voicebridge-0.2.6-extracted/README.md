# ChatGPT VoiceBridge 拡張 0.2.6

ChatGPTブラウザ版で新しく生成された最終回答を、ローカルのVoiceBridgeへ送るVivaldi／Chrome向け拡張。

## 0.2.2 の主な変更

- 古いチャットの遅延読み込みを、新しいユーザー発言と誤認する件数監視を廃止。
- 実際の送信操作、または回答生成開始を確認した場合だけ読み上げ待機へ入る。
- 更新、古いチャットを開く、チャット間を移動するだけでは読み上げない。
- バックグラウンドタブの新規回答は引き続き読み上げる。
- 判定ログを記録・表示・コピー・消去できる。
- ログには回答本文とトークンを保存しない。

## 更新方法

1. ZIPを展開する。
2. `vivaldi://extensions` を開く。
3. 旧版を削除する。
4. 「解凍してロード」で `chatgpt_voicebridge_extension_0.2.2` を選ぶ。
5. トークンを入力し直して保存する。
6. 開いているChatGPTタブを一度再読み込みする。

## 判定ログ

拡張アイコンを開き、「判定ログを記録する」を有効にして保存する。

主なイベント:

- `baseline` — 開いた時点の回答を既存扱いに登録
- `armed` — 新しい回答を待つ状態へ移行
- `generation_start` / `generation_end` — 生成状態の変化
- `existing_answer_ignored` — 古い回答として無視
- `answer_candidate_new` / `answer_candidate_changed` — 新規回答候補
- `send_attempt` — VoiceBridgeへの送信を開始
- `voicebridge_accept` — VoiceBridgeが受理
- `voicebridge_error` — 送信失敗

誤って読み上げた場合は、直後に拡張画面を開いて「更新」→「コピー」を押す。
ログは最大300件で、本文や認証トークンは含まれない。


## 0.2.3 の変更

- ChatGPTの生成終了ボタンが消えても、最終本文のDOM反映が数秒遅れる場合に対応。
- 生成終了後6秒以上経過し、かつ本文が3秒以上変化していない場合だけ送信する。
- `generation_end` 後に本文が更新された場合、安定待ちをやり直す。
- デバッグログへ `final_wait` と `final_ready` を追加。


## 0.2.4 の変更

- バックグラウンドタブ内の `setTimeout` やMutationObserverだけに依存しない。
- Manifest V3サービスワーカーと各ChatGPTタブを長時間ポートで接続。
- サービスワーカーから1秒ごとに各タブへDOM確認信号を送る。
- 拡張画面に「監視中のChatGPTタブ数」を表示。
- `final_wait` / `final_ready` ログへ `scanSource`、表示状態、外部確認信号からの経過時間を追加。

正常なら、別タブへ移動した後もログの `final_ready` に
`"scanSource":"background-ping"` と `"visibility":"hidden"` が記録される。


## 0.2.5 の変更

- `#settings/Personalization` などのURLハッシュ変更を、別チャットへの移動として扱わない。
- 同一会話内で設定画面を開閉しても、回答候補、生成終了時刻、読み上げ待機状態を維持する。
- URLのパスが変わり、本当に別会話へ移った場合だけ基準点を再構築する。
- ログイベントを `conversation_route_change` と `same_conversation_url_change` に分離する。


## 0.2.6 の変更

- 非表示タブでChatGPTの本文DOMが数文字のまま停止する事例に対応。
- 非表示中はDOM本文を完成回答として送らない。
- 回答完了時は「ChatGPTの回答が完了した」と短く通知する。
- 読み上げ待機状態を維持し、タブへ戻って本文DOMが更新・安定した後に全文を送る。
- 完了通知は `source=chatgpt-commentary` として送るため、吸気を付けない。
- ログへ `hidden_final_deferred`、`completion_notice_*`、`visible_final_send` を追加。

### 重要な制約

DOM監視だけでは、Vivaldiが非表示タブのChatGPT描画を止めた場合に
回答全文を取得できない。0.2.6は部分読みを防ぎ、完了通知で気づけるようにする版。
別タブ中の全文読み上げを実現するには、将来版でページの応答通信を直接捕捉する必要がある。

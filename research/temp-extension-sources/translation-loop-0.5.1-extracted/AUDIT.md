# ChatGPT Translation Loop Test 0.5.1 修正後監査

監査対象: `/mnt/data/chatgpt-translation-loop-test-0.5.1`

## 結論

最大チャット数による停止を追加し、既存の終了語、Pause、Reset、安全停止、プロジェクト内ローテーションとの優先順位を確認した。配布を止めるCritical・Highの新規問題は静的検査と自動試験では確認されなかった。

ChatGPT実画面での2チャット完走試験は未実施であり、候補版として扱う。

## 最大チャット数の意味

設定名: `maxChatCycles`

表示名: 「最大チャット数（開始チャットを含む）」

- 開始チャットは`chatGeneration=0`、表示上は1チャット目。
- ローテーションを1回確認すると`chatGeneration=1`、表示上は2チャット目。
- 現在チャット番号は`chatGeneration + 1`。
- 現在チャット番号が設定値以上で、そのチャットの規定回答数へ達すると`RUN_COMPLETED`。
- `RUN_COMPLETED`では`enabled:false`、`runToken:null`、`pendingSubmissionNonce:null`となり、次のローテーションを行わない。

例:

```text
maxCompletedTurns = 10
maxChatCycles = 2

チャット1で10回答
→ ローテーション
→ チャット2で10回答
→ RUN_COMPLETED
```

## 停止判定の優先順位

1. 回答末尾が終了語に一致: `PHASE_COMPLETED`
2. 現在チャットが規定回答数へ到達し、最大チャット数にも到達: `RUN_COMPLETED`
3. 最大チャット数未到達でローテーション無効: `TARGET_REACHED`
4. 最大チャット数未到達でローテーション有効: 次のチャットへ移動
5. 1チャットあたりの回答数未到達: 固定文を送信

終了語が最大チャット数より先に評価され、最終チャットではローテーション判定より先に`RUN_COMPLETED`へ入ることを試験した。

## 同時に修正した表示問題

0.5.0の`popup.js`には終了語入力欄の参照があったが、`popup.html`に対応する`phaseMarker`要素がなかった。0.5.1で入力欄を追加した。

ポップアップ見出しが`0.4.0`のままだった問題も`0.5.1`へ修正した。

## 実施した検査

```text
node --check *.js
node test_background_tab_policy.js
node test_chat_cycle_limit_policy.js
node test_loop_core.js
node test_phase_completion_policy.js
node test_prompt_stacker_runner.js
node test_prompt_stacker_storage.js
node test_rotation_continuation_policy.js
node test_rotation_submission_policy.js
node test_rotation_url.js
node test_rotation_verification_once.js
node test_runtime_guard.js
node test_send_button_readiness.js
node test_terminal_gate.js
node test_upstream_reuse_policy.js
```

`test_chat_cycle_limit_policy.js`は次を検査する。

- 開始チャットが1として数えられる。
- `maxChatCycles=1`では初期チャット完了時に停止する。
- `maxChatCycles=2`では2チャット目完了時に停止する。
- 終了語判定がチャット数判定より先にある。
- チャット数判定がローテーション判定より先にある。
- ポップアップが設定値を保存・復元する。

## 残存リスク

1. 実ブラウザで「既存チャット完走→新規チャット完走→RUN_COMPLETED」の実走は未確認。
2. `continueAfterRotation`をオフにすると、最大チャット数へ達する前でも`ROTATION_VERIFIED`で停止する。これは明示設定を優先する既存仕様。
3. ページ再読み込み、ブラウザ再起動、拡張更新後の自動復旧は行わず安全停止する。
4. ChatGPTのDOM変更時は送信せずERRORになる可能性がある。

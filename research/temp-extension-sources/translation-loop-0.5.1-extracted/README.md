# ChatGPT Translation Loop Test 0.5.1

ChatGPTの対象タブを開いたまま、回答完了を確認して固定文を送り、指定回答数ごとに同一プロジェクト内の新規チャットへ移るManifest V3拡張の試験版です。

VoiceBridgeとは独立しています。localhost通信、VoiceBridgeのstorage、同一メッセージ名は使いません。

## 0.5.1の追加

長期間の無人運転を制限する「最大チャット数（開始チャットを含む）」を追加しました。既定値は`2`です。

- 開始時に開いている既存チャットを1として数える。
- 各チャットでは「1チャットあたりの回答数」まで処理する。
- 最終チャットが規定回答数へ達した時点で`RUN_COMPLETED`として正常終了する。
- 最終チャット完了後は、プロジェクトページへ移動せず新規チャットも作らない。
- 回答末尾の終了語は最大チャット数より先に判定する。
- 設定範囲は1～50チャット。

例として、回答数を`10`、最大チャット数を`2`にすると次の順で終了します。

```text
既存チャットで10回答
→ 同じプロジェクトに新規チャットを作成
→ 新規チャットで10回答
→ RUN_COMPLETED
```

最大チャット数を`1`にすると、開始チャットの規定回答数が完了した時点で新規チャットを作らず終了します。

0.5.0でポップアップに表示されていなかった「終了語（回答末尾）」欄と、見出しの旧バージョン表記も修正しました。

## 0.5.0由来の修正

0.4.1監査で確認したCritical・High項目を修正しました。

- 同じ固定文を繰り返すと、過去のユーザーターンを新しい送信証拠と誤認する問題を修正。
- 送信成功は、送信前後で実際に変化した次の証拠だけで確定。
  - ユーザーターン数の増加
  - 最新ユーザーターン識別子の変化と送信文一致
  - 生成状態の非生成から生成中への変化
  - ローテーション時の新規会話IDまたは会話URL生成
- 入力欄が空になっただけでは成功扱いにしない。
- Pause・Reset・二重Startを直列化し、古い非同期送信が停止後の状態を上書きしない`runToken`を追加。
- Content scriptはBackgroundが完了通知を受理するまで回答を処理済みにしない。再開直後の高速回答は再通知する。
- 汎用`button[type="submit"]`はcomposer内だけで探索し、ページ全体ではChatGPT固有の強い送信ボタンだけを許可。
- watchdogがContent scriptへ2回連続で接続できない場合はERRORで停止。
- 実行中の外部サイト移動、別プロジェクト移動、意図しない会話変更を監視して停止。
- localとsyncの旧設定がともに更新時刻を持たない場合はlocalを優先。
- 完了判定とURL解析を共有モジュールへ切り出し、本体と同じ関数を試験。
- 高頻度の判定ログを状態変化時または30秒ごとへ抑制。
- ローテーション送信済みnonceのContent側キャッシュを20件に制限。
- 内部通信を`v051`へ更新し、旧Content scriptとの混在を防止。

## 回答末尾による正常終了

設定「終了語（回答末尾）」の既定値は次です。

```text
規定フェイズ完了
```

最新のアシスタント回答を空白正規化した後、その末尾が設定語と一致した場合、次の固定文送信やローテーションを行わず、`PHASE_COMPLETED`として正常終了します。

例:

```text
人物監査の第一フェイズを完了した。
規定フェイズ完了
```

終了判定は回答数上限やローテーション判定より先に行います。設定欄を空にした場合は既定値へ戻します。

## チャット数による正常終了

「最大チャット数（開始チャットを含む）」は、1回のStartで処理するチャット総数です。現在位置はポップアップに`現在 / 上限`で表示します。

```text
1 / 2  開始チャット
2 / 2  1回ローテーション後の最終チャット
```

最終チャットの規定回答数へ達すると`RUN_COMPLETED`になり、scan alarmとrotation alarmを解除して停止します。

## 主な構成

### 回答完了判定

Oracle由来の肯定的完了ゲートを使用します。

- 停止ボタンがない
- 強いThinking信号がない
- 本文フィンガープリントが安定
- 完成後操作バーを連続して確認

停止ボタン消失や本文静止だけでは完了扱いにしません。

### 入力・送信runner

Prompt Stacker由来の小さなrunnerを使用します。

- textareaのnative setter
- contenteditableの`execCommand("insertText")`
- composer内の有効な送信ボタンを待機
- 通常の`button.click()`
- キャンセル可能な待機
- 送信前後の肯定的証拠確認

Prompt StackerにはEnter送信フォールバックがありますが、本拡張では安全条件を優先して無効にしています。有効な送信ボタンを確認できない場合は送信しません。

### 状態と保存

- 設定は`chrome.storage.local`へ保存し、利用可能なら`chrome.storage.sync`にもミラー。
- 実行状態とログはブラウザ・タブ固有なのでlocalだけに保存。
- `runToken`により、Pause・Reset後の古い処理や二重Startを排除。
- Service Workerを常駐させるportや1秒間隔のtimerは使わず、30秒間隔の`chrome.alarms`を補助watchdogとして使用。

### 独自実装を残す部分

- 同一プロジェクト内ローテーション
- 正式なプロジェクトURLの検出
- プロジェクトID・会話ID・nonceの検証
- 新規チャット送信後のURL・ユーザーターン・生成開始確認
- fail closedの安全停止

## 導入

1. ZIPを展開する。
2. Vivaldiは`vivaldi://extensions`、Chromeは`chrome://extensions`を開く。
3. デベロッパーモードを有効にする。
4. 旧版を無効化または削除する。
5. 「解凍して読み込む」で`chatgpt-translation-loop-test-0.5.1`フォルダを選ぶ。
6. 対象プロジェクト内の既存チャットを開く。
7. ポップアップで「現在のプロジェクトを設定」を押し、設定を保存する。
8. Startを押す。

拡張更新前から開いているChatGPTタブにも、Start時に0.5.1のContent scriptを注入します。

## 非アクティブタブでの運転

対象タブを選択し続ける必要はありません。

監視経路は次の二つです。

1. Content scriptの`MutationObserver`と自己再走査。
2. `chrome.alarms`から30秒ごとに送る補助走査。

ブラウザと対象タブは開いたままにしてください。OSスリープ中は処理を進めず、復帰後に再走査します。タブ破棄、ページ再読み込み、ブラウザ再起動、拡張更新後の自動復旧は行わず、曖昧な継続を避けてERRORで停止します。

## ローテーション試験

実作業を発生させない試験例です。

1. 「1チャットあたりの回答数」を`1`にする。
2. 「最大チャット数」を`2`にする。
3. 「続行文」を短い試験指示にする。
4. 「新規チャット開始文」も短い試験指示にする。
5. 「上限後に同じプロジェクトで新規チャットを作成」をオン。
6. 「新規チャットでも自動ループを続ける」をオン。
7. Startを押す。
8. 回答後に同じプロジェクトの新しい会話IDへ変わることを確認する。
9. 新規チャットの最初の回答後に`RUN_COMPLETED`になることを確認する。

成功時の主なログ:

```text
rotation_prepared
project_composer_wait
rotation_submit_attempt
rotation_submit_evidence
rotation_submit_evidence_accepted
rotation_verified
rotation_loop_resumed
```

正常終了時の主な状態:

```text
PHASE_COMPLETED  回答末尾の終了語
RUN_COMPLETED    設定した最大チャット数
```

## 安全停止

次の場合は送信を継続せずERRORまたは正常終了します。

- 入力欄に下書きがある。
- 入力欄または有効な送信ボタンを確認できない。
- 送信後の新しい証拠を確認できない。
- 設定済みプロジェクトと現在のプロジェクトが一致しない。
- 正式なプロジェクトURLを確認できない。
- ローテーション中に別プロジェクトまたは通常ホームへ出る。
- 新しい会話IDが旧会話IDと同じ。
- 120秒以内に新しい会話IDを確認できない。
- 所有タブが閉じられる、破棄される、ChatGPT外へ移動する。
- Content scriptへ2回連続で接続できない。
- 実行中に意図しない別チャットへ移動する。
- ブラウザ再起動、ページ再読み込み、拡張更新で監視世代が失われる。
- 回答末尾が設定済み終了語と一致する。この場合は`PHASE_COMPLETED`で正常終了。
- 最終チャットの規定回答数へ達する。この場合は`RUN_COMPLETED`で正常終了。

## プロジェクトURL

プロジェクト名を含む正式URLを保存します。

```text
https://chatgpt.com/g/g-p-...-project-name/project
```

会話URLの裸のIDだけから遷移先を捏造しません。ローテーション時は現在URLと設定URLの安定した`g-p-...`識別子が一致する場合だけ処理します。

## 試験

```text
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

`test_terminal_gate.js`、`test_rotation_url.js`、`test_loop_core.js`、`test_runtime_guard.js`は本体が使用する共有モジュールを直接読み込みます。

## 既知の制約

- ChatGPT Web UIのDOM変更によりselector更新が必要になる場合があります。
- 実ブラウザでの長時間・複数チャット連続試験は別途必要です。
- 画像生成など本文以外の特殊な完了形は対象外です。
- ページ再読み込み、ブラウザ再起動、拡張更新後は自動復旧せず安全停止します。
- 終了語の後に別の文字や句読点がある場合は末尾一致になりません。
- 「新規チャットでも自動ループを続ける」がオフの場合、最大チャット数へ達する前でも新規会話確認時点で停止します。

## 第三者コード

OracleとPrompt StackerのMITライセンス全文を同梱しています。詳細は`THIRD_PARTY_NOTICES.md`を参照してください。

# 次チャット用引継ぎ — 2026-08-09 06:05 JST

GitHub `kaillebidan-byte/MYGPT` mainを正本として継続する。

## CURRENT

Worker Fanoutは旧v0.x継ぎ足しではなく `extensions/mygpt-worker-fanout-v2/` で再構築中。

Reuse policy:
- Translation Loop 0.5.1:原則直接流用（runtime_guard、Prompt Stacker、runToken/state concepts）
- VoiceBridge 0.2.6:原則直接流用（route/generation/background-tab observer）
- AutoGPT 0.0.71: visible DOM/file/new-chat primitivesだけ選別。Bearer/internal API/fetch interception/security-header removal/telemetry/external upload等は除外。

## v0.2.0 live result

One-worker READY test failed:

```text
Phase: ERROR
Worker: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Tab: 22739717
File: kokyo_base_20260805.png
COMPOSER_INSERT_VERIFY_FAILED
```

Detail showed file reconstruction + `input.files` assignment succeeded but attachment evidence was only `input-files`, not visible ChatGPT UI. No submit occurred.

## v0.2.1 fix

- AutoGPT-proven ChatGPT attachment sequenceに合わせ `DataTransfer -> input.files -> change`。file-input `input` eventは削除。
- `input.files`単独を成功扱いしない。
- visible filename / newly appeared attachment UIを必須化。
- UI未確認なら `FILE_ATTACHMENT_UI_NOT_CONFIRMED`。
- attachment後にcomposer editorが安定するまで待つ。
- reflection確認時はcurrent editorを再取得してReact remountに対応。
- CRLF正規化追加。
- send/submitはまだ実装しない。

Static tests PASS。

## NEXT ONLY

v0.2.1をVivaldiでone-worker READY再テストする。

PASS条件:
- Phase READY
- Attachment visible-filename または visible-attachment-ui
- canonicalが目視で添付済み
- packetが未送信draftで存在
- user turnなし
- generationなし

PASS後、同じprepare routineをF2/F3/F4の3 slotへ拡張する。control planeを再設計しない。

# MYGPT Worker Fanout v2 — v0.2.1 live fix record

Date: 2026-08-09 JST
Status: **STATIC PASS / VIVALDI RE-TEST PENDING**

## v0.2.0 live evidence

User Vivaldi result:

```text
Phase: ERROR
Worker: /g/g-6a76f033fc088191846913f86ba0625d-mygpt-single-frame-worker-test
Tab: 22739717
File: kokyo_base_20260805.png
Attachment: -
Composer: -
Insert: -
COMPOSER_INSERT_VERIFY_FAILED
```

Returned detail showed:
- worker identity was correct;
- reconstructed canonical name/size/type were correct;
- `input.files` assignment succeeded (`attachment.evidence = input-files`);
- packet reflection failed;
- no submit occurred.

## Diagnosis

v0.2.0 treated `input.files` persistence as attachment success even when no visible ChatGPT attachment UI had appeared. It also dispatched a file-input `input` event before `change`.

The AutoGPT 0.0.71 audit records its regular ChatGPT upload primitive as assigning a `DataTransfer` file list and dispatching `change`. v0.2.1 follows that proven sequence more closely.

The composer verification also held the originally found editor node while ChatGPT can remount the composer after attachment state changes.

## v0.2.1 changes

- file input selector prefers `accept*=image`;
- canonical path is `DataTransfer -> input.files -> change` only;
- `input.files` alone is diagnostic, not PASS evidence;
- require visible filename or newly appeared attachment/preview UI;
- fail as `FILE_ATTACHMENT_UI_NOT_CONFIRMED` when visible UI does not appear;
- wait for a stable current composer before packet insertion;
- reacquire current composer during reflected-text verification;
- normalize CRLF/CR to LF;
- retain `submitted: false` boundary.

## Static result

All v2 Node syntax/tests pass, including:
- route adapter;
- Translation Loop Prompt Stacker insert-only runner;
- Translation Loop runtime guard;
- AutoGPT-style file adapter;
- v2 READY safety contract.

## CURRENT stopping point

Run v0.2.1 in Vivaldi for the same one-worker READY test.

PASS requires:
- `Phase: READY`;
- attachment evidence `visible-filename` or `visible-attachment-ui`;
- canonical visibly attached;
- packet visibly present as unsent draft;
- no user turn / no generation.

Do not begin 3-slot fanout until this one-worker READY path passes live.

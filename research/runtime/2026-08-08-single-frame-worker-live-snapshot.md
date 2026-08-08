# MYGPT Single Frame Worker Test — live runtime snapshot

Date: 2026-08-08 JST
Status: CONTROL — PARTIAL, AWAITING LIVE EDITOR CAPTURE

## Purpose

次のautomation / quality A/Bを開始する前に、R0/R1/R2を通した実機Custom GPT workerの設定を固定する。

この文書はworkerへ見せるKnowledgeではない。CONTROL / EVIDENCEとして使う。

## Source priority

1. 2026-08-08時点の実機Custom GPT editor表示
2. 実機chatで観測済みの挙動
3. CURRENT research records

実機editorとresearch記録が衝突する場合は、実機editorを記録したうえで差分を明示する。推測で埋めない。

## Official editor fields to capture

OpenAIの現行GPT editorには少なくとも以下の設定項目があるため、スナップショットではこれらを確認する。

- Name
- Description
- Conversation starters
- Instructions
- Knowledge
- Recommended model
- Capabilities
  - Web search
  - Image generation
  - Code Interpreter & Data Analysis
  - その他、実機に表示されるcapability
- Apps
- Actions
- version / update state if relevant

## Known CURRENT values from validated project evidence

### Identity

- GPT name: `MYGPT Single Frame Worker Test`

### Capability / dependency state

Validated semantic state:
- Image generation: ON
- Web: OFF
- Code / Data Analysis: OFF
- Actions: NONE
- Apps: NONE
- Knowledge: NONE

### Runtime model behavior

Validated production runtime:
- user selects / uses `Instant` in the worker conversation
- R0/R1/R2 production evidence chain is on this Instant path
- Thinking is not globally prohibited, but it is not the production default

Important:
- editor-side `Recommended model` and chat-side selectable model/mode are separate fields and must not be conflated
- exact current editor value for Recommended model is PENDING live capture

### Worker context contract

Known validated behavior:
- one fresh Custom-GPT conversation or clean pre-motion Branch per generated frame
- direct canonical attachment or proven clean-Branch inheritance
- worker sees one current static pose only
- no full motion
- no other pose packets
- no F1/F2/F3/F4 / progress / sequence / board / sheet / storyboard context
- generated frames never become identity canon

### Proven targeted invariant retained in live worker

`動かす腕の大袖は、腕の屈曲に伴ってたわみ・向きが変わってよいが、基準画像の大袖としての基本構造を維持する。袖口の開口、金色の縁取り、灰色の内側、袖の模様を、別構造へ描き替えたり消したりしない。`

This is only one known sentence from the live Instructions. Do not reconstruct the rest of the Instructions from research prose.

## LIVE EDITOR CAPTURE — PENDING

The following must be copied from the current editor before N3-B1A:

### Name
PENDING

### Description
PENDING

### Conversation starters
PENDING

### Instructions — exact full text
PENDING

### Knowledge
PENDING visual confirmation

### Recommended model
PENDING

### Capabilities
- Web search: PENDING visual confirmation
- Image generation: PENDING visual confirmation
- Code Interpreter & Data Analysis: PENDING visual confirmation
- other visible capabilities: PENDING

### Apps
PENDING visual confirmation

### Actions
PENDING visual confirmation

## Acceptance for snapshot completion

Snapshot becomes `COMPLETE CONTROL` only when:
1. exact Instructions全文が保存されている
2. editorの各capability / Knowledge / Apps / Actions状態が実機で確認されている
3. Recommended modelのeditor値と、chat runtimeで使ったInstantを区別して記録している
4. research記録との差分があれば明記している
5. live configurationを変更せず記録だけ行っている

Until then, do not start an automation experiment that would make later comparison ambiguous.

# MYGPT調整プロジェクト 引継ぎ

更新日: 2026-08-08 22:39 JST

GitHub `main` を正本とする。チャット記憶だけで過去方式へ戻さない。

## 次チャットで最初に読む

1. `research/PROJECT-HANDOFF.md` — この文書
2. `research/decisions/2026-08-08-three-extension-synthesis.md` — CURRENT N3実装方針
3. `research/runtime/2026-08-08-single-frame-worker-live-snapshot.md` — 現行Custom GPT実機設定の完全スナップショット
4. `research/decisions/2026-08-08-production-v0-generalized-verdict.md` — generation品質の正本
5. `research/decisions/2026-08-08-temp-extension-source-lifecycle.md` — 一時ソースの必須削除規則
6. `research/audits/2026-08-08-autogpt-0.0.71-static-analysis.md`
7. `research/audits/2026-08-08-voicebridge-0.2.6-reuse-assessment.md`
8. `research/audits/2026-08-08-translation-loop-0.5.1-static-analysis.md`
9. `research/plans/2026-08-08-post-v0-roadmap.md`
10. `research/decisions/2026-08-08-production-v0-acceptance.md`

`research/experiments/2026-08-08-n3-orchestration-ceiling.md` はN3の経緯と公式built-in ceilingの記録として残すが、browser automationのCURRENT実装判断は `three-extension-synthesis.md` を優先する。

---

## 0. 最重要制約

- repo: `kaillebidan-byte/MYGPT`
- ユーザー環境: ChatGPT Plus + Vivaldi / Chromium extension環境
- productionをWork / Codex系週間agentic allowanceやOpenAI API別課金へ依存させない。
- 「画像生成するな」「画像生成依頼ではありません」と明示されたturnでは画像生成を絶対に起動しない。
- 設計判断前にGitHub `main`、実画像、実ログ、既存検索、過去棄却理由を確認する。
- 直近の参照だけで設計を決めない。
- 公式機能に手段がないことを、community / browser-side手段までないと一般化しない。
- そのturnで実行可能な確定作業を先送りしない。
- ユーザー側の次操作がある場合は回答冒頭に置く。
- generation tuningとUI automationを混ぜない。automation都合でworker isolationを弱めない。

---

## 1. CURRENT generation status — PRODUCTION V0 GENERALIZED PASS

R0 / R1 / R2 はすべて最終PASS済み。

Validated scope:
- 1 canonical character
- F1 = canonical静止姿勢
- one-shot motion
- 4 keyposes total
- F2/F3/F4のみ独立生成
- front-facing baseline camera
- chroma background
- deterministic board / strip composition

範囲外:
- loop motion
- non-canonical start pose
- multi-person
- large camera/viewpoint changes
- complex prop/environment interaction
- Thinking default
- zero-click fan-out

First-pass reliabilityは100%ではない。
R1/R2ではlocal state failureがあり、canonicalから失敗frameだけ局所retryしてPASSした。

Generation品質を上げるためのW-series global tuningはCLOSED。N3 automationのために再開しない。

---

## 2. CURRENT production architecture

```text
natural motion request
        ↓
planner understands full motion
        ↓
F1 = canonical
        ↓
planner emits F2/F3/F4 independent local static packets
        ↓
F2/F3/F4 = isolated Custom GPT / Instant workers
             canonical + current one pose only
        ↓
raw visual identity / motion audit
        ↓
failed local frame only: isolated retry from canonical
        ↓
remove_chroma_key.py (despill enabled)
        ↓
common scale / baseline normalization
        ↓
compose_keypose_board_from_frames.py / build_motion_strip.py
        ↓
visual audit + machine geometry/chroma audit
```

4 keyposesを3 independent image generationsで作る。
Generated frameを次frameのidentity sourceにしない。

Workerへ見せない:
- full motion
- other pose packets
- F1/F2/F3/F4 sequence structure
- progress%
- board / sheet / storyboard / 2x2 concepts
- other generated frames

---

## 3. 現行Custom GPT worker — 実機snapshot COMPLETE

Name:
`MYGPT Single Frame Worker Test`

Description:
`添付された基準画像から、指定された1つの静止姿勢だけを生成する隔離テスト用GPT。`

Live editor:
- Recommended model: `GPT-5.6 Sol (gpt-5-6-instant)`
- Image generation: ON
- Web search: OFF
- Code Interpreter & Data Analysis: OFF
- Knowledge: NONE
- Actions: NONE
- Conversation starters: NONE
- Plus editor画面には独立Apps toggleは表示されていない。active/exposedなApp integrationなしとだけ扱う。

Exact Instructions全文は:
`research/runtime/2026-08-08-single-frame-worker-live-snapshot.md`

重要:
- Instantがproduction validated default。
- Thinkingは後のBranchで画像生成成功例があるがdefaultではない。
- Instructionsは「1 request = 1 image」を要求するが、Instant/Thinkingの両方でA/B候補が返る場合がある。platform-level multiplicity保証ではない。

Custom GPTを残す理由:
- worker configuration container
- saved memory /通常custom instructions / previous conversationから切り離すisolation container

fresh chat自動化ができても、Custom GPTを捨てる理由にはならない。

---

## 4. Carrier / identity / post-process — 既に解決済み

Carrier:
- N1 standalone portrait 4/4
- no 2x2 / labels / dividers
- fresh Custom GPT chat = proven
- clean pre-motion Branch = proven

Identity:
- broad Knowledge不要
- confirmed weak pointsはactive large sleeveとvisible hand
- live Instructionsには大袖の局所不変条件を残す
- visible hand articulation / palm orientationは必要なlocal packetだけへabsolute指定

R0:
- anatomical-right hand raise PASS

R1:
- mirrored anatomical-left hand raise FINAL PASS after local B retries
- small landmark近傍のspatial first-pass failureを確認

R2:
- torso-dominant shallow bow FINAL PASS after local C retry
- endpoint depthをexpression changeで代替する失敗を確認

Chroma CURRENT ACTIVE:
- `audit/scripts/remove_chroma_key.py`
- `audit/scripts/compose_keypose_board_from_frames.py`
- `audit/scripts/build_motion_strip.py`
- `audit/scripts/machine_audit_board.py`

`remove_chroma_key.py` dominant-channel despill ON。

---

## 5. N3 correction history

古い誤り:
- official built-in bulk fan-outが見つからないことを、Plus/no-separate-API条件全体のorchestration ceilingと一般化した。

修正済み:
- official built-in fan-out: not found
- browser-side automation: viable research category
- Chinese/community prior artを再確認

中国圏/community evidence:
- `hzeyuan/OpenGPTS`: browser-side GPTs / multi-GPT prior art
- Autojourney AutoGPT: automatic new-chat, queued prompts, image upload/generation workflowのcurrent implementation evidence

この調査の副産物として、Custom GPT browser automationの実装方向が具体化した。

---

## 6. AutoGPT 0.0.71 — 実機A1 + static analysis

User installed Autojourney AutoGPT in Vivaldi and supplied installed extension package `0.0.71_0.zip`。

Live finding:
- `MYGPT Single Frame Worker Test` Custom GPT page上でAutoGPT UIが起動。
- よって `/g/...` pageでbrowser extensionが動作できること自体はPASS。

Useful implementation evidence:
- visible new-chat DOM control
- visible composer insertion
- `input[type=file]` + `File` / `DataTransfer`によるChatGPT自身のfile upload
- visible send operation

Full AutoGPTをproduction採用しない理由:
- `window.fetch` interception
- ChatGPT internal `/backend-api/...` observation/direct calls
- Bearer Authorization capture
- streaming response parsing
- generated output extraction / auto-download
- CSP / X-Frame-Options / COOP / COEP removal
- visibility/focus spoofing
- external membership checks
- Google Analytics telemetry
- third-party upload helper
- Plan gating

重要:
- ChatGPT Bearer tokenをAutojourney/GAへ外送している経路までは確認していない。確認したtoken用途はChatGPT内部endpoint。
- normal ChatGPT image-upload pathがcanonicalをimgbbへ送る証拠も確認していない。

Verdict:
**AutoGPT本体は使わず、visible UI primitiveだけclean-roomで再実装する。**

---

## 7. VoiceBridge 0.2.6 — static analysis

User supplied existing local add-on:
`chatgpt_voicebridge_extension_0.2.6.zip`

Strengths:
- Manifest V3
- low-privilege standard DOM content script
- all `chatgpt.com/*` including `/g/...`
- MutationObserver
- SPA route change detection
- assistant message / composer / send observation
- visible stop-button based generation-state observation
- multi-tab content/background communication
- no internal ChatGPT API interception
- no Bearer capture
- no telemetry
- no third-party image upload

Current network path:
- configured local VoiceBridge endpoint only, default `127.0.0.1:50333/speak`

Not enough alone:
- no tab creation
- no prompt insertion
- no file attachment
- no fan-out state machine

Use only its observer / generic route concepts。
Speech endpointと1秒persistent pingはMYGPT専用拡張へ初期段階では持ち込まない。

---

## 8. Translation Loop Test 0.5.1 — static analysis

User supplied another existing add-on:
`chatgpt-translation-loop-test-0.5.1.zip`

Usage assumption:
- 1日数時間程度のbounded operation

Static result:
- all JS `node --check` PASS
- bundled `test_*.js` 全PASS
- no application-level fetch/XHR/WebSocket
- no internal ChatGPT API / Bearer capture / telemetry

Strengths — three inspected extensionsで最も強いcontrol plane:
- `chrome.tabs` / scripting / alarms
- robust composer discovery
- native textarea setter / contenteditable input events
- visible send-button click
- wait until send enabled
- fail closed if draft exists
- positive post-submit evidence
- `runToken` stale-operation rejection
- serialized runtime mutation
- tab ownership
- route/conversation verification
- bounded operation
- ambiguous state -> stop
- tests / module separation

Important limitation:
- current route model is ChatGPT Project `g-p-...` specific
- MYGPT production workerはuser-created Custom GPT `/g/...`
- Project route parser / rotation logicをそのまま使わない

Use:
- control plane / state-machine concepts
- prompt runner
- positive submit verification
- fail-closed rules
- tests

Do not use unchanged:
- Project `g-p` parser
- arbitrary translation continuation loop
- worker packet/canonical dataの`storage.sync`

---

## 9. CURRENT N3 implementation decision — THREE-WAY SYNTHESIS

正本:
`research/decisions/2026-08-08-three-extension-synthesis.md`

一つを丸ごと採用しない。
既存VoiceBridge/Translation Loopを壊して改造しない。

**独立した `MYGPT Worker Fanout` extensionを新設する。**

Architecture:

```text
MYGPT planner
  -> F2 / F3 / F4 packets
        ↓
MYGPT Worker Fanout

Control plane
  Translation Loop由来の設計
  - runToken
  - bounded exactly 3 slots
  - tab ownership
  - serialized state
  - fail closed
  - positive submit evidence

Route / identity adapter
  VoiceBridge由来のgeneric ChatGPT observation
  - /g/... coverage
  - SPA route observation
  - Custom GPT stable identity verify

DOM adapter
  - Translation Loop型composer handling
  - AutoGPTで実証されたvisible file-input/DataTransfer primitiveをclean-room実装
  - visible UI controls only

Observer
  - MutationObserver
  - visible stop-button generation state

Coordinator
  - open 3 same-Custom-GPT tabs
  - bind F2/F3/F4 to tab IDs
  - attach same canonical independently
  - insert one packet per tab
  - controlled submit

Session
  - local/ephemeral only
  - no telemetry
  - no external upload
  - no sync of canonical/packets
```

Explicitly DO NOT implement:
- ChatGPT internal API
- Bearer token capture
- fetch/response interception
- backend response parsing
- generated image URL extraction
- automatic download
- CSP/security header removal
- visibility/focus spoofing
- auto retry/rate-driving
- telemetry
- third-party membership
- third-party image upload

---

## 10. MYGPT Worker Fanout — 実装順序

### Gate 0 — next chatで開始する場所

**画像生成なし。**

1. repoに独立extension directoryを作る。
2. current Custom GPT pageからnormalized `/g/...` worker identityを取得するroute adapterを作る。
3. popup/backgroundからそのsame worker identityで1つだけ新規tabを開く。
4. content scriptがdestination route / worker identityを報告する。
5. same `MYGPT Single Frame Worker Test` identityならPASS。
6. このGateではpromptを入れない。canonicalも添付しない。sendしない。

### Gate 1
- one tabへpacket textをinsert
- submitしない

### Gate 2
- canonicalをextension UIで1回選択
- ChatGPT自身のvisible file inputへattach
- submitしない

### Gate 3
- canonical + packet preparation in one tab
- manual visual confirm

### Gate 4
- exactly 3 tabsへF2/F3/F4 fan-out
- still no auto-submit
- all 3 same Custom GPT identity / isolated packetを確認

### Gate 5
- controlled submit追加
- all slots READY後にvisible send controlsのみ使用
- positive submit evidenceを確認
- no auto retry

### Gate 6
- known validated one static packetでsingle image invocation

### Gate 7
- 3-worker actual fan-out image generation

Output saving / review remains manual for first operational milestone。

---

## 11. Temporary extension source escrow — 必ず最後に削除

Directory:
`research/temp-extension-sources/`

Purpose:
- fan-out実装中だけ3 extension evidenceを保持
- runtime / Knowledge / generation referenceには絶対使わない

Stored:
- VoiceBridge 0.2.6 exact ZIP bytes — Base64 reconstructable
- Translation Loop 0.5.1 exact ZIP bytes — Base64 split parts reconstructable
- AutoGPT 0.0.71 — public repoで再配布licenseが確認できないためfull packageは置かず、version/hash/provenance recordのみ

Permanent lifecycle rule:
`research/decisions/2026-08-08-temp-extension-source-lifecycle.md`

**Mandatory completion action:**
`MYGPT Worker Fanout` accepted completion gate到達後、`research/temp-extension-sources/` directory全体を削除する。
これはoptional cleanupではなくcompletion gateの一部。

削除前に:
- 必要な機能がfinal implementationへ独立実装/reuse済み
- 必要なaudit/decision findingsがpermanent docsへ残っている
- reused codeに必要なlicense/noticeをtemp外へ保持
- final designがtemp sourceへ依存していない

---

## 12. Quality improvement research — automation後

Post-v0 roadmapの順序を維持する。

AutomationがPASSまたは明確にblockされる前に、新しいidentity conditioningを入れない。

Planner first-pass reliability:
- R1 near-landmark state: positive body landmark優先、強いexclusion gapでstateを早めない
- R2 torso endpoint: absolute torso-angle/body-axis、必要時のみcanonical expression維持

その後のQ1候補:
- A = canonical only
- B = canonical + canonical原画像からlossless cropした大袖detail 1枚

Generated reference / multi-view / character sheetは後順位。
直近の中国圏/consistency prior artだけで全面設計変更しない。

---

## 13. FROZEN legacy / asset policy

CURRENT ACTIVE:
- minimal Custom GPT worker architecture
- active post-processing/audit scripts
- 今後の専用 `MYGPT Worker Fanout` はN3 acceptance後にactive候補

CURRENT CONTROL / EVIDENCE:
- research handoff / decisions / experiments / audits
- generation workerに見せない

TEST / AUDIT FIXTURE:
- layout guides
- historical boards/artifacts
- generation referenceへ戻さない

FROZEN LEGACY:
- `project/**`
- `legacy/**`

Reactivation requires:
1. named current failure
2. old rejection reason
3. new evidence invalidating old reason
4. single-variable test
5. comparison with current acceptance
6. PASS後のみstatus変更

Do not restore:
- old Project runtime
- broad Knowledge
- four-pose layout guides as generation input
- generated-frame identity chaining
- old Actions/GitHub-coupled generation architecture

---

## 14. CURRENT stopping point

Completed this chat:
- live Custom GPT worker snapshot COMPLETE
- AutoGPT Vivaldi install permission reviewed
- AutoGPT UI activation on Custom GPT page observed PASS
- AutoGPT 0.0.71 package static analysis COMPLETE
- VoiceBridge 0.2.6 static analysis COMPLETE
- Translation Loop Test 0.5.1 static analysis COMPLETE
- three-extension synthesis decision COMPLETE
- temporary source escrow created
- mandatory deletion lifecycle rule created

No image generation should be performed merely to continue N3 implementation.

### NEXT ACTION

Next chat should **start coding Gate 0 of the dedicated `MYGPT Worker Fanout` extension**.

Do not start by further researching generic browser automation.
Do not modify the two working local add-ons first.
Do not enable AutoGPT Plan.
Do not touch image-generation quality prompts.

First deliverable:
- minimal Manifest V3 extension skeleton in repo
- Custom GPT `/g/...` identity normalization
- one-tab open + same-worker verification
- non-generation test instructions for Vivaldi

After Gate 0 implementation, user performs the live Vivaldi test and returns screenshot/log result.

# MYGPT external research / prior-art search index

更新日: 2026-08-09 19:52 JST
Status: **CURRENT SEARCH ENTRYPOINT**

この文書は、既存例・外部事例・中国語圏事例・論文・公開GPT・browser automation prior artを探すときの入口。

新しいWeb検索を始める前に、まずここから既存調査へ降りる。同じ一般検索を繰り返さず、既存資料で未解決になっている角度だけを追加検索する。

## 最初に読む

1. `research/chatgpt-project-practices/search-ledger.md`
   - Web調査の検索台帳。
   - R01〜R05の検索語、確認済み一次資料、未確認事項、次に検索する角度を記録。
   - `DONE`の一般論は、仕様更新や新しい実機矛盾がない限り再検索しない。

2. `research/chatgpt-project-practices/README.md`
   - ChatGPT Projects / image reference / orchestration-context調査群の案内。

## Identity-preserving variation / isolated workers

`research/prior-art/2026-08-09-identity-preserving-variation-isolated-workers.md`

目的:
- 1枚のcanonicalから、ペット機能のような「同一subjectの別pose / 別状態差分」を高いidentity fidelityで作る方向を決める
- isolated worker成立後に可能になったA/Bやbest-of-Nを既存研究へ対応付ける

対象:
- OpenAI current image editing / high-fidelity input direction
- Animate Anyone / PoseAnimate — appearance/referenceとpose guiderの分離
- BLIP-Diffusion / OminiControl / GroundingBooth — subject identityとstructure/spatial controlの分離
- AnyDoor / SSR-Encoder / holistic identity research — global identity + local detail
- ConsiStory / StoryDiffusion / StorySync — cross-image consistency（モデル内部機構なので直接移植不可）
- The Chosen One — multiple candidate / consistency selectionの考え方
- DSH-Bench / MaSC — subject/region-aware identity evaluation
- UNO / AnyStory / DreamO / UMO — multi-reference時のrouting / attribute confusion

現在の有力実験順:
1. `ID-V1` — canonicalをsemantic referenceではなく**編集元/source image**として扱うA/B
2. `ID-V2` — canonical + **1 worker専用のsingle-pose visual guide**
3. `ID-V4` — same poseをbest-of-2隔離生成し、identity監査で選択
4. `ID-V3` — 必要な局所だけcanonical-derived detail cropを追加

重要:
- generated frame chainingへ戻さない
- 4pose board / sequence / other slotsをworkerへ見せない
- cross-image attention論文を、generated outputs相互参照で雑に模倣しない
- identity / pose / evaluationを別チャネルとして設計する

同一性改善を検討する場合、まずこのnoteを読む。

## Browser filesystem / selectable output directory

`research/prior-art/2026-08-09-selectable-output-directory-browser-prior-art.md`

対象:
- Chrome `chrome.downloads` のDownloads-relative制約
- File System Access APIのofficial permission lifecycle
- VS Code WebのIndexedDB persisted handle実例
- `idb-keyval`
- GoogleChromeLabs `browser-fs-access`
- `native-file-system-adapter`
- AutoGPT 0.0.71のdownload plumbing
- Autojourney Pro Downloaderというnative companion方式

現在のreuse結論:
- arbitrary user-selected folderのbrowser-only本命は **Chrome official / VS Code Web pattern**
- `FileSystemDirectoryHandle`をIndexedDBへ保存し、later reuse時に`queryPermission` / `requestPermission`する
- `chrome.downloads`はv0.4.5 staging/fallbackとして維持
- `browser-fs-access` / `native-file-system-adapter`を現時点で丸ごと追加する利益は小さい
- permissionは長いgeneration後ではなくRun user gestureでpreflightする方向を優先

保存先実装を追加修正する前に、このnoteを読む。

## 中国語圏の画像生成・一致性・pose control

### 中国語圏AIGC実務の広い調査

`research/chatgpt-project-practices/china-imagegen-practices.md`

対象:
- 角色一致性
- 姿势控制
- 多图参考
- 草图 / visual control signal
- 分镜 / 四宫格 / 组图
- multi-round editing
- Seedream / 可灵 / Vidu
- Bilibili / RunningHub / 中国語実務記事

使いどころ:
- identity / pose / scene / style / structureを別control channelへ分ける既存例を探す
- single-pose visual guideの根拠を確認する
- `分镜 / 四宫格`語彙がmulti-panel表現へ寄せる外部事例を確認する

### 中国圏character-consistency先行研究

`research/prior-art/2026-08-08-cn-character-consistency-recovered.md`

対象:
- ByteDance XVerse
- CharaConsist
- Zhejiang ContextGen
- ByteDance UMO
- 中国圏production heuristic

使いどころ:
- identityとpose/layoutの分離
- large-motion時のfine-grained clothing drift
- multi-reference identity confusion
- canonical identity anchor設計

この資料はquality-research inputであり、CURRENT worker promptへそのまま追加するKnowledgeではない。

## Planner / isolated workerの既存例

`research/chatgpt-project-practices/planner-worker-isolation.md`

対象:
- OpenAI Agents SDK `Agent.as_tool()`
- deterministic code orchestration
- isolated specialist runs
- ImageGenerationTool
- InterleaveThinker
- coDrawAgents / M3

重要:
- この文書の「次は外部isolation PoC」という当時の結論は、後のbrowser-side Worker Fanout実機成功より前のもの。
- **既存アーキテクチャ例の調査資料としては有効だが、CURRENT実装方針ではない。**

CURRENT browser implementationは:
- `research/experiments/2026-08-09-worker-fanout-isolated-generation-recovery-output-checkpoint.md`
- `research/reference/2026-08-09-extension-reuse-inventory.md`

を優先する。

## 中国/community browser automation prior art

`research/experiments/2026-08-08-n3-orchestration-ceiling.md`

この文書には、当時のbrowser automation探索として以下が残っている:
- `hzeyuan/OpenGPTS`
- Autojourney AutoGPT中国語changelog / fresh-chat / queued prompt / image upload prior art
- official built-in fan-outとcommunity browser automationを分離して考える修正

現在はCustom-GPT compatibility gate自体が後続実装でPASSしているため、**N3の未検証結論はhistorical**。
prior-art部分を検索証拠として使う。

## 公開画像生成GPTの既存例

`research/public-image-gpt-reuse/README.md`

配下:
- `source-matrix.md`
- `source-extracts.md`
- `reusable-components.md`
- `current-repository-findings.md`
- `target-structure.md`
- `migration-map.md`
- `third-party-notices.md`

対象:
- 公開画像生成Custom GPTの設計原則
- どの部分を流用し、どの固有設定をコピーしないか
- 旧MYGPT再編時の調査根拠

これは2026-08-07時点の再構築研究であり、CURRENT production構成ではない。

## ChatGPT Projects / image-generation context

`research/chatgpt-project-practices/`

主要資料:
- `reading-list.md` — 外部読み物一覧
- `patterns-and-pitfalls.md` — Projects運用パターン / failure
- `image-reference-notes.md` — reference image実例
- `imagegen-orchestration-context.md` — sequence / multi-panel化の外部調査
- `search-ledger.md` — 検索履歴と未解決角度

## 実装用の既存extension調査

外部検索ではなく、既に取得・解析したextension implementationを探す場合:

`research/reference/README.md`

優先:
1. `research/reference/2026-08-09-extension-reuse-inventory.md`
2. `research/reference/2026-08-09-autogpt-0.0.71-internal-structure-map.md`
3. `research/audits/2026-08-09-autogpt-0.0.71-deep-architecture-analysis.md`
4. `research/decisions/2026-08-09-autogpt-stripped-clone-current.md`

Translation Loop / AutoGPT / VoiceBridgeの既存機構を再実装する前にここを確認する。

## 検索結果とCURRENT判断の境界

外部事例・論文・community implementationは次の用途に使う:
- 仮説生成
- 実装候補の発見
- 「既に存在する解法」の確認
- 検証条件の設計

CURRENT production判断は、外部例だけで上書きしない。
優先順位:

1. MYGPT実機結果
2. CURRENT decision / checkpoint
3.一次資料・実装実物
4. community実例 / secondary source

## 新しい検索を追加したら

MYGPTの設計判断に使った検索だけをdurable stateへ残す。

- 既存topicの続き → `search-ledger.md` または既存topic noteを更新
- 新しい大きな検索軸 → topic noteを作り、この `SEARCH-INDEX.md` へ導線追加
- 中国語圏だけの別角度 → `china-imagegen-practices.md` または `prior-art/` へ統合
- browser automationの実装調査 → `reference/` とCURRENT checkpointへの関係を明記

検索結果の羅列ではなく、次の調査者が「何を再検索しなくてよいか」「何がまだ未確認か」を判断できる形で残す。
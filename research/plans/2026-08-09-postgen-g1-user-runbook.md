# POSTGEN-G1 — user runbook

Date: 2026-08-10 JST
Status: **CURRENT USER PROCEDURE / INPUTS FIXED**

Goal: characterize the Instant post-image dialogue stage without modifying the production worker or Worker Orchestrator v0.5.0.

The user does **not** need to choose or rediscover an R1/R2 pose. Inputs are fixed below from the previously validated R2 evidence chain.

Experimental worker config:
- `research/runtime/2026-08-09-postgen-g1-experimental-worker-config.md`

Fixed control pose:
- `research/runtime/2026-08-10-postgen-g1-selected-control-pose.md`

Execution plan:
- `research/plans/2026-08-09-identity-quality-closed-loop-execution-plan.md`

---

# Part A — create the experimental GPT clone

1. Open the current `MYGPT Single Frame Worker Test` GPT editor.
2. Open `...` and duplicate the GPT.
3. Rename the duplicate:
   - `MYGPT Single Frame Worker POSTGEN G1`
4. Description:
   - `添付された基準画像から指定された1つの静止姿勢を1枚生成し、生成後に短い構造化監査だけを返すPOSTGEN-G1実験用GPT。`
5. Keep the duplicated GPT's recommended model unchanged; test on Instant.
6. G1a capabilities:
   - Image generation ON
   - Web OFF
   - Code Interpreter & Data Analysis OFF
   - Actions NONE
   - Apps not active
   - Knowledge NONE
7. Replace Instructions with the exact G1a text in `research/runtime/2026-08-09-postgen-g1-experimental-worker-config.md`.
8. Save/update the duplicate.
9. Do not edit the original production worker.

---

# Part B — G1a-1 manual single-chat runtime observation

## Input is fixed to R2-B

1. Open a fresh conversation with `MYGPT Single Frame Worker POSTGEN G1`.
2. Use Instant.
3. Attach original canonical `kokyo_base_20260805.png` directly.
4. Send exactly this one prompt:

```text
人物は正面を向いたまま、両足を基準画像と同じ位置で接地させてください。腰から上の上体を前へ傾け、浅いお辞儀として明確に読める姿勢にしてください。頭部は上体と一緒に前下方へ追従させ、首だけを曲げないでください。身体を横向きや斜め横向きへ回転させず、正面基準を維持してください。両腕は新しい独立したジェスチャーを作らず、基準画像の左右関係を保ったまま身体の両側に置き、大袖は上体前傾に受動的に追従して自然に垂らしてください。膝を大きく曲げず、足の位置を変えないでください。それ以外の表情、衣装構造、装飾、体格は基準画像を維持してください。人物1体、1姿勢、全身、正面基準、縦長の1枚だけを生成してください。
```

5. Send once.
6. Do not send any second user message.

Historical reason for this choice:
- R2-B was first-pass PASS;
- R2-C had a known endpoint/expression failure;
- R1-B had known hand-to-flower spatial retry history;
- therefore R2-B is the cleaner runtime-control input.

## Expected behavior

```text
one image generation
-> image appears
-> POSTGEN_AUDIT {...}
-> stop
```

No second generated image.

## Capture

Return:
- one screenshot showing generated image + `POSTGEN_AUDIT` line;
- exact `POSTGEN_AUDIT {...}` text.

Strongly preferred DOM observation after completion:

```js
(() => {
  const turns = [...document.querySelectorAll('article[data-testid^="conversation-turn"], div[data-testid^="conversation-turn"], section[data-testid^="conversation-turn"]')];
  return turns.map((turn, index) => ({
    index,
    text: (turn.innerText || '').slice(0, 500),
    images: [...turn.querySelectorAll('img')].map(img => ({
      alt: img.alt || '',
      w: img.naturalWidth || 0,
      h: img.naturalHeight || 0,
      srcPrefix: String(img.currentSrc || img.src || '').slice(0, 80)
    }))
  })).filter(x => x.text.includes('POSTGEN_AUDIT') || x.images.some(i => i.w >= 128 && i.h >= 128));
})()
```

Copy the console result. Observation only; do not click/send from DevTools.

## G1a-1 PASS

PASS if:
- exactly one image-generation event;
- `POSTGEN_AUDIT` appears after image generation without a second user message;
- no autonomous repair/regeneration;
- image/audit turn relationship can be determined.

If FAIL, stop. Do not proceed to G1a-2.

---

# Part C — G1a-2 Worker Orchestrator v0.5.0 compatibility

Run only after G1a-1 succeeds.

Do not change extension code.

## Preparation

1. Keep `MYGPT Worker Orchestrator v5` manifest `0.5.0` loaded.
2. Reload source ChatGPT tab if the extension was reloaded.
3. Use the cloned `MYGPT Single Frame Worker POSTGEN G1` route as the source GPT.
4. Select the already-proven writable output folder.
5. Select original canonical `kokyo_base_20260805.png`.
6. Set the three slot prompts exactly as follows.

### F2 — historical R2-A PASS state

```text
人物は正面を向いたまま、両足を基準画像と同じ位置で接地させてください。腰から上の上体だけをごく軽く前へ傾け、頭部も上体と一緒にわずかに前下方へ追従させてください。首だけを曲げたり、身体を横向きに回転させたりしないでください。両腕は新しい独立したジェスチャーを作らず、基準画像の左右関係を保ったまま身体の両側に置き、大袖は上体の傾きに受動的に追従して自然に垂らしてください。膝を大きく曲げず、足の位置を変えないでください。それ以外の表情、衣装構造、装飾、体格は基準画像を維持してください。人物1体、1姿勢、全身、正面基準、縦長の1枚だけを生成してください。
```

### F3 — historical R2-B PASS state

```text
人物は正面を向いたまま、両足を基準画像と同じ位置で接地させてください。腰から上の上体を前へ傾け、浅いお辞儀として明確に読める姿勢にしてください。頭部は上体と一緒に前下方へ追従させ、首だけを曲げないでください。身体を横向きや斜め横向きへ回転させず、正面基準を維持してください。両腕は新しい独立したジェスチャーを作らず、基準画像の左右関係を保ったまま身体の両側に置き、大袖は上体前傾に受動的に追従して自然に垂らしてください。膝を大きく曲げず、足の位置を変えないでください。それ以外の表情、衣装構造、装飾、体格は基準画像を維持してください。人物1体、1姿勢、全身、正面基準、縦長の1枚だけを生成してください。
```

### F4 — historical accepted R2-C retry PASS state

```text
人物は正面基準を維持し、両足を基準画像と同じ位置で接地させてください。腰から上の胴体全体を股関節・腰の位置から前へ約20〜25度傾け、肩、胸部、首、頭部を一つの姿勢として同じ方向へ前下方に傾けてください。胸の花紋が描かれた胸部の面もわずかに床方向を向く、完成した浅いお辞儀の姿勢で停止してください。首だけを曲げたり、身体を横向きや斜め横向きへ回転させたりしないでください。両腕は新しいジェスチャーを作らず身体の両側に置き、大袖は重力方向へ自然に垂らしてください。膝を大きく曲げず、両足の位置を変えないでください。両目は基準画像と同じく開いたままにし、口元も基準画像と同じ中立表情を維持してください。それ以外の衣装構造、装飾、体格を基準画像から変更しないでください。人物1体、1姿勢、全身、正面基準、縦長の1枚だけを生成してください。
```

These are the historical selected R2 sequence inputs; do not modify wording for G1a-2.

## Run

1. Press Run once.
2. Grant selected-folder permission if prompted before generation starts.
3. Do not interact with F2/F3/F4 chats while running.
4. Let the extension reach its normal terminal state.

## Record

Copy full popup final status:
- Phase
- Recovery
- Output
- Worker route
- F2 line
- F3 line
- F4 line
- any error

Filesystem check:
- F2 image present
- F3 image present
- F4 image present
- correct slot-specific files
- no wrong image silently saved

## G1a-2 PASS

PASS if:
- F2/F3/F4 generation COMPLETE;
- Recovery COMPLETE;
- Output COMPLETE;
- three correct images present;
- post-image audit text does not make the collector miss/misidentify images.

If Recovery fails with `OUTPUT_IMAGE_NOT_FOUND` after audit text appears, stop and return evidence. Do not patch manually.

---

# Part D — send back exactly these items

1. `G1a-1 manual: PASS` or `FAIL`
2. screenshot
3. exact `POSTGEN_AUDIT {...}` line
4. DevTools console result if obtained
5. `G1a-2 orchestrator: PASS` or `FAIL`
6. full extension popup final status
7. `selected folder: 3/3 files present` or exact discrepancy
8. visibly unusual behavior, if any

Do not perform G1b or G1c until this evidence is reviewed.

---

# Deferred G1b / G1c

G1b later:
- enable one narrow read-only text/JSON Action;
- no image bytes;
- Code Interpreter remains OFF.

G1c later:
- test Code Interpreter generated-image file/path access only;
- do not install MaSC/DreamBench++ yet.

---

# Do not do during G1a

Do not:
- edit production worker;
- modify Worker Orchestrator source;
- use Branch/Thinking;
- add pose guides;
- change canonical;
- add generated identity references;
- install metrics;
- add broad GitHub access;
- allow autonomous same-chat regeneration.

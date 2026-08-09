# POSTGEN-G1 selected control pose

Date: 2026-08-10 JST
Status: **CURRENT / FIXED INPUT FOR G1a**

## Decision

POSTGEN-G1 uses the previously validated **P1-R2 Local packet B — clear shallow forward inclination**.

Do not ask the user to choose an R1/R2 pose. The control input is fixed here so the runtime gate is reproducible.

## Why R2-B

Historical R2 first-pass evidence records:
- R2-A: PASS;
- R2-B: PASS;
- R2-C: FAIL due to insufficient endpoint separation plus unrequested expression change.

R2-B specifically passed:
- clear shallow bow;
- torso/head act as one posture rather than head-only nod;
- no side rotation;
- arms remain passive;
- feet remain planted;
- identity/topology remains usable;
- expression remains broadly neutral with the eye open.

R1-B is not selected because that late-hand-raise state had known spatial-compliance retry history around the chest flower. POSTGEN-G1 is a post-image runtime/collector gate, so a previously clean pose is preferable to a known spatial-stress frame.

Evidence:
- `research/experiments/2026-08-08-p1-r2-torso-bow-plan.md`
- `research/experiments/2026-08-08-p1-r2-first-pass-result.md`
- `research/experiments/2026-08-08-p1-r1-mirrored-unilateral-plan.md`

## Exact user prompt for G1a-1

Attach the original canonical directly and send exactly this one local static-pose request:

```text
人物は正面を向いたまま、両足を基準画像と同じ位置で接地させてください。腰から上の上体を前へ傾け、浅いお辞儀として明確に読める姿勢にしてください。頭部は上体と一緒に前下方へ追従させ、首だけを曲げないでください。身体を横向きや斜め横向きへ回転させず、正面基準を維持してください。両腕は新しい独立したジェスチャーを作らず、基準画像の左右関係を保ったまま身体の両側に置き、大袖は上体前傾に受動的に追従して自然に垂らしてください。膝を大きく曲げず、足の位置を変えないでください。それ以外の表情、衣装構造、装飾、体格は基準画像を維持してください。人物1体、1姿勢、全身、正面基準、縦長の1枚だけを生成してください。
```

## G1a-2 orchestrator slots

For the first orchestrator compatibility test, keep the existing three-slot R2 sequence:

- F2 = R2-A very slight forward inclination;
- F3 = **R2-B clear shallow forward inclination**;
- F4 = use the already-accepted/final R2-C retry packet from the completed R2 evidence chain, not the failed original R2-C packet.

If the sole goal is to test post-image collector compatibility rather than sequence quality, do not introduce any new pose wording, visual pose guide, or identity-conditioning change.

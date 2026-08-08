# N0 — Custom GPT Thinking vs Instant result

Date: 2026-08-08
Status: HISTORICAL RESULT — Thinking failed at N0 runtime; later N2 follow-up proved Thinking image generation can succeed

> Follow-up correction: `research/experiments/2026-08-08-n2-branch-thinking-followup-result.md` records a later clean-seed Branch run that was switched to Thinking and successfully returned two image alternatives. Therefore the Thinking failure below remains valid as an N0 runtime observation, but the earlier conclusion that Thinking was unusable as a general rule is superseded.

## Purpose

Separate two different questions before using a Custom GPT as a single-frame worker:

1. Can Custom GPT Thinking actually execute image generation in the observed runtime?
2. If not, is Custom GPT Instant still accurate enough for the MYGPT single-frame worker role?

## Configuration

Minimal Custom GPT worker:
- image generation ON
- no Actions
- no Knowledge files
- no GitHub integration
- no motion/four-state/sequence instructions
- one current static pose only
- canonical attached directly in the test conversation

Canonical:
- `kokyo_base_20260805.png`
- 1024x1536

Static test pose:
- front-facing standing pose
- anatomical right elbow lightly bent
- anatomical right hand raised to upper-abdomen / solar-plexus region
- other body regions and expression requested to remain based on canonical

## Custom GPT / Thinking

Observed N0 failure:

> 画像生成ツールがこの環境で利用できないため、画像ファイルを返せません。

The generation path began but did not return an image.

Historical interpretation at N0:
- FAIL for tool availability in that run
- do NOT count this as a failure of the context-isolated-worker architecture
- do not spend further N1 trials attempting prompt repair in Thinking

Corrected interpretation after N2:
- this was a runtime/tool-availability incident, not proof of a permanent Custom-GPT/Thinking limitation
- a later Thinking run succeeded
- no evidence yet shows that Branch itself caused the later success

## Custom GPT / Instant

Observed output:
- one image
- one person
- one pose
- full body
- portrait
- green background retained
- anatomical right arm is the active arm
- right hand is at the intended upper-abdomen / solar-plexus region, below the chest flower endpoint
- no multi-panel / 2x2 / labels / divider

### Identity / topology review

Strong preservation:
- face and expression
- hat silhouette and top ornament
- hair silhouette and eye-side fringe
- chest flower emblem
- non-active sleeve overall silhouette
- circular waist medallion
- major tassel/cord arrangement
- lower garment and shoes

Visible drift:
- active right sleeve necessarily changes with the arm pose, and its internal ornament placement / folds are redrawn rather than rigidly preserved
- active-side sleeve opening/silhouette changes substantially from canonical because of articulation
- minor line/shading differences exist over the whole character

The result is not a literal pixel edit/copy of the canonical. Both files are 1024x1536, but an exact pixel comparison found only about 0.17% of pixels exactly identical, so identity is being maintained through redraw rather than through preservation of unchanged pixels.

This matters for later motion continuity: one Instant frame can be visually close while four independently redrawn frames may still exhibit accessory/sleeve jitter.

## N0 decision as used for N1

- Custom GPT / Thinking: failed for tool availability in the N0 run
- Custom GPT / Instant: PASS for the N0 gate; quality sufficient to justify N1

N1 therefore used Instant only.
That historical test choice remains valid.

Current production interpretation after later evidence:
- Instant remains the validated default because N1/W1-W4/C0 were completed on Instant
- Thinking is no longer classified as inherently unavailable
- do not switch production modes based on the single later Thinking success alone

## N1 procedure that followed

For each local static-pose packet:
1. open the same minimal worker GPT in a brand-new conversation;
2. select Instant;
3. directly attach the high-resolution canonical;
4. paste only the current single-pose packet;
5. generate exactly one image;
6. save the image immediately;
7. start another brand-new worker conversation for the next frame.

The worker must not see:
- the full motion request
- the other pose packets
- progress percentages
- F1/F2/F3/F4 labels
- sequence / board / sheet / 2x2 concepts

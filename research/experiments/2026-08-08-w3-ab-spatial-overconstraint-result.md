# W3 — A/B spatial overconstraint result

Date: 2026-08-08 JST
Status: PROMPT-COMPLIANCE PASS / F3-STATE DESIGN FAIL / REPURPOSE AS F2 CANDIDATE

## Inputs

Canonical:
- `kokyo_base_20260805.png`

W3 generated outputs:
- A = `19_12_14 (1)`
- B = `19_12_14 (2)`

Worker configuration stayed unchanged from W1/W2:
- Custom GPT / Instant
- fresh conversation
- canonical directly attached
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- Knowledge NONE
- targeted active large-sleeve invariant retained

W3 changed only the local pose packet. The packet required:
- the entire right hand to stay below the chest flower
- no part of the hand to overlap the flower
- a visible white-cloth gap between flower and fingertips
- neutral lightly extended fingers

## Direct comparison result

### Carrier
PASS for both A and B.

- one person
- one pose
- portrait
- no 2x2 / labels / dividers

### Spatial instruction compliance
PASS for both A and B.

Both outputs place the right hand clearly below the chest flower with a large visible gap. This is repeatable across the A/B outputs, so it should not be interpreted as random model drift.

### Why W3 is not a useful F3

The W3 wording over-constrained the geometry.

The intended late state needed the fingertips to approach the lower edge of the flower while the palm/wrist remained lower on the torso.

But W3 required the *entire hand* to be below the flower and also required an additional visible gap. Given the actual hand size and the limited vertical white-cloth area between the flower and waist/belt region, this naturally pushes the hand down toward the upper waist.

Therefore the model largely complied with W3; the local packet itself described an earlier state than intended.

Correct interpretation:
- not `text-only landmark placement is impossible`
- not `worker ignored the prompt`
- instead: `the W3 spatial constraint encodes an F2-like pose, not the intended F3-like pose`

## A vs B

Both are usable as early-state evidence, but B is the stronger production candidate.

B advantages:
- right hand reads closer to the desired neutral lightly extended hand
- active large-sleeve structure remains coherent with the W1 invariant
- sleeve motif/opening/grey lining remain readable
- waist/tassel area is less visually degraded than A
- overall silhouette is closer to a plausible intermediate from canonical

A remains valid evidence that the W3 wording consistently drives the hand too low for F3.

## Revised sequence candidate

Do not spend more generations trying to force a tiny flower-to-hand gap for F3.

Use the current evidence more efficiently:

- F1 = canonical itself
- F2 = W3-B (`19_12_14 (2)`)
- F3 = W2 (`19_07_53`) — hand already near the flower and hand shape improved
- F4 = generate a new endpoint using the same W1 sleeve invariant and the same neutral-hand rule, with the hand explicitly resting on / covering the chest flower endpoint

Rationale:
- F2 now has a clear early raised-hand state
- F3 has a clear later near-flower state
- a new endpoint is more valuable than another late-state micro-adjustment because the old N1 endpoint predates the sleeve invariant and has weaker active-sleeve continuity

## Next controlled test

W4 — endpoint consistency test.

Do not change Custom GPT settings.

Use:
- fresh Custom GPT / Instant conversation
- canonical directly attached
- same targeted large-sleeve invariant
- same neutral lightly extended hand-shape wording

Endpoint packet should specify only:
- right hand reaches and rests over the chest flower area
- neutral lightly extended fingers
- palm toward torso / back of hand generally visible
- other body parts unchanged

Purpose:
- test whether the improved sleeve topology survives at the endpoint
- produce a candidate F4 compatible with F2=W3-B and F3=W2

If W4 passes, evaluate the complete candidate sequence before adding any new control mechanism.

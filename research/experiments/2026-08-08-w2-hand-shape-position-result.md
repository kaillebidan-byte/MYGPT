# W2 — hand-shape / hand-position packet test

Date: 2026-08-08 JST
Status: PARTIAL PASS — sleeve and hand-shape improved; hand-position constraint still fails

## Purpose

After W1 showed that a single targeted large-sleeve invariant improves the active anatomical-right sleeve without damaging carrier or stable regions, W2 changed only the local pose packet.

Worker configuration remained the W1 configuration:
- Custom GPT / Instant
- fresh conversation
- same high-resolution canonical directly attached
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- Knowledge NONE
- targeted large-sleeve invariant retained

W2 local packet additionally specified:
- the right hand should stay clearly below the chest flower
- fingertips should not overlap the flower
- fingers should be naturally together and lightly extended
- not a fist
- not a widely spread palm
- palm toward the torso / back of hand generally visible toward camera

## Evidence reviewed

Compared:
- canonical `kokyo_base_20260805.png`
- old N1 late frame `18_12_53`
- W1 `19_04_15`
- W2 `19_07_53`

The comparison focused on:
- active right large sleeve
- right-hand articulation
- hand-to-flower spatial relation
- unchanged stable regions
- carrier

## Result

### Carrier
PASS.

- one person
- one pose
- portrait
- no 2x2 / labels / dividers

The extra local hand constraints did not reintroduce the carrier failure.

### Active right large sleeve
PASS / W1 improvement retained.

W2 preserves the W1-style large-sleeve construction much better than old `18_12_53`:
- long draped sleeve remains
- large opening remains readable
- grey inner lining remains visible
- gold-trimmed opening remains coherent
- decorative motif remains part of the same sleeve rather than being reinterpreted as a different sleeve structure

The targeted worker invariant therefore continues to look useful.

### Right-hand shape
PARTIAL PASS / strong improvement.

Compared with W1 and old endpoint-like open-hand behavior:
- the hand is less dramatically spread
- fingers are closer to a neutral lightly extended configuration
- there is no fist
- the gesture reads less like a separate secondary action

However the fingers are still visibly separated rather than fully neutral/compact. Treat this as acceptable-to-WARN for now; do not add more worker-level prose yet.

### Hand-to-flower position
FAIL.

The prompt explicitly required:
- fingertips and chest flower to have a clear gap
- right hand not to overlap the flower

W2 still places the fingertips at the lower-left edge of the flower region; the intended clear gap is not established. The hand is still too high for the requested late-but-not-endpoint state.

This is now a narrower spatial-position compliance problem, not a general identity problem.

### Stable regions
PASS / no new material regression observed.

No new broad failure is visible in:
- head / hat / hair
- non-active sleeve
- waist / medallion region
- lower garment / shoes

## Interpretation

W2 supports the previous decomposition:

1. Worker-level targeted sleeve invariant works and should remain.
2. Hand shape can be improved through the isolated local packet without exposing sequence context.
3. The remaining failure is exact hand placement relative to a visible landmark.

Do not respond by adding a broad identity Knowledge file or more global worker instructions.

## Existing research check before another experiment

The project search ledger already records the OpenAI image-generation prompting guidance that:
- lean / small single-change iteration is preferable for debugging;
- pose/action/hands should be described concretely.

A targeted 2026-08-08 follow-up search of official OpenAI developer material did not surface a documented ChatGPT-specific mechanism that guarantees exact hand-to-landmark spacing from text alone.

Therefore the next test, if run, should remain a single-variable local-packet refinement rather than a worker-architecture change.

## Candidate next refinement

If a W3 is run, change only the spatial relation from vague `少し下` / `明確な隙間` to a stronger whole-hand landmark constraint, for example:

`右手全体を胸の花紋より下に置く。指先を含む右手のどの部分も花紋の輪郭へ重ねない。花紋の最下端と右手の最上端の間に、少なくとも指1本分ほどの背景色ではなく衣服部分が見える間隔を残す。`

Keep the same hand-shape wording and the same W1 sleeve invariant.

Do not run multiple variants at once.

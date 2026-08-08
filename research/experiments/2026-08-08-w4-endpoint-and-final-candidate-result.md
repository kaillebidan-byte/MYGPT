# W4 — endpoint consistency and final candidate result

Date: 2026-08-08 JST
Status: PASS — W-series generation tuning complete

## Worker configuration

Unchanged from W1-W3:
- Custom GPT / Instant
- fresh conversation
- same high-resolution canonical directly attached
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- Knowledge NONE
- targeted active large-sleeve invariant retained

No additional worker knowledge or global motion context was introduced.

## W4 request intent

Endpoint only:
- anatomical-right hand reaches the chest flower
- hand rests naturally over the flower area
- neutral lightly extended fingers
- palm toward torso / back of hand generally visible
- all non-active body regions remain anchored to canonical

## W4 result

### Carrier
PASS.

- one person
- one pose
- portrait
- no 2x2 / labels / dividers

### Endpoint
PASS.

The right hand reaches and visibly overlaps the chest flower. The pose clearly reads as the stop/end state rather than another intermediate.

### Hand shape
PASS / minor-WARN only.

The fingers are lightly extended and substantially more neutral than the original N1 endpoint behavior. The hand is not a fist and is not dramatically splayed. Small redraw differences remain but no new gesture/action is introduced.

### Active anatomical-right large sleeve
PASS.

Compared with the old N1 endpoint, W4 preserves the W1-style sleeve construction much better:
- long draped sleeve remains
- large opening remains readable
- grey inner lining remains visible
- gold-trimmed opening remains coherent
- decorative motif remains attached to the same sleeve concept rather than becoming a different sleeve topology

The targeted sleeve invariant remains effective at the endpoint.

### Stable regions
PASS / minor-WARN.

No production-blocking new regression was observed in:
- hat / hair / face
- non-active sleeve
- waist medallion and major cords/tassels
- lower garment
- shoes

W4 is still an independent redraw, so fine line/shape differences remain. Do not interpret this as pixel preservation.

## Final candidate sequence after W1-W4

Use:
- F1 = canonical `kokyo_base_20260805.png`
- F2 = W3-B `19_12_14 (2)`
- F3 = W2 `19_07_53`
- F4 = W4 `19_17_55`

Do not use:
- regenerated neutral N1 frame as F1
- W3-A when W3-B is available
- old N1 endpoint when W4 is available

## Sequence-level visual result

### Motion semantics
PASS.

The anatomical-right hand progresses monotonically:
1. F1: arm down / neutral start
2. F2: hand raised to upper-waist / lower-torso early state
3. F3: hand raised near the chest flower but not yet at the endpoint
4. F4: hand reaches and rests over the chest flower

No endpoint reversion and no active-limb side swap.

### Carrier
PASS 4/4.

All generated moving frames are standalone portraits. No multi-panel regression.

### Active sleeve continuity
PASS with minor visual variation.

The sleeve naturally shortens/lifts in screen space as the arm raises, while the opening / grey lining / gold trim / motif remain recognizably the same garment construction. This is materially better than the original N1 moving sequence.

### Hand continuity
PASS with minor redraw variation.

Hand shape is no longer changing from near-fist to widely spread palm as a separate unintended gesture. Orientation and finger spacing still vary modestly because every frame is an independent redraw, but the visible sequence reads as one raising action.

### Non-active identity
PASS / minor-WARN.

Hat, hair, face, viewer-right/non-active sleeve, waist structure, lower garment and shoes remain stable enough for deterministic normalization testing. The moving outputs are not identical-pixel edits and should still be audited after composition.

## Quantitative advisory observations

Foreground bounds for the final candidate remain vertically aligned and preserve the same viewer-right boundary; the total width shrinks as the active sleeve moves inward, which is expected from the pose change.

Advisory stable-region similarity remains strongest between F2/F3. W4 shows more whole-redraw variation than F2/F3, but visual inspection does not show a production-blocking topology failure. Do not use SSIM or pixel identity as a sole gate.

## Decision

Stop W-series prompt tuning here.

Do not:
- add broad identity Knowledge
- add more global worker prose
- add pose-reference images yet
- rerun F2/F3 just to chase small pixel/line differences
- expose sequence context to the worker

Keep the proven worker configuration and the single targeted large-sleeve invariant.

The next step is deterministic C0 post-processing and sequence audit using exactly the final candidate four frames above:
1. chroma removal
2. common scale / baseline normalization
3. deterministic strip/board composition
4. visual identity / motion audit
5. machine geometry/chroma audit

Only if this composed sequence reveals unacceptable flicker/topology drift should C2/C3 controls be reopened.

# C0 — final candidate composed-sequence audit

Date: 2026-08-08 JST
Status: PASS — chroma-edge mitigation applied

## Candidate evaluated

- F1 = canonical `kokyo_base_20260805.png`
- F2 = W3-B `19_12_14 (2)`
- F3 = W2 `19_07_53`
- F4 = W4 `19_17_55`

No new image generation was used for this audit.

## Deterministic processing performed

Using current `main` behavior as the processing contract:
- chroma removal
- common scale / baseline normalization
- deterministic 1024x1536 2x2 composition
- chronological transparent strip
- mechanical geometry/chroma audit
- visual identity / motion audit

Board geometry used current compose defaults:
- outer margin 48
- center gap X 96
- center gap Y 112
- slot padding 16
- common scale ~0.43919

## Mechanical audit

All current machine-audit flags were false on the composed board:
- wrong_aspect: false
- outer_edge_contact: false
- center_vertical_contamination: false
- center_horizontal_contamination: false
- divider_like_vertical_white_band: false
- divider_like_horizontal_white_band: false
- border_not_uniform: false
- background_not_uniform: false
- shadow_like_background: false

## Visual sequence audit

### Motion semantics — PASS

1. F1: right arm down / neutral start
2. F2: upper waist / lower torso early raise
3. F3: near chest-flower late raise
4. F4: hand over chest-flower endpoint

No endpoint reversion and no active-limb side swap.

### Active anatomical-right large sleeve — PASS

W1's targeted invariant survives the final candidate:
- same long large-sleeve construction remains readable
- opening remains readable
- grey inner lining remains present
- gold trim remains coherent
- motif remains attached to the same sleeve topology

### Right hand — PASS / minor redraw variation

The earlier fist-to-wide-palm secondary gesture has been substantially removed.
F2/F3/F4 use a broadly compatible lightly extended hand articulation.
F4 clearly reaches the endpoint.

### Non-active structures — PASS with minor redraw drift

No production-blocking topology failure found in:
- hat / hair relationship
- non-active sleeve
- chest flower
- waist medallion
- major tassel / cord layout
- lower garment
- shoes

F4 differs somewhat more from F2/F3 at raw-pixel / fixed-region level, but visible identity/topology remains coherent. Do not reopen generation tuning for this.

## Chroma-edge finding and fix

Initial transparent outputs showed a thin green fringe on some anti-aliased boundaries when composited over black/white.

Diagnosis:
- not generation / identity / motion failure
- alpha-only chroma removal retained green-dominant RGB in near-key edge pixels

`audit/scripts/remove_chroma_key.py` was therefore updated after C0 with dominant-channel despill:
- only activates automatically when the detected key has one clearly dominant RGB channel
- only touches near-key pixels within a configurable RGB distance
- caps the dominant key channel relative to the strongest non-key channel
- keeps the old alpha threshold / feather behavior
- can be disabled with `--no-despill`

Validated against all four fixed candidate frames on white and black composites.
Result: the visible green fringe is materially reduced without changing the generation candidate or requiring new image generation.

Patch commit:
- `f33abec67811e85bfc3eddf2d283383315eea47f`

## C0 verdict

**PASS for generation architecture, four-frame candidate, deterministic composition, and current chroma-removal path.**

Current production candidate remains:
- F1 canonical
- F2/F3/F4 fresh Custom-GPT / Instant workers
- targeted active-large-sleeve invariant
- absolute visible-hand articulation in each local packet
- deterministic post-processing / audit after generation

W-series generation tuning stays closed.

## Do not do next

- do not regenerate F2/F3/F4 for small pixel differences
- do not add broad identity Knowledge
- do not add global worker prose
- do not return to direct 2x2 generation
- do not treat chroma-edge artifacts as a generation identity problem

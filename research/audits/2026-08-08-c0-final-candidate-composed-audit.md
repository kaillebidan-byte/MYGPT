# C0 — final candidate composed-sequence audit

Date: 2026-08-08 JST
Status: PASS WITH POST-PROCESSING WARN

## Candidate evaluated

- F1 = canonical `kokyo_base_20260805.png`
- F2 = W3-B `19_12_14 (2)`
- F3 = W2 `19_07_53`
- F4 = W4 `19_17_55`

No new image generation was used for this audit.

## Deterministic processing performed

Using the current `main` implementations as the reference contract:
- chroma removal behavior from `audit/scripts/remove_chroma_key.py`
- deterministic common-scale / baseline / slot geometry from `audit/scripts/compose_keypose_board_from_frames.py`
- chronological strip normalization principle from `audit/scripts/build_motion_strip.py`
- mechanical geometry/chroma checks from `audit/scripts/machine_audit_board.py`

Produced locally for inspection:
- transparent F1-F4
- 1024x1536 deterministic 2x2 candidate board
- chronological F1-F4 transparent motion strip
- mechanical-audit JSON

The board used the exact current compose geometry defaults:
- 1024x1536
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

Therefore board geometry / safe gaps / background uniformity are acceptable for this candidate.

## Visual sequence audit

### Motion semantics

PASS.

The sequence reads monotonically:
1. F1 — right arm down / neutral start
2. F2 — right hand around upper waist / lower torso
3. F3 — right hand immediately below / near the chest flower
4. F4 — right hand over the chest flower endpoint

No endpoint reversion and no active-limb side swap are visible.

### Active anatomical-right large sleeve

PASS.

Compared with the old N1 outputs, W1's targeted invariant survives the final candidate sequence:
- long large-sleeve construction remains recognizable
- sleeve opening remains readable
- grey inner lining remains present
- gold trim remains coherent
- motif remains attached to the same sleeve rather than becoming a different sleeve topology

The silhouette changes with the arm, as expected, but does not read as a new garment part in each frame.

### Right hand

PASS / minor redraw variation.

The earlier unwanted fist-to-wide-palm secondary action has been substantially removed.
F2/F3/F4 use a broadly compatible lightly extended open-hand articulation.
F4 clearly reaches the intended endpoint.

### Non-active structures

PASS with minor redraw drift.

No production-blocking topology failure was found in:
- hat / hair relationship
- non-active sleeve
- chest flower
- waist medallion
- major tassel / cord layout
- lower garment
- shoes

F4 shows somewhat more broad redraw difference than F2/F3 in head / non-active sleeve / lower-body pixel structure, but the visible identity/topology remains coherent. Treat this as normal independent-redraw variation, not a reason to reopen worker prompting now.

Advisory fixed-region SSIM from the raw full-resolution frames supports this interpretation but is not used as the identity verdict. F2/F3 are especially close; F4 is somewhat farther from them while remaining visually the same character/outfit.

## Post-processing WARN — transparent-edge green fringe

The current chroma removal produces a thin residual green edge on some anti-aliased boundaries when the transparent PNG is composited over black or white.

This is NOT a generation / identity / motion failure.
It is a separate `remove_chroma_key.py` edge-despill / threshold issue.

The raw green-background frames and deterministic green board do not have a mechanical chroma/background failure; the warning appears after conversion to transparency.

Do not reopen Custom-GPT generation tuning to address this.
Handle it only in the chroma-removal stage.

## C0 verdict

**PASS for the generation architecture and four-frame candidate.**

The project no longer needs W-series prompt tuning for this motion example.

Current production candidate remains:
- F1 canonical
- F2/F3/F4 fresh Custom-GPT / Instant workers
- targeted active-large-sleeve invariant
- absolute visible-hand articulation in each local packet
- deterministic compose/audit after generation

Next engineering task is only the transparent-edge chroma fringe, then Branch / orchestration friction can be considered separately.

## Do not do next

- do not regenerate F2/F3/F4 merely to chase small pixel differences
- do not add broad identity Knowledge
- do not add more global worker prompt text
- do not return to direct 2x2 generation
- do not treat chroma fringe as an image-generation identity problem

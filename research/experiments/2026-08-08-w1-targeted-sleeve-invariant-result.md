# W1 — targeted active-sleeve invariant result

Date: 2026-08-08 JST
Status: PASS for sleeve-control hypothesis / WARN for hand-position semantics

## Purpose

Test only the targeted worker-side invariant introduced after the N1 RAW identity audit:

`動かす腕の大袖は腕の屈曲に伴ってたわみ・向きが変わってよいが、正本の大袖としての基本構造を維持する。袖口の開口、金色の縁取り、灰色の内側、袖の模様を別構造へ描き替えたり消したりしない。`

Keep all other worker conditions unchanged:
- Custom GPT
- Instant
- fresh conversation
- canonical directly attached
- Knowledge NONE
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- one current static pose only

The user request reused the old late-pose request without adding a hand-shape constraint, so the sleeve rule was the intentional changed variable.

## Compared images

Canonical:
- `kokyo_base_20260805.png`

Old N1 frames:
- F2 early: `18_11_57`
- old F3 late: `18_12_53`
- F4 endpoint: `18_13_52`

W1:
- `19_04_15`

All are 1024x1536.

## Carrier

PASS.

W1 remained:
- one image
- one person
- one pose
- full-body portrait
- no 2x2 / labels / dividers

The added sleeve invariant did not reintroduce the earlier multi-panel failure mode.

## Active anatomical-right sleeve

PASS for the W1 hypothesis.

Compared with old F3, W1 preserves the large-sleeve construction much better:
- large hanging bell-sleeve volume remains visible
- sleeve opening remains large and coherent
- grey inner lining remains clearly present
- gold-trimmed opening remains continuous
- decorative motif remains part of the same sleeve rather than being simplified away
- the whole active sleeve reads as the same garment undergoing arm articulation rather than a newly designed smaller folded sleeve

Temporal comparison is especially important:
- old F2 already had a long, hanging large sleeve with a broad grey-lined opening
- W1 late pose is structurally much closer to that F2 sleeve than old F3 was

Therefore the short targeted worker invariant is useful and should be retained for the next controlled test.

## Stable regions

No new broad identity regression was established.

Advisory canonical-region SSIM comparison, old F3 -> W1:
- head: ~0.842 -> ~0.960
- non-active sleeve: ~0.961 -> ~0.961
- waist/right-center: ~0.921 -> ~0.952
- lower body: ~0.949 -> ~0.946

These are not identity verdicts; they only support the visual finding that the sleeve instruction did not damage the previously stable parts of the character.

Foreground chroma estimate:
- canonical bbox: about 635x1438
- old F3 bbox: about 560x1439
- W1 bbox: about 623x1437

The larger W1 width mainly reflects preservation of the hanging active sleeve and must not be interpreted alone as a proportion metric.

## Hand / pose semantics

WARN / not fixed by W1.

The exact old late-pose request said the right hand should be below the chest flower and not yet reach it.

In W1:
- the right hand is higher than old F3
- fingers overlap / intrude into the flower-emblem area rather than leaving a clear gap below it
- the hand is still broadly open

This does NOT invalidate the sleeve-control hypothesis because hand wording was intentionally unchanged in W1.
It confirms that hand articulation and hand-location precision belong in the local pose packet rather than in a broad identity Knowledge file.

## Decision

Keep the targeted large-sleeve invariant in the Custom GPT worker.
Do not add a broad identity Knowledge file.
Do not lengthen the worker with global motion or sequence context.

Next test should change the local pose packet, not the worker configuration.

## W2 — one-frame hand-control test

Use the same worker configuration as W1 with no further setting changes.
Open a fresh Custom-GPT / Instant conversation and attach the canonical directly.

Test one late pose only with explicit local invariants:
- hand stays clearly below the chest flower, with visible gap and no overlap
- fingers naturally together and lightly extended
- not a fist
- not a widely spread palm
- palm toward the torso / back of hand generally toward the viewer

Purpose:
- prove that the planner/local packet can control the second identified continuity defect without changing worker context architecture

Only after W2 passes should F2/F3/F4 be regenerated as three fresh conversations using the same absolute hand-shape rule and per-frame hand-position rules.

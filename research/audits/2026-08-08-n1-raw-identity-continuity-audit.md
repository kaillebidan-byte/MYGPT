# N1 RAW identity / continuity audit

Date: 2026-08-08 JST
Status: COMPLETED — targeted worker adjustment justified

## Inputs reviewed

Canonical:
- `kokyo_base_20260805.png`

N1 Custom-GPT / Instant outputs:
- `18_10_55` — regenerated neutral start
- `18_11_57` — early raise
- `18_12_53` — later raise
- `18_13_52` — endpoint at chest flower

All images are 1024x1536.

## Method

This audit used the current identity contract in `project/sources/production/01-character-identity.md` and inspected:
- proportions
- silhouette
- topology
- part count / attachments
- left/right
- overlap / occlusion
- hat/hair boundary
- chest flower
- both sleeves
- waist medallion / tassels / cords / fasteners
- lower garment / shoes

Simple image metrics were used only as advisory evidence, not as the identity verdict.
Foreground bounds were estimated from the chroma-green background. Stable-region SSIM was also checked without using a single score as a PASS gate.

## Quantitative observations

Estimated foreground bboxes:
- canonical: x=190..823, y=53..1488 => 634x1436
- regenerated neutral: x=218..797, y=31..1490 => 580x1460
- early: x=265..823, y=53..1488 => 559x1436
- late: x=265..823, y=52..1488 => 559x1437
- endpoint: x=265..823, y=53..1488 => 559x1436

The early/late/endpoint frames therefore share nearly identical vertical placement and right-side bounds. Their narrower whole-foreground width is expected because the anatomical-right arm/sleeve is raised inward; it must not be interpreted as whole-body proportion shrinkage.

Advisory SSIM values in regions that should remain comparatively stable:

Canonical vs regenerated neutral:
- head: ~0.46
- non-active sleeve: ~0.56
- waist/right-center: ~0.34
- lower body: ~0.64

Canonical vs moving frames:
- head: ~0.84–0.95
- non-active sleeve: ~0.94–0.96
- waist/right-center: ~0.92–0.95
- lower body: ~0.90–0.94

Moving-frame pairwise stability:
- non-active sleeve: ~0.976–0.978
- waist/right-center: ~0.972–0.981
- lower body: ~0.949–0.985

Interpretation: the moving frames are not suffering broad uncontrolled identity drift. The regenerated neutral frame is the clear outlier.

## Visual audit

### Regenerated neutral start (`18_10_55`)

FAIL as production F1.

Observed whole-character reinterpretation:
- character becomes narrower / more vertically elongated relative to canonical
- face/hair/hat proportions shift more than in the moving frames
- torso and waist geometry are redrawn more strongly
- both sleeve silhouettes differ from canonical despite no motion being required
- lower garment and accessory geometry also shift

Decision:
- do not generate F1 when the canonical already is the required start pose
- use the canonical itself as F1

### Moving frames (`18_11_57`, `18_12_53`, `18_13_52`)

#### Stable / acceptable

PASS or minor-WARN only:
- face identity and expression
- hat overall structure
- hair silhouette / hat-hair relationship
- non-active anatomical-left sleeve (viewer-right): very stable across all three moving frames
- torso proportions outside the active-arm overlap region
- waist medallion and major ribbon/loop structure
- main tassel / cord layout; no obvious major part-count collapse across the three moving frames
- lower garment
- shoes
- common camera / vertical placement

These areas do not justify adding a broad identity Knowledge file or a much longer global worker prompt.

#### Primary FAIL 1 — visible right-hand shape is not invariant

The target motion only specified raising the right hand; it did not request a gesture change.

Observed progression:
- early: hand is relatively curled / near-fist-like
- late: fingers open more and separate
- endpoint: palm is broadly open with extended fingers

This creates an unrequested secondary action: the hand appears to open while rising.

Root cause:
- the local pose packets specified hand position but did not specify hand shape / palm orientation
- because every worker is context-isolated, no worker can infer the desired hand-shape invariant from another frame

Implication:
- this is primarily a **planner/local-packet omission**, not evidence for broad worker identity failure
- future local pose packets must explicitly specify a hand-shape invariant when the hand becomes visible

Recommended packet invariant for this motion class:
`右手は指を自然に揃えて軽く伸ばした中立的な開いた手。握り拳や大きく開いた掌にはしない。手のひらの向きも指定状態を維持する。`

The same absolute hand-shape sentence should be repeated independently in each relevant local packet. Do not tell a worker to 'match the other frames'.

#### Primary FAIL 2 — active right large-sleeve topology/silhouette changes too aggressively

The active anatomical-right sleeve must deform with the arm, so identical silhouette is not required.

However the three outputs change more than the limb motion alone requires:
- sleeve opening size / visibility changes strongly
- grey inner lining exposure changes abruptly
- gold-trimmed opening geometry is reinterpreted
- decorative motif placement shifts substantially with the redraw
- from late to endpoint, the sleeve construction reads as a more different folded configuration than the relatively small hand-position change would predict

This is the strongest actual worker-side identity/continuity weakness in the moving set.

Implication:
- do not add the entire identity contract to the worker
- add one short, targeted invariant for the large sleeve only

Recommended worker invariant:
`動かす腕の大袖は腕の屈曲に伴ってたわみ・向きが変わってよいが、正本の大袖としての基本構造を維持する。袖口の開口、金色の縁取り、灰色の内側、袖の模様を別構造へ描き替えたり消したりしない。`

This does not expose sequence / four-state context and therefore should not undermine the N1 carrier boundary.

#### Secondary WARN — head/hair micro-redraw

The late frame differs slightly more around fringe/face geometry than early/endpoint, but the overall identity remains strong and the moving frames stay mutually close.

Do not add a new global head/hair prompt yet.

#### Secondary WARN — waist accessories

The major medallion / loops / cords / tassels remain recognizable and broadly consistent. Small line/shape changes exist, but no clear major topology failure was established from the current set.

Do not tune this area yet. Re-audit after the targeted sleeve/hand fix before adding more constraints.

## Correct diagnosis after reviewing the actual outputs

The problem is NOT currently 'general identity is bad'.

The evidence supports a narrower diagnosis:
1. regenerated neutral F1 is unnecessary and materially worse — replace it with canonical itself;
2. moving-frame global identity is already fairly strong;
3. the dominant temporal-continuity defects are:
   - unspecified right-hand articulation;
   - over-reinterpreted active right sleeve.

Therefore broad identity Knowledge or a large worker-prompt expansion would be overcorrection and would introduce unnecessary context.

## Custom-GPT adjustment supported by this audit

Keep:
- Instant
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- Knowledge NONE
- fresh conversation per generated frame
- direct attachment of the same canonical every time

Change only the worker instruction's large-sleeve invariant, using the targeted sentence above.

Do not add:
- motion design knowledge
- four-state knowledge
- identity Knowledge file
- board/sheet/audit documents

Separately, update the planner/local-packet contract so any visible hand has an explicit hand shape / palm orientation. This belongs in each isolated packet, not in global sequence context exposed to the worker.

## Next controlled test

W1 — one-frame sleeve test:
- modify only the worker sleeve invariant
- keep Knowledge empty
- use a fresh Custom-GPT / Instant conversation
- attach canonical directly
- reuse the exact old late-pose request first, without changing the hand-shape wording
- compare the active sleeve to old `18_12_53`

Purpose:
- isolate whether the targeted worker invariant improves sleeve topology without reintroducing sheetification or damaging stable regions

After W1:
- if sleeve improves and carrier remains single portrait, run three fresh packets with explicit identical absolute hand-shape constraints to check final continuity
- if sleeve does not improve, do not pile on more prose; proceed to the previously planned local-edit / role-separated-reference fallback research path

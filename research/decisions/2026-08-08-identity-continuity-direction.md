# Identity / continuity direction after C0

Date: 2026-08-08 JST
Status: CURRENT DECISION
Constraint: ChatGPT Plus / no Work / no Codex agentic allowance / no OpenAI API billing for production path

## Current decision in one sentence

Fresh Custom-GPT / Instant workers plus one targeted active-sleeve invariant are good enough for the four-keypose production candidate; C0 deterministic composition passed, so stop generation-prompt tuning and treat the remaining visible green edge as a chroma-removal engineering issue.

## Proven generation architecture

When canonical already represents the one-shot start state:

```text
natural motion request
→ planner understands the full motion
→ planner emits three independent local pose packets
→ F1 = canonical itself, no generation
→ F2 = fresh Custom-GPT / Instant conversation
→ F3 = fresh Custom-GPT / Instant conversation
→ F4 = fresh Custom-GPT / Instant conversation
→ each worker sees canonical + one local pose only
→ deterministic chroma removal
→ common scale / baseline normalization
→ deterministic strip / board composition
→ visual identity / motion audit
→ machine geometry / chroma audit
```

This uses three image generations for a four-keypose one-shot.

## Worker configuration to keep

- model mode: Instant
- Image generation ON
- Web OFF
- Code/Data Analysis OFF
- Actions NONE
- Apps NONE
- Knowledge NONE
- fresh conversation per generated frame
- same high-resolution canonical directly attached every time
- never use a generated frame as the next identity source
- never show full motion / other packets / progress percentages / F1-F4 / sequence / board / sheet concepts
- keep worker prompt short
- retain only the proven targeted active-sleeve invariant beyond the minimal single-frame worker rules

Do not add the full `01-character-identity.md` contract to the worker prompt. Use it as an audit contract.

## Visible-hand local packet rule

When hand shape matters, state it absolutely inside each isolated local packet:
- fingers naturally together and lightly extended
- not a fist
- not a dramatically splayed palm
- palm orientation stated when needed

Do not tell a worker to match another frame.
Spatial wording must encode the intended state itself; W3 proved that an over-strong exclusion can accidentally define an earlier state while still being followed correctly.

## Final four-frame candidate used in C0

- F1 = canonical `kokyo_base_20260805.png`
- F2 = W3-B `19_12_14 (2)`
- F3 = W2 `19_07_53`
- F4 = W4 `19_17_55`

Motion reads:
1. neutral start
2. early raise near upper waist / lower torso
3. later raise near chest flower
4. stop with hand over chest flower

## C0 result

See `research/audits/2026-08-08-c0-final-candidate-composed-audit.md`.

Result: **PASS WITH POST-PROCESSING WARN**.

Deterministic 2x2 composition passed all current `machine_audit_board.py` mechanical flags:
- correct aspect
- no outer-edge contact
- clean center gaps
- no divider-like white bands
- uniform border/background
- no machine-detected shadow-like background contamination

Visual audit passed for:
- monotonic right-hand motion
- endpoint
- active-limb side
- active large-sleeve construction
- hand articulation continuity
- non-active sleeve
- hat/hair relation
- chest flower
- waist medallion / major tassel-cord layout
- lower garment / shoes

Independent redraw differences remain, especially in F4, but no production-blocking topology failure was found.

## Remaining issue — chroma removal only

Transparent outputs made with the current chroma-removal behavior show a thin green fringe along some anti-aliased edges when composited onto black/white.

This is not a generation / identity / motion failure.
Do not change Custom GPT prompting to fix it.

Next engineering work may adjust `audit/scripts/remove_chroma_key.py` edge despill / threshold behavior and validate it against the fixed C0 candidate.

The raw green-background frames and deterministic green board already pass mechanical chroma/background audit.

## Branch / automation

Generation quality has now passed the composed candidate gate.
After the chroma-removal edge issue is handled, Branch may be tested as friction reduction from a clean pre-motion seed.

Zero-click spawning of multiple independent worker chats is still not documented in normal Chat. Work/API remain outside the original constraint.

## Do not do now

- no new W-series generation tuning
- no broad identity Knowledge
- no additional global worker prose
- no new pose-reference image
- no regeneration of F2/F3/F4 for small pixel differences
- no direct 2x2 generation
- no generated-frame identity chaining
- no full-board repair
- no Custom GPT Thinking prompt repair
- do not treat transparent green fringe as a generation problem

## Evidence

- `research/audits/2026-08-08-n1-raw-identity-continuity-audit.md`
- `research/experiments/2026-08-08-w1-targeted-sleeve-invariant-result.md`
- `research/experiments/2026-08-08-w2-hand-shape-position-result.md`
- `research/experiments/2026-08-08-w3-ab-spatial-overconstraint-result.md`
- `research/experiments/2026-08-08-w4-endpoint-and-final-candidate-result.md`
- `research/audits/2026-08-08-c0-final-candidate-composed-audit.md`

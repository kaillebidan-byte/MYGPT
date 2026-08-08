# Incident Addendum — old Project produced one valid single-frame exception

Date: 2026-08-08
Status: CONFIRMED observation / causal interpretation pending fresh-Project rerun

## Context

In the old MYGPT Project, a frame-first one-shot test still produced multi-pose 2x2 sheets for most INITIAL/REPAIR jobs even after old 2x2 sources had been removed from the current source set.

However, one REPAIR output (F4) was a single portrait image containing one person and one pose.

This matters because it disproves the strongest form of the claim that same-turn motion context makes single-frame output impossible in every image-generation call.

## Canonical vs single-frame F4

Canonical:
- `kokyo_base_20260805.png`
- 1024x1536

Single-frame result:
- 1024x1535
- one person / one pose
- green background
- right hand at chest-height endpoint

A direct pixel comparison was performed locally.

Approximate measurements:
- exact pixel match across the whole aligned image: ~0.20%
- exact pixel match inside the estimated character-overlap region: ~0.65%
- estimated character-mask IoU: ~0.94
- overall SSIM: ~0.60

Interpretation:
- this is not a literal pixel copy of the canonical;
- the whole image was re-rendered/reconstructed, although the silhouette and placement are strongly anchored to the canonical;
- the moved arm region differs more strongly than relatively unchanged regions, which is consistent with a localized-edit-like result, but does not prove that ChatGPT used a specific image-edit API/path internally.

## Updated causal interpretation

Do not record the old-Project run as proof that `same-turn 4 jobs always become sheets`.

Observed instead:
- most calls strongly collapse into the overall sequence-sheet representation;
- at least one later REPAIR call escaped that representation and produced a single frame;
- therefore the behavior is stochastic/context-sensitive rather than an absolute hard limitation.

The old Project also still contained at least one historical 2x2 chibi-motion chat at the time of earlier tests. That retained Project conversation is an additional confounder.

## Next test

Use a newly created Project with:
- Project-only memory;
- no migrated historical chats;
- no `four-pose-portrait.png`;
- only the current 01-05 production sources and current test Instructions;
- the same 1024x1536 canonical directly attached;
- the same one-shot request.

Compare the first INITIAL jobs before interpreting repair behavior.

Do not delete or rewrite the old Project until the new-Project A/B result has been captured.

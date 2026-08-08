# M2e — hidden progress contract still sheetifies

Date: 2026-08-08
Status: FAIL / reproduction in progress

## Goal

Test whether four sequential single-image generations can be assigned distinct temporal roles using an internal progress contract (0%, ~35%, ~70%, 100%) without visibly exposing four concrete pose descriptions before generation.

The intended behavior was:
- one image-generation operation at a time;
- one standalone portrait per operation;
- no visible four-pose plan before generation;
- state 1 = neutral start;
- state 2/3 = intermediate motion states;
- state 4 = endpoint;
- no Python/OpenCV/ffmpeg substitution.

## First run observed by user

Before the run was stopped, the user observed:
- 7 split / multi-pose images;
- 2 standalone images.

The assistant repeatedly attempted to recover the first/start state with increasingly explicit negative layout language, including phrases equivalent to:
- one standalone image only;
- no four-way split;
- no continuous poses;
- no collage;
- no multiple people;
- no motion sheet;
- no 2x2;
- no comparison figure;
- do not raise the right hand yet;
- reproduce the attached canonical start pose directly.

Despite this localization, split-image output remained dominant during the observed portion of the run.

The later standalone outputs are not counted as a clean M2e PASS because they occurred after repeated automatic repair / negative-layout prompting.

## Interruption mistake and corrected evidence-capture rule

The test was stopped after failure was already clear, but stopping prevented some generated images from being saved afterward.

Correction for future runs:

1. Save each generated image immediately when it appears.
2. Keep a simple ordinal log (`1`, `2`, `3`, ...), output form, and whether it occurred before or after auto-repair language appeared.
3. Once the experiment's primary outcome is established, stopping is allowed **only after already-rendered evidence has been saved**.
4. A run does not need to finish merely for experimental purity if the primary condition is already decisively failed and the currently visible artifacts have been preserved.
5. If the purpose includes studying autonomous recovery behavior, continue deliberately and record that later outputs belong to a repair phase, not to the original condition.

This replaces the incorrect blanket rule that a failing run must always be allowed to finish.

## Rerun / resend evidence

The user resent the same M2e request. The first and second outputs again appeared as split images, suggesting the same failure path is reproducing.

At this point the rerun is still in progress, so the current evidence is:
- first-run dominant failure: 7 split vs 2 standalone before interruption;
- rerun: outputs 1 and 2 already split.

This is enough to treat the M2e failure mode as reproducible in direction, although the rerun's final counts are not yet known.

## Current interpretation

M2b showed that four successive static requests in one chat can produce 4/4 standalone portraits when no global motion plan is present.

M2e instead keeps a global hidden four-stage motion contract in Project Instructions. The repeated split-image behavior therefore supports the hypothesis that **global multi-state orchestration can contaminate generation even when the concrete four poses are not visibly printed to the user and each local retry asks only for the start pose**.

The 0/35/70/100 abstraction did not provide an isolation boundary. It may still preserve enough sequence-level intent for the generation-facing prompt rewrite to infer a multi-pose representation.

Do not interpret the heavy negative-layout retry sequence as evidence that more `no 2x2` wording is the right production fix.

## Operational note

For the current rerun, save every image as soon as it renders. If the first few saved outputs already reproduce the split-image path, there is no need to keep the run alive solely to prove M2e failure. Continue only if autonomous recovery behavior itself is being studied.

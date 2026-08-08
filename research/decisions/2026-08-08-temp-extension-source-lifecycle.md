# Temporary extension source lifecycle

Date: 2026-08-08 JST
Status: CURRENT LIFECYCLE RULE

Temporary evidence/source escrow exists at:

`research/temp-extension-sources/`

Purpose:
- preserve the three extension evidence sources only while `MYGPT Worker Fanout` is being implemented and verified;
- allow implementation to compare/reproduce safe DOM/control primitives without relying on chat memory.

## Mandatory completion action

**When `MYGPT Worker Fanout` reaches its accepted completion gate, delete the entire `research/temp-extension-sources/` directory.**

This deletion is part of the completion gate. It is not optional repository cleanup.

Before deletion, ensure:
1. the final fan-out implementation contains all required independently implemented/reused functionality;
2. permanent audit/decision documents contain the findings that need to remain;
3. any legally required license/notice for actually reused code is retained outside the temporary directory;
4. no permanent design depends on the temporary archive copies.

After those conditions are met, remove every temporary archive/base64 part/source record in that directory.

## Runtime exposure prohibition

Nothing under `research/temp-extension-sources/` may be used as:
- Custom GPT Knowledge;
- Project Source for generation;
- worker prompt context;
- canonical/reference image conditioning;
- production runtime dependency.

The directory is implementation evidence only.

## AutoGPT exception

Because `kaillebidan-byte/MYGPT` is public and the supplied installed AutoGPT 0.0.71 package contained no redistribution license in the inspected directory, its full archive is not republished. The temporary escrow stores its exact version/hash/provenance record and the permanent static-analysis findings instead.

VoiceBridge 0.2.6 and Translation Loop Test 0.5.1 are preserved temporarily in exact byte-reconstructable Base64 form; Translation Loop Test includes an MIT license.

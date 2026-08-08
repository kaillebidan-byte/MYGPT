# Autojourney AutoGPT 0.0.71 — temporary source record

Status: TEMPORARY EVIDENCE ENTRY / DELETE WITH THIS DIRECTORY AFTER FANOUT COMPLETION

The exact installed-extension ZIP supplied for analysis had:

- filename: `0.0.71_0.zip`
- version: `0.0.71`
- SHA-256: `7c4c7240efe82dd94abc618c44925ab02a28770418d939516762fcd867f862c8`

The package was statically inspected without executing its code.

The supplied package did not include a redistribution license in the inspected extension directory. Because `kaillebidan-byte/MYGPT` is a public repository, the full third-party archive is intentionally not republished here.

Permanent technical findings are recorded in:

- `research/audits/2026-08-08-autogpt-0.0.71-static-analysis.md`
- `research/decisions/2026-08-08-three-extension-synthesis.md`

Use AutoGPT only as prior-art evidence for clean-room UI behavior:
- visible fresh-chat navigation;
- composer insertion;
- normal send controls;
- ChatGPT file input + `File` / `DataTransfer` attachment.

Do not copy/reintroduce:
- internal ChatGPT API interception;
- Bearer token capture;
- response-stream scraping;
- automatic output download;
- security-header removal;
- telemetry/membership infrastructure;
- focus/visibility spoofing.

**Delete this record together with `research/temp-extension-sources/` once `MYGPT Worker Fanout` is accepted complete.**

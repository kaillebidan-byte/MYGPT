# TEMPORARY extension source escrow

Date: 2026-08-08 JST
Status: TEMPORARY / DELETE AFTER MYGPT WORKER FANOUT COMPLETION

This directory exists only to preserve the three extension evidence sources long enough to implement and verify `MYGPT Worker Fanout`.

## Mandatory deletion rule

**Delete this entire directory after `MYGPT Worker Fanout` reaches its accepted completion gate.**

Completion means the dedicated fan-out extension has been implemented, its required reusable behaviors have been independently incorporated or reimplemented, and the final implementation/audit records no longer depend on these temporary source copies.

Do not leave this directory as permanent project content after completion.
Do not expose these temporary sources to the image-generation worker as Knowledge, Project Source, prompt context, or runtime reference.

## Three evidence sources

1. Autojourney AutoGPT 0.0.71 — third-party Chrome/Vivaldi extension inspected as prior art.
2. ChatGPT VoiceBridge 0.2.6 — user-supplied local add-on, inspected for DOM observation/multi-tab behavior.
3. ChatGPT Translation Loop Test 0.5.1 — MIT-licensed test extension, inspected for control-plane/state-machine behavior.

## Storage format

Where an archive is stored as `*.zip.b64`, it is the exact uploaded ZIP bytes encoded as single-line Base64. Restore with e.g.:

```bash
base64 -d input.zip.b64 > output.zip
```

Validate restored bytes against the SHA-256 values below.

## SHA-256

- AutoGPT 0.0.71 uploaded ZIP: `7c4c7240efe82dd94abc618c44925ab02a28770418d939516762fcd867f862c8`
- VoiceBridge 0.2.6 ZIP: `05feb875dd5d7b381f4fff328662ef12efde49ffd61d8bc194ef7b295dfa41be`
- Translation Loop 0.5.1 ZIP: `2c10ed7156ad30fbb8454fa962cff604e24a5ad029f4406d92576fe9400e1b2a`

## Third-party AutoGPT note

The MYGPT repository is public. The inspected AutoGPT package did not contain a redistribution license in the supplied installed-extension directory. Therefore the full AutoGPT archive is **not republished here**. Its temporary entry preserves exact version/hash/acquisition facts and points to the static-analysis record; the MYGPT implementation must remain clean-room and copy only observed UI behavior/architecture concepts, not proprietary/minified source.

See:
- `autogpt-0.0.71-source-record.md`
- `research/audits/2026-08-08-autogpt-0.0.71-static-analysis.md`

## Delete checklist

At fan-out completion, delete:
- this `README.md`;
- `autogpt-0.0.71-source-record.md`;
- `chatgpt_voicebridge_extension_0.2.6.zip.b64`;
- `chatgpt-translation-loop-test-0.5.1.zip.b64`;
- any other files later added under `research/temp-extension-sources/`.

Retain only the final implementation, permanent audit/decision documents, and licensing/notices actually required by reused code.

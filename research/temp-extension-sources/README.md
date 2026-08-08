# TEMPORARY extension source escrow

Date: 2026-08-08 JST
Status: TEMPORARY / DELETE AFTER MYGPT WORKER FANOUT COMPLETION

This directory exists only to preserve the three extension evidence sources long enough to implement and verify `MYGPT Worker Fanout`.

## Mandatory deletion rule

**Delete this entire directory after `MYGPT Worker Fanout` reaches its accepted completion gate.**

This deletion is a required completion step, not optional cleanup.

Completion means the dedicated fan-out extension has been implemented, its required reusable behaviors have been independently incorporated or reimplemented, and the final implementation/audit records no longer depend on these temporary source copies.

Do not leave this directory as permanent project content after completion.
Do not expose these temporary sources to the image-generation worker as Knowledge, Project Source, prompt context, or runtime reference.

## Three evidence sources

1. Autojourney AutoGPT 0.0.71 — third-party Chrome/Vivaldi extension inspected as prior art.
2. ChatGPT VoiceBridge 0.2.6 — user-supplied local add-on, inspected for DOM observation/multi-tab behavior.
3. ChatGPT Translation Loop Test 0.5.1 — MIT-licensed test extension, inspected for control-plane/state-machine behavior.

## Stored material

### AutoGPT 0.0.71

`autogpt-0.0.71-source-record.md`

The exact uploaded package hash/version and analysis provenance are preserved, but the full archive is not republished because this repository is public and no redistribution license was present in the inspected installed-extension package.

### VoiceBridge 0.2.6

Exact uploaded ZIP bytes are preserved as single-line Base64:

`chatgpt_voicebridge_extension_0.2.6.zip.b64`

Restore:

```bash
base64 -d chatgpt_voicebridge_extension_0.2.6.zip.b64 > chatgpt_voicebridge_extension_0.2.6.zip
```

### Translation Loop Test 0.5.1

Exact uploaded ZIP bytes are preserved as Base64 split only because the GitHub connector used here accepts UTF-8 text rather than direct binary upload.

Concatenate in this exact order:

1. `chatgpt-translation-loop-test-0.5.1.zip.b64.part01`
2. `chatgpt-translation-loop-test-0.5.1.zip.b64.part02`
3. `chatgpt-translation-loop-test-0.5.1.zip.b64.part03a`
4. `chatgpt-translation-loop-test-0.5.1.zip.b64.part03b`
5. `chatgpt-translation-loop-test-0.5.1.zip.b64.part03c`
6. `chatgpt-translation-loop-test-0.5.1.zip.b64.part03d`
7. `chatgpt-translation-loop-test-0.5.1.zip.b64.part04a`
8. `chatgpt-translation-loop-test-0.5.1.zip.b64.part04b`
9. `chatgpt-translation-loop-test-0.5.1.zip.b64.part04c`
10. `chatgpt-translation-loop-test-0.5.1.zip.b64.part04d`

Example:

```bash
cat \
  chatgpt-translation-loop-test-0.5.1.zip.b64.part01 \
  chatgpt-translation-loop-test-0.5.1.zip.b64.part02 \
  chatgpt-translation-loop-test-0.5.1.zip.b64.part03a \
  chatgpt-translation-loop-test-0.5.1.zip.b64.part03b \
  chatgpt-translation-loop-test-0.5.1.zip.b64.part03c \
  chatgpt-translation-loop-test-0.5.1.zip.b64.part03d \
  chatgpt-translation-loop-test-0.5.1.zip.b64.part04a \
  chatgpt-translation-loop-test-0.5.1.zip.b64.part04b \
  chatgpt-translation-loop-test-0.5.1.zip.b64.part04c \
  chatgpt-translation-loop-test-0.5.1.zip.b64.part04d \
  > translation-loop.zip.b64
base64 -d translation-loop.zip.b64 > chatgpt-translation-loop-test-0.5.1.zip
```

## SHA-256 validation

- AutoGPT 0.0.71 uploaded ZIP: `7c4c7240efe82dd94abc618c44925ab02a28770418d939516762fcd867f862c8`
- VoiceBridge 0.2.6 ZIP: `05feb875dd5d7b381f4fff328662ef12efde49ffd61d8bc194ef7b295dfa41be`
- Translation Loop 0.5.1 ZIP: `2c10ed7156ad30fbb8454fa962cff604e24a5ad029f4406d92576fe9400e1b2a`

After reconstruction, validate against these hashes before treating the archive as exact evidence.

## Third-party AutoGPT boundary

The MYGPT repository is public. The inspected AutoGPT package did not contain a redistribution license in the supplied installed-extension directory. Therefore the full AutoGPT archive is **not republished here**. Its temporary entry preserves exact version/hash/acquisition facts and points to the static-analysis record; the MYGPT implementation must remain clean-room and copy only observed UI behavior/architecture concepts, not proprietary/minified source.

See:
- `autogpt-0.0.71-source-record.md`
- `research/audits/2026-08-08-autogpt-0.0.71-static-analysis.md`
- `research/decisions/2026-08-08-three-extension-synthesis.md`

## Delete checklist — mandatory at completion

When `MYGPT Worker Fanout` is accepted complete, delete **every file under `research/temp-extension-sources/`**, including:
- this `README.md`;
- `autogpt-0.0.71-source-record.md`;
- `chatgpt_voicebridge_extension_0.2.6.zip.b64`;
- every `chatgpt-translation-loop-test-0.5.1.zip.b64.part*` file;
- any additional temporary source/evidence file later added here.

Retain only:
- the final MYGPT Worker Fanout implementation;
- permanent audit/decision records;
- licensing/notices actually required by code that is legally reused.

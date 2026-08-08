# N3-B1A — AutoGPT 0.0.71 static-analysis result

Date: 2026-08-08 JST
Status: A1 ACTIVATION PASS / FULL EXTENSION REJECTED FOR PRODUCTION PATH / MINIMAL LOCAL AUTOMATION PATH SUPPORTED

## Evidence

See:
- `research/audits/2026-08-08-autogpt-0.0.71-static-analysis.md`
- installed extension ZIP SHA-256 `7c4c7240efe82dd94abc618c44925ab02a28770418d939516762fcd867f862c8`

## What is now confirmed

1. AutoGPT UI activates on the existing `MYGPT Single Frame Worker Test` Custom-GPT page.
2. The extension's ordinary ChatGPT automation is based partly on visible DOM operations:
   - click ChatGPT's own new-chat control;
   - paste into the composer;
   - attach files through ChatGPT's file input.
3. Therefore a separately billed OpenAI API is not technically necessary for the basic primitives MYGPT needs.
4. The full extension also goes well beyond those primitives:
   - fetch interception;
   - ChatGPT Bearer Authorization capture into extension runtime state;
   - direct internal `backend-api` calls;
   - streaming/output parsing and download extraction;
   - ChatGPT security-header removal;
   - visibility/focus spoofing;
   - external membership and analytics traffic.

## Decision

Do not activate an AutoGPT paid/trial plan for the MYGPT production path merely to continue B1A.
Do not adopt the full extension as production orchestration.

This is **not** a rejection of browser automation.
The installed code is strong prior-art evidence that the required low-level visible-UI primitives exist.

The preferred next candidate becomes a minimal local helper that implements only the needed subset while retaining Custom-GPT isolation.

## Minimal-helper boundary

Initial allowed scope:
- operate only on `chatgpt.com` Custom-GPT UI;
- open/target fresh `MYGPT Single Frame Worker Test` conversations;
- use visible DOM/navigation controls;
- optionally prepare/paste one harmless text payload for a non-generation gate;
- no output extraction.

Explicitly excluded from the first implementation:
- hidden/internal ChatGPT API calls;
- Authorization capture;
- response-stream interception;
- generated-output scraping/download automation;
- CSP/XFO/COOP/COEP removal;
- background-focus/visibility spoofing;
- automatic retries/rate driving;
- external telemetry/membership services;
- third-party image upload.

## Next live gate

Before file upload or image generation, prove one fresh Custom-GPT conversation can be opened/targeted by the minimal helper while preserving:
- GPT identity;
- Instant path;
- no inherited planner/full-motion context.

Only after that should canonical file attachment and three-worker fan-out be added incrementally.

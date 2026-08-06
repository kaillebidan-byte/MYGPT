# Privacy Policy — MYGPT Experimental Sprite Audit

Last updated: 2026-08-07

## Overview

The production image-generation GPT does not use external Actions.

A separate experimental GPT configuration may send one generated image reference and audit settings to a separately deployed audit receiver service. The receiver downloads the temporary image, stores it for a limited period, and starts a GitHub Actions workflow in the repository `kaillebidan-byte/MYGPT`.

The audit integration is experimental and is not part of the production GPT while file transfer, storage, and failure handling are being validated.

## Data processed

The experimental audit flow may process:

- one image file reference supplied through OpenAI's GPT Actions infrastructure
- the generated image downloaded by the audit receiver
- a request identifier and audit identifier
- expected animation-state names
- normalization and issue-publication options
- a short-lived HTTPS image URL created by the audit receiver
- generated audit outputs, including `audit.json`, `contact-sheet.png`, `preview.gif`, and `normalized-spritesheet.webp`

Do not submit private, confidential, personal, or access-controlled images to the experimental audit flow.

## Data flow

```text
OpenAI GPT Actions
  → audit receiver service
  → short-term controlled image storage
  → GitHub repository_dispatch
  → GitHub Actions
```

The OpenAI temporary file URL is intended to be consumed immediately by the audit receiver. It is not intentionally written to GitHub Issues or audit artifacts.

## Storage and retention

The audit receiver must define and enforce a limited retention period for the source image. The source image should be deleted after the audit is complete or after the configured short-term retention period, whichever occurs first.

GitHub Actions audit outputs are stored as workflow artifacts for up to 14 days unless repository settings or the workflow are changed.

A summary may be posted as a GitHub Issue in the public repository. The summary may include:

- audit ID
- request ID
- state names
- detected problems
- repair instructions
- workflow URL

The Issue must not intentionally include the source image, source image URL, OpenAI file reference, receiver token, or GitHub token.

## Third-party processing

The experimental flow may involve:

- OpenAI's GPT Actions infrastructure
- the separately deployed audit receiver and its storage provider
- GitHub API and GitHub Actions

Their respective terms and privacy policies apply.

## Authentication

The GPT Action may use a Bearer token to authenticate to the audit receiver.

The audit receiver may use a GitHub token to start the repository workflow and read its result. Authentication tokens must not be included in prompts, repository files, logs, artifacts, public Issues, or user-facing responses.

## Security controls

The audit receiver should:

- accept only one PNG, WebP, or JPEG image per audit
- enforce a file-size limit
- download temporary file references immediately
- restrict GitHub dispatch to the intended repository and event type
- use short-lived image URLs
- prevent public directory listing
- validate request and audit identifiers
- avoid storing user-provided secrets in logs

The GitHub workflow restricts image downloads to the repository variable `AUDIT_IMAGE_HOST`.

## User control

Users choose whether to use the separate experimental audit GPT configuration.

Subject to the behavior and retention policies of the relevant services, audit workflow runs, artifacts, and public audit Issues may be deleted through GitHub. Source images stored by the audit receiver must be handled according to the receiver's retention and deletion controls.

## Contact

Questions or deletion requests can be submitted through the Issues section of the `kaillebidan-byte/MYGPT` repository.

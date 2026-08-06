# Privacy Policy — MYGPT Sprite Audit Action

Last updated: 2026-08-06

## Overview

This Custom GPT action sends a user-provided public image URL and audit settings to the GitHub API for the repository `kaillebidan-byte/MYGPT`. GitHub Actions downloads the image and runs automated sprite-sheet quality checks.

## Data processed

The action may process:

- a public image URL supplied by the user
- a user-generated request identifier
- expected animation-state names and audit options
- the downloaded image itself during the GitHub Actions run
- generated audit outputs, including `audit.json`, `contact-sheet.png`, `preview.gif`, and `normalized-spritesheet.webp`

Do not submit private, confidential, personal, or access-controlled image URLs.

## Storage and retention

Audit outputs are stored as GitHub Actions artifacts for up to 14 days. A summary of the audit may be posted as a GitHub Issue in the public `kaillebidan-byte/MYGPT` repository. The issue summary may include the request identifier, state names, detected problems, and repair instructions. It does not intentionally include the source image or authentication token.

## Third-party processing

Requests are processed by OpenAI's GPT Actions infrastructure and GitHub's API and GitHub Actions services. Their respective terms and privacy policies apply.

## Authentication

A GitHub personal access token is stored in the Custom GPT action configuration and used only to call the GitHub endpoints declared by the action schema. The token must never be included in prompts, repository files, logs, or public issue content.

## User control

Users choose whether to invoke the audit action and may delete workflow runs, artifacts, or audit issues through GitHub, subject to GitHub's platform behavior and retention rules.

## Contact

Questions or deletion requests can be submitted through the Issues section of the `kaillebidan-byte/MYGPT` repository.

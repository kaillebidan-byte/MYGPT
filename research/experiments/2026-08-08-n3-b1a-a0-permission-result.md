# N3-B1A A0 — AutoGPT install permission result

Date: 2026-08-08 JST
Status: PASS WITH CAUTION — CONTINUE TO A1

## Evidence

User-provided Chrome extension install-permission screenshot for:
`AutoGPT - Auto send ChatGPT/Sora prompts and download images/videos`

Local evidence:
- dimensions: `454 x 310`
- SHA-256: `ed5c1f28d554f49972f12a7cbc152ab8cb4a53787813229fba291c51f86234f3`

Visible requested permissions in the prompt:
- read/change own data on ChatGPT-related sites shown in the prompt, including `chatgpt.com` / `sora.chatgpt.com`
- block content on arbitrary pages
- display notifications
- manage downloads

## Decision

A0 is **PASS WITH CAUTION**, not a clean low-privilege PASS.

Reason:
- the prompt does **not** show a general permission to read/change browsing data on every website;
- the data read/change access shown is scoped to ChatGPT/Sora-related sites, which is directly relevant to the planned UI test;
- however, `block content on arbitrary pages`, notifications, and download-management permissions are broader than the minimum needed for a text-only Custom-GPT compatibility check.

Therefore continue only with the narrow B1A test:
- no auto-download
- no output extraction
- no unrelated sensitive chats/files open during the test
- no image generation in A1-A4

If the extension later requires enabling additional all-site read/change access, stop and re-evaluate before granting it.

## Next gate

A1 — activation on the normal `MYGPT Single Frame Worker Test` Custom GPT chat page.

Required evidence:
- extension UI/helper appears and is usable on `/g/...` Custom GPT conversation page;
- do not send a task yet.

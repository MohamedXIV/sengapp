# Security Policy

Sengapp is a **pre-alpha** project and does not yet have a deployed public service or supported release.

## Reporting a vulnerability

**Please do not open a public GitHub issue or discussion containing exploit steps, credentials or private user data.**

If GitHub's **Private Vulnerability Reporting** option is enabled for this repository, use its private reporting interface under the repository's Security tab. Otherwise, contact the maintainer privately through an appropriate channel listed on their GitHub profile. If no private route is available, avoid public disclosure of sensitive details and request a private reporting channel first.

Include affected revision, impact, a concise reproduction, and sanitized evidence. Do not test against other people's accounts or data without authorization.

## Current commitments

- Authentication and authorization must be enforced server-side for every sensitive operation.
- Invite-only access is a registration rule, not a substitute for membership checks.
- AI and storage provider credentials belong on the server, never in committed files or public client bundles.
- Private attachments require intentional access control; avoid treating permanent bearer URLs as group-limited.
- AI participation and third-party processing must be explicit and scoped.
- The initial product does **not** claim end-to-end encryption.

## Support and response times

No supported versions, service-level guarantees or fixed vulnerability response timelines exist yet. This policy will be updated before an outside-family public alpha.

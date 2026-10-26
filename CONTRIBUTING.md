# Contributing to Sengapp

Thanks for being interested in Sengapp. 🐿️

**Current stage:** pre-alpha planning. Product features and architecture are still being formalized. There is no runnable app yet, and the public repository does not yet have a software license.

## Where to start

1. Read the [vision](docs/product/vision.md), [roadmap](docs/product/roadmap.md) and [design draft](docs/specs/sengapp-v0.1-design.md).
2. Check existing issues and PRs before opening a duplicate.
3. For significant ideas, open a proposal issue and discuss scope **before** implementing. The v0.1 feature set is frozen.
4. For a contained documentation correction, a focused PR is welcome.

## Expectations for future code contributions

- Small, coherent PRs with a clear reason and a way to verify the change.
- TypeScript with explicit validation and server-side access checks.
- Include tests for behavior and authorization changes; especially negative cross-user tests.
- Follow existing shadcn components and design tokens before adding custom UI infrastructure.
- Respect mobile data, keyboard/screen-reader use and reduced-motion settings.
- Never commit API keys, tokens, private user data, conversations or screenshots containing secrets.
- Do not add GitHub Actions workflows just for convenience; prefer local checks unless CI is necessary.

## Pull requests

Use the PR template. Describe what changed, why, security/privacy effects, and how you tested it. Screenshots should be redacted if they contain personal data.

## Licensing note

A LICENSE has not been selected yet. Public source visibility alone does not permit reuse or redistribution. Please avoid substantial code contributions until contribution/licensing terms are confirmed.

## Security issues

Please use [SECURITY.md](SECURITY.md), **not** public GitHub issues, for suspected vulnerabilities.

# Security Policy

## Reporting a vulnerability

Please report security issues privately via GitHub's
**Security Advisories** (Security tab → "Report a vulnerability")
rather than opening a public issue. Reports are acknowledged
within 5 business days.

If you can't use GitHub Advisories, email
`ryan-evans-git` via the address listed on their GitHub profile.
PGP-encrypted reports are accepted on request.

## Supported versions

Only the latest released minor version receives security fixes.

## Scope

In scope:

- Code in this repository (`src/`).
- The published npm package and its bundled output (`dist/`).
- Container images built from this repository's `Dockerfile`.
- The SSE event-parsing path — anything that turns server-sent
  text into rendered DOM is treated as a trust boundary.

Out of scope:

- Vulnerabilities in upstream React, Vite, or Vitest — please
  report those to the respective vendors. Dependabot tracks
  their advisories and we ship updated pins promptly.
- The `ai-assistant-client` server this UI talks to — see its
  own SECURITY.md.

## What we run on every commit

- TypeScript (`tsc --noEmit`)
- Vitest (full suite)
- Vite build (catches publishable-bundle regressions)
- npm audit (high+ severity gates merge)
- Trivy (filesystem + Dockerfile scan)
- CodeQL (GitHub-native SAST, `security-extended` query pack)
- Gitleaks (committed-secret detection across full history)
- Dependabot (weekly dep PRs; immediate security updates)
- ESLint (when configured — currently the script is declared but
  the dependency is not yet installed; see ci.yml for the gating
  logic)

A failing security check blocks merge to `main`.

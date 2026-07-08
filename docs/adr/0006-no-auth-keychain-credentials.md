# ADR 0006 — No app auth; API credentials via OS keychain

## Status
accepted

## Context
Harbor is a local-first desktop app for a single user (the owner of the machine). There is no multi-user access to the app itself. However, the app must store third-party API credentials securely: Linear tokens, GitHub PATs, AI provider keys (OpenAI, Anthropic), and opencode config.

## Decision
- **No application-level auth** — the app runs on the owner's machine; OS-level access control is the boundary.
- **API credentials stored in the OS keychain** via `keytar` (macOS Keychain, Windows Credential Vault, Linux Secret Service).
- **No multi-tenancy / RBAC** — single-user; profiles (e.g. personal vs work) can be added later if needed, but are not a v1 concern.

## Alternatives
- **App-level PIN/password** — unnecessary friction for a single-user desktop app; OS login is already the gate.
- **Credentials in plaintext config/env** — insecure; any process or backup can read them.
- **Full RBAC + multi-tenant** — YAGNI for a single-user local app.

## Consequences
- Credentials are encrypted at rest by the OS; never written to the SQLite DB or config files in plaintext.
- `keytar` is a native addon — needs `electron-rebuild`.
- Adding profiles later is a schema change (profile column on projects), not an architecture change.
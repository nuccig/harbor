# ADR 0002 — TypeScript + Node 20+ as runtime and language

## Status
accepted

## Context
Harbor orchestrates AI agents (opencode, codex, claude-code), integrates with Linear/GitHub/nucci-projects APIs, and manages the opencode harness (TS-based). MCP SDK is TS-first. A single language across front and back reduces context-switching and tooling duplication.

## Decision
Use **TypeScript** on **Node.js 20+** as the sole language and runtime for both front and back.

## Alternatives
- **Python** — strong for AI/ML, but Harbor does orchestration via APIs, not ML computation. Poorer fit with the TS-based opencode harness and MCP SDK.
- **Go** — great for concurrency and single-binary distribution, but overkill for a desktop orchestrator and lacks the front-end ecosystem.

## Consequences
- Single language end-to-end; types shared across front and back.
- Direct compatibility with MCP SDK, `gh`/Linear SDKs, opencode harness tooling.
- Node 20+ required on dev machines (bundled in Electron runtime, so end users don't need it).
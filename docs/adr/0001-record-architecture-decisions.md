# ADR 0001 — Record Architecture Decisions

## Status
accepted

## Context
Harbor is a greenfield project. Early foundational choices (runtime, framework, storage, deploy) constrain all later work. Later flows (plan, spec, implement) need to ground their decisions in recorded context, not guesswork.

## Decision
Record architecture decisions as ADRs in `docs/adr/`. One decision per file, numbered `NNNN-<slug>.md`. Status starts `accepted`; supersede by writing a new ADR that references the old one.

## Alternatives
- Keep decisions in chat/wiki — not greppable, not versioned with code.
- Single big design doc — hard to find individual decisions, hard to supersede.

## Consequences
- Every later flow reads `docs/adr/` to understand the stack.
- Decisions are auditable and supersedeable.
- Small overhead per decision; paid back when someone asks "why X?"
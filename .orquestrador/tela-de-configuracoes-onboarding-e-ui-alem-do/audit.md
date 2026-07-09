# Audit — SDD issue 29

## Status

Audit completed after review-001 recheck: no new product blocker found. The PR can be
handed off as draft with local verification evidence, but not flipped ready while GitHub
reports no remote checks.

## Findings for SDD skill/process improvement

### A-001 — Fix-agent stall escalation is under-specified

Severity: medium

The orquestrador contract says the controller never writes code, but this run hit repeated
fix-agent stalls/limits during review remediation. The practical escape hatch was a
controller-applied, tightly scoped fix after reporting the exception.

Recommendation: add an explicit escalation rule to `orquestrador`: after two failed or
stalled fix-agent attempts, the controller must either spawn a replacement with narrower
scope or ask HITL approval for an exception. The exception should be recorded in memory and
reviewed before merge.

### A-002 — Electron packaging smoke should be a conditional verify extension

Severity: medium

The constitution verify gate (`lint`, `typecheck`, `test`) was green while Windows local
packaging still failed on `winCodeSign`/symlink. The issue was relevant because the feature
touched Electron preload/build behavior and packaging config.

Recommendation: when a task touches `package.json` build config, `electron.vite.config.ts`,
`src/main/`, or `src/preload/`, require `npm run build` and a local packaging smoke such as
`npm run build:app -- --dir --config.asar=false` before final PR handoff.

### A-003 — Manual evidence must identify external harness dependencies

Severity: low

The first evidence report said Playwright runtime in a way that could be misread as a
product dependency. The dependency graph intentionally excludes Playwright.

Recommendation: add an evidence-template field for `Product dependencies` versus
`External verification harness`. This avoids accidental dependency drift claims.

### A-004 — PR step needs explicit behavior for “no checks reported”

Severity: low

`gh pr checks` can report no checks for a draft branch. The current PR rule says to flip
ready only when checks are green, but does not state the no-checks path.

Recommendation: document that “no checks reported” keeps the PR draft and requires a human
or CI configuration decision; local verify evidence may be cited but does not substitute
for remote green checks.

## Product review result

All `reviews-001/` findings are resolved and re-reviewed clean. No `reviews-002/` was
opened.

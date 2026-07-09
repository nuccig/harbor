---
id: 201
severity: medium
status: resolved
location: .orquestrador/tela-de-configuracoes-onboarding-e-ui-alem-do/evidence/issue-29-manual-verification.md:5
created: 2026-07-09
---

# Manual evidence claims a Playwright runtime that the plan excluded

## Problem

The final manual evidence report says the runtime was “Playwright `_electron` controlando o app Harbor buildado (`electron .`)”. That conflicts with the approved plan/ADR, which explicitly kept Playwright out of this issue, and with `package.json`, which has no Playwright dependency.

This weakens PR readiness because the report’s execution environment is part of the acceptance evidence. Reviewers cannot tell whether the screenshots and AC observations came from Playwright `_electron`, a custom Electron helper, `electron .`, or another runtime.

## Suggested fix

Update the evidence report to state the actual runtime and command used. If the run used a custom Electron helper, name it as such and record the built app target, viewport, and output/log location. If it really used Playwright, add the missing supporting context and reconcile that with the “no Playwright” plan decision before claiming final PASS.

## Resolution

O relatório foi ajustado para dizer que a evidência rodou no app Harbor buildado
(`electron .`) em Electron real, controlado por um harness externo do Codex via
Playwright `_electron` no Node REPL. Playwright não foi adicionado ao produto nem ao
`package.json`; foi apenas o driver externo da verificação manual.

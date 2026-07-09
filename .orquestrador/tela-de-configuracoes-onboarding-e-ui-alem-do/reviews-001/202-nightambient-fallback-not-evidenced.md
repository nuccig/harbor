---
id: 202
severity: medium
status: resolved
location: .orquestrador/tela-de-configuracoes-onboarding-e-ui-alem-do/evidence/issue-29-manual-verification.md:91
created: 2026-07-09
---

# NightAmbient fallback CSS was required but not evidenced

## Problem

Task 007 step 8 requires testing Night Harbor with WebGPU/WebGL2 when available and forcing the rendering backend unavailable to verify the static CSS fallback. The AC-034 row only records the normal active path: one canvas, `pointer-events: none`, no cursor trail, and unmount after concept switch.

That is useful evidence, but it does not prove the forced-unavailable fallback path. Because Task 006 also required a static fallback if WebGPU/WebGL2 fails, AC-034 should not be final PASS until the fallback branch is either observed and recorded or explicitly marked out of scope with rationale.

## Suggested fix

Rerun the manual/helper check with both `navigator.gpu` and `window.WebGL2RenderingContext` unavailable before NightAmbient mounts, then update the AC-034 evidence with the observed fallback element and `canvasCount=0`. If the helper cannot force that environment reliably, mark the fallback subcheck unresolved in the report and open a source/test remediation task instead of claiming AC-034 PASS.

## Resolution

`NightAmbient` passou a testar suporte real com `typeof` em vez de apenas presença de
propriedade. O harness pós-fix forçou `navigator.gpu` e `WebGL2RenderingContext` para
`undefined` antes da montagem e confirmou `ambientPresent=true`, `canvasCount=0`,
`cssFallbackLayer=true` e `pointerEvents=none`.

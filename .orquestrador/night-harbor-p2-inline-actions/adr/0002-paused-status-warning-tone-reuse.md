---
id: 0002
title: Paused reusa o tone warning do StatusChip com ícone Pause distinto — sem 5º tone
status: accepted
date: 2026-07-10
---

# ADR-0002 — Paused reusa o tone `warning` do StatusChip com ícone `Pause` distinto — sem 5º tone

## Context

G3/D-005 fixam Paused na família âmbar ("tom de atenção") — mas Ready já usa o tone `warning`
(âmbar #ffd166 no night-harbor) com ícone default `Clock`. Dois statuses vizinhos na mesma
família de cor precisam de diferenciação clara (spec.md Riscos "Ambiguidade âmbar"), e AC-017
lista "chip Paused sobre seu fundo tintado" como par a auditar. O `StatusChip` tem 4 tones
(`success | warning | danger | neutral`) e um prop `icon` de override por instância
(`StatusChip.tsx:7`). R2 do handoff pergunta: reusar `warning` + ícone distinto conta como
"nenhum par novo" perante AC-017, ou a spec exige um 5º tone?

## Decision

- **Paused usa `tone="warning"` + `icon={Pause}`** (Phosphor, já dependência). Ready permanece
  `warning` + default `Clock`. Complete/Running inalterados (non-goal da spec).
- A diferenciação Ready×Paused é **rótulo + ícone** — que é exatamente o que a regra
  color-not-only exige: a cor NUNCA pode ser o único discriminador, então um 5º tone âmbar
  "ligeiramente diferente" não diferenciaria nada por si só. Ícones distintos são obrigatórios
  em qualquer rota; adotada a rota em que eles são o discriminador projetado, não um remendo.
- **Leitura de AC-017 adotada: satisfazer por medição, não por dispensa.** O par do chip
  Paused foi re-medido integralmente por script nesta run (memory/contrast-audit.md, pares
  A1–A4): 8.48:1 sobre o tint 15% composto, 10.49:1 sobre o fallback sólido (night-harbor);
  6.73–10.02:1 nos legados via cadeia var() existente (`--border`/`--ink-muted`). Hex
  idênticos aos de ADR-0014 — o reuso é comprovado numericamente, não presumido.

## Alternatives considered

- **5º tone (`attention`) com cor âmbar própria** — rejeitado: (a) um segundo âmbar
  quase-igual REDUZ a distinguibilidade em vez de aumentar (a diferenciação real vem de
  ícone+rótulo de qualquer forma); (b) cria token night-harbor-only novo + cadeia de fallback
  nova + 6 pares de auditoria novos; (c) amplia a API pública do StatusChip para um caso que o
  prop `icon` existente já resolve.
- **Paused em outra família (ex.: azul/info)** — rejeitado: contraria G3/D-005 (decisão HITL
  vinculante: família âmbar), e "pausado" semanticamente É atenção, não informação.
- **Declarar o par isento de auditoria por reuso** — rejeitado: AC-017 lista o chip Paused
  nominalmente; a re-medição custa uma linha de script e elimina a ambiguidade de leitura
  (R2) sem depender de interpretação.

## Consequences

- Zero tokens novos, zero mudanças em `primitives.module.css` para o chip — Paused é
  puramente `tone="warning" icon={Pause}` no call site (dentro do SessionCard).
- Nos conceitos legados o chip Paused degrada exatamente como o warning de hoje (cadeia
  var() → `--border`/`--ink-muted`), com o ícone `Pause` preservando a diferenciação — zero
  edição em command-deck/signal-poster (AC-016).
- O par âmbar fica com um único significado visual de família ("atenção") e dois estados
  discrimináveis por forma; se um dia Paused precisar de identidade de cor própria, será um
  novo ADR com auditoria nova.
- Testes: asserts de tone por substring (`statusChip_warning`) valem para Ready E Paused — a
  diferenciação nos testes usa o rótulo acessível e o ícone, não a classe de tone.

# Contrast Audit — Night Harbor P2 StatusChip

**Data**: 2026-07-09 (rev. 2 — corrigido com a auditoria numérica exata do controller no gate HITL)
**Fase**: plan (sdd-plan)
**Riscos endereçados**: R1, R2, R3 (handoff-001.md)

> **ERRATA (rev. 2)**: A rev. 1 deste documento continha luminâncias incorretas (aproximações
> sem a linearização sRGB correta). Exemplos dos erros: L(#0e1b2f) foi estimada como ~0.095/0.15
> quando o valor exato é **≈ 0.011**; a Descoberta 8 **inverteu a fórmula de contraste**
> (colocou a cor clara no denominador) e concluiu 0.189:1 quando `--ink` sobre o fundo tintado
> é na verdade **11.75:1**. Todos os números abaixo são da auditoria do controller
> (WCAG 2.1, linearização sRGB com expoente 2.4) e são autoritativos.

---

## Descoberta 1: Token --surface-active Existe

**Risco R1 FECHADO**

Verificação em concepts.module.css (bloco night-harbor):
```css
.concept[data-concept='night-harbor'] {
  --surface-active: #19385a;
  /* ... */
}
```

Token existe e está definido. Não é necessário criar ou usar alternativa.

Ratios da pill ativa (controller):
- `--ink` (#f3f7ff) sobre `--surface-active` (#19385a): **11.15:1** ✓ (texto ≥4.5:1)
- Borda `--accent` (#63a9ff) sobre `--surface-active`: **4.93:1** ✓ (não-texto ≥3:1)

---

## Descoberta 2: Valores RGB Night Harbor

```
Tokens (night-harbor):
--canvas:         #07111f
--surface:        #0e1b2f   (L ≈ 0.011)
--surface-raised: #152642
--surface-active: #19385a
--ink:            #f3f7ff
--ink-muted:      #aabbd1
--accent:         #63a9ff
--on-accent:      #07111f

Status tokens:
--success:        #5ad8a6
--on-success:     #07111f
--warning:        #ffd166
--on-warning:     #0e1b2f
--danger:         #ff8d9d
--on-danger:      #21040a
--border:         #41597a
```

---

## Descoberta 3: Pares on-\* sobre fill SÓLIDO do token (semântica correta dos on-tokens)

Estes pares passam AA — mas só quando o fundo é o token **sólido**:

1. `--on-success` (#07111f) sobre `--success` (#5ad8a6): **10.65:1** ✓
2. `--on-warning` (#0e1b2f) sobre `--warning` (#ffd166): **11.97:1** ✓
3. `--on-danger` (#21040a) sobre `--danger` (#ff8d9d): ✓ (bem acima de 4.5:1; a estimativa "~5.2:1" da spec era conservadora)

**Conclusão**: on-* funcionam sobre fills sólidos. É essa a semântica que fica **reservada** (ADR-0001) — o chip tintado não os usa.

---

## Descoberta 4: on-\* sobre fundo tintado color-mix FALHA em qualquer transparência (motivo da mudança de esquema)

Fundo tintado = mistura do tone com `--surface` (#0e1b2f, L ≈ 0.011) → resultado escuro. Texto on-* também é escuro → contraste inviável:

- `--on-success` (#07111f) sobre mix **85%** (fundo efetivo #193741): **1.50:1** ✗
- `--on-success` sobre mix **80%**: **1.71:1** ✗

**Os dois lados do trade-off A original (80% vs 85%) reprovam.** Ajustar transparência não corrige; a incompatibilidade é estrutural (texto escuro sobre fundo escuro).

---

## Descoberta 5: Esquema aprovado — texto na COR DO TOKEN sobre fundo tintado 85% (ratios do controller)

Texto/ícone/dot na cor do próprio token; neutral usa `--ink-muted`:

| Tone | Texto | Fundo efetivo (mix 85% sobre --surface) | Ratio | AA |
|------|-------|------------------------------------------|-------|----|
| success | #5ad8a6 | #193741 | **7.10:1** | ✓ |
| warning | #ffd166 | #323637 | **8.48:1** | ✓ |
| danger | #ff8d9d | #322c40 | **6.08:1** | ✓ |
| neutral | #aabbd1 (`--ink-muted`) | #16243a | **7.97:1** | ✓ |

Nota: tone text neutral com `--border` (#41597a) falharia (**2.18:1** ✗) — por isso neutral usa `--ink-muted`.

---

## Descoberta 6: Fallback sólido `--surface-raised` (#152642) — tone text sobre ele

Para navegadores sem color-mix, o fundo do chip é sólido `var(--surface-raised)` (nunca color-mix no fallback):

| Tone | Texto | Ratio | AA |
|------|-------|-------|----|
| success | #5ad8a6 | **8.51:1** | ✓ |
| warning | #ffd166 | **10.49:1** | ✓ |
| danger | #ff8d9d | **6.88:1** | ✓ |
| neutral | #aabbd1 | **7.74:1** | ✓ |

---

## Descoberta 7: `--ink` sobre fundo tintado (correção da Descoberta 8 da rev. 1)

A rev. 1 inverteu a fórmula e reportou 0.189:1. Cálculo correto: cor mais clara no numerador.

- `--ink` (#f3f7ff) sobre fundo tintado success (#193741): **11.75:1** ✓

(`--ink` seria alternativa viável de texto, mas o gate escolheu a cor do token — comunica o tone diretamente e mantém o dot/ícone/texto coesos.)

---

## Status dos Riscos — Sumário

| # | Risco | Status | Resolução |
|---|---|---|---|
| R1 | --surface-active não existe | ✓ **FECHADO** | Token confirmado em concepts.module.css (#19385a); pill ativa 11.15:1 / 4.93:1 ✓ |
| R2 | Color-mix 85% degrada <4.5:1 | ✓ **FECHADO (via mudança de esquema)** | Texto/ícone/dot na cor do token (não on-*): 7.10 / 8.48 / 6.08 / 7.97 ✓ @85%; fallback sólido `--surface-raised`: 8.51 / 10.49 / 6.88 / 7.74 ✓ |
| R3 | --on-danger sobre --danger borderline | ✓ **FECHADO** | Par não é usado no chip (on-* reservados a fills sólidos); e o par em si passa AA sobre fill sólido |
| R4 | Motion bypass reduced-motion | ✓ **MITIGADO** | Nenhuma motion nova em P2.1+P2.2; futuro coberto por constitution.md L4 |

---

## Decisão Final (gate HITL, vinculante — ver ADR-0001)

1. Fundo: `color-mix(in srgb, var(--tone), transparent 85%)` (85% mantido, como a spec)
2. Texto/ícone/dot: cor do token; neutral → `--ink-muted`
3. Fallback sem color-mix: background sólido `var(--surface-raised)`
4. `--on-*` não usados no chip (reservados a fills sólidos futuros)
5. Cadeia var() para conceitos legados: `var(--success, var(--ink-muted))` (texto), `var(--success, var(--border))` (tone), `var(--surface-raised)` (bg — existe nos 3 conceitos)

**Auditoria CONCLUÍDA** — constitution.md boundary (review numérico de contraste) cumprido no gate. Re-auditar somente se algum hex mudar em implement.

---

## Próximas Etapas

- [x] Auditoria numérica exata (controller, gate HITL) — concluída
- [ ] sdd-tasks: tasks consomem ratios deste documento; sem tarefa de auditoria pendente (apenas re-verificação se cores mudarem)
- [ ] sdd-review: revisor confere que o CSS implementado corresponde ao esquema auditado (85% + tone text + fallback sólido)

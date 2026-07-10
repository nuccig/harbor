---
id: 0001
title: Fundo tintado color-mix 85% com texto na cor do token e fallback surface-raised
status: accepted
date: 2026-07-09
---

# ADR-0001 — Fundo tintado color-mix 85% com texto na cor do token e fallback surface-raised

> Rev. 2 — decisão final do gate HITL do plan (2026-07-09). A versão anterior propunha
> transparência 80% com texto `--on-*`; a auditoria numérica exata do controller
> (WCAG 2.1, linearização sRGB expoente 2.4) reprovou os dois lados desse trade-off.

## Context

StatusChip aplica fundo tintado via CSS `color-mix(in srgb, var(--tone), transparent 85%)`. Risco R2 (handoff-001.md) identificava que a transparência poderia degradar contraste abaixo de 4.5:1 (WCAG 2.1 AA).

A auditoria exata do controller confirmou o problema — e mostrou que ajustar a transparência **não resolve** enquanto o texto for `--on-*` (tokens escuros, pensados para fills sólidos claros):

- `--on-success` (#07111f) sobre fundo tintado @85%: **1.50:1** ✗
- `--on-success` sobre fundo tintado @80%: **1.71:1** ✗

Ou seja: texto on-* sobre fundo tintado color-mix **falha em qualquer transparência**. O fundo tintado resultante é escuro (mistura com `--surface` #0e1b2f, L ≈ 0.011); texto escuro sobre fundo escuro nunca atinge AA.

## Decision

**Esquema de cor final (decisão do usuário no gate, vinculante):**

1. **Fundo**: `color-mix(in srgb, var(--tone), transparent 85%)` — **85% mantido, como a spec**.
2. **Texto, ícone e dot na COR DO TOKEN** (`--success`/`--warning`/`--danger`), não `--on-*`. Tokens de tone são claros e contrastam com o fundo tintado escuro.
3. **Neutral**: texto/ícone em `--ink-muted` (#aabbd1) — tone text com `--border` (#41597a) falha (2.18:1).
4. **Fallback sem color-mix**: background **sólido** `var(--surface-raised)` (#152642). O fallback NUNCA usa color-mix (bug da versão anterior deste ADR: o `--chipBackground` de fallback usava color-mix, o que o tornava inútil exatamente nos navegadores sem suporte).
5. **Tokens `--on-*` não são usados no chip.** Ficam **reservados a fills sólidos futuros** (ex.: badge com `background: var(--success)` + `color: var(--on-success)` = 10.65:1 ✓). Essa é a semântica correta dos pares on-token (atlas recall: on-token-semantics).

### Ratios auditados (controller, WCAG 2.1 exato)

**Texto na cor do token sobre fundo color-mix 85% (sobre `--surface` #0e1b2f)**:

| Tone | Texto | Fundo efetivo | Ratio | AA |
|------|-------|---------------|-------|----|
| success | #5ad8a6 | #193741 | **7.10:1** | ✓ |
| warning | #ffd166 | #323637 | **8.48:1** | ✓ |
| danger | #ff8d9d | #322c40 | **6.08:1** | ✓ |
| neutral | #aabbd1 | #16243a | **7.97:1** | ✓ |

**Tone text sobre fallback sólido `--surface-raised` (#152642)**:

| Tone | Ratio | AA |
|------|-------|----|
| success | **8.51:1** | ✓ |
| warning | **10.49:1** | ✓ |
| danger | **6.88:1** | ✓ |
| neutral | **7.74:1** | ✓ |

### CSS resultante

```css
.statusChip {
  /* Fallback sólido — navegadores sem color-mix. NUNCA color-mix aqui. */
  background: var(--surface-raised);
  border: 1px solid var(--chipTone, var(--border));
  color: var(--chipText, var(--ink-muted));
}

@supports (color: color-mix(in srgb, black, transparent)) {
  .statusChip {
    background: color-mix(in srgb, var(--chipTone, var(--border)), transparent 85%);
  }
}

.statusChip_success { --chipTone: var(--success, var(--border)); --chipText: var(--success, var(--ink-muted)); }
.statusChip_warning { --chipTone: var(--warning, var(--border)); --chipText: var(--warning, var(--ink-muted)); }
.statusChip_danger  { --chipTone: var(--danger, var(--border));  --chipText: var(--danger, var(--ink-muted)); }
.statusChip_neutral { --chipTone: var(--border);                 --chipText: var(--ink-muted); }
```

A cadeia `var(--tone, fallback)` garante comportamento neutro legível sob conceitos legados (command-deck, signal-poster) sem editar seus blocos: `--success`/`--warning` inexistentes resolvem para `--ink-muted`/`--border`, e `--surface-raised` existe nos 3 conceitos.

## Alternatives Considered

1. **Texto on-* + transparência 85% (spec literal)** — reprovado: 1.50:1.
2. **Texto on-* + transparência 80% (rev. 1 deste ADR)** — reprovado: 1.71:1. Ajuste de opacidade não corrige a incompatibilidade fundamental (texto escuro sobre fundo escuro).
3. **Fallback com cor pré-calculada hardcoded (rev. 1)** — descartado: introduz hex mágicos fora do sistema de tokens; `--surface-raised` já existe, é portável entre conceitos e passa AA com tone text.
4. **Derivar fundo de --surface-raised no color-mix** — desnecessário após mudança do texto para cor do token.
5. **Neutral com tone text --border** — reprovado: 2.18:1; substituído por `--ink-muted`.

## Consequences

- Navegadores com color-mix: fundo tintado dinâmico 85%, texto/dot/ícone na cor do token — 6.08:1 a 8.48:1 ✓.
- Navegadores sem color-mix: chip sólido `--surface-raised` com borda no tone — 6.88:1 a 10.49:1 ✓; degrada gracefully.
- `--on-*` preservam sua semântica (texto sobre fill sólido do token); nenhum uso incorreto entra no codebase.
- Constitution.md boundary (review numérico de contraste obrigatório) **CUMPRIDO**: todos os pares novos auditados numericamente pelo controller; re-auditar apenas se algum hex mudar em implement.
- Riscos R2 e R3 **FECHADOS** (R3 sai do escopo: par on-danger/danger não é usado no chip).

## Related Decisions

- ADR-0002 (StatusChip API) — consome este esquema de cor
- plan.md §2.5, §2.7, §2.10 — implementação e ratios
- handoff-001.md R2, R3 — riscos de origem
- memory/contrast-audit.md — auditoria corrigida
- atlas recalls: navbar-contrast-color-mix-over-ambient, on-token-semantics

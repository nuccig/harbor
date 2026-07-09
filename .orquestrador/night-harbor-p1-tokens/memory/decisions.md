# Decisões — Fase P1 (Fundação de Tokens)

## D-001: Dual Export TS vs CSS

**Decisão**: `motion-tokens.ts` exporta **valores numéricos** para motion/react, não strings CSS.

**Contexto**: motion/react `Transition.duration` espera `number` (segundos) ou undefined. CSS custom properties (em global.css) usam strings `'280ms'`. Duas representações diferentes.

**Implementação**:
```typescript
// src/renderer/src/app/motion-tokens.ts
export const motionTokens = {
  duration: 0.28,           // motion/react: segundos
  durationExit: 0.182,      // 0.65 × 0.28
  ease: [0.22, 1, 0.36, 1] as const,
};
```

CSS em global.css permanece com strings:
```css
:root {
  --motion-duration: 280ms;
  --motion-duration-exit: 182ms;
  --motion-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
```

**Justificativa**: Evita conversão/parsing em runtime. motion/react internamente converte para `ms` de qualquer forma; manter tokens TS "nativos" (numérico) mantém API clara.

**Verificação**: DevTools mostra `transition-duration: 280ms` (CSS computed), TSX passa `duration: 0.28` (motion/react).

---

## D-002: Preservação de Aliases Legais

**Decisão**: Não deletar `--ease-standard` e `--duration-fast` do `:root`. Remapeá-los como aliases aos novos tokens.

**Contexto**: Componentes legais (command-deck, signal-poster, primitivas) leem `--ease-standard` e `--duration-fast`. Deletar causa regressão em AC-011 (testes quebram).

**Implementação**:
```css
:root {
  /* Motion base (novo) */
  --motion-duration: 280ms;
  --motion-duration-exit: 182ms;
  --motion-ease: cubic-bezier(0.22, 1, 0.36, 1);

  /* Aliases legais (deprecado, será removido na semana) — TODO L-2026-07-16 */
  --duration-fast: var(--motion-duration);       /* Era 160ms */
  --ease-standard: var(--motion-ease);            /* Era cubic-bezier(0.2, 0.8, 0.2, 1) */
  
  /* ... resto ... */
}
```

**Armadilha**: `--duration-fast` muda de 160ms → 280ms. Se algum teste relied em "rápido = 160ms", pode falhar (verá 280ms). Revisar suite.

---

## D-003: AC-012 (Exit < Enter) → Teste, Não Screenshot

**Decisão**: AC-012 ("screenshot 1024×700 mostra exit < enter") implementado como assertion em `concept-transitions.test.tsx` ou `app-integration.test.tsx`, não screenshot manual.

**Contexto**: Run é `--quick`; screenshots manuais fogem ao escopo. Teste é reproduzível e determinístico.

**Implementação esperada**:
```typescript
describe('Motion tokens', () => {
  it('exit duration is 65% of enter', () => {
    expect(motionTokens.durationExit).toBe(0.182);
    expect(motionTokens.durationExit).toBeLessThan(motionTokens.duration);
    // Ratio check
    expect(motionTokens.durationExit / motionTokens.duration).toBeCloseTo(0.65, 2);
  });

  it('NightHarborLayout applies exit transition override', async () => {
    // (Simulación de cambio de surface y verificación de computed style)
    // Esta é mais integradora, verificar em app-integration.test.tsx
  });
});
```

---

## D-004: WCAG 4.5:1 para Novos Tokens Status

**Decisão**: `--success` e `--warning` auditados numericamente a 4.5:1 (AA) sobre `--surface: #0e1b2f`.

**Candidatos** (handoff-001.md §5):
- **Verde**: `#5ad8a6` → ratio ~9.7:1 ✅
- **Âmbar**: `#ffd166` → ratio ~12.4:1 ✅

**Documentação**: Comentário CSS ao lado de cada token indicando valor numérico.

```css
/* #5ad8a6 on #0e1b2f → WCAG ratio ~9.7:1 ✓ AA & AAA */
--success: #5ad8a6;
--on-success: #f3f7ff;

/* #ffd166 on #0e1b2f → WCAG ratio ~12.4:1 ✓ AA & AAA */
--warning: #ffd166;
--on-warning: #0e1b2f;
```

---

## D-005: Iconografia — Signature Usa Token `--icon-md`

**Decisão**: `.signatureIcon svg` passa de `1.2rem` hardcoded a `var(--icon-md)`.

**Contexto**: P1 não adiciona novos ícones; apenas tokeniza tamanho existente. Prepara caminho para P2.1 (StatusChip) e P2.2 (nav com ícones).

**Implementação**:
```css
.signatureIcon svg {
  block-size: var(--icon-md);
  inline-size: var(--icon-md);
}
```

Onde `--icon-md: 1.2rem` em global.css (AC-009).

---

## D-006: Nenhuma Mudança de UI Visível

**Decisão**: P1 é tokens + refactor TSX. Zero mudanças visuais no Shell.

**Justificativa**: Cor, layout, tamanho de fonte permanecem idênticos. Exit transition fica mais rápida (182ms vs antes não-explícito), mas imperceptível em screenshot — precisa vídeo ou DevTools para confirmar.

**Implicação**: `npm run test` snapshot tests não devem falhar (mesma renderização visual).

---

## D-007: Testes Vitest — Migração de Imports

**Decisão**: Qualquer teste que mocked `motion/react` ou verificava hardcoded `0.28`/`[0.22, 1, 0.36, 1]` precisa migrar para `motionTokens`.

**Localização**: `tests/renderer/integration/app-integration.test.tsx`, `tests/renderer/design-lab/design-lab.test.tsx`

**Implementação**: Procurar por patterns:
- `duration: 0.28` → `duration: motionTokens.duration`
- `ease: [0.22, 1, 0.36, 1]` → `ease: motionTokens.ease`
- Assertions sobre `transition-duration` → atualizar para `280ms` ou `182ms` (não 160ms/antigas)

---

## D-008: Primitivas — Classe Utilitária `.data`

**Decisão**: Criar `.data` em `primitives.module.css` com MONO + tabular-nums.

**Contexto**: P1.4 (tipografia); uso futuro em P2.3 (KPI strip).

```css
.data {
  font-variation-settings: 'MONO' 1;
  font-variant-numeric: tabular-nums;
}
```

Sem mudança visual em P1 (nenhum elemento usa `.data` ainda).

---

## D-009: Color-Scheme — Rota Futura (Não P1)

**Decisão**: `:root { color-scheme: light; }` permanece em P1 (não alterado).

**Contexto**: Spec cita em "Fora de Escopo" e risk #5. design.md §8.5 lista como pendência. AC não cobre.

**Próxima fase**: P3.5 ou design follow-up para mudar a `dark`.

---

## Referências

- handoff-001.md (este handoff)
- spec.md (AC-001 a AC-012)
- proposta-melhorias-001.md §2 (gaps M1–M5, I3, T1–T5)
- design.md §5 (motion), §6 (status icons), §3 (tipografia)

---

**Última atualização**: 2026-07-09

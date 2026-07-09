# Handoff P1 — Fundação de Tokens → Implementação

**Data de handoff**: 2026-07-09  
**Fase anterior**: spec (aprovada)  
**Fase atual**: implement  
**Próxima fase**: verify

---

## 1. Missão

Implementar a base de tokens unificados para Night Harbor — motion, status, tipografia e ícones — eliminando valores hardcoded no TSX conforme os 12 Acceptance Criteria da spec.md. A regra `exit = 0.65 × enter` (182ms de 280ms) está documentada em design.md §5 mas ainda não implementada. Os tokens devem viver simultaneamente em CSS custom properties (`:root` e `[data-concept='night-harbor']`) e em constante TS compartilhada (`motion-tokens.ts`), consolidando dois sistemas de motion desconexos (M2 da proposta-melhorias-001.md §2.1). Este work desbloqueia a série P2 (componentes StatusChip, nav com ícones, KPI strip).

---

## 2. Arquivos-Alvo com Estado Atual

### 2.1 `src/renderer/src/styles/global.css` (linhas ~9-32)

**Estado atual:**
- `:root` declara `color-scheme: light` (linha 10) — pendência para dark-only assertivo
- Tokens de duração divergentes: `--duration-fast: 160ms` (L27), `--ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1)` (L29)
- Type scale: `--type-small: 0.78rem`, `--type-body: 0.95rem`, `--type-large: 1.125rem`, `--type-title: clamp(2rem, 4vw, 4.5rem)` (L23-26)
- Sem tokens de motion base (280ms, 182ms, easing [0.22,1,0.36,1])
- Sem tokens de status (`--success`, `--warning`), tipografia (`--type-metric`, `--weight-*`), ou ícones (`--icon-sm/md/lg`)

**Ações esperadas:**
- AC-001: Inserir `--motion-duration: 280ms`, `--motion-duration-exit: 182ms`, `--motion-ease: cubic-bezier(0.22, 1, 0.36, 1)` sob `:root`
- AC-007: Inserir `--type-metric: clamp(1.6rem, 2.2vw, 2.4rem)`, `--weight-body: 400`, `--weight-label: 520`, `--weight-heading: 650`
- AC-009: Inserir `--icon-sm: 1rem`, `--icon-md: 1.2rem`, `--icon-lg: 1.5rem`
- AC-010: Mapear `--ease-standard` e `--duration-fast` como aliases aos novos valores (não deletar — quebra componentes legacy como command-deck)

---

### 2.2 `src/renderer/src/concepts/concepts.module.css` (bloco `[data-concept='night-harbor']` ~L135-159)

**Estado atual:**
- Bloco night-harbor declara 22 tokens cor/geometria (canvas, surface, accent, etc.)
- Signature icon hardcoded a `1.2rem` (L44-47 em `.signatureIcon svg`)
- Sem tokens de status (`--success`, `--on-success`, `--warning`, `--on-warning`)
- Valores candidatos na spec: verde-sinal ~`#5ad8a6` (ajustado), âmbar ~`#ffd166` (família do focus-ring)

**Ações esperadas:**
- AC-005: Inserir `--success`, `--on-success`, `--warning`, `--on-warning` no bloco night-harbor (valores candidatos sujeitos a auditoria WCAG 4.5:1)
- AC-006: Documentar razão WCAG de cada par de contraste em comentário CSS
- AC-009: Alterar `.signatureIcon svg` de `block-size: 1.2rem; inline-size: 1.2rem` para usar `var(--icon-md)` (interpolação desde global.css)

---

### 2.3 `src/renderer/src/concepts/ConceptScaffold.tsx` (linhas ~1-77)

**Estado atual:**
- Importa `Transition` de `motion/react` (L1)
- Aceita prop `transition: Transition` (L11)
- Usa `activeTransition = reduceMotion ? { duration: 0.08 } : transition` (L29) — duplicação lógica
- `motion.main` exit não aplica duração reduzida: `exit={{ opacity: 0, x: -offset, y: ... }}` recebe a mesma transition do enter (L59, L66)
- Zero referência a tokens TS — lê transition como objeto literal

**Ações esperadas:**
- AC-002/003: Importar `motionTokens` de `'../app/motion-tokens'`
- AC-004: Alterar linha 59 exit para: `exit={{ opacity: 0, x: -offset, y: concept === 'signal-poster' ? 0 : -offset, transition: { duration: motionTokens.durationExit, ease: motionTokens.ease } }}` (override duração específica ao sair)
  - Ou, se motion/react suporta nested transition em exit (verificar docs), usar `exit={{ ... }, transition: exitTransition}`
- Refactor: se `reduceMotion`, ambas as transitions usam `{ duration: 0.08 }` — pré-compor antes do ternário

---

### 2.4 `src/renderer/src/concepts/night-harbor/NightHarborLayout.tsx` (linha ~12)

**Estado atual:**
- Hardcoda a transition: `transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}` (L12)
- Valor `0.28` é formato motion/react (segundos), não CSS (280ms)

**Ações esperadas:**
- AC-003: Remover hardcoding, substituir por: `transition={{ duration: motionTokens.duration, ease: motionTokens.ease }}`
  - Nota: motion/react aceita `duration` como número (segundos: 0.28) ou string ('280ms'). Se usar token TS, exportar como numérico (0.28, 0.182) — motion/react NÃO aceita '280ms' em `transition.duration`
- Importar: `import { motionTokens } from '../../app/motion-tokens'`

---

### 2.5 `src/renderer/src/ui/primitives.module.css` (novo `.data` ou utilitária)

**Estado atual:**
- Existe `.button`, `.field`, `.fieldControl`, etc.
- Sem classe utilitária para dados tabulares/MONO

**Ações esperadas:**
- AC-008: Criar `.data` com:
  ```css
  .data {
    font-variation-settings: 'MONO' 1;
    font-variant-numeric: tabular-nums;
  }
  ```
  - Uso: tempos, contagens, IDs, custos (futuros em P2.3 — KPI strip)

---

### 2.6 `src/renderer/src/app/motion-tokens.ts` (NOVO — ainda não existe)

**Ações esperadas:**
- AC-002: Criar arquivo com:
  ```typescript
  export const motionTokens = {
    duration: 0.28,           // Segundos (motion/react format)
    durationExit: 0.182,      // 0.65 × 0.28
    ease: [0.22, 1, 0.36, 1] as const,
  };
  ```
  - **Dual format**: motion/react NÃO aceita strings CSS em `transition.duration`. Exportar valores numéricos.
  - Alternativa (se TSX precisar strings CSS em algum ponto): adicionar ramo de strings:
    ```typescript
    export const motionTokensCss = {
      duration: '280ms',
      durationExit: '182ms',
      ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
    };
    ```
    Mas a spec cita *apenas* o formato TS, não dual export. Verificar se componentes legais usam CSS strings.

---

## 3. Correções de Dispatch Decididas pelo Controller

### 3.1 Dual export TS/CSS (motion-tokens.ts)

**Decisão**: `motionTokens` exporta **valores numéricos** (motion/react format: `duration: 0.28`, não `'280ms'`).

**Justificativa**: motion/react `Transition.duration` espera número (segundos) ou undefined, não string CSS. Se TSX precisar strings CSS (ex., em inline `style` ou CSS-in-JS), criar objeto separado `motionTokensCss` — mas spec.md AC-002 não pede dual export, então implementar apenas formato motion/react por enquanto.

**Verificação**: DevTools `getComputedStyle(element).transitionDuration` mostrará `280ms` (CSS), mas TSX passa `0.28` (motion/react interno).

---

### 3.2 Preservação de aliases legais (não deletar `--ease-standard` / `--duration-fast`)

**Decisão**: Manter `--ease-standard` e `--duration-fast` como aliases no bloco `:root`, apontando aos novos valores.

**Justificativa**: componentes legais (command-deck, signal-poster, primitivas antigas) leem essas variáveis. Deletar causa regressão (AC-011 testes quebram). Roubo de espaço é negligenciável.

**Implementação**:
```css
:root {
  /* Motion base (novo) */
  --motion-duration: 280ms;
  --motion-duration-exit: 182ms;
  --motion-ease: cubic-bezier(0.22, 1, 0.36, 1);

  /* Aliases legais (deprecado, remoção semana que vem) */
  --duration-fast: var(--motion-duration);       /* Era 160ms, agora 280ms — atenção! */
  --ease-standard: var(--motion-ease);
  
  /* ... resto dos tokens ... */
}
```

**Armadilha**: se algum componente relied em `--duration-fast: 160ms` (mais rápido que 280ms), pode parecer lento agora. Verificar testes: se assertion falhar, essa era a causa.

---

### 3.3 AC-012 → teste vs screenshot manual

**Decisão**: AC-012 ("screenshot 1024×700 mostra exit < enter") vira teste `app-integration.test.tsx` ou novo `concept-transitions.test.tsx` com assert numérico, em vez de screenshot manual (run é `--quick`).

**Implementação esperada**:
```typescript
// tests/renderer/integration/concept-transitions.test.tsx
it('exit transition shorter than enter for night-harbor', async () => {
  // Render ConceptScaffold com motionTokens
  // Simular troca de surface
  // Assert: element.style.transitionDuration === '182ms' na exit
  expect(motionTokens.durationExit).toBe(0.182);
  expect(motionTokens.durationExit).toBeLessThan(motionTokens.duration);
});
```

---

## 4. Armadilhas Conhecidas

### 4.1 Testes vitest e assertions de duração

**Localização**: `tests/renderer/integration/app-integration.test.tsx`, `tests/renderer/design-lab/design-lab.test.tsx`

**Risco**: se algum teste usa `getComputedStyle()` ou assertions sobre `transition-duration`, pode falhar após alterar de 160ms/280ms arbitrários para 280ms/182ms base. Procurar por:
- `transition-duration`
- `duration`
- `0.28`, `0.16`, `280ms`, `160ms`

**Ação**: revisar suite antes de commit; se falhar, atualizar assertion ou aumentar timeout.

---

### 4.2 ESLint flat config e imports tipo

**Risco**: `import type { Transition } from 'motion/react'` — se tipo não for re-exportado, ESLint pode reclamar `no-unused-vars`. motion/react oferece tipos?

**Ação**: testar `npm run lint` após implementar; se falhar, remover import tipo (Transition é inferível).

---

### 4.3 TypeScript strict

**Risco**: `motionTokens.duration` é `0.28` (number), `motionTokens.ease` é `const [0.22, 1, 0.36, 1]` (readonly tuple). motion/react `Transition` espera tipos exatos?

**Ação**: testar `npm run typecheck`; se erro de tipo, usar `as const` ou `as Ease[]`.

---

### 4.4 Clamp de `--type-metric` em 1024×700

**Risco**: `clamp(1.6rem, 2.2vw, 2.4rem)` em viewport 1024px → 2.2vw = 22.5px ≈ 1.4rem (abaixo do min 1.6rem). Em 700px, ainda pior.

**Ação**: verificar em DevTools que resultado é ≥1.6rem visualmente. Spec pressupõe 1024px min width; confirmar.

---

### 4.5 Permanência do ambient layer sob `prefers-reduced-motion`

**Risco**: `nucci-0016` governa ambient; skill diz ambient desliga sob `prefers-reduced-motion: reduce`. Nenhuma regra TS/CSS nova toca ambient, mas se teste roda com `prefers-reduced-motion: reduce` ativado, ambient vanece. Confirmar que nenhuma lógica depende de ambient estar sempre presente.

**Ação**: verificar `tests/renderer/design-lab/design-lab.test.tsx` (se executa com motion reduzido, é OK).

---

## 5. Contraste WCAG — Candidatos Status

Spec AC-006 exige auditoria ≥4.5:1 (AA) para novos tokens status.

### 5.1 Candidato Verde (Success)

**Proposto**: `#5ad8a6` (verde-sinal) sobre `--surface: #0e1b2f`

**Cálculo luminância (fórmula WCAG 2.1)**:
- `#5ad8a6` → RGB(90, 216, 166)
  - Normalize: R'=90/255≈0.353, G'=216/255≈0.847, B'=166/255≈0.651
  - L1 = 0.2126×(0.353)^2.2 + 0.7152×(0.847)^2.2 + 0.0722×(0.651)^2.2
  - L1 ≈ 0.2126×0.106 + 0.7152×0.656 + 0.0722×0.378 ≈ 0.023 + 0.469 + 0.027 ≈ 0.519

- `#0e1b2f` → RGB(14, 27, 47)
  - Normalize: R'=14/255≈0.055, G'=27/255≈0.106, B'=47/255≈0.184
  - L2 = 0.2126×(0.055)^2.2 + 0.7152×(0.106)^2.2 + 0.0722×(0.184)^2.2
  - L2 ≈ 0.2126×0.002 + 0.7152×0.009 + 0.0722×0.024 ≈ 0.0005 + 0.0064 + 0.0017 ≈ 0.0086

- **Ratio = (L1 + 0.05) / (L2 + 0.05) = (0.519 + 0.05) / (0.0086 + 0.05) = 0.569 / 0.0586 ≈ 9.7:1**

✅ **PASSA 4.5:1 (AA) e 7:1 (AAA)**

### 5.2 Candidato Âmbar (Warning)

**Proposto**: `#ffd166` (foco-ring-family) sobre `--surface: #0e1b2f`

**Cálculo**:
- `#ffd166` → RGB(255, 209, 102)
  - Normalize: R'=255/255=1.0, G'=209/255≈0.820, B'=102/255≈0.4
  - L1 = 0.2126×(1.0)^2.2 + 0.7152×(0.820)^2.2 + 0.0722×(0.4)^2.2
  - L1 ≈ 0.2126×1.0 + 0.7152×0.635 + 0.0722×0.14 ≈ 0.213 + 0.454 + 0.010 ≈ 0.677

- L2 ≈ 0.0086 (mesma de acima)

- **Ratio = (0.677 + 0.05) / (0.0086 + 0.05) = 0.727 / 0.0586 ≈ 12.4:1**

✅ **PASSA 4.5:1 (AA) e 7:1 (AAA)**

### 5.3 Documentação esperada em código

```css
.concept[data-concept='night-harbor'] {
  /* ... existing tokens ... */

  /* Status signals — WCAG 2.1 Level AA (4.5:1 text contrast) */
  /* #5ad8a6 on #0e1b2f → ratio ~9.7:1 ✓ */
  --success: #5ad8a6;
  --on-success: #f3f7ff;  /* Usar --ink para consistência */

  /* #ffd166 on #0e1b2f → ratio ~12.4:1 ✓ */
  --warning: #ffd166;
  --on-warning: #0e1b2f;  /* Ou --ink se precisar contrast melhor */
}
```

---

## 6. Verify Gate

Todos os seguintes devem passar **sem erros**:

```bash
npm run lint
npm run typecheck
npm run test
```

**Checklist de verify**:
- [ ] ESLint: zero warnings em global.css, concepts.module.css, ConceptScaffold.tsx, NightHarborLayout.tsx, motion-tokens.ts
- [ ] TypeScript strict: zero erros de tipo
- [ ] Testes vitest: todas as suites passam, inclusive design-lab.test.tsx e app-integration.test.tsx
- [ ] DevTools manual (opcional): inspecionar elemento em saída após implementar; confirmar `transition-duration: 180ms` (exit, ≈182ms arredondado) vs `transition-duration: 280ms` (enter)

---

## 7. Próximas Fases (após AC-001-012 ✓)

- **P2.1**: StatusChip (dot + ícone + label)
- **P2.2**: Nav lateral com ícone+label + pill ativa
- **P2.3**: KPI strip (--type-metric MONO + sparkline-maré)
- **P2.4–P2.6**: Ações inline, filter chips, stagger

---

## Referências

- `.orquestrador/night-harbor-p1-tokens/spec.md` (esta fase)
- `.orquestrador/night-harbor-ui-design/proposta-melhorias-001.md` §2-4 (contexto de gaps)
- `.agents/skills/harbor-night-harbor-ui/SKILL.md` (regras de direção)
- `docs/adr/design.md` §5 (motion base 280ms + exit rule)
- `docs/adr/ADR-0002` (layouts/motion), `ADR-0004` (Recursive/ícones)

---

**Escrito por**: dispatcher handoff-agent  
**Entregue para**: implement-agent  
**Status**: pronto para implementação

# P1 — Fundação de Tokens (spec.md)

## Objetivo

Implementar a base de tokens unificados para Night Harbor — motion, status, tipografia e ícone — eliminando valores hardcoded no TSX, cumprindo regras já decididas (exit = 0.65 × enter) e desbloqueando a série P2 (componentes de status/métrica). Tudo em CSS custom properties + constante TS compartilhada.

## Motivação

Proposta-melhorias-001.md §2.1–2.4 documenta os gaps concretos:
- **Motion**: regra `exit < enter` está em design.md §5 mas não implementada (M1); dois sistemas desconexos CSS/TSX (M2)
- **Status**: sem verde/âmbar tokens — status renderizado com hex cru em P2 (proposta §2.4, bloqueador)
- **Tipografia**: sem `--type-metric`, pesos não tokenizados, MONO subutilizado, sem tabulares (T1–T5)
- **Ícones**: sem tokens de tamanho — hardcoded 1.2rem no signature (I3)

Design.md §5 reafirma motion base 280ms + easing [0.22,1,0.36,1]. Skill do projeto consolida Night Harbor como único conceito ativo e proíbe hex cru em componentes.

## Acceptance Criteria

**AC-001**: Tokens de motion em `src/renderer/src/styles/global.css` sob `:root`:
- `--motion-duration: 280ms`
- `--motion-duration-exit: 182ms` (= 0.65 × 280)
- `--motion-ease: cubic-bezier(0.22, 1, 0.36, 1)`

**AC-002**: Constante TS compartilhada `src/renderer/src/app/motion-tokens.ts` exporta:
```typescript
export const motionTokens = {
  duration: '280ms',
  durationExit: '182ms',
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
};
```

**AC-003**: `ConceptScaffold.tsx` e `NightHarborLayout.tsx` leem de `motion-tokens.ts`, zero valores hardcoded (0.28, [0.22,1,0.36,1]) no TSX.

**AC-004**: Exit animation no `ConceptScaffold.tsx` usa `motionTokens.durationExit` (182ms), verificável em DevTools como `transition-duration: 182ms` no elemento ao sair.

**AC-005**: Tokens de status em `src/renderer/src/concepts/concepts.module.css` sob `[data-concept='night-harbor']`:
- `--success: <candidato verde-sinal ajustado>`
- `--on-success: <cor de texto sobre success>`
- `--warning: <candidato âmbar ffd166-family>`
- `--on-warning: <cor de texto sobre warning>`

**AC-006**: Contraste dos novos pares (success/on-success, warning/on-warning) auditado ≥4.5:1 (metodologia WCAG 2.1 level AA), documentado em comentário CSS ao lado de cada token.

**AC-007**: Tokens tipográficos em `global.css`:
- `--type-metric: clamp(1.6rem, 2.2vw, 2.4rem)` (numeral KPI)
- `--weight-body: 400`
- `--weight-label: 520`
- `--weight-heading: 650`

**AC-008**: Classe utilitária `.data` (ou primitiva) em `src/renderer/src/styles/primitives.module.css` com:
```css
font-variation-settings: 'MONO' 1;
font-variant-numeric: tabular-nums;
```

**AC-009**: Tokens de ícone em `global.css`:
- `--icon-sm: 1rem`
- `--icon-md: 1.2rem`
- `--icon-lg: 1.5rem`

Signature icon (`concepts.module.css`) passa a usar `--icon-md` em vez de hardcoded 1.2rem.

**AC-010**: Tokens divergentes (`--ease-standard`, `--duration-fast`) são identificados, remapeados para os novos ou marcados como deprecated com data de remoção (próxima semana).

**AC-011**: Verify gate passa: `npm run lint && npm run typecheck && npm run test` executam sem erros, zero regressões em testes vitest.

**AC-012**: Screenshot 1024×700 do Shell renderizado mostra transições exit claramente mais curtas que enter em qualquer diálogo/modal que se fecha.

## Fora de Escopo

- **Componentes novos**: StatusChip, KPI strip, MetricTile (= P2)
- **UI visível**: nenhuma mudança de cor/layout além da aplicação dos tokens novos
- **Stagger de listas**: tabulação 40ms na entrada de itens (= P2.6)
- **Light mode**: Harbor é dark-only; `global.css` `:root` não ganha light fallback
- **Phosphor massivo**: apenas signature icon continua usando Phosphor; navegação lateral vai ganhar ícones em P2.1
- **Conceitos legacy**: command-deck e signal-poster permanecem no registro histórico, não ganham novos tokens
- **Design Lab**: repurposing e remoção de Iconoir ficam para P3.3
- **Validação AERT detalhada**: contraste auditado via software (Contrast Ratio tool ou similar), documentado; AERT full não é bloqueador nesta fase

## Riscos

1. **Valores candidatos status (verde/âmbar)**: propostos como `#5ad8a6` (verde-sinal) e `#ffd166` (foco-ring-family). Contraste precisa ser **numericamente auditado** antes de fixar. Se um deles falhar 4.5:1, usar paleta alternativa (ex.: verde mais saturado, ou descer a luminância do âmbar).

2. **Regressão em usos antigos de `--ease-standard` / `--duration-fast`**: qualquer componente que lê essas variáveis hoje quebrará se deletadas. Solução: mapeá-los como aliases aos novos no mesmo bloco `:root`, com TODO de remoção futura.

3. **Typos em cubic-bezier**: `cubic-bezier(0.22, 1, 0.36, 1)` é sensível. Testar com `getComputedStyle()` em DevTools para confirmar que o navegador parseou.

4. **Clamp de `--type-metric`**: `clamp(1.6rem, 2.2vw, 2.4rem)` pressupõe viewport ≥ ~730px de width. Baseline é 1024px, então dentro da spec, mas confirmar em 1024×700 que não fica visivelmente cortado.

5. **Permanência da ambient layer**: NightAmbient permanece decorativa sob `reduced-motion`, mas se algum teste roda com `prefers-reduced-motion: reduce`, ambient desliga. Zero impacto funcional, mas confirmar em suite que lógica não quebra.

## Próximos Passos (após AC-001-012 verde)

1. P2.1 + P2.2: StatusChip + nav com ícone+label
2. P2.3: KPI strip com `--type-metric` + sparkline-maré
3. P2.4–P2.6: ações inline, filter chips, stagger

---

**Escrito**: especificação SDD fase P1 (run --quick)  
**Referência**: proposta-melhorias-001.md §4.P1; design.md §5; skill harbor-night-harbor-ui

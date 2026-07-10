# Handoff 005 — Review to Fix Gate

**Phase**: review → fix  
**Date**: 2026-07-09  
**Feature**: night-harbor-p2-statuschip-nav  
**Status**: PASS (2 Medium findings, non-blocking)

---

## Dispatch Summary

Review round `reviews-001` cleared with **0 Critical, 0 High, 2 Medium** findings. Both are test-quality improvements, not functional defects. All 10 ACs ✓, all 9 hard rules ✓, security ✓, regression ✓.

**Findings to fix**:
- **101**: Brittle hardcoded agent count in test assertion (shell-settings.test.tsx:362)
- **201**: Missing tone class assertions in integration tests (shell-settings.test.tsx:305–387)

---

## Finding 101 — Brittle Hardcoded Agent Count

**File**: tests/renderer/shell-settings/shell-settings.test.tsx  
**Line**: 362  
**Severity**: MEDIUM

### Problem
```typescript
expect(within(agentsSection).getAllByText('Available')).toHaveLength(3)
```

Count `3` is hardcoded with no semantic link to `mockCatalog.agents`. If mock data changes, test fails ambiguously (is it a code bug or a mock change?).

### Recommended Fix
**Option A** (preferred): Parameterize from mock data:
```typescript
const availableAgentsCount = mockCatalog.agents
  .filter(agent => agent.status === 'Available').length

expect(within(agentsSection).getAllByText('Available'))
  .toHaveLength(availableAgentsCount)
```

**Option B** (minimum): Add explanatory comment:
```typescript
// mockCatalog.agents: 3x Available (verify if agents change)
expect(within(agentsSection).getAllByText('Available')).toHaveLength(3)
```

---

## Finding 201 — Missing Tone Class Assertions

**File**: tests/renderer/shell-settings/shell-settings.test.tsx  
**Lines**: 305–387 (all new StatusChip integration tests)  
**Severity**: MEDIUM

### Problem
Tests verify text labels render, but **do not assert CSS tone classes** (e.g., `statusChip_success`, `statusChip_warning`). A CSS regression could remove these classes and tests would still pass.

### Examples of Current Gaps
**Line 317-319**:
```typescript
expect(screen.getByText('Running')).toBeInTheDocument()
expect(screen.getByText('Ready')).toBeInTheDocument()
```
✗ Does not check: Is `.statusChip_success` class applied? Is the green tone color visible?

**Line 362**:
```typescript
expect(within(agentsSection).getAllByText('Available')).toHaveLength(3)
```
✗ Does not check: Do the elements have `.statusChip_success` class?

### Critical Technical Alert — CSS Modules Scoping

**⚠️ AVISO CRÍTICO**: Vite hashes CSS Module class names at runtime (e.g., `.statusChip_success` becomes `.statusChip_success__a1b2c` in compiled output). 

**DO NOT use**:
```typescript
// ❌ WRONG — will fail in compiled output
expect(runningChip).toHaveClass('statusChip_success')
```

**DO use substring match**:
```typescript
// ✓ CORRECT — catches hashed name
const runningChip = screen.getByText('Running').closest('[class*="statusChip"]')
expect(runningChip?.className).toContain('statusChip_success')
```

Or use a helper function:
```typescript
function expectStatusChip(
  label: string, 
  expectedTone: 'success' | 'warning' | 'danger' | 'neutral'
) {
  const chip = screen.getByText(label).closest('[class*="statusChip"]')
  expect(chip).toBeTruthy()
  expect(chip?.className).toContain(`statusChip_${expectedTone}`)
}

// Usage:
expectStatusChip('Running', 'success')
expectStatusChip('Ready', 'warning')
expectStatusChip('Complete', 'neutral')
```

### Recommended Fix Scope

1. **Line 317-319** (Running/Ready/Complete): Add tone assertions for all 3 statuses
2. **Line 325** (Idle): Add tone assertion (likely `neutral`)
3. **Line 362** (Available agents count): Combine with Finding 101 fix + add tone assertion
4. **Other StatusChip assertions**: Audit remaining lines 305–387 for missing tone checks

---

## Scope & Constraints

- **Edit file only**: tests/renderer/shell-settings/shell-settings.test.tsx
- **Optional harmonization**: Consider adding helper to status-chip.test.tsx if existing assertions there need updating (check line 176)
- **CSS Module pattern**: Use `.closest('[class*="statusChip"]')` + `.className.toContain()`, never toHaveClass() literal
- **Verify gate required**: Must run full test suite + typecheck after fixes (no silent assertions)
- **Learnings update**: If CSS Module scoping pattern is new/durable, append to learnings.md as "L10: CSS Module Substring Assertions"

---

## State Transitions After Fix

1. ✓ Update finding files (101/201) with "resolved" status
2. ✓ Commit changes (sdd-fix-review agent will handle git)
3. ✓ Run verify gate (`npm run test` + `npm run typecheck`)
4. ✓ Append learnings.md if durable
5. ✓ Return to orchestrator

---

## Next Agent: fix-agent

**Input**: This handoff-005.md + finding files  
**Output**: Edited shell-settings.test.tsx + updated finding files + learnings.md (if applicable)  
**Gate**: Verify (tests pass, no type errors, assertions match CSS Module scoping)

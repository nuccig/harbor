# Finding 201: Missing tone class assertions in integration tests

**Status**: RESOLVED  
**Severity**: MEDIUM  
**Category**: test-coverage  
**File**: tests/renderer/shell-settings/shell-settings.test.tsx  
**Lines**: 305–387 (all new StatusChip integration tests)

## Issue

Integration tests verify that StatusChip text labels render, but do **not assert that CSS tone classes are applied**. Tests could pass even if CSS classes like `statusChip_success`, `statusChip_warning`, etc. are never applied to the rendered element.

### Examples of loose verification:

**Line 317-319**:
```typescript
expect(screen.getByText('Running')).toBeInTheDocument()
expect(screen.getByText('Ready')).toBeInTheDocument()
expect(screen.getByText('Complete')).toBeInTheDocument()
```
Text is verified, but does **not check**:
- Is 'Running' wrapped in a `.statusChip` element?
- Does that element have class `.statusChip_success`?
- Does the tint background appear (CSS color-mix)?

**Line 362**:
```typescript
expect(within(agentsSection).getAllByText('Available')).toHaveLength(3)
```
Text count is verified, but **does not check**:
- Does each 'Available' text have `.statusChip_success` class?
- Does the green tone color apply?

## Failure Scenario

1. A CSS regression or refactor removes or renames the `.statusChip_success` class
2. StatusChip still renders text "Running" 
3. All tests pass (text is present)
4. User sees plain unstyled text without green color or dot
5. **Bug slips to production undetected**

## Evidence

- Tests use text-based queries (`getByText`) not class-based queries
- No assertions on `container.querySelector('[class*="statusChip_"]')`
- statusChip.test.tsx line 176 has one weak attempt (`[class*="statusChip_warning"]`) but full assertions suite in integration context is missing

## Recommendation

Add tone class assertions to every StatusChip integration test:

**Before**:
```typescript
expect(screen.getByText('Running')).toBeInTheDocument()
```

**After**:
```typescript
const runningChip = screen.getByText('Running').closest('[class*="statusChip"]')
expect(runningChip).toHaveClass('statusChip_success')
expect(runningChip).toHaveClass('statusChip')  // base class
```

Or use a helper:
```typescript
function expectStatusChip(label: string, expectedTone: 'success' | 'warning' | 'danger' | 'neutral') {
  const chip = screen.getByText(label).closest('[class*="statusChip"]')
  expect(chip).toHaveClass(`statusChip_${expectedTone}`)
}

// Usage:
expectStatusChip('Running', 'success')
expectStatusChip('Ready', 'warning')
expectStatusChip('Complete', 'neutral')
```

## Impact

- **Current tests**: Pass (false confidence in visual correctness)
- **Visual regression detection**: Weak; CSS changes could go unnoticed
- **Maintenance**: Medium; grows with each new tone/status combo

## Does this block review?

**No** (tests pass, implementation is correct). But **Medium priority** for test quality improvement.

Classification: Test suite lacks sufficient assertions to catch CSS/tone mapping regressions.

---

## Resolution

**Applied**: Helper function + substring matching for CSS Module classes

Added `expectStatusChip()` helper to safely assert tone classes in CSS Module scoped environment:
```typescript
function expectStatusChip(
  label: string,
  expectedTone: 'success' | 'warning' | 'danger' | 'neutral'
) {
  const chip = screen.getByText(label).closest('[class*="statusChip"]')
  expect(chip).toBeTruthy()
  expect(chip?.className).toContain(`statusChip_${expectedTone}`)
}
```

**Applied to all StatusChip integration tests**:
- Line 305–327: Session statuses (Running → success, Ready → warning, Complete → neutral)
- Line 341–376: Agent statuses (Available → success)
- Line 365–393: Integration statuses (Not configured → warning, Simulated → neutral)

**Key pattern**: Uses `.closest('[class*="statusChip"]')` + `.className.toContain()` to handle Vite CSS Module hash obfuscation. Never uses `toHaveClass()` with literal class names.

**Benefit**: CSS regressions in tone mapping will now be reliably caught. Test suite is resilient to CSS Module name hashing.

**Date resolved**: 2026-07-09

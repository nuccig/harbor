# Finding 101: Brittle hardcoded agent count in test assertion

**Status**: RESOLVED  
**Severity**: MEDIUM  
**Category**: test-coverage  
**File**: tests/renderer/shell-settings/shell-settings.test.tsx  
**Line**: 362

## Issue

Test assertion hardcodes the expected count of "Available" agents:

```typescript
expect(within(agentsSection).getAllByText('Available')).toHaveLength(3)
```

The number 3 is tied to `mockCatalog.agents` at time of writing but has no semantic connection to the assertion. If an agent is added or removed from the mock catalog, this test fails without clarifying the failure as a mock-data change vs. a code defect.

## Failure Scenario

1. Someone adds a 4th agent to mockCatalog.agents
2. This test fails: "expected 4, received 3"
3. Failure is ambiguous: could be code bug or mock data change
4. Test maintenance burden increases

## Evidence

- Line 362 in shell-settings.test.tsx: hardcoded `.toHaveLength(3)`
- No reference to mockCatalog.agents.filter(...).length
- Pattern appears only once (not widespread duplication)

## Recommendation

**Option A (Semantic)**: Parameterize from mock data:
```typescript
const availableAgentsCount = mockCatalog.agents
  .filter(agent => agent.status === 'Available').length
expect(within(agentsSection).getAllByText('Available'))
  .toHaveLength(availableAgentsCount)
```

**Option B (Minimum fix)**: Add comment:
```typescript
// mockCatalog.agents: 3x Available (expected count; update if agents change)
expect(within(agentsSection).getAllByText('Available')).toHaveLength(3)
```

## Impact

- **Code functionality**: None (test passes)
- **Future maintenance**: Potential false positives when mock data changes
- **CI stability**: Low (fails only if mock data intentionally changes)

## Does not block review

This is a test-quality issue, not a functional defect. Implementation is correct; test assertion is brittle but passing.

---

## Resolution

**Applied**: Option A (Semantic parameterization)

Added import of `mockCatalog` and derived the expected count:
```typescript
const availableAgentsCount = mockCatalog.agents.filter(
  (agent) => agent.status === 'Available'
).length
expect(within(agentsSection).getAllByText('Available')).toHaveLength(
  availableAgentsCount
)
```

**Benefit**: Test now semantically links to mock data. If agents are added/removed from mockCatalog, test assertion updates automatically without ambiguity.

**Date resolved**: 2026-07-09

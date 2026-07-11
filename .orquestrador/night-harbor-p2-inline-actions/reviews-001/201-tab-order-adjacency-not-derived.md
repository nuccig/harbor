---
id: 201
severity: medium
status: resolved
location: tests/renderer/shell/inline-actions.test.tsx:24,231-258 (AC-014 tab-order test)
created: 2026-07-11
---

# AC-014 tab-order test depends on un-derived fixture adjacency between the Running card and `oneButtonSession`'s card

## Problem

The second half of `'keeps a consistent content → pause/resume → log tab order across cards
(AC-014)'` asserts that tabbing away from the Running session's log button lands directly on
`oneButtonSession`'s log button:

```ts
const oneButtonSession = seedViews.find((view) => !view.canTogglePause)
// …
runningLogButton.focus()
expect(document.activeElement).toBe(runningLogButton)
await user.tab()
expect(document.activeElement).toBe(oneButtonLogButton)
```

`oneButtonSession` is selected via `seedViews.find((view) => !view.canTogglePause)` — a
predicate over the *status matrix* (only Running/Paused sessions get a toggle button), not over
*position*. It happens to resolve to `session-103` (Ready), which happens to be the very next
item after `session-104` (Running) in `mockCatalog.sessions`. The test asserts a DOM-adjacency
fact (`oneButtonSession`'s card is the *next rendered card* after `runningSession`'s) that is
never itself derived or asserted from the fixture — it is an accidental consequence of today's
fixture ordering (Running, Ready, Complete). This is exactly the pattern called out in the review
brief: a test that "assume que sessão Running precede Ready sem derivar do mock."

If `mockCatalog.sessions` gains a session between `session-104` and `session-103` (e.g. a second
Running session, or a reorder), or if the first non-togglable session in array order stops being
adjacent to the Running one, this assertion breaks — not because AC-014's real behavior (content →
pause/resume → log tab order, consistent per card) regressed, but because the test's second half
silently assumed an adjacency the first half never established. The failure would read as a tab-
order regression when the actual cause is an unrelated fixture edit, which is the exact
maintenance/false-signal cost the "counts/adjacency derived from fixture" checklist item exists to
prevent.

## Suggested fix

Derive the full expected tab sequence programmatically from `seedViews` (already in DOM order)
instead of assuming two specific cards are adjacent:

```ts
const expectedStops = seedViews.flatMap((view) => {
  const labels = sessionActionLabels(view)
  const stops = [screen.getByRole('button', { name: view.canTogglePause ? labels.pause : labels.log })]
  if (view.canTogglePause) stops.push(screen.getByRole('button', { name: labels.log }))
  return stops
})

expectedStops[0].focus()
for (let i = 1; i < expectedStops.length; i++) {
  await user.tab()
  expect(document.activeElement).toBe(expectedStops[i])
}
```

This walks every card in fixture order (whatever that order is) and checks the full pause/resume →
log sequence per card, so the test keeps testing "consistent order across cards" without silently
depending on which two specific statuses happen to sit next to each other today.

## Resolution

Replaced the hand-picked `oneButtonSession` adjacency assertion with a fully derived
`expectedStops` sequence: `seedViews.flatMap(...)` walks every card in fixture order,
contributing its `togglePauseLabel` stop only when `canTogglePause`, then its `logLabel`
stop — no assumption about which two statuses sit next to each other. `oneButtonSession`
stays only as the top-level fixture-sanity guard (line 24/26); the test body no longer
references it directly. Verified: `npm run test` 220/220 green, including the rewritten
AC-014 test.

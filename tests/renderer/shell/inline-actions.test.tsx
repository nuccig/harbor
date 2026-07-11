import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLayoutEffect, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import {
  ExperienceProvider,
  useExperienceDispatch,
  useExperienceState
} from '../../../src/renderer/src/app/ExperienceProvider'
import {
  createInitialExperienceState,
  type ScenarioId
} from '../../../src/renderer/src/app/experience-model'
import { mockCatalog } from '../../../src/renderer/src/app/mock-catalog'
import { selectSessionViews, sessionActionLabels } from '../../../src/renderer/src/app/selectors'
import { Shell } from '../../../src/renderer/src/shell'
import { Button } from '../../../src/renderer/src/ui'

// Fixtures derived from Task 001's selector/reducer over the default state — never hand-rolled
// (constitution css-module-class-asserts learning extends to counts/ids/labels too).
const seedViews = selectSessionViews(createInitialExperienceState())
const runningSession = seedViews.find((view) => view.status === 'Running')
const readySession = seedViews.find((view) => view.status === 'Ready')
const oneButtonSession = seedViews.find((view) => !view.canTogglePause)

if (!runningSession || !readySession || !oneButtonSession) {
  throw new Error('fixture is missing an expected seed status — check mock-catalog.ts sessions')
}

const runningCountBeforePause = mockCatalog.sessions.filter(
  (session) => session.status === 'Running'
).length

function stubMatchMedia(matches: boolean) {
  const original = window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false
    })
  })
  return () =>
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: original })
}

function ExperienceTestRoot({ children }: { children: ReactNode }) {
  return <ExperienceProvider>{children}</ExperienceProvider>
}

function OnboardingCompletionHarness() {
  const state = useExperienceState()
  const dispatch = useExperienceDispatch()

  if (state.phase === 'onboarding') {
    return (
      <Button onClick={() => dispatch({ type: 'completeOnboarding' })}>
        Complete onboarding
      </Button>
    )
  }

  return <Shell />
}

function ScenarioOnboardingHarness({ scenario }: { scenario: ScenarioId }) {
  const state = useExperienceState()
  const dispatch = useExperienceDispatch()

  useLayoutEffect(() => {
    dispatch({ type: 'selectScenario', scenario })
  }, [dispatch, scenario])

  if (state.phase === 'onboarding') {
    return (
      <Button onClick={() => dispatch({ type: 'completeOnboarding' })}>
        Complete onboarding
      </Button>
    )
  }

  return <Shell />
}

function expectStatusChip(
  label: string,
  expectedTone: 'success' | 'warning' | 'danger' | 'neutral'
) {
  const chip = screen.getByText(label).closest('[class*="statusChip"]')
  expect(chip).toBeTruthy()
  expect(chip?.className).toContain(`statusChip_${expectedTone}`)
}

function getLogPanelFor(logButton: HTMLElement): HTMLElement {
  const panelId = logButton.getAttribute('aria-controls')
  expect(panelId).toBeTruthy()
  const panel = document.getElementById(panelId ?? '')
  expect(panel).toBeTruthy()
  return panel as HTMLElement
}

async function completeOnboarding(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Complete onboarding' }))
}

describe('Shell inline session actions', () => {
  it('pauses and resumes the Running session in place on the Overview panel (AC-005/006)', async () => {
    const user = userEvent.setup()
    render(
      <ExperienceTestRoot>
        <OnboardingCompletionHarness />
      </ExperienceTestRoot>
    )
    await completeOnboarding(user)

    const labels = sessionActionLabels(runningSession)

    expectStatusChip('Running', 'success')
    await user.click(screen.getByRole('button', { name: labels.pause }))

    expectStatusChip('Paused', 'warning')
    expect(screen.getByRole('button', { name: labels.resume })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: labels.resume }))

    expectStatusChip('Running', 'success')
    expect(screen.getByRole('button', { name: labels.pause })).toBeInTheDocument()

    // Close the pause → resume → pause cycle (review 202) on the exact same mounted
    // SessionCard instance, with no intervening remount/navigation.
    await user.click(screen.getByRole('button', { name: labels.pause }))

    expectStatusChip('Paused', 'warning')
    expect(screen.getByRole('button', { name: labels.resume })).toBeInTheDocument()
  })

  it('keeps pause state consistent across Overview and the Sessions board in both directions (AC-010)', async () => {
    const user = userEvent.setup()
    render(
      <ExperienceTestRoot>
        <OnboardingCompletionHarness />
      </ExperienceTestRoot>
    )
    await completeOnboarding(user)

    const labels = sessionActionLabels(runningSession)
    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary navigation' })

    // Pause on Overview, verify on the Sessions board.
    await user.click(screen.getByRole('button', { name: labels.pause }))
    expectStatusChip('Paused', 'warning')

    await user.click(within(primaryNavigation).getByRole('button', { name: 'Sessions' }))
    expectStatusChip('Paused', 'warning')
    expect(screen.getByRole('button', { name: labels.resume })).toBeInTheDocument()

    // Reverse the direction: resume + re-pause on the board, verify back on Overview.
    await user.click(screen.getByRole('button', { name: labels.resume }))
    expectStatusChip('Running', 'success')

    await user.click(screen.getByRole('button', { name: labels.pause }))
    expectStatusChip('Paused', 'warning')

    await user.click(within(primaryNavigation).getByRole('button', { name: 'Overview' }))
    expectStatusChip('Paused', 'warning')
    expect(screen.getByRole('button', { name: labels.resume })).toBeInTheDocument()
  })

  it('decrements the Active agents KPI by exactly one when the Running session is paused (AC-011)', async () => {
    const user = userEvent.setup()
    render(
      <ExperienceTestRoot>
        <OnboardingCompletionHarness />
      </ExperienceTestRoot>
    )
    await completeOnboarding(user)

    const keyMetricsHeading = screen.getByRole('heading', { level: 2, name: 'Key metrics' })
    const keyMetricsGroup = keyMetricsHeading.closest('[data-surface-slot]')
    expect(keyMetricsGroup).toBeTruthy()
    const group = within(keyMetricsGroup as HTMLElement)
    const activeAgentsTile = group.getAllByRole('listitem')[0]

    expect(within(activeAgentsTile).getByText('Active agents')).toBeInTheDocument()
    expect(
      within(activeAgentsTile).getByText(String(runningCountBeforePause))
    ).toBeInTheDocument()

    const labels = sessionActionLabels(runningSession)
    await user.click(screen.getByRole('button', { name: labels.pause }))

    expect(
      within(activeAgentsTile).getByText(String(runningCountBeforePause - 1))
    ).toBeInTheDocument()
  })

  const sessionScenarios: readonly [ScenarioId, readonly string[]][] = [
    ['loading', ['Loading active agent sessions…']],
    ['empty', ['No active sessions', 'Start an agent session from a project when you are ready.']],
    ['error', ['Agent sessions could not be loaded']]
  ]

  it.each(sessionScenarios)(
    'renders the sessions group %s scenario with zero action buttons/log panels and unchanged copy (AC-012)',
    async (scenario, expectedTexts) => {
      const user = userEvent.setup()
      render(
        <ExperienceTestRoot>
          <ScenarioOnboardingHarness scenario={scenario} />
        </ExperienceTestRoot>
      )
      await completeOnboarding(user)

      const sessionsHeading = screen.getByRole('heading', {
        level: 2,
        name: 'Active agent sessions'
      })
      const sessionsGroup = sessionsHeading.closest('[data-surface-slot]')
      expect(sessionsGroup).toBeTruthy()
      const group = within(sessionsGroup as HTMLElement)

      for (const text of expectedTexts) {
        expect(group.getByText(text)).toBeInTheDocument()
      }

      expect(
        group.queryByRole('button', { name: /Pause session|Resume session|Session log/ })
      ).not.toBeInTheDocument()
    }
  )

  it('keeps a consistent content → pause/resume → log tab order across cards (AC-014)', async () => {
    const user = userEvent.setup()
    render(
      <ExperienceTestRoot>
        <OnboardingCompletionHarness />
      </ExperienceTestRoot>
    )
    await completeOnboarding(user)

    // Derive the full expected stop sequence from seedViews (already in fixture/DOM order)
    // instead of assuming any two specific cards are adjacent (review 201): each card
    // contributes its pause/resume stop only when canTogglePause, then its log stop — a
    // card with no toggle button must not insert a pause/resume stop of its own.
    const expectedStops = seedViews.flatMap((view) => [
      ...(view.canTogglePause
        ? [screen.getByRole('button', { name: view.togglePauseLabel })]
        : []),
      screen.getByRole('button', { name: view.logLabel })
    ])

    // Sanity check the derived sequence mixes both card shapes, so this test still exercises
    // the "no toggle stop" edge case whatever the fixture's current ordering is.
    expect(expectedStops.length).toBeGreaterThan(seedViews.length)

    expectedStops[0].focus()
    expect(document.activeElement).toBe(expectedStops[0])
    for (let i = 1; i < expectedStops.length; i++) {
      await user.tab()
      expect(document.activeElement).toBe(expectedStops[i])
    }
  })

  it('suppresses the sessionLogAnimated class when the reduce-motion setting is enabled (AC-015, setting path)', async () => {
    const user = userEvent.setup()
    render(
      <ExperienceTestRoot>
        <OnboardingCompletionHarness />
      </ExperienceTestRoot>
    )
    await completeOnboarding(user)

    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    await user.click(within(primaryNavigation).getByRole('button', { name: 'Settings' }))
    await user.click(
      within(screen.getByRole('navigation', { name: 'Settings categories' })).getByRole(
        'button',
        { name: 'Appearance & motion' }
      )
    )
    await user.click(screen.getByRole('checkbox', { name: 'Reduce motion' }))

    await user.click(within(primaryNavigation).getByRole('button', { name: 'Overview' }))

    const labels = sessionActionLabels(runningSession)
    const logButton = screen.getByRole('button', { name: labels.log })
    await user.click(logButton)

    const panel = getLogPanelFor(logButton)
    expect(panel.className).not.toContain('sessionLogAnimated')
  })

  it('suppresses the sessionLogAnimated class when the system prefers reduced motion (AC-015, system path)', async () => {
    const restoreMatchMedia = stubMatchMedia(true)
    try {
      const user = userEvent.setup()
      render(
        <ExperienceTestRoot>
          <OnboardingCompletionHarness />
        </ExperienceTestRoot>
      )
      await completeOnboarding(user)

      const labels = sessionActionLabels(runningSession)
      const logButton = screen.getByRole('button', { name: labels.log })
      await user.click(logButton)

      const panel = getLogPanelFor(logButton)
      expect(panel.className).not.toContain('sessionLogAnimated')
    } finally {
      restoreMatchMedia()
    }
  })

  it('opens two session log panels independently within the same Shell tree (AC-018)', async () => {
    const user = userEvent.setup()
    render(
      <ExperienceTestRoot>
        <OnboardingCompletionHarness />
      </ExperienceTestRoot>
    )
    await completeOnboarding(user)

    const runningLabels = sessionActionLabels(runningSession)
    const readyLabels = sessionActionLabels(readySession)
    const runningLogButton = screen.getByRole('button', { name: runningLabels.log })
    const readyLogButton = screen.getByRole('button', { name: readyLabels.log })

    await user.click(runningLogButton)
    await user.click(readyLogButton)

    expect(runningLogButton).toHaveAttribute('aria-expanded', 'true')
    expect(readyLogButton).toHaveAttribute('aria-expanded', 'true')

    await user.click(runningLogButton)

    expect(runningLogButton).toHaveAttribute('aria-expanded', 'false')
    expect(readyLogButton).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows every seed session status on a fresh mount, never a leftover Paused (AC-013)', async () => {
    const user = userEvent.setup()
    render(
      <ExperienceTestRoot>
        <OnboardingCompletionHarness />
      </ExperienceTestRoot>
    )
    await completeOnboarding(user)

    expect(screen.queryByText('Paused')).not.toBeInTheDocument()
    expectStatusChip('Running', 'success')
    expectStatusChip('Ready', 'warning')
    expectStatusChip('Complete', 'neutral')
  })
})

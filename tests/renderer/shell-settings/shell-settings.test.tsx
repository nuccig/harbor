import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLayoutEffect, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import {
  ExperienceProvider,
  useExperienceDispatch,
  useExperienceState
} from '../../../src/renderer/src/app/ExperienceProvider'
import type {
  ScenarioId,
  SettingsCategory,
  ShellDestination
} from '../../../src/renderer/src/app/experience-model'
import { mockCatalog } from '../../../src/renderer/src/app/mock-catalog'
import { Settings } from '../../../src/renderer/src/settings'
import { Shell } from '../../../src/renderer/src/shell'
import { Button, ToastRegion } from '../../../src/renderer/src/ui'

function ExperienceTestRoot({ children }: { children: ReactNode }) {
  return <ExperienceProvider>{children}</ExperienceProvider>
}

function ShellWithToast() {
  const state = useExperienceState()
  const dispatch = useExperienceDispatch()

  return (
    <>
      <Shell />
      <ToastRegion
        toast={state.toast}
        onDismiss={() => dispatch({ type: 'dismissToast' })}
      />
      <span data-testid="lab-open">{String(state.designLabOpen)}</span>
    </>
  )
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

const destinations: readonly [ShellDestination, string, string][] = [
  ['overview', 'Overview', 'Current project'],
  ['projects', 'Projects', 'Simulated workspace'],
  ['sessions', 'Sessions', 'Agent session board'],
  ['issues', 'Issues', 'Prioritized queue'],
  ['settings', 'Settings', 'General']
]

const categories: readonly [SettingsCategory, string][] = [
  ['general', 'General'],
  ['appearance-motion', 'Appearance & motion'],
  ['agents', 'Agents'],
  ['integrations', 'Integrations'],
  ['notifications', 'Notifications']
]

describe('Shell and settings', () => {
  it('opens Overview after onboarding and exposes all five operational groups', async () => {
    const user = userEvent.setup()

    render(
      <ExperienceTestRoot>
        <OnboardingCompletionHarness />
      </ExperienceTestRoot>
    )

    await user.click(screen.getByRole('button', { name: 'Complete onboarding' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toHaveFocus()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Current project' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Active agent sessions' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Issue queue' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Key metrics' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Activity' })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Recent usage' })
    ).not.toBeInTheDocument()
  })

  it('renders the Key metrics KPI strip with exactly 4 tiles in the fixed semantic order', async () => {
    const user = userEvent.setup()

    render(
      <ExperienceTestRoot>
        <OnboardingCompletionHarness />
      </ExperienceTestRoot>
    )

    await user.click(screen.getByRole('button', { name: 'Complete onboarding' }))

    const keyMetricsHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Key metrics'
    })
    const keyMetricsGroup = keyMetricsHeading.closest('[data-surface-slot]')
    expect(keyMetricsGroup).toBeTruthy()
    const group = within(keyMetricsGroup as HTMLElement)

    const tiles = group.getAllByRole('listitem')
    const expectedTileCount = Object.keys(mockCatalog.kpis.series).length
    expect(tiles).toHaveLength(expectedTileCount)

    const activeAgentsCount = mockCatalog.sessions.filter(
      (session) => session.status === 'Running'
    ).length
    const issueQueueCount = mockCatalog.issueQueue.length
    const successRate = mockCatalog.kpis.successRate
    const agentTime = mockCatalog.recentUsage.find(
      (usage) => usage.label === 'Agent time'
    )?.value

    expect(within(tiles[0]).getByText('Active agents')).toBeInTheDocument()
    expect(within(tiles[0]).getByText(String(activeAgentsCount))).toBeInTheDocument()

    expect(within(tiles[1]).getByText('Issue queue')).toBeInTheDocument()
    expect(within(tiles[1]).getByText(String(issueQueueCount))).toBeInTheDocument()

    expect(within(tiles[2]).getByText('Success rate')).toBeInTheDocument()
    expect(within(tiles[2]).getByText(`${successRate}%`)).toBeInTheDocument()

    expect(within(tiles[3]).getByText('Agent time')).toBeInTheDocument()
    expect(within(tiles[3]).getByText(agentTime ?? '—')).toBeInTheDocument()

    // Scoped "Issue queue" collision check: the group heading (queue slot) and the
    // tile label (utility slot) share the same text but live in different sections.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Issue queue' })
    ).toBeInTheDocument()
  })

  const kpiScenarios: readonly [ScenarioId, readonly string[]][] = [
    ['loading', ['Loading key metrics…']],
    ['empty', ['No metrics yet', 'Metrics appear after simulated agent sessions run.']],
    ['error', ['Key metrics could not be loaded']]
  ]

  it.each(kpiScenarios)(
    'renders the Key metrics group %s scenario scoped to its own group',
    async (scenario, expectedTexts) => {
      const user = userEvent.setup()

      render(
        <ExperienceTestRoot>
          <ScenarioOnboardingHarness scenario={scenario} />
        </ExperienceTestRoot>
      )

      await user.click(screen.getByRole('button', { name: 'Complete onboarding' }))

      const keyMetricsHeading = screen.getByRole('heading', {
        level: 2,
        name: 'Key metrics'
      })
      const keyMetricsGroup = keyMetricsHeading.closest('[data-surface-slot]')
      expect(keyMetricsGroup).toBeTruthy()
      const group = within(keyMetricsGroup as HTMLElement)

      for (const text of expectedTexts) {
        expect(group.getByText(text)).toBeInTheDocument()
      }

      if (scenario === 'error') {
        expect(group.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
      }
    }
  )

  it.each(destinations)(
    'navigates to %s by keyboard, identifies it as current, and keeps primary navigation',
    async (_destination, label, contentHeading) => {
      const user = userEvent.setup()

      render(
        <ExperienceTestRoot>
          <Shell />
        </ExperienceTestRoot>
      )

      const primaryNavigation = screen.getByRole('navigation', {
        name: 'Primary navigation'
      })
      const destinationButton = within(primaryNavigation).getByRole('button', {
        name: label
      })

      if (label === 'Overview') {
        await user.click(
          within(primaryNavigation).getByRole('button', { name: 'Projects' })
        )
      }
      destinationButton.focus()
      await user.keyboard('{Enter}')

      expect(destinationButton).toHaveAttribute('aria-current', 'page')
      expect(primaryNavigation).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1, name: label })).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { level: 2, name: contentHeading })
      ).toBeInTheDocument()

      if (label === 'Settings') {
        expect(
          screen.getByRole('heading', { level: 2, name: 'General' })
        ).toHaveFocus()
      } else {
        expect(screen.getByRole('heading', { level: 1, name: label })).toHaveFocus()
      }
    }
  )

  it.each(categories)(
    'selects the %s settings category by keyboard and focuses its content heading',
    async (_category, label) => {
      const user = userEvent.setup()

      render(
        <ExperienceTestRoot>
          <Settings />
        </ExperienceTestRoot>
      )

      const categoryNavigation = screen.getByRole('navigation', {
        name: 'Settings categories'
      })
      const categoryButton = within(categoryNavigation).getByRole('button', {
        name: label
      })

      if (label === 'General') {
        await user.click(
          within(categoryNavigation).getByRole('button', {
            name: 'Appearance & motion'
          })
        )
      }
      categoryButton.focus()
      await user.keyboard('{Enter}')

      expect(categoryButton).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('heading', { level: 2, name: label })).toHaveFocus()

      switch (_category) {
        case 'general':
          expect(
            screen.getByRole('checkbox', { name: 'Launch at login' })
          ).toBeInTheDocument()
          break
        case 'appearance-motion':
          expect(
            screen.getByRole('button', { name: 'Open Design Lab' })
          ).toBeInTheDocument()
          break
        case 'agents':
          expect(
            screen.getByRole('combobox', { name: 'Default agent' })
          ).toBeInTheDocument()
          break
        case 'integrations':
          expect(
            screen.getByRole('list', { name: 'Issue integrations' })
          ).toBeInTheDocument()
          break
        case 'notifications':
          expect(
            screen.getByRole('checkbox', { name: 'Session notifications' })
          ).toBeInTheDocument()
          break
      }
    }
  )

  it('opens the shared Design Lab through experience state without a second panel', async () => {
    const user = userEvent.setup()

    render(
      <ExperienceTestRoot>
        <ShellWithToast />
      </ExperienceTestRoot>
    )

    await user.click(
      within(screen.getByRole('navigation', { name: 'Primary navigation' })).getByRole(
        'button',
        { name: 'Settings' }
      )
    )
    await user.click(
      within(screen.getByRole('navigation', { name: 'Settings categories' })).getByRole(
        'button',
        { name: 'Appearance & motion' }
      )
    )
    await user.click(screen.getByRole('button', { name: 'Open Design Lab' }))

    expect(screen.getByTestId('lab-open')).toHaveTextContent('true')
  })

  it('announces a named save toast without moving focus from the action', async () => {
    const user = userEvent.setup()

    render(
      <ExperienceTestRoot>
        <ShellWithToast />
      </ExperienceTestRoot>
    )

    await user.click(
      within(screen.getByRole('navigation', { name: 'Primary navigation' })).getByRole(
        'button',
        { name: 'Settings' }
      )
    )

    const saveButton = screen.getByRole('button', { name: 'Save General settings' })
    saveButton.focus()
    await user.keyboard('{Enter}')

    expect(screen.getByRole('status')).toHaveTextContent('General settings saved')
    expect(screen.getByRole('status')).toHaveTextContent(
      'General settings were saved for this session.'
    )
    expect(saveButton).toHaveFocus()
  })

  it('moves focus from the skip link to the shell main content', async () => {
    const user = userEvent.setup()

    render(
      <ExperienceTestRoot>
        <Shell />
      </ExperienceTestRoot>
    )

    const skipLink = screen.getByRole('link', { name: 'Skip to main content' })
    expect(skipLink).toHaveAttribute('href', '#shell-main-content')

    skipLink.focus()
    await user.keyboard('{Enter}')

    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('updates ephemeral settings drafts through labeled native controls', async () => {
    const user = userEvent.setup()

    render(
      <ExperienceTestRoot>
        <Settings />
      </ExperienceTestRoot>
    )

    const launchAtLogin = screen.getByRole('checkbox', { name: 'Launch at login' })
    expect(launchAtLogin).not.toBeChecked()

    await user.click(launchAtLogin)
    expect(launchAtLogin).toBeChecked()

    await user.click(
      within(screen.getByRole('navigation', { name: 'Settings categories' })).getByRole(
        'button',
        { name: 'Agents' }
      )
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Default agent' }),
      'gemini-cli'
    )

    expect(screen.getByRole('combobox', { name: 'Default agent' })).toHaveValue(
      'gemini-cli'
    )
  })

  it('renders StatusChip components for session status in Overview', async () => {
    const user = userEvent.setup()

    render(
      <ExperienceTestRoot>
        <OnboardingCompletionHarness />
      </ExperienceTestRoot>
    )

    await user.click(screen.getByRole('button', { name: 'Complete onboarding' }))

    // Verify that session status values are rendered (StatusChip displays them as labels)
    expect(screen.getByText('Running')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getByText('Complete')).toBeInTheDocument()

    // Verify CSS tone classes are applied
    expectStatusChip('Running', 'success')
    expectStatusChip('Ready', 'warning')
    expectStatusChip('Complete', 'neutral')
  })

  it('renders nav labels always visible (never icon-only)', async () => {
    render(
      <ExperienceTestRoot>
        <Shell />
      </ExperienceTestRoot>
    )

    const primaryNavigation = screen.getByRole('navigation', {
      name: 'Primary navigation'
    })

    // Verify all destination labels are present as text content within buttons
    expect(within(primaryNavigation).getByText('Overview')).toBeInTheDocument()
    expect(within(primaryNavigation).getByText('Projects')).toBeInTheDocument()
    expect(within(primaryNavigation).getByText('Sessions')).toBeInTheDocument()
    expect(within(primaryNavigation).getByText('Issues')).toBeInTheDocument()
    expect(within(primaryNavigation).getByText('Settings')).toBeInTheDocument()
  })

  it('renders StatusChip in agents list (Available → success)', async () => {
    const user = userEvent.setup()

    render(
      <ExperienceTestRoot>
        <Settings />
      </ExperienceTestRoot>
    )

    // Navigate to Agents category
    await user.click(
      within(screen.getByRole('navigation', { name: 'Settings categories' })).getByRole(
        'button',
        { name: 'Agents' }
      )
    )

    // Verify that agents status is rendered via StatusChip
    const agentsSection = screen.getByLabelText('Available agents')
    expect(agentsSection).toBeInTheDocument()

    // Derive expected count from mockCatalog (Fix 101: avoid brittle hardcoded count)
    const availableAgentsCount = mockCatalog.agents.filter(
      (agent) => agent.status === 'Available'
    ).length
    const availableElements = within(agentsSection).getAllByText('Available')
    expect(availableElements).toHaveLength(availableAgentsCount)

    // Verify CSS tone classes are applied to all Available agent chips (Fix 201)
    availableElements.forEach((element) => {
      const chip = element.closest('[class*="statusChip"]')
      expect(chip).toBeTruthy()
      expect(chip?.className).toContain('statusChip_success')
    })
  })

  it('renders StatusChip in integrations list (Not configured → warning, Simulated → neutral)', async () => {
    const user = userEvent.setup()

    render(
      <ExperienceTestRoot>
        <Settings />
      </ExperienceTestRoot>
    )

    // Navigate to Integrations category
    await user.click(
      within(screen.getByRole('navigation', { name: 'Settings categories' })).getByRole(
        'button',
        { name: 'Integrations' }
      )
    )

    // Verify that integrations status is rendered via StatusChip
    const integrationsSection = screen.getByLabelText('Issue integrations')
    expect(integrationsSection).toBeInTheDocument()

    // Verify tone class assertions (Fix 201: CSS tone mapping)
    const notConfiguredElement = within(integrationsSection).getByText('Not configured')
    const notConfiguredChip = notConfiguredElement.closest('[class*="statusChip"]')
    expect(notConfiguredChip).toBeTruthy()
    expect(notConfiguredChip?.className).toContain('statusChip_warning')

    const simulatedElement = within(integrationsSection).getByText('Simulated')
    const simulatedChip = simulatedElement.closest('[class*="statusChip"]')
    expect(simulatedChip).toBeTruthy()
    expect(simulatedChip?.className).toContain('statusChip_neutral')
  })
})

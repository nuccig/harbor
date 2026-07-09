import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import {
  ExperienceProvider,
  useExperienceDispatch,
  useExperienceState
} from '../../../src/renderer/src/app/ExperienceProvider'
import type {
  SettingsCategory,
  ShellDestination
} from '../../../src/renderer/src/app/experience-model'
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
      screen.getByRole('heading', { level: 2, name: 'Recent usage' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Activity' })
    ).toBeInTheDocument()
  })

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
})

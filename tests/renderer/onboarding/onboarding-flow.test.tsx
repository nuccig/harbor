import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  ExperienceProvider,
  selectOverviewView,
  useExperience
} from '../../../src/renderer/src/app/index'
import { OnboardingFlow } from '../../../src/renderer/src/onboarding'

function StateProbe() {
  const [state, dispatch] = useExperience()
  const project = selectOverviewView(state).currentProject

  return (
    <>
      <output aria-label="experience state">{JSON.stringify(state)}</output>
      <output aria-label="project state">{JSON.stringify(project)}</output>
      <button
        onClick={() =>
          dispatch({ type: 'selectConcept', concept: 'night-harbor' })
        }
        type="button"
      >
        Select Night Harbor
      </button>
    </>
  )
}

function renderOnboarding() {
  const user = userEvent.setup()

  render(
    <ExperienceProvider>
      <OnboardingFlow />
      <StateProbe />
    </ExperienceProvider>
  )

  return user
}

function readOutput(label: string) {
  return JSON.parse(screen.getByRole('status', { name: label }).textContent ?? '{}')
}

async function goToFirstProject(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await user.click(screen.getByRole('button', { name: 'Continue' }))
}

describe('OnboardingFlow', () => {
  it('opens a new session on Welcome with explicit progress and advance action', () => {
    renderOnboarding()

    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument()
    expect(screen.getByText('1 of 4')).toHaveAccessibleName('Step 1 of 4')
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
  })

  it('follows the four-step order and preserves every controlled draft going back', async () => {
    const user = renderOnboarding()

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(
      screen.getByRole('heading', { name: 'Installed agents' })
    ).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /Claude Code/ }))

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(
      screen.getByRole('heading', { name: 'Issue integrations' })
    ).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Linear/ }))

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(
      screen.getByRole('heading', { name: 'First project' })
    ).toBeInTheDocument()
    await user.clear(screen.getByRole('textbox', { name: 'Project name' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Project name' }),
      'Tidepool'
    )

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('radio', { name: /Linear/ })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('checkbox', { name: /Codex/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Claude Code/ })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByRole('textbox', { name: 'Project name' })).toHaveValue(
      'Tidepool'
    )
    expect(readOutput('experience state').onboardingDraft).toMatchObject({
      selectedAgents: ['codex', 'claude-code'],
      issueIntegration: 'linear',
      projectName: 'Tidepool'
    })
  })

  it('marks Installed agents as deferred, keeps Continue, and preserves integration choices', async () => {
    const user = renderOnboarding()

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Skip' }))

    expect(
      screen.getByText(
        'Agent setup was skipped. You can complete it later in Settings.'
      )
    ).toHaveAttribute('role', 'status')
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByRole('radio', { name: /GitHub Issues/ })).toBeChecked()
    expect(readOutput('experience state').onboardingDraft).toMatchObject({
      agentsSkipped: true,
      integrationsSkipped: false,
      issueIntegration: 'github'
    })
  })

  it('marks Issue integrations as deferred without changing the agents draft', async () => {
    const user = renderOnboarding()

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('checkbox', { name: /Gemini CLI/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Skip' }))

    expect(
      screen.getByText(
        'Issue integration setup was skipped. You can complete it later in Settings.'
      )
    ).toHaveAttribute('role', 'status')
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('checkbox', { name: /Codex/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Gemini CLI/ })).toBeChecked()
    expect(readOutput('experience state').onboardingDraft).toMatchObject({
      selectedAgents: ['codex', 'gemini-cli'],
      agentsSkipped: false,
      integrationsSkipped: true
    })
  })

  it('completes a filled First project with populated default data', async () => {
    const user = renderOnboarding()

    await goToFirstProject(user)
    expect(screen.getByRole('textbox', { name: 'Project name' })).toHaveValue(
      'Harbor'
    )
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(readOutput('experience state')).toMatchObject({
      phase: 'shell',
      shellDestination: 'overview',
      projectAvailability: 'populated',
      onboardingDraft: {
        projectName: 'Harbor',
        firstProjectSkipped: false
      }
    })
    expect(readOutput('project state')).toMatchObject({
      status: 'ready',
      data: { name: 'Harbor' }
    })
  })

  it('completes a skipped First project with a useful empty-state signal', async () => {
    const user = renderOnboarding()

    await goToFirstProject(user)
    await user.click(screen.getByRole('button', { name: 'Skip' }))

    expect(readOutput('experience state')).toMatchObject({
      phase: 'shell',
      shellDestination: 'overview',
      projectAvailability: 'empty',
      onboardingDraft: { firstProjectSkipped: true }
    })
    expect(readOutput('project state')).toMatchObject({
      status: 'empty',
      title: 'No project yet',
      guidance: 'Add a project when you are ready to start a workspace.',
      action: { label: 'Add project' }
    })
  })

  it('preserves all onboarding controls when an external concept change rerenders the flow', async () => {
    const user = renderOnboarding()

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('checkbox', { name: /Claude Code/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('radio', { name: /Linear/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.clear(screen.getByRole('textbox', { name: 'Project name' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Project name' }),
      'Breakwater'
    )

    await user.click(screen.getByRole('button', { name: 'Select Night Harbor' }))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('radio', { name: /Linear/ })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('checkbox', { name: /Claude Code/ })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByRole('textbox', { name: 'Project name' })).toHaveValue(
      'Breakwater'
    )
    expect(readOutput('experience state')).toMatchObject({
      concept: 'night-harbor',
      onboardingDraft: {
        selectedAgents: ['codex', 'claude-code'],
        issueIntegration: 'linear',
        projectName: 'Breakwater'
      }
    })
  })

  it('moves focus to each heading on forward and backward step changes', async () => {
    const user = renderOnboarding()
    const names = [
      'Welcome',
      'Installed agents',
      'Issue integrations',
      'First project'
    ]

    expect(screen.getByRole('heading', { name: names[0] })).toHaveFocus()

    for (const name of names.slice(1)) {
      await user.click(screen.getByRole('button', { name: 'Continue' }))
      expect(screen.getByRole('heading', { name })).toHaveFocus()
      expect(screen.getByRole('heading', { name })).toHaveAttribute(
        'tabindex',
        '-1'
      )
    }

    for (const name of [...names].reverse().slice(1)) {
      await user.click(screen.getByRole('button', { name: 'Back' }))
      expect(screen.getByRole('heading', { name })).toHaveFocus()
    }
  })

  it('keeps controls and Back, Skip, and Continue in coherent keyboard order', async () => {
    const user = renderOnboarding()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Continue' })).toHaveFocus()
    await user.keyboard('{Enter}')

    const agentOptions = screen.getAllByRole('checkbox')
    await user.tab()
    expect(agentOptions[0]).toHaveFocus()
    await user.keyboard(' ')
    expect(agentOptions[0]).not.toBeChecked()
    await user.tab()
    expect(agentOptions[1]).toHaveFocus()
    await user.tab()
    expect(agentOptions[2]).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Back' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Skip' })).toHaveFocus()
    await user.keyboard(' ')
    expect(
      screen.getByText(
        'Agent setup was skipped. You can complete it later in Settings.'
      )
    ).toHaveAttribute('role', 'status')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Continue' })).toHaveFocus()
    await user.keyboard('{Enter}')

    const integrationOptions = screen.getAllByRole('radio')
    await user.tab()
    expect(integrationOptions[0]).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(integrationOptions[1]).toBeChecked()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Back' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Skip' })).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Continue' })).toHaveFocus()
    await user.keyboard(' ')

    expect(
      screen.getByRole('textbox', { name: 'Project name' })
    ).toBeInTheDocument()
    await user.tab()
    expect(screen.getByRole('textbox', { name: 'Project name' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Back' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Skip' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(readOutput('experience state')).toMatchObject({
      phase: 'shell',
      projectAvailability: 'empty'
    })
  })

  it('renders only English product copy in every owned step', async () => {
    const user = renderOnboarding()
    const flow = screen.getByRole('region', { name: 'Welcome' })
    const portugueseWords =
      /\b(bem-vindo|agentes instalados|integrações|projeto|voltar|continuar|pular)\b/i

    for (let step = 0; step < 4; step += 1) {
      expect(within(flow).queryByText(portugueseWords)).not.toBeInTheDocument()

      if (step < 3) {
        await user.click(screen.getByRole('button', { name: 'Continue' }))
      }
    }
  })
})

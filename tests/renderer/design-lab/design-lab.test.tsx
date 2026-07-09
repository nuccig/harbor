import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, type PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'
import {
  ExperienceProvider,
  useExperienceDispatch,
  useExperienceState,
  type ExperienceAction,
  type ExperienceState
} from '../../../src/renderer/src/app/index'
import { DesignLab } from '../../../src/renderer/src/design-lab/DesignLab'

function StateProbe() {
  const state = useExperienceState()

  return <output aria-label="experience state">{JSON.stringify(state)}</output>
}

function SeedExperience({ actions }: { actions: readonly ExperienceAction[] }) {
  const dispatch = useExperienceDispatch()

  useEffect(() => {
    for (const action of actions) {
      dispatch(action)
    }
  }, [actions, dispatch])

  return null
}

function ExternalControls() {
  const dispatch = useExperienceDispatch()

  return (
    <>
      <button
        type="button"
        onClick={() => dispatch({ type: 'setDesignLabOpen', open: true })}
      >
        Open from Appearance &amp; motion
      </button>
      <button
        type="button"
        onClick={() => {
          dispatch({ type: 'completeOnboarding' })
          dispatch({ type: 'goToDestination', destination: 'settings' })
          dispatch({
            type: 'selectSettingsCategory',
            category: 'appearance-motion'
          })
        }}
      >
        Navigate to Settings
      </button>
    </>
  )
}

function LabHarness({
  actions = [],
  children
}: PropsWithChildren<{ actions?: readonly ExperienceAction[] }>) {
  return (
    <ExperienceProvider>
      <SeedExperience actions={actions} />
      <ExternalControls />
      <DesignLab />
      <button type="button">After Design Lab</button>
      <StateProbe />
      {children}
    </ExperienceProvider>
  )
}

function readState(): ExperienceState {
  return JSON.parse(
    screen.getByRole('status', { name: 'experience state' }).textContent ?? '{}'
  ) as ExperienceState
}

const persistentSeed: readonly ExperienceAction[] = [
  { type: 'selectScenario', scenario: 'error' },
  {
    type: 'updateOnboardingDraft',
    field: 'projectName',
    value: 'Persistent mock project'
  },
  {
    type: 'updateSetting',
    field: 'sessionNotifications',
    value: false
  }
]

describe('Design Lab shared entry and rail', () => {
  it.each([
    {
      entry: 'welcome onboarding',
      actions: persistentSeed,
      expected: {
        phase: 'onboarding',
        onboardingStep: 'welcome',
        shellDestination: 'overview',
        settingsCategory: 'general'
      }
    },
    {
      entry: 'later onboarding step',
      actions: [
        ...persistentSeed,
        { type: 'goToOnboardingStep', step: 'first-project' } as const
      ],
      expected: {
        phase: 'onboarding',
        onboardingStep: 'first-project',
        shellDestination: 'overview',
        settingsCategory: 'general'
      }
    },
    {
      entry: 'shell destination',
      actions: [
        ...persistentSeed,
        { type: 'completeOnboarding' } as const,
        { type: 'goToDestination', destination: 'projects' } as const
      ],
      expected: {
        phase: 'shell',
        onboardingStep: 'welcome',
        shellDestination: 'projects',
        settingsCategory: 'general'
      }
    },
    {
      entry: 'Appearance & motion',
      actions: [
        ...persistentSeed,
        { type: 'completeOnboarding' } as const,
        { type: 'goToDestination', destination: 'settings' } as const,
        {
          type: 'selectSettingsCategory',
          category: 'appearance-motion'
        } as const
      ],
      expected: {
        phase: 'shell',
        onboardingStep: 'welcome',
        shellDestination: 'settings',
        settingsCategory: 'appearance-motion'
      }
    }
  ])(
    'opens the same panel and preserves the $entry state when concept changes',
    async ({ actions, expected }) => {
      const user = userEvent.setup()
      render(<LabHarness actions={actions} />)

      const openExternally = screen.getByRole('button', {
        name: 'Open from Appearance & motion'
      })
      await user.click(openExternally)

      expect(
        screen.getByRole('heading', { name: 'Tune the proposals' })
      ).toHaveFocus()
      expect(screen.getByRole('button', { name: 'Collapse Design Lab' })).toHaveAttribute(
        'aria-expanded',
        'true'
      )

      await user.click(screen.getByRole('radio', { name: 'Signal Poster' }))

      expect(readState()).toMatchObject({
        ...expected,
        concept: 'signal-poster',
        scenario: 'error',
        onboardingDraft: { projectName: 'Persistent mock project' },
        settingsDraft: { sessionNotifications: false },
        designLabOpen: true
      })
    }
  )

  it('identifies the Lab, concept, and scenario in both collapsed and expanded branches', async () => {
    const user = userEvent.setup()
    render(<LabHarness />)

    const lab = screen.getByRole('complementary', { name: 'Design Lab' })
    expect(lab).toHaveAttribute('data-open', 'false')
    expect(within(lab).getByText('Lab')).toBeVisible()
    expect(within(lab).getByLabelText('Current concept: Deck')).toHaveTextContent('Deck')
    expect(within(lab).getByLabelText('Current scenario: Default')).toHaveTextContent(
      'Default'
    )

    const trigger = within(lab).getByRole('button', { name: 'Open Design Lab' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('aria-controls')

    await user.click(trigger)

    expect(lab).toHaveAttribute('data-open', 'true')
    expect(within(lab).getByText('Lab')).toBeVisible()
    expect(within(lab).getByLabelText('Current concept: Deck')).toHaveTextContent('Deck')
    expect(within(lab).getByLabelText('Current scenario: Default')).toHaveTextContent(
      'Default'
    )
    expect(
      within(lab).getByRole('region', { name: 'Design Lab controls' })
    ).toBeVisible()
  })

  it('keeps the active concept while exposing all four scenario branches in the rail', async () => {
    const user = userEvent.setup()
    render(<LabHarness />)

    await user.click(screen.getByRole('button', { name: 'Open Design Lab' }))
    await user.click(screen.getByRole('radio', { name: 'Night Harbor' }))

    for (const scenario of ['Default', 'Loading', 'Empty', 'Error']) {
      await user.click(screen.getByRole('radio', { name: scenario }))

      expect(screen.getByLabelText(`Current scenario: ${scenario}`)).toHaveTextContent(
        scenario
      )
      expect(readState()).toMatchObject({
        concept: 'night-harbor',
        scenario: scenario.toLowerCase()
      })
    }
  })

  it('collapses on Escape, restores trigger focus, and does not trap focus', async () => {
    const user = userEvent.setup()
    render(<LabHarness />)

    await user.click(screen.getByRole('button', { name: 'Open Design Lab' }))
    const conceptChoice = screen.getByRole('radio', { name: 'Night Harbor' })
    conceptChoice.focus()

    await user.keyboard('{Escape}')

    const collapsedTrigger = screen.getByRole('button', { name: 'Open Design Lab' })
    expect(collapsedTrigger).toHaveFocus()
    expect(collapsedTrigger).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByRole('region', { name: 'Design Lab controls' })
    ).not.toBeInTheDocument()

    await user.tab()
    expect(screen.getByRole('button', { name: 'After Design Lab' })).toHaveFocus()
  })
})

describe('Design Lab assessments', () => {
  it.each(['Clarity', 'Personality', 'Density', 'Motion'])(
    'supports complete keyboard and value semantics for %s',
    async (metric) => {
      const user = userEvent.setup()
      render(<LabHarness />)

      await user.click(screen.getByRole('button', { name: 'Open Design Lab' }))
      const slider = screen.getByRole('slider', { name: metric })

      expect(slider).toHaveAttribute('aria-valuemin', '0')
      expect(slider).toHaveAttribute('aria-valuemax', '10')
      expect(slider).toHaveAttribute('aria-valuenow', '5')
      expect(slider).toHaveAttribute('aria-valuetext', `${metric}: 5 of 10`)

      slider.focus()
      await user.keyboard('{ArrowUp}')
      expect(slider).toHaveAttribute('aria-valuenow', '6')
      expect(slider).toHaveAttribute('aria-valuetext', `${metric}: 6 of 10`)

      await user.keyboard('{ArrowDown}')
      expect(slider).toHaveAttribute('aria-valuenow', '5')

      await user.keyboard('{Home}')
      expect(slider).toHaveAttribute('aria-valuenow', '0')

      await user.keyboard('{End}')
      expect(slider).toHaveAttribute('aria-valuenow', '10')
      expect(screen.getByText('10', { selector: 'output' })).toBeVisible()
    }
  )

  it('keeps ratings associated with their concept through concept and navigation changes', async () => {
    const user = userEvent.setup()
    render(<LabHarness />)

    await user.click(screen.getByRole('button', { name: 'Open Design Lab' }))

    const clarity = screen.getByRole('slider', { name: 'Clarity' })
    clarity.focus()
    await user.keyboard('{End}')

    await user.click(screen.getByRole('radio', { name: 'Night Harbor' }))
    const nightClarity = screen.getByRole('slider', { name: 'Clarity' })
    expect(nightClarity).toHaveAttribute('aria-valuenow', '5')
    nightClarity.focus()
    await user.keyboard('{Home}')

    await user.click(screen.getByRole('radio', { name: 'Command Deck' }))
    expect(screen.getByRole('slider', { name: 'Clarity' })).toHaveAttribute(
      'aria-valuenow',
      '10'
    )

    expect(readState().assessments).toMatchObject({
      'command-deck': { clarity: 10 },
      'night-harbor': { clarity: 0 }
    })

    await user.click(screen.getByRole('button', { name: 'Navigate to Settings' }))
    expect(readState()).toMatchObject({
      phase: 'shell',
      shellDestination: 'settings',
      settingsCategory: 'appearance-motion',
      assessments: {
        'command-deck': { clarity: 10 },
        'night-harbor': { clarity: 0 }
      }
    })
    expect(screen.getByRole('slider', { name: 'Clarity' })).toHaveAttribute(
      'aria-valuenow',
      '10'
    )
  })

  it('marks each proposal as an evaluation favorite without changing the active concept', async () => {
    const user = userEvent.setup()
    render(<LabHarness />)

    await user.click(screen.getByRole('button', { name: 'Open Design Lab' }))

    for (const concept of ['Command Deck', 'Night Harbor', 'Signal Poster']) {
      await user.click(screen.getByRole('radio', { name: concept }))
      const before = readState().concept
      await user.click(screen.getByRole('button', { name: `Mark ${concept}` }))

      expect(readState().concept).toBe(before)
      expect(readState().favoriteConcept).toBe(before)
      expect(
        screen.getByRole('status', { name: 'Favorite evaluation' })
      ).toHaveTextContent(`Preference: ${concept}.`)
      expect(
        screen.getByRole('button', { name: `${concept} is marked` })
      ).toHaveAttribute('aria-pressed', 'true')
    }

    await user.click(screen.getByRole('radio', { name: 'Command Deck' }))
    expect(readState()).toMatchObject({
      concept: 'command-deck',
      favoriteConcept: 'signal-poster'
    })
    expect(screen.getByText('This note does not select a product direction and resets with the demo.')).toBeVisible()
  })
})

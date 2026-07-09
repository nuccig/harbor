import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  ExperienceProvider,
  useExperience
} from '../../../src/renderer/src/app/ExperienceProvider'

function SessionProbe() {
  const [state, dispatch] = useExperience()

  return (
    <>
      <output aria-label="session state">{JSON.stringify(state)}</output>
      <button
        type="button"
        onClick={() => {
          dispatch({ type: 'goToOnboardingStep', step: 'first-project' })
          dispatch({ type: 'selectConcept', concept: 'signal-poster' })
          dispatch({ type: 'selectScenario', scenario: 'error' })
          dispatch({
            type: 'updateOnboardingDraft',
            field: 'projectName',
            value: 'Changed project'
          })
          dispatch({
            type: 'updateSetting',
            field: 'launchAtLogin',
            value: true
          })
          dispatch({
            type: 'updateAssessment',
            concept: 'signal-poster',
            metric: 'motion',
            value: 10
          })
          dispatch({ type: 'selectFavorite', concept: 'signal-poster' })
          dispatch({ type: 'setDesignLabOpen', open: true })
        }}
      >
        Change session
      </button>
    </>
  )
}

function readSession() {
  return JSON.parse(screen.getByRole('status', { name: 'session state' }).textContent ?? '{}')
}

describe('ExperienceProvider session boundary', () => {
  it('preserves changes while mounted and resets them after a fresh provider mount', () => {
    const firstMount = render(
      <ExperienceProvider>
        <SessionProbe />
      </ExperienceProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Change session' }))

    expect(readSession()).toMatchObject({
      onboardingStep: 'first-project',
      concept: 'signal-poster',
      scenario: 'error',
      onboardingDraft: { projectName: 'Changed project' },
      settingsDraft: { launchAtLogin: true },
      assessments: { 'signal-poster': { motion: 10 } },
      favoriteConcept: 'signal-poster',
      designLabOpen: true
    })

    firstMount.unmount()

    render(
      <ExperienceProvider>
        <SessionProbe />
      </ExperienceProvider>
    )

    expect(readSession()).toMatchObject({
      phase: 'onboarding',
      onboardingStep: 'welcome',
      shellDestination: 'overview',
      settingsCategory: 'general',
      concept: 'command-deck',
      scenario: 'default',
      onboardingDraft: {
        projectName: 'Harbor',
        firstProjectSkipped: false
      },
      assessments: {
        'command-deck': {},
        'night-harbor': {},
        'signal-poster': {}
      },
      favoriteConcept: null,
      designLabOpen: false
    })
  })
})

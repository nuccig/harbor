import { describe, expect, it } from 'vitest'
import {
  CONCEPT_IDS,
  RATING_METRICS,
  SCENARIO_IDS,
  createInitialExperienceState,
  experienceReducer,
  type ExperienceAction,
  type ExperienceState
} from '../../../src/renderer/src/app/experience-model'

function reduce(
  state: ExperienceState,
  ...actions: ExperienceAction[]
): ExperienceState {
  return actions.reduce(experienceReducer, state)
}

function createChangedSession(): ExperienceState {
  return reduce(
    createInitialExperienceState(),
    { type: 'goToOnboardingStep', step: 'issue-integrations' },
    {
      type: 'updateOnboardingDraft',
      field: 'selectedAgents',
      value: ['codex', 'gemini-cli']
    },
    {
      type: 'updateOnboardingDraft',
      field: 'projectName',
      value: 'Dockyard'
    },
    { type: 'goToDestination', destination: 'settings' },
    { type: 'selectSettingsCategory', category: 'notifications' },
    { type: 'selectScenario', scenario: 'error' },
    {
      type: 'updateSetting',
      field: 'sessionNotifications',
      value: false
    },
    { type: 'setDesignLabOpen', open: true },
    {
      type: 'updateAssessment',
      concept: 'command-deck',
      metric: 'clarity',
      value: 8
    },
    { type: 'selectFavorite', concept: 'night-harbor' },
    {
      type: 'showToast',
      toast: {
        title: 'Settings updated',
        message: 'The simulated notification setting was updated.',
        tone: 'success'
      }
    }
  )
}

describe('experience model initial session', () => {
  it('starts from the approved ephemeral defaults', () => {
    const state = createInitialExperienceState()

    expect(state).toMatchObject({
      phase: 'onboarding',
      onboardingStep: 'welcome',
      shellDestination: 'overview',
      settingsCategory: 'general',
      concept: 'command-deck',
      scenario: 'default',
      projectAvailability: 'populated',
      favoriteConcept: null,
      designLabOpen: false,
      toast: null
    })
    expect(state.onboardingDraft).toEqual({
      selectedAgents: ['codex'],
      agentsSkipped: false,
      issueIntegration: 'github',
      integrationsSkipped: false,
      projectName: 'Harbor',
      firstProjectSkipped: false
    })
    expect(state.assessments).toEqual({
      'command-deck': {},
      'night-harbor': {},
      'signal-poster': {}
    })
  })

  it('creates independent nested values for every new session', () => {
    const first = createInitialExperienceState()
    const second = createInitialExperienceState()

    expect(second).toEqual(first)
    expect(second).not.toBe(first)
    expect(second.onboardingDraft).not.toBe(first.onboardingDraft)
    expect(second.settingsDraft).not.toBe(first.settingsDraft)
    expect(second.assessments).not.toBe(first.assessments)
    expect(second.assessments['command-deck']).not.toBe(
      first.assessments['command-deck']
    )
  })
})

describe('concept and scenario invariants', () => {
  it.each(CONCEPT_IDS)(
    'selects %s without changing navigation, scenario, drafts, or session data',
    (concept) => {
      const state = createChangedSession()
      const next = experienceReducer(state, { type: 'selectConcept', concept })

      expect(next).toEqual({ ...state, concept })
    }
  )

  it.each(SCENARIO_IDS)(
    'selects the %s scenario without changing concept or navigation',
    (scenario) => {
      const state = reduce(createChangedSession(), {
        type: 'selectConcept',
        concept: 'signal-poster'
      })
      const next = experienceReducer(state, { type: 'selectScenario', scenario })

      expect(next).toEqual({ ...state, scenario })
    }
  )

  it('recovers the current scenario without changing the rest of the session', () => {
    const state = createChangedSession()
    const next = experienceReducer(state, { type: 'recoverScenario' })

    expect(next).toEqual({ ...state, scenario: 'default' })
  })
})

describe('session-only assessments', () => {
  it('keeps all four ratings independent for every concept while navigating', () => {
    let state = createInitialExperienceState()

    CONCEPT_IDS.forEach((concept, conceptIndex) => {
      RATING_METRICS.forEach((metric, metricIndex) => {
        state = experienceReducer(state, {
          type: 'updateAssessment',
          concept,
          metric,
          value: (conceptIndex * 4 + metricIndex) % 11
        })
      })
    })

    const assessedState = state
    state = reduce(
      state,
      { type: 'goToOnboardingStep', step: 'first-project' },
      { type: 'goToDestination', destination: 'issues' },
      { type: 'selectSettingsCategory', category: 'agents' },
      { type: 'selectConcept', concept: 'night-harbor' }
    )

    expect(state.assessments).toEqual(assessedState.assessments)
    CONCEPT_IDS.forEach((concept, conceptIndex) => {
      RATING_METRICS.forEach((metric, metricIndex) => {
        expect(state.assessments[concept][metric]).toBe(
          (conceptIndex * 4 + metricIndex) % 11
        )
      })
    })
  })

  it.each([-1, 11, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid rating %s',
    (value) => {
      const state = createInitialExperienceState()
      const next = experienceReducer(state, {
        type: 'updateAssessment',
        concept: 'command-deck',
        metric: 'clarity',
        value
      })

      expect(next).toBe(state)
      expect(next.assessments['command-deck']).toEqual({})
    }
  )

  it.each(CONCEPT_IDS)(
    'selects %s as favorite without switching the active concept',
    (concept) => {
      const state = reduce(createInitialExperienceState(), {
        type: 'selectConcept',
        concept: 'night-harbor'
      })
      const next = experienceReducer(state, { type: 'selectFavorite', concept })

      expect(next.favoriteConcept).toBe(concept)
      expect(next.concept).toBe('night-harbor')
      expect(next.assessments).toEqual(state.assessments)
    }
  )

  it('allows clearing a favorite without changing the active concept', () => {
    const state = reduce(
      createInitialExperienceState(),
      { type: 'selectConcept', concept: 'signal-poster' },
      { type: 'selectFavorite', concept: 'command-deck' }
    )

    const next = experienceReducer(state, { type: 'selectFavorite', concept: null })

    expect(next.favoriteConcept).toBeNull()
    expect(next.concept).toBe('signal-poster')
  })
})

describe('flow, drafts, and feedback invariants', () => {
  it('updates one onboarding draft field without losing the other choices', () => {
    const state = createInitialExperienceState()
    const next = experienceReducer(state, {
      type: 'updateOnboardingDraft',
      field: 'projectName',
      value: 'Northstar'
    })

    expect(next.onboardingDraft).toEqual({
      ...state.onboardingDraft,
      projectName: 'Northstar'
    })
  })

  it.each([
    ['installed-agents', 'agentsSkipped'],
    ['issue-integrations', 'integrationsSkipped'],
    ['first-project', 'firstProjectSkipped']
  ] as const)('skips only %s and preserves every other draft value', (step, flag) => {
    const state = reduce(
      createInitialExperienceState(),
      {
        type: 'updateOnboardingDraft',
        field: 'selectedAgents',
        value: ['claude-code']
      },
      {
        type: 'updateOnboardingDraft',
        field: 'projectName',
        value: 'Northstar'
      }
    )
    const next = experienceReducer(state, { type: 'skipOnboardingStep', step })

    expect(next.onboardingDraft).toEqual({
      ...state.onboardingDraft,
      [flag]: true
    })
  })

  it('completes populated onboarding in Overview without changing assessments', () => {
    const state = reduce(createInitialExperienceState(), {
      type: 'updateAssessment',
      concept: 'command-deck',
      metric: 'density',
      value: 7
    })
    const next = experienceReducer(state, { type: 'completeOnboarding' })

    expect(next).toMatchObject({
      phase: 'shell',
      shellDestination: 'overview',
      projectAvailability: 'populated'
    })
    expect(next.assessments).toEqual(state.assessments)
  })

  it('completes a skipped first project in the useful empty mode', () => {
    const state = reduce(createInitialExperienceState(), {
      type: 'skipOnboardingStep',
      step: 'first-project'
    })
    const next = experienceReducer(state, { type: 'completeOnboarding' })

    expect(next).toMatchObject({
      phase: 'shell',
      shellDestination: 'overview',
      projectAvailability: 'empty'
    })
  })

  it('updates one setting and opens the removable Design Lab without persistence', () => {
    const state = createInitialExperienceState()
    const next = reduce(
      state,
      {
        type: 'updateSetting',
        field: 'defaultAgent',
        value: 'gemini-cli'
      },
      { type: 'setDesignLabOpen', open: true }
    )

    expect(next.settingsDraft).toEqual({
      ...state.settingsDraft,
      defaultAgent: 'gemini-cli'
    })
    expect(next.designLabOpen).toBe(true)
  })

  it('shows and dismisses a named toast without changing navigation', () => {
    const state = createChangedSession()
    const dismissed = experienceReducer(state, { type: 'dismissToast' })

    expect(state.toast).toEqual({
      title: 'Settings updated',
      message: 'The simulated notification setting was updated.',
      tone: 'success'
    })
    expect(dismissed).toEqual({ ...state, toast: null })
  })
})

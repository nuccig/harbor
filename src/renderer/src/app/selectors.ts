import {
  ONBOARDING_STEPS,
  type ExperienceState,
  type OnboardingDraft,
  type SettingsDraft
} from './experience-model'
import {
  mockCatalog,
  type ScenarioSlice,
  type SharedAction
} from './mock-catalog'

interface ScenarioCopy {
  loadingLabel: string
  emptyTitle: string
  emptyGuidance: string
  emptyAction?: SharedAction
  errorTitle: string
  errorCause: string
}

function selectScenarioSlice<T>(
  state: ExperienceState,
  data: T,
  copy: ScenarioCopy
): ScenarioSlice<T> {
  switch (state.scenario) {
    case 'default':
      return { status: 'ready', data }
    case 'loading':
      return { status: 'loading', label: copy.loadingLabel }
    case 'empty':
      return {
        status: 'empty',
        title: copy.emptyTitle,
        guidance: copy.emptyGuidance,
        ...(copy.emptyAction === undefined ? {} : { action: copy.emptyAction })
      }
    case 'error':
      return {
        status: 'error',
        title: copy.errorTitle,
        cause: copy.errorCause,
        recovery: { id: 'recover-scenario', label: 'Try again' }
      }
  }
}

export interface OnboardingViewModel {
  step: ExperienceState['onboardingStep']
  stepNumber: number
  totalSteps: number
  label: string
  description: string
  draft: OnboardingDraft
  content: ScenarioSlice<{ label: string; description: string }>
}

export function selectOnboardingView(state: ExperienceState): OnboardingViewModel {
  const content = mockCatalog.labels.onboarding[state.onboardingStep]
  const stepNumber = ONBOARDING_STEPS.indexOf(state.onboardingStep) + 1

  return {
    step: state.onboardingStep,
    stepNumber,
    totalSteps: ONBOARDING_STEPS.length,
    label: content.label,
    description: content.description,
    draft: state.onboardingDraft,
    content: selectScenarioSlice(state, content, {
      loadingLabel: `Loading ${content.label.toLowerCase()}…`,
      emptyTitle: `No ${content.label.toLowerCase()} data yet`,
      emptyGuidance: 'You can continue now and complete this setup later.',
      errorTitle: `${content.label} could not be loaded`,
      errorCause: 'The simulation returned an expected error state.'
    })
  }
}

const overviewCopy = {
  currentProject: {
    loadingLabel: 'Loading current project…',
    emptyTitle: 'No project yet',
    emptyGuidance: 'Add a project when you are ready to start a workspace.',
    emptyAction: { id: 'add-project', label: 'Add project' } as const,
    errorTitle: 'Current project could not be loaded',
    errorCause: 'The simulated project source is unavailable.'
  },
  sessions: {
    loadingLabel: 'Loading active agent sessions…',
    emptyTitle: 'No active sessions',
    emptyGuidance: 'Start an agent session from a project when you are ready.',
    emptyAction: { id: 'configure-agent', label: 'Configure agents' } as const,
    errorTitle: 'Agent sessions could not be loaded',
    errorCause: 'The simulated session source is unavailable.'
  },
  issues: {
    loadingLabel: 'Loading issue queue…',
    emptyTitle: 'Issue queue is clear',
    emptyGuidance: 'Connect an issue source to build a queue.',
    emptyAction: { id: 'connect-integration', label: 'Connect integration' } as const,
    errorTitle: 'Issue queue could not be loaded',
    errorCause: 'The simulated issue source is unavailable.'
  },
  usage: {
    loadingLabel: 'Loading recent usage…',
    emptyTitle: 'No usage recorded',
    emptyGuidance: 'Usage appears after simulated agent sessions run.',
    errorTitle: 'Recent usage could not be loaded',
    errorCause: 'The simulated usage summary is unavailable.'
  },
  activity: {
    loadingLabel: 'Loading activity…',
    emptyTitle: 'No recent activity',
    emptyGuidance: 'Workspace events will appear here.',
    errorTitle: 'Activity could not be loaded',
    errorCause: 'The simulated activity feed is unavailable.'
  }
} satisfies Record<string, ScenarioCopy>

export interface OverviewViewModel {
  currentProject: ScenarioSlice<typeof mockCatalog.currentProject>
  sessions: ScenarioSlice<typeof mockCatalog.sessions>
  issueQueue: ScenarioSlice<typeof mockCatalog.issueQueue>
  recentUsage: ScenarioSlice<typeof mockCatalog.recentUsage>
  activity: ScenarioSlice<typeof mockCatalog.activity>
}

export function selectOverviewView(state: ExperienceState): OverviewViewModel {
  const currentProject =
    state.scenario === 'default' && state.projectAvailability === 'empty'
      ? {
          status: 'empty' as const,
          title: overviewCopy.currentProject.emptyTitle,
          guidance: overviewCopy.currentProject.emptyGuidance,
          action: overviewCopy.currentProject.emptyAction
        }
      : selectScenarioSlice(state, mockCatalog.currentProject, overviewCopy.currentProject)

  return {
    currentProject,
    sessions: selectScenarioSlice(state, mockCatalog.sessions, overviewCopy.sessions),
    issueQueue: selectScenarioSlice(state, mockCatalog.issueQueue, overviewCopy.issues),
    recentUsage: selectScenarioSlice(state, mockCatalog.recentUsage, overviewCopy.usage),
    activity: selectScenarioSlice(state, mockCatalog.activity, overviewCopy.activity)
  }
}

export interface ShellViewModel {
  destination: ExperienceState['shellDestination']
  destinationLabel: string
  overview: OverviewViewModel
}

export function selectShellView(state: ExperienceState): ShellViewModel {
  return {
    destination: state.shellDestination,
    destinationLabel: mockCatalog.labels.destinations[state.shellDestination],
    overview: selectOverviewView(state)
  }
}

export interface SettingsViewModel {
  category: ExperienceState['settingsCategory']
  categoryLabel: string
  draft: SettingsDraft
  content: ScenarioSlice<SettingsDraft>
}

export function selectSettingsView(state: ExperienceState): SettingsViewModel {
  const categoryLabel = mockCatalog.labels.settingsCategories[state.settingsCategory]

  return {
    category: state.settingsCategory,
    categoryLabel,
    draft: state.settingsDraft,
    content: selectScenarioSlice(state, state.settingsDraft, {
      loadingLabel: `Loading ${categoryLabel.toLowerCase()} settings…`,
      emptyTitle: `No ${categoryLabel.toLowerCase()} settings`,
      emptyGuidance: 'Default values are available until you choose an option.',
      errorTitle: `${categoryLabel} settings could not be loaded`,
      errorCause: 'The simulated settings source is unavailable.'
    })
  }
}

export function selectActiveAssessment(state: ExperienceState) {
  return state.assessments[state.concept]
}

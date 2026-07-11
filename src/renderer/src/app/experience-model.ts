export const CONCEPT_IDS = ['command-deck', 'night-harbor', 'signal-poster'] as const
export const SCENARIO_IDS = ['default', 'loading', 'empty', 'error'] as const
export const ONBOARDING_STEPS = [
  'welcome',
  'installed-agents',
  'issue-integrations',
  'first-project'
] as const
export const SHELL_DESTINATIONS = [
  'overview',
  'projects',
  'sessions',
  'issues',
  'settings'
] as const
export const SETTINGS_CATEGORIES = [
  'general',
  'appearance-motion',
  'agents',
  'integrations',
  'notifications'
] as const
export const RATING_METRICS = ['clarity', 'personality', 'density', 'motion'] as const
export const CODING_AGENT_IDS = ['codex', 'claude-code', 'gemini-cli'] as const
export const ISSUE_INTEGRATION_IDS = ['github', 'linear'] as const

export type ConceptId = (typeof CONCEPT_IDS)[number]
export type ScenarioId = (typeof SCENARIO_IDS)[number]
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]
export type ShellDestination = (typeof SHELL_DESTINATIONS)[number]
export type SettingsCategory = (typeof SETTINGS_CATEGORIES)[number]
export type RatingMetric = (typeof RATING_METRICS)[number]
export type CodingAgentId = (typeof CODING_AGENT_IDS)[number]
export type IssueIntegrationId = (typeof ISSUE_INTEGRATION_IDS)[number]
export type RatingValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface OnboardingDraft {
  selectedAgents: readonly CodingAgentId[]
  agentsSkipped: boolean
  issueIntegration: IssueIntegrationId | null
  integrationsSkipped: boolean
  projectName: string
  firstProjectSkipped: boolean
}

export interface SettingsDraft {
  launchAtLogin: boolean
  reduceMotion: boolean
  sessionNotifications: boolean
  issueNotifications: boolean
  defaultAgent: CodingAgentId
}

export interface ToastMessage {
  title: string
  message: string
  tone: 'success' | 'info'
}

export type ConceptAssessment = Partial<Record<RatingMetric, RatingValue>>
export type Assessments = Record<ConceptId, ConceptAssessment>

export interface ExperienceState {
  phase: 'onboarding' | 'shell'
  onboardingStep: OnboardingStep
  shellDestination: ShellDestination
  settingsCategory: SettingsCategory
  concept: ConceptId
  scenario: ScenarioId
  onboardingDraft: OnboardingDraft
  settingsDraft: SettingsDraft
  projectAvailability: 'populated' | 'empty'
  assessments: Assessments
  favoriteConcept: ConceptId | null
  designLabOpen: boolean
  toast: ToastMessage | null
  pausedSessionIds: readonly string[]
}

type UpdateOnboardingDraftAction = {
  [Field in keyof OnboardingDraft]: {
    type: 'updateOnboardingDraft'
    field: Field
    value: OnboardingDraft[Field]
  }
}[keyof OnboardingDraft]

type UpdateSettingAction = {
  [Field in keyof SettingsDraft]: {
    type: 'updateSetting'
    field: Field
    value: SettingsDraft[Field]
  }
}[keyof SettingsDraft]

export type ExperienceAction =
  | { type: 'goToOnboardingStep'; step: OnboardingStep }
  | UpdateOnboardingDraftAction
  | {
      type: 'skipOnboardingStep'
      step: 'installed-agents' | 'issue-integrations' | 'first-project'
    }
  | { type: 'completeOnboarding' }
  | { type: 'goToDestination'; destination: ShellDestination }
  | { type: 'selectSettingsCategory'; category: SettingsCategory }
  | { type: 'selectConcept'; concept: ConceptId }
  | { type: 'selectScenario'; scenario: ScenarioId }
  | {
      type: 'updateAssessment'
      concept: ConceptId
      metric: RatingMetric
      value: number
    }
  | { type: 'selectFavorite'; concept: ConceptId | null }
  | UpdateSettingAction
  | { type: 'setDesignLabOpen'; open: boolean }
  | { type: 'showToast'; toast: ToastMessage }
  | { type: 'dismissToast' }
  | { type: 'recoverScenario' }
  | { type: 'toggleSessionPaused'; sessionId: string }

function createInitialOnboardingDraft(): OnboardingDraft {
  return {
    selectedAgents: ['codex'],
    agentsSkipped: false,
    issueIntegration: 'github',
    integrationsSkipped: false,
    projectName: 'Harbor',
    firstProjectSkipped: false
  }
}

function createInitialSettingsDraft(): SettingsDraft {
  return {
    launchAtLogin: false,
    reduceMotion: false,
    sessionNotifications: true,
    issueNotifications: true,
    defaultAgent: 'codex'
  }
}

function createEmptyAssessments(): Assessments {
  return {
    'command-deck': {},
    'night-harbor': {},
    'signal-poster': {}
  }
}

export function createInitialExperienceState(): ExperienceState {
  return {
    phase: 'onboarding',
    onboardingStep: 'welcome',
    shellDestination: 'overview',
    settingsCategory: 'general',
    concept: 'command-deck',
    scenario: 'default',
    onboardingDraft: createInitialOnboardingDraft(),
    settingsDraft: createInitialSettingsDraft(),
    projectAvailability: 'populated',
    assessments: createEmptyAssessments(),
    favoriteConcept: null,
    designLabOpen: false,
    toast: null,
    pausedSessionIds: []
  }
}

export function isRatingValue(value: number): value is RatingValue {
  return Number.isInteger(value) && value >= 0 && value <= 10
}

export function experienceReducer(
  state: ExperienceState,
  action: ExperienceAction
): ExperienceState {
  switch (action.type) {
    case 'goToOnboardingStep':
      return { ...state, onboardingStep: action.step }
    case 'updateOnboardingDraft':
      return {
        ...state,
        onboardingDraft: {
          ...state.onboardingDraft,
          [action.field]: action.value
        }
      }
    case 'skipOnboardingStep':
      if (action.step === 'installed-agents') {
        return {
          ...state,
          onboardingDraft: { ...state.onboardingDraft, agentsSkipped: true }
        }
      }
      if (action.step === 'issue-integrations') {
        return {
          ...state,
          onboardingDraft: { ...state.onboardingDraft, integrationsSkipped: true }
        }
      }
      return {
        ...state,
        onboardingDraft: { ...state.onboardingDraft, firstProjectSkipped: true }
      }
    case 'completeOnboarding':
      return {
        ...state,
        phase: 'shell',
        shellDestination: 'overview',
        projectAvailability: state.onboardingDraft.firstProjectSkipped ? 'empty' : 'populated'
      }
    case 'goToDestination':
      return { ...state, phase: 'shell', shellDestination: action.destination }
    case 'selectSettingsCategory':
      return { ...state, settingsCategory: action.category }
    case 'selectConcept':
      return { ...state, concept: action.concept }
    case 'selectScenario':
      return { ...state, scenario: action.scenario }
    case 'updateAssessment':
      if (!isRatingValue(action.value)) {
        return state
      }
      return {
        ...state,
        assessments: {
          ...state.assessments,
          [action.concept]: {
            ...state.assessments[action.concept],
            [action.metric]: action.value
          }
        }
      }
    case 'selectFavorite':
      return { ...state, favoriteConcept: action.concept }
    case 'updateSetting':
      return {
        ...state,
        settingsDraft: {
          ...state.settingsDraft,
          [action.field]: action.value
        }
      }
    case 'setDesignLabOpen':
      return { ...state, designLabOpen: action.open }
    case 'showToast':
      return { ...state, toast: action.toast }
    case 'dismissToast':
      return { ...state, toast: null }
    case 'recoverScenario':
      return { ...state, scenario: 'default' }
    case 'toggleSessionPaused': {
      const isPaused = state.pausedSessionIds.includes(action.sessionId)
      return {
        ...state,
        pausedSessionIds: isPaused
          ? state.pausedSessionIds.filter((id) => id !== action.sessionId)
          : [...state.pausedSessionIds, action.sessionId]
      }
    }
  }
}

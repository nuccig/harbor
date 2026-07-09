import type {
  ConceptId,
  OnboardingStep,
  RatingMetric,
  ScenarioId,
  SettingsCategory,
  ShellDestination
} from './experience-model'

export type SharedActionId =
  | 'recover-scenario'
  | 'add-project'
  | 'configure-agent'
  | 'connect-integration'

export interface SharedAction {
  id: SharedActionId
  label: string
}

export type ScenarioSlice<T> =
  | { status: 'ready'; data: T }
  | { status: 'loading'; label: string }
  | { status: 'empty'; title: string; guidance: string; action?: SharedAction }
  | { status: 'error'; title: string; cause: string; recovery: SharedAction }

function freezeItems<T extends object>(items: T[]): readonly Readonly<T>[] {
  return Object.freeze(items.map((item) => Object.freeze(item)))
}

const concepts: Readonly<Record<ConceptId, { label: string; shortLabel: string }>> =
  Object.freeze({
    'command-deck': Object.freeze({ label: 'Command Deck', shortLabel: 'Deck' }),
    'night-harbor': Object.freeze({ label: 'Night Harbor', shortLabel: 'Night' }),
    'signal-poster': Object.freeze({ label: 'Signal Poster', shortLabel: 'Signal' })
  })

const scenarios: Readonly<Record<ScenarioId, string>> = Object.freeze({
  default: 'Default',
  loading: 'Loading',
  empty: 'Empty',
  error: 'Error'
})

const onboarding: Readonly<
  Record<OnboardingStep, { label: string; description: string }>
> = Object.freeze({
  welcome: Object.freeze({
    label: 'Welcome',
    description: 'Set up a focused command center for your coding agents.'
  }),
  'installed-agents': Object.freeze({
    label: 'Installed agents',
    description: 'Choose the agents to include in this simulated workspace.'
  }),
  'issue-integrations': Object.freeze({
    label: 'Issue integrations',
    description: 'Choose a simulated issue source, or finish this later.'
  }),
  'first-project': Object.freeze({
    label: 'First project',
    description: 'Name the first simulated project shown in Harbor.'
  })
})

const destinations: Readonly<Record<ShellDestination, string>> = Object.freeze({
  overview: 'Overview',
  projects: 'Projects',
  sessions: 'Sessions',
  issues: 'Issues',
  settings: 'Settings'
})

const settingsCategories: Readonly<Record<SettingsCategory, string>> = Object.freeze({
  general: 'General',
  'appearance-motion': 'Appearance & motion',
  agents: 'Agents',
  integrations: 'Integrations',
  notifications: 'Notifications'
})

const ratingMetrics: Readonly<Record<RatingMetric, string>> = Object.freeze({
  clarity: 'Clarity',
  personality: 'Personality',
  density: 'Density',
  motion: 'Motion'
})

export const mockCatalog = Object.freeze({
  labels: Object.freeze({
    concepts,
    scenarios,
    onboarding,
    destinations,
    settingsCategories,
    ratingMetrics
  }),
  currentProject: Object.freeze({
    id: 'harbor',
    name: 'Harbor',
    branch: 'codex/issue-29-configuracoes-onboarding-ui',
    status: 'Active'
  }),
  sessions: freezeItems([
    { id: 'session-104', agent: 'Codex', task: 'Settings shell', status: 'Running' },
    { id: 'session-103', agent: 'Claude Code', task: 'Onboarding copy', status: 'Ready' },
    { id: 'session-102', agent: 'Gemini CLI', task: 'UI references', status: 'Complete' }
  ]),
  issueQueue: freezeItems([
    { id: '#29', title: 'Settings, onboarding, and UI concepts', priority: 'High' },
    { id: '#31', title: 'Session history', priority: 'Medium' },
    { id: '#34', title: 'Project health indicators', priority: 'Low' }
  ]),
  recentUsage: freezeItems([
    { label: 'Agent time', value: '3h 42m' },
    { label: 'Sessions', value: '18' },
    { label: 'Issues touched', value: '7' }
  ]),
  activity: freezeItems([
    { id: 'activity-1', label: 'Issue #29 moved to implementation', time: '2 min ago' },
    { id: 'activity-2', label: 'Codex session completed', time: '18 min ago' },
    { id: 'activity-3', label: 'Harbor workspace opened', time: '1 hr ago' }
  ]),
  agents: freezeItems([
    { id: 'codex', label: 'Codex', status: 'Available' },
    { id: 'claude-code', label: 'Claude Code', status: 'Available' },
    { id: 'gemini-cli', label: 'Gemini CLI', status: 'Available' }
  ]),
  integrations: freezeItems([
    { id: 'github', label: 'GitHub Issues', status: 'Simulated' },
    { id: 'linear', label: 'Linear', status: 'Not configured' }
  ])
})

export type MockCatalog = typeof mockCatalog

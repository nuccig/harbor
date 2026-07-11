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

export interface SessionLogLine {
  time: string
  text: string
}

export type ScenarioSlice<T> =
  | { status: 'ready'; data: T }
  | { status: 'loading'; label: string }
  | { status: 'empty'; title: string; guidance: string; action?: SharedAction }
  | { status: 'error'; title: string; cause: string; recovery: SharedAction }

function freezeItems<T extends object>(items: T[]): readonly Readonly<T>[] {
  return Object.freeze(items.map((item) => Object.freeze(item)))
}

function freezeArray<T>(items: T[]): readonly T[] {
  return Object.freeze([...items])
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
  ]),
  kpis: Object.freeze({
    successRate: 92,
    series: Object.freeze({
      'active-agents': freezeArray([1, 2, 2, 1, 2, 3, 2, 1, 2, 1]),
      queue: freezeArray([2, 3, 4, 3, 2, 3, 4, 3, 2, 3]),
      'success-rate': freezeArray([88, 90, 89, 91, 93, 90, 94, 92, 95, 92]),
      'agent-time': freezeArray([2.6, 2.8, 3.0, 3.1, 2.9, 3.3, 3.5, 3.4, 3.6, 3.42])
    })
  }),
  sessionLogs: Object.freeze<Readonly<Record<string, readonly SessionLogLine[]>>>({
    'session-104': freezeItems([
      { time: '09:41:02', text: 'Session started · task "Settings shell" assigned to Codex' },
      { time: '09:41:05', text: 'Reading src/renderer/src/settings/Settings.tsx' },
      { time: '09:41:11', text: 'Planning edit: extract settings category list' },
      { time: '09:42:03', text: 'Applied patch to Settings.tsx (+42 −11)' },
      { time: '09:42:27', text: 'Running lint · 0 errors' },
      { time: '09:43:14', text: 'Running typecheck · 0 errors' },
      { time: '09:44:39', text: 'Running test suite · 42 passed' },
      { time: '09:45:20', text: 'Awaiting next instruction' }
    ]),
    'session-103': freezeItems([
      { time: '09:12:44', text: 'Session started · task "Onboarding copy" assigned to Claude Code' },
      { time: '09:12:50', text: 'Reading src/renderer/src/onboarding/OnboardingFlow.tsx' },
      { time: '09:13:31', text: 'Drafting revised welcome step copy' },
      { time: '09:15:08', text: 'Applied patch to onboarding copy strings (+9 −9)' },
      { time: '09:15:41', text: 'Running verify gate · all checks green' },
      { time: '09:16:22', text: 'Draft ready for operator review' },
      { time: '09:16:23', text: 'Session idle · waiting for review' }
    ]),
    'session-102': freezeItems([
      { time: '08:03:17', text: 'Session started · task "UI references" assigned to Gemini CLI' },
      { time: '08:03:29', text: 'Collecting UI reference material' },
      { time: '08:05:02', text: 'Summarizing 6 reference layouts' },
      { time: '08:07:46', text: 'Writing notes to docs/ui-references.md' },
      { time: '08:09:12', text: 'Cross-checking references against concept tokens' },
      { time: '08:11:05', text: 'Applied patch to docs/ui-references.md (+120 −0)' },
      { time: '08:12:33', text: 'Running verify gate · all checks green' },
      { time: '08:13:00', text: 'Summary posted to activity feed' },
      { time: '08:13:01', text: 'Session complete' }
    ])
  })
})

export type MockCatalog = typeof mockCatalog

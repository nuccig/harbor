import { describe, expect, it } from 'vitest'
import {
  createInitialExperienceState,
  experienceReducer,
  type ExperienceState,
  type ScenarioId
} from '../../../src/renderer/src/app/experience-model'
import { mockCatalog } from '../../../src/renderer/src/app/mock-catalog'
import {
  isSessionActive,
  resolveAgentTime,
  selectActiveAssessment,
  selectOnboardingView,
  selectOverviewView,
  selectSessionViews,
  selectSettingsView,
  selectShellView,
  sessionActionLabels
} from '../../../src/renderer/src/app/selectors'

function withScenario(state: ExperienceState, scenario: ScenarioId) {
  return experienceReducer(state, { type: 'selectScenario', scenario })
}

describe('immutable English catalog', () => {
  it('freezes the catalog, labels, fixtures, and fixture items', () => {
    expect(Object.isFrozen(mockCatalog)).toBe(true)
    expect(Object.isFrozen(mockCatalog.labels)).toBe(true)
    expect(Object.isFrozen(mockCatalog.labels.concepts)).toBe(true)
    expect(Object.isFrozen(mockCatalog.sessions)).toBe(true)
    expect(Object.isFrozen(mockCatalog.sessions[0])).toBe(true)
  })

  it('provides approved labels for every concept, scenario, and surface', () => {
    expect(Object.values(mockCatalog.labels.concepts).map(({ label }) => label)).toEqual([
      'Command Deck',
      'Night Harbor',
      'Signal Poster'
    ])
    expect(Object.values(mockCatalog.labels.scenarios)).toEqual([
      'Default',
      'Loading',
      'Empty',
      'Error'
    ])
    expect(Object.values(mockCatalog.labels.onboarding).map(({ label }) => label)).toEqual([
      'Welcome',
      'Installed agents',
      'Issue integrations',
      'First project'
    ])
  })
})

describe('scenario selectors', () => {
  it.each([
    ['default', 'ready'],
    ['loading', 'loading'],
    ['empty', 'empty'],
    ['error', 'error']
  ] as const)('maps %s to a %s slice across the Overview groups', (scenario, status) => {
    const state = withScenario(createInitialExperienceState(), scenario)
    const view = selectOverviewView(state)

    expect(view.currentProject.status).toBe(status)
    expect(view.sessions.status).toBe(status)
    expect(view.issueQueue.status).toBe(status)
    expect(view.recentUsage.status).toBe(status)
    expect(view.activity.status).toBe(status)
    expect(view.kpis.status).toBe(status)
    expect(state.concept).toBe('command-deck')
    expect(state.onboardingStep).toBe('welcome')
  })

  it('uses deterministic loading copy without timers or network state', () => {
    const state = withScenario(createInitialExperienceState(), 'loading')
    const view = selectOverviewView(state)

    expect(view.sessions).toEqual({
      status: 'loading',
      label: 'Loading active agent sessions…'
    })
  })

  it('provides guidance and a pertinent action for an empty slice', () => {
    const state = withScenario(createInitialExperienceState(), 'empty')
    const view = selectOverviewView(state)

    expect(view.currentProject).toEqual({
      status: 'empty',
      title: 'No project yet',
      guidance: 'Add a project when you are ready to start a workspace.',
      action: { id: 'add-project', label: 'Add project' }
    })
  })

  it('provides a named cause and shared recovery for an error slice', () => {
    const state = withScenario(createInitialExperienceState(), 'error')
    const view = selectOverviewView(state)

    expect(view.issueQueue).toEqual({
      status: 'error',
      title: 'Issue queue could not be loaded',
      cause: 'The simulated issue source is unavailable.',
      recovery: { id: 'recover-scenario', label: 'Try again' }
    })
  })

  it('uses deterministic loading copy for the KPI slice', () => {
    const state = withScenario(createInitialExperienceState(), 'loading')
    const view = selectOverviewView(state)

    expect(view.kpis).toEqual({
      status: 'loading',
      label: 'Loading key metrics…'
    })
  })

  it('provides guidance without an action for an empty KPI slice', () => {
    const state = withScenario(createInitialExperienceState(), 'empty')
    const view = selectOverviewView(state)

    expect(view.kpis).toEqual({
      status: 'empty',
      title: 'No metrics yet',
      guidance: 'Metrics appear after simulated agent sessions run.'
    })
    expect(view.kpis).not.toHaveProperty('action')
  })

  it('provides a named cause and shared recovery for an error KPI slice', () => {
    const state = withScenario(createInitialExperienceState(), 'error')
    const view = selectOverviewView(state)

    expect(view.kpis).toEqual({
      status: 'error',
      title: 'Key metrics could not be loaded',
      cause: 'The simulated metrics source is unavailable.',
      recovery: { id: 'recover-scenario', label: 'Try again' }
    })
  })

  it('returns a useful project-empty slice after skipping the first project', () => {
    const skipped = experienceReducer(createInitialExperienceState(), {
      type: 'skipOnboardingStep',
      step: 'first-project'
    })
    const completed = experienceReducer(skipped, { type: 'completeOnboarding' })
    const view = selectOverviewView(completed)

    expect(view.currentProject.status).toBe('empty')
    expect(view.sessions.status).toBe('ready')
  })
})

describe('KPI view models', () => {
  it('derives exactly 4 KPIs in the fixed order, from existing data plus the new success-rate field', () => {
    const view = selectOverviewView(createInitialExperienceState())

    if (view.kpis.status !== 'ready') {
      throw new Error('expected the default-scenario kpis slice to be ready')
    }
    const kpis = view.kpis.data

    expect(kpis.map((kpi) => kpi.id)).toEqual([
      'active-agents',
      'queue',
      'success-rate',
      'agent-time'
    ])

    const activeAgents = mockCatalog.sessions.filter((s) => s.status === 'Running').length
    const queued = mockCatalog.issueQueue.length
    const agentTime = mockCatalog.recentUsage.find((u) => u.label === 'Agent time')?.value

    expect(kpis.find((kpi) => kpi.id === 'active-agents')?.value).toBe(String(activeAgents))
    expect(kpis.find((kpi) => kpi.id === 'queue')?.value).toBe(String(queued))
    expect(kpis.find((kpi) => kpi.id === 'agent-time')?.value).toBe(agentTime)
    expect(kpis.find((kpi) => kpi.id === 'success-rate')?.value).toBe(
      `${mockCatalog.kpis.successRate}%`
    )
  })

  it('sizes every KPI series from the fixture, never a hardcoded point count', () => {
    for (const series of Object.values(mockCatalog.kpis.series)) {
      expect(series.length).toBeGreaterThanOrEqual(8)
      expect(series.length).toBeLessThanOrEqual(12)
    }
  })

  it('leaves mockCatalog.recentUsage unchanged by this feature (AC-017)', () => {
    expect(mockCatalog.recentUsage).toEqual([
      { label: 'Agent time', value: '3h 42m' },
      { label: 'Sessions', value: '18' },
      { label: 'Issues touched', value: '7' }
    ])

    const view = selectOverviewView(createInitialExperienceState())
    expect(view.recentUsage.status).toBe('ready')
  })

  it('falls back to an em dash when recentUsage has no Agent time entry', () => {
    const recentUsageWithoutAgentTime = mockCatalog.recentUsage.filter(
      (usage) => usage.label !== 'Agent time'
    )

    expect(resolveAgentTime(recentUsageWithoutAgentTime)).toBe('—')
    expect(resolveAgentTime(mockCatalog.recentUsage)).toBe(
      mockCatalog.recentUsage.find((usage) => usage.label === 'Agent time')?.value
    )
  })
})

describe('surface view models', () => {
  it('selects onboarding position and preserves its draft reference', () => {
    const state = experienceReducer(createInitialExperienceState(), {
      type: 'goToOnboardingStep',
      step: 'issue-integrations'
    })
    const view = selectOnboardingView(state)

    expect(view).toMatchObject({
      step: 'issue-integrations',
      stepNumber: 3,
      totalSteps: 4,
      label: 'Issue integrations'
    })
    expect(view.draft).toBe(state.onboardingDraft)
  })

  it('selects the active shell destination and the shared Overview model', () => {
    const state = experienceReducer(createInitialExperienceState(), {
      type: 'goToDestination',
      destination: 'sessions'
    })
    const view = selectShellView(state)

    expect(view.destination).toBe('sessions')
    expect(view.destinationLabel).toBe('Sessions')
    expect(view.overview.sessions.status).toBe('ready')
  })

  it('selects the active settings category, draft, and scenario', () => {
    let state = experienceReducer(createInitialExperienceState(), {
      type: 'selectSettingsCategory',
      category: 'appearance-motion'
    })
    state = withScenario(state, 'error')
    const view = selectSettingsView(state)

    expect(view.categoryLabel).toBe('Appearance & motion')
    expect(view.draft).toBe(state.settingsDraft)
    expect(view.content).toMatchObject({
      status: 'error',
      title: 'Appearance & motion settings could not be loaded'
    })
  })

  it('selects ratings only for the currently evaluated concept', () => {
    let state = experienceReducer(createInitialExperienceState(), {
      type: 'updateAssessment',
      concept: 'command-deck',
      metric: 'personality',
      value: 6
    })
    state = experienceReducer(state, {
      type: 'updateAssessment',
      concept: 'night-harbor',
      metric: 'personality',
      value: 9
    })

    expect(selectActiveAssessment(state)).toEqual({ personality: 6 })

    state = experienceReducer(state, {
      type: 'selectConcept',
      concept: 'night-harbor'
    })
    expect(selectActiveAssessment(state)).toEqual({ personality: 9 })
  })
})

describe('session view models', () => {
  it('resolves the default (no toggles) merge equivalent to the seed for every session', () => {
    const views = selectSessionViews(createInitialExperienceState())

    expect(views).toHaveLength(mockCatalog.sessions.length)

    mockCatalog.sessions.forEach((session, index) => {
      const view = views[index]
      const labels = sessionActionLabels(session)
      const expectedTone = isSessionActive(session.status)
        ? 'success'
        : session.status === 'Ready'
          ? 'warning'
          : 'neutral'

      expect(view.id).toBe(session.id)
      expect(view.agent).toBe(session.agent)
      expect(view.task).toBe(session.task)
      expect(view.status).toBe(session.status)
      expect(view.paused).toBe(false)
      expect(view.statusTone).toBe(expectedTone)
      expect(view.canTogglePause).toBe(isSessionActive(session.status))
      expect(view.togglePauseLabel).toBe(labels.pause)
      expect(view.logLabel).toBe(labels.log)
    })
  })

  it('pausing the seed Running session flips status, tone, and label to Paused/resume', () => {
    const runningSession = mockCatalog.sessions.find((s) => s.status === 'Running')
    if (!runningSession) {
      throw new Error('expected a Running session in the fixture')
    }

    const state = experienceReducer(createInitialExperienceState(), {
      type: 'toggleSessionPaused',
      sessionId: runningSession.id
    })
    const view = selectSessionViews(state).find((v) => v.id === runningSession.id)
    if (!view) {
      throw new Error('expected a view model for the paused session')
    }

    expect(view.status).toBe('Paused')
    expect(view.statusTone).toBe('warning')
    expect(view.paused).toBe(true)
    expect(view.canTogglePause).toBe(true)
    expect(view.togglePauseLabel).toBe(sessionActionLabels(runningSession).resume)
  })

  it('never repaints a Ready/Complete session as Paused for a spurious toggled id', () => {
    const nonActiveSession = mockCatalog.sessions.find(
      (s) => s.status === 'Ready' || s.status === 'Complete'
    )
    if (!nonActiveSession) {
      throw new Error('expected a Ready or Complete session in the fixture')
    }

    const state = experienceReducer(createInitialExperienceState(), {
      type: 'toggleSessionPaused',
      sessionId: nonActiveSession.id
    })
    expect(state.pausedSessionIds).toContain(nonActiveSession.id)

    const view = selectSessionViews(state).find((v) => v.id === nonActiveSession.id)
    if (!view) {
      throw new Error('expected a view model for the toggled session')
    }

    expect(view.status).toBe(nonActiveSession.status)
    expect(view.paused).toBe(false)
  })

  it('recomputes the active-agents KPI after a Running session is paused', () => {
    const runningSession = mockCatalog.sessions.find((s) => s.status === 'Running')
    if (!runningSession) {
      throw new Error('expected a Running session in the fixture')
    }
    const runningCountBeforePause = mockCatalog.sessions.filter(
      (s) => s.status === 'Running'
    ).length

    const state = experienceReducer(createInitialExperienceState(), {
      type: 'toggleSessionPaused',
      sessionId: runningSession.id
    })
    const view = selectOverviewView(state)
    if (view.kpis.status !== 'ready') {
      throw new Error('expected the default-scenario kpis slice to be ready')
    }

    const activeAgentsKpi = view.kpis.data.find((kpi) => kpi.id === 'active-agents')
    expect(activeAgentsKpi?.value).toBe(String(runningCountBeforePause - 1))
  })

  it('has a log block for every seed session with 6-10 lines and unique times (G2/AC-007)', () => {
    mockCatalog.sessions.forEach((session) => {
      const lines = mockCatalog.sessionLogs[session.id]

      expect(lines).toBeDefined()
      expect(lines.length).toBeGreaterThanOrEqual(6)
      expect(lines.length).toBeLessThanOrEqual(10)
      expect(new Set(lines.map((l) => l.time)).size).toBe(lines.length)
    })
  })

  it('keeps mockCatalog.sessions frozen and unchanged through a sequence of toggles (AC-019)', () => {
    const seedBefore = mockCatalog.sessions.map((session) => ({ ...session }))

    const runningSession = mockCatalog.sessions.find((s) => s.status === 'Running')
    const readySession = mockCatalog.sessions.find((s) => s.status === 'Ready')
    if (!runningSession || !readySession) {
      throw new Error('expected Running and Ready sessions in the fixture')
    }

    let state = createInitialExperienceState()
    state = experienceReducer(state, {
      type: 'toggleSessionPaused',
      sessionId: runningSession.id
    })
    state = experienceReducer(state, {
      type: 'toggleSessionPaused',
      sessionId: runningSession.id
    })
    state = experienceReducer(state, {
      type: 'toggleSessionPaused',
      sessionId: readySession.id
    })

    expect(state.pausedSessionIds).toEqual([readySession.id])
    expect(Object.isFrozen(mockCatalog.sessions)).toBe(true)
    expect(mockCatalog.sessions).toEqual(seedBefore)

    const freshViews = selectSessionViews(createInitialExperienceState())
    mockCatalog.sessions.forEach((session, index) => {
      expect(freshViews[index].status).toBe(session.status)
      expect(freshViews[index].paused).toBe(false)
    })
  })
})

import type { MouseEvent, ReactNode } from 'react'
import {
  useExperienceDispatch,
  useExperienceState
} from '../app/ExperienceProvider'
import type { ShellDestination } from '../app/experience-model'
import { mockCatalog } from '../app/mock-catalog'
import type { ScenarioSlice, SharedAction } from '../app/mock-catalog'
import { selectShellView } from '../app/selectors'
import { ScenarioPresenter } from '../scenarios'
import { Settings } from '../settings'
import { Button, FocusHeading, SkipLink, SkipTarget } from '../ui'
import styles from './shell.module.css'

const destinations = Object.entries(mockCatalog.labels.destinations) as readonly [
  ShellDestination,
  string
][]

function DataList({
  items
}: {
  items: readonly { label: string; value: string }[]
}) {
  return (
    <dl className={styles.dataList}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ScenarioGroup<T>({
  children,
  loadingAction,
  onAction,
  renderReady,
  slice,
  slot,
  title
}: {
  children?: ReactNode
  loadingAction?: SharedAction
  onAction: (action: SharedAction) => void
  renderReady: (data: T) => ReactNode
  slice: ScenarioSlice<T>
  slot: string
  title: string
}) {
  return (
    <section className={styles.group} data-surface-slot={slot}>
      <header className={styles.groupHeader}>
        <h2>{title}</h2>
        {children}
      </header>
      <ScenarioPresenter
        loadingActions={loadingAction === undefined ? [] : [loadingAction]}
        onAction={onAction}
        renderReady={renderReady}
        slice={slice}
      />
    </section>
  )
}

function Overview() {
  const state = useExperienceState()
  const dispatch = useExperienceDispatch()
  const { overview } = selectShellView(state)

  function handleAction(action: SharedAction) {
    switch (action.id) {
      case 'recover-scenario':
        dispatch({ type: 'recoverScenario' })
        break
      case 'add-project':
        dispatch({
          type: 'showToast',
          toast: {
            title: 'Project added',
            message: 'A simulated project was added for this session.',
            tone: 'success'
          }
        })
        break
      case 'configure-agent':
        dispatch({ type: 'goToDestination', destination: 'settings' })
        dispatch({ type: 'selectSettingsCategory', category: 'agents' })
        break
      case 'connect-integration':
        dispatch({ type: 'goToDestination', destination: 'settings' })
        dispatch({ type: 'selectSettingsCategory', category: 'integrations' })
        break
    }
  }

  return (
    <div className={styles.overview} data-surface="overview">
      <ScenarioGroup
        loadingAction={{ id: 'add-project', label: 'Add project' }}
        onAction={handleAction}
        renderReady={(project) => (
          <dl className={styles.projectSummary}>
            <div>
              <dt>Project</dt>
              <dd>{project.name}</dd>
            </div>
            <div>
              <dt>Branch</dt>
              <dd>{project.branch}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{project.status}</dd>
            </div>
          </dl>
        )}
        slice={overview.currentProject}
        slot="primary"
        title="Current project"
      />
      <ScenarioGroup
        loadingAction={{ id: 'configure-agent', label: 'Configure agents' }}
        onAction={handleAction}
        renderReady={(sessions) => (
          <ul className={styles.itemList}>
            {sessions.map((session) => (
              <li key={session.id}>
                <span>
                  <strong>{session.agent}</strong>
                  <span>{session.task}</span>
                </span>
                <span>{session.status}</span>
              </li>
            ))}
          </ul>
        )}
        slice={overview.sessions}
        slot="metrics"
        title="Active agent sessions"
      />
      <ScenarioGroup
        loadingAction={{ id: 'connect-integration', label: 'Connect integration' }}
        onAction={handleAction}
        renderReady={(issues) => (
          <ol className={styles.itemList}>
            {issues.map((issue) => (
              <li key={issue.id}>
                <span>
                  <strong>{issue.id}</strong>
                  <span>{issue.title}</span>
                </span>
                <span>{issue.priority}</span>
              </li>
            ))}
          </ol>
        )}
        slice={overview.issueQueue}
        slot="queue"
        title="Issue queue"
      />
      <ScenarioGroup
        onAction={handleAction}
        renderReady={(usage) => <DataList items={usage} />}
        slice={overview.recentUsage}
        slot="utility"
        title="Recent usage"
      />
      <ScenarioGroup
        onAction={handleAction}
        renderReady={(activity) => (
          <ol className={styles.activityList}>
            {activity.map((event) => (
              <li key={event.id}>
                <span>{event.label}</span>
                <time>{event.time}</time>
              </li>
            ))}
          </ol>
        )}
        slice={overview.activity}
        slot="activity"
        title="Activity"
      />
    </div>
  )
}

function Projects() {
  return (
    <section className={styles.destinationPanel} data-surface="projects">
      <h2>Simulated workspace</h2>
      <dl className={styles.projectSummary}>
        <div>
          <dt>Project</dt>
          <dd>{mockCatalog.currentProject.name}</dd>
        </div>
        <div>
          <dt>Branch</dt>
          <dd>{mockCatalog.currentProject.branch}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{mockCatalog.currentProject.status}</dd>
        </div>
      </dl>
      <p>Project data is local to this demonstration and is not read from disk.</p>
    </section>
  )
}

function Sessions() {
  return (
    <section className={styles.destinationPanel} data-surface="sessions">
      <h2>Agent session board</h2>
      <ul className={styles.itemList}>
        {mockCatalog.sessions.map((session) => (
          <li key={session.id}>
            <span>
              <strong>{session.agent}</strong>
              <span>{session.task}</span>
            </span>
            <span>{session.status}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Issues() {
  return (
    <section className={styles.destinationPanel} data-surface="issues">
      <h2>Prioritized queue</h2>
      <ol className={styles.itemList}>
        {mockCatalog.issueQueue.map((issue) => (
          <li key={issue.id}>
            <span>
              <strong>{issue.id}</strong>
              <span>{issue.title}</span>
            </span>
            <span>{issue.priority}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function DestinationContent({ destination }: { destination: ShellDestination }) {
  switch (destination) {
    case 'overview':
      return <Overview />
    case 'projects':
      return <Projects />
    case 'sessions':
      return <Sessions />
    case 'issues':
      return <Issues />
    case 'settings':
      return <Settings />
  }
}

export function Shell() {
  const state = useExperienceState()
  const dispatch = useExperienceDispatch()
  const view = selectShellView(state)

  function focusMainContent(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    document.getElementById('shell-main-content')?.focus()
  }

  return (
    <div className={styles.shell}>
      <SkipLink onClick={focusMainContent} targetId="shell-main-content">
        Skip to main content
      </SkipLink>
      <aside className={styles.sidebar}>
        <header className={styles.productHeader}>
          <span className={styles.eyebrow}>Agent operations</span>
          <strong>Harbor</strong>
        </header>
        <nav aria-label="Primary navigation" className={styles.primaryNavigation}>
          {destinations.map(([destination, label]) => (
            <Button
              aria-current={view.destination === destination ? 'page' : undefined}
              className={styles.destinationButton}
              key={destination}
              onClick={() => dispatch({ type: 'goToDestination', destination })}
              variant="quiet"
            >
              {label}
            </Button>
          ))}
        </nav>
        <p className={styles.sessionNote}>Simulated data · resets on reload</p>
      </aside>

      <SkipTarget className={styles.main} id="shell-main-content">
        <header className={styles.contentHeader}>
          <span className={styles.eyebrow}>Workspace / {view.destinationLabel}</span>
          <FocusHeading focusKey={view.destination} focusOnMount>
            {view.destinationLabel}
          </FocusHeading>
        </header>
        <DestinationContent destination={view.destination} />
      </SkipTarget>
    </div>
  )
}

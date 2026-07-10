import { useId, type ChangeEvent, type ReactNode } from 'react'
import {
  useExperienceDispatch,
  useExperienceState
} from '../app/ExperienceProvider'
import type {
  CodingAgentId,
  ExperienceAction,
  SettingsCategory,
  SettingsDraft
} from '../app/experience-model'
import { mockCatalog } from '../app/mock-catalog'
import { selectSettingsView } from '../app/selectors'
import { ScenarioPresenter } from '../scenarios'
import { Button, FocusHeading, StatusChip } from '../ui'
import styles from './settings.module.css'

const categories = Object.entries(mockCatalog.labels.settingsCategories) as readonly [
  SettingsCategory,
  string
][]

type UpdateSettingAction = Extract<ExperienceAction, { type: 'updateSetting' }>

// Mappers — semântica de domínio vive onde é usada
const mapAgentStatusToTone = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (status) {
    case 'Available':
      return 'success'
    default:
      return 'neutral'
  }
}

const mapIntegrationStatusToTone = (
  status: string
): 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (status) {
    case 'Not configured':
      return 'warning'
    case 'Simulated':
      return 'neutral'
    default:
      return 'neutral'
  }
}

function SettingToggle({
  checked,
  description,
  label,
  onChange
}: {
  checked: boolean
  description: string
  label: string
  onChange: (checked: boolean) => void
}) {
  const descriptionId = useId()

  return (
    <label className={styles.toggle}>
      <input
        aria-describedby={descriptionId}
        aria-label={label}
        checked={checked}
        className={styles.checkbox}
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      <span className={styles.toggleCopy}>
        <strong>{label}</strong>
        <span id={descriptionId}>{description}</span>
      </span>
    </label>
  )
}

function GeneralSettings({
  draft,
  update
}: {
  draft: SettingsDraft
  update: (action: UpdateSettingAction) => void
}) {
  return (
    <div className={styles.controls}>
      <SettingToggle
        checked={draft.launchAtLogin}
        description="Open Harbor when this computer starts."
        label="Launch at login"
        onChange={(checked) =>
          update({ type: 'updateSetting', field: 'launchAtLogin', value: checked })
        }
      />
      <p className={styles.note}>
        Changes stay in this demonstration until the app is reloaded.
      </p>
    </div>
  )
}

function AppearanceSettings({
  draft,
  onOpenDesignLab,
  update
}: {
  draft: SettingsDraft
  onOpenDesignLab: () => void
  update: (action: UpdateSettingAction) => void
}) {
  return (
    <div className={styles.controls}>
      <SettingToggle
        checked={draft.reduceMotion}
        description="Simplify non-essential transitions in this session."
        label="Reduce motion"
        onChange={(checked) =>
          update({ type: 'updateSetting', field: 'reduceMotion', value: checked })
        }
      />
      <div className={styles.actionBlock}>
        <div>
          <strong>Compare visual concepts</strong>
          <p>
            Open the shared Design Lab without leaving your current settings category.
          </p>
        </div>
        <Button onClick={onOpenDesignLab} variant="primary">
          Open Design Lab
        </Button>
      </div>
    </div>
  )
}

function AgentSettings({
  draft,
  update
}: {
  draft: SettingsDraft
  update: (action: UpdateSettingAction) => void
}) {
  function handleAgentChange(event: ChangeEvent<HTMLSelectElement>) {
    update({
      type: 'updateSetting',
      field: 'defaultAgent',
      value: event.currentTarget.value as CodingAgentId
    })
  }

  return (
    <div className={styles.controls}>
      <label className={styles.selectField}>
        <span>Default agent</span>
        <select value={draft.defaultAgent} onChange={handleAgentChange}>
          {mockCatalog.agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.label}
            </option>
          ))}
        </select>
      </label>
      <ul className={styles.statusList} aria-label="Available agents">
        {mockCatalog.agents.map((agent) => (
          <li key={agent.id}>
            <span>{agent.label}</span>
            <StatusChip tone={mapAgentStatusToTone(agent.status)} label={agent.status} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function IntegrationSettings({ onSimulate }: { onSimulate: (label: string) => void }) {
  return (
    <ul className={styles.statusList} aria-label="Issue integrations">
      {mockCatalog.integrations.map((integration) => (
        <li key={integration.id}>
          <span>
            <strong>{integration.label}</strong>
            <StatusChip
              tone={mapIntegrationStatusToTone(integration.status)}
              label={integration.status}
            />
          </span>
          <Button
            aria-label={`Simulate ${integration.label} connection`}
            onClick={() => onSimulate(integration.label)}
            variant="quiet"
          >
            Simulate connection
          </Button>
        </li>
      ))}
    </ul>
  )
}

function NotificationSettings({
  draft,
  update
}: {
  draft: SettingsDraft
  update: (action: UpdateSettingAction) => void
}) {
  return (
    <div className={styles.controls}>
      <SettingToggle
        checked={draft.sessionNotifications}
        description="Announce when a simulated agent session changes state."
        label="Session notifications"
        onChange={(checked) =>
          update({
            type: 'updateSetting',
            field: 'sessionNotifications',
            value: checked
          })
        }
      />
      <SettingToggle
        checked={draft.issueNotifications}
        description="Announce changes in the simulated issue queue."
        label="Issue notifications"
        onChange={(checked) =>
          update({
            type: 'updateSetting',
            field: 'issueNotifications',
            value: checked
          })
        }
      />
    </div>
  )
}

export function Settings() {
  const state = useExperienceState()
  const dispatch = useExperienceDispatch()
  const view = selectSettingsView(state)

  function update(action: UpdateSettingAction) {
    dispatch(action)
  }

  function showSimulatedConnection(label: string) {
    dispatch({
      type: 'showToast',
      toast: {
        title: `${label} connection simulated`,
        message: `${label} is available for this demonstration only.`,
        tone: 'success'
      }
    })
  }

  function renderCategory(draft: SettingsDraft): ReactNode {
    let content: ReactNode

    switch (view.category) {
      case 'general':
        content = <GeneralSettings draft={draft} update={update} />
        break
      case 'appearance-motion':
        content = (
          <AppearanceSettings
            draft={draft}
            onOpenDesignLab={() => dispatch({ type: 'setDesignLabOpen', open: true })}
            update={update}
          />
        )
        break
      case 'agents':
        content = <AgentSettings draft={draft} update={update} />
        break
      case 'integrations':
        content = <IntegrationSettings onSimulate={showSimulatedConnection} />
        break
      case 'notifications':
        content = <NotificationSettings draft={draft} update={update} />
        break
    }

    return (
      <div className={styles.categoryBody}>
        {content}
        <Button
          onClick={() =>
            dispatch({
              type: 'showToast',
              toast: {
                title: `${view.categoryLabel} settings saved`,
                message: `${view.categoryLabel} settings were saved for this session.`,
                tone: 'success'
              }
            })
          }
          variant="primary"
        >
          Save {view.categoryLabel} settings
        </Button>
      </div>
    )
  }

  return (
    <section
      aria-labelledby={`settings-heading-${view.category}`}
      className={styles.settings}
      data-surface="settings"
    >
      <nav aria-label="Settings categories" className={styles.categoryNavigation}>
        {categories.map(([category, label]) => (
          <Button
            aria-current={view.category === category ? 'page' : undefined}
            className={styles.categoryButton}
            key={category}
            onClick={() => dispatch({ type: 'selectSettingsCategory', category })}
            variant="quiet"
          >
            {label}
          </Button>
        ))}
      </nav>

      <div className={styles.categoryContent}>
        <FocusHeading
          as="h2"
          focusKey={view.category}
          focusOnMount
          id={`settings-heading-${view.category}`}
        >
          {view.categoryLabel}
        </FocusHeading>
        <p className={styles.intro}>
          Adjust this session&apos;s simulated preferences. Nothing is stored after
          reload.
        </p>
        <ScenarioPresenter
          loadingActions={[
            {
              id: 'configure-agent',
              label: `Save ${view.categoryLabel} settings`
            }
          ]}
          onAction={(action) => {
            if (action.id === 'recover-scenario') {
              dispatch({ type: 'recoverScenario' })
            }
          }}
          renderReady={renderCategory}
          slice={view.content}
        />
      </div>
    </section>
  )
}

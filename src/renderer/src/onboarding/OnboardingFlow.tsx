import { type ChangeEvent } from 'react'
import {
  CODING_AGENT_IDS,
  ISSUE_INTEGRATION_IDS,
  ONBOARDING_STEPS,
  mockCatalog,
  selectOnboardingView,
  useExperience,
  type CodingAgentId,
  type IssueIntegrationId,
  type OnboardingStep
} from '../app/index'
import { ScenarioPresenter, type ScenarioPresenterProps } from '../scenarios'
import { Button, FocusHeading, StatusMessage, TextField } from '../ui'
import styles from './onboarding.module.css'

const deferredCopy = {
  'installed-agents':
    'Agent setup was skipped. You can complete it later in Settings.',
  'issue-integrations':
    'Issue integration setup was skipped. You can complete it later in Settings.'
} satisfies Record<'installed-agents' | 'issue-integrations', string>

function previousStep(step: OnboardingStep): OnboardingStep | null {
  const currentIndex = ONBOARDING_STEPS.indexOf(step)
  return currentIndex > 0 ? ONBOARDING_STEPS[currentIndex - 1] : null
}

function nextStep(step: OnboardingStep): OnboardingStep | null {
  const currentIndex = ONBOARDING_STEPS.indexOf(step)
  return currentIndex < ONBOARDING_STEPS.length - 1
    ? ONBOARDING_STEPS[currentIndex + 1]
    : null
}

export interface OnboardingFlowProps {
  className?: string
}

export function OnboardingFlow({ className }: OnboardingFlowProps) {
  const [state, dispatch] = useExperience()
  const view = selectOnboardingView(state)
  const backStep = previousStep(view.step)
  const forwardStep = nextStep(view.step)
  const canContinue =
    view.step !== 'first-project' || view.draft.projectName.trim().length > 0

  const goBack = () => {
    if (backStep !== null) {
      dispatch({ type: 'goToOnboardingStep', step: backStep })
    }
  }

  const continueFlow = () => {
    if (forwardStep !== null) {
      dispatch({ type: 'goToOnboardingStep', step: forwardStep })
      return
    }

    if (canContinue) {
      dispatch({
        type: 'updateOnboardingDraft',
        field: 'firstProjectSkipped',
        value: false
      })
      dispatch({ type: 'completeOnboarding' })
    }
  }

  const skipStep = () => {
    if (view.step === 'welcome') {
      return
    }

    dispatch({ type: 'skipOnboardingStep', step: view.step })

    if (view.step === 'first-project') {
      dispatch({ type: 'completeOnboarding' })
    }
  }

  const scenarioAction: ScenarioPresenterProps<{
    label: string
    description: string
  }>['onAction'] = (action) => {
    if (action.id === 'recover-scenario') {
      dispatch({ type: 'recoverScenario' })
    }
  }

  const renderActions = ({
    continueDisabled = false,
    includeSkip = false
  }: {
    continueDisabled?: boolean
    includeSkip?: boolean
  } = {}) => (
    <div className={styles.actions} data-slot="onboarding-actions">
      {backStep === null ? null : (
        <Button onClick={goBack} variant="secondary">
          Back
        </Button>
      )}
      {includeSkip && view.step !== 'welcome' ? (
        <Button onClick={skipStep} variant="quiet">
          Skip
        </Button>
      ) : null}
      <Button
        disabled={continueDisabled || !canContinue}
        onClick={continueFlow}
        variant="primary"
      >
        Continue
      </Button>
    </div>
  )

  return (
    <section
      aria-labelledby="onboarding-heading"
      className={[styles.flow, className].filter(Boolean).join(' ')}
      data-surface="onboarding"
    >
      <header className={styles.header}>
        <p
          aria-label={`Step ${view.stepNumber} of ${view.totalSteps}`}
          className={styles.progress}
          data-slot="onboarding-progress"
        >
          {view.stepNumber} of {view.totalSteps}
        </p>
        <FocusHeading
          focusKey={view.step}
          focusOnMount
          id="onboarding-heading"
        >
          {view.label}
        </FocusHeading>
        <p className={styles.description}>{view.description}</p>
      </header>

      <div className={styles.primary} data-slot="onboarding-primary">
        <ScenarioPresenter
          loadingActions={[]}
          onAction={scenarioAction}
          renderReady={() => (
            <>
              <StepFields
                onAgentChange={(agent, selected) => {
                  const selectedAgents = selected
                    ? [...view.draft.selectedAgents, agent]
                    : view.draft.selectedAgents.filter((item) => item !== agent)

                  dispatch({
                    type: 'updateOnboardingDraft',
                    field: 'selectedAgents',
                    value: selectedAgents
                  })
                  dispatch({
                    type: 'updateOnboardingDraft',
                    field: 'agentsSkipped',
                    value: false
                  })
                }}
                onIntegrationChange={(integration) => {
                  dispatch({
                    type: 'updateOnboardingDraft',
                    field: 'issueIntegration',
                    value: integration
                  })
                  dispatch({
                    type: 'updateOnboardingDraft',
                    field: 'integrationsSkipped',
                    value: false
                  })
                }}
                onProjectNameChange={(event) => {
                  dispatch({
                    type: 'updateOnboardingDraft',
                    field: 'projectName',
                    value: event.target.value
                  })
                  dispatch({
                    type: 'updateOnboardingDraft',
                    field: 'firstProjectSkipped',
                    value: false
                  })
                }}
                step={view.step}
                draft={view.draft}
              />
              {view.step === 'installed-agents' && view.draft.agentsSkipped ? (
                <StatusMessage>{deferredCopy['installed-agents']}</StatusMessage>
              ) : null}
              {view.step === 'issue-integrations' &&
              view.draft.integrationsSkipped ? (
                <StatusMessage>
                  {deferredCopy['issue-integrations']}
                </StatusMessage>
              ) : null}
              {renderActions({
                includeSkip: view.step !== 'welcome'
              })}
            </>
          )}
          safeActions={
            view.content.status === 'ready'
              ? undefined
              : view.content.status === 'loading'
              ? renderActions({ continueDisabled: true })
              : view.content.status === 'error'
                ? backStep === null
                  ? undefined
                  : (
                      <div
                        className={styles.actions}
                        data-slot="onboarding-actions"
                      >
                        <Button onClick={goBack} variant="secondary">
                          Back
                        </Button>
                      </div>
                    )
                : renderActions()
          }
          slice={view.content}
        />
      </div>
    </section>
  )
}

interface StepFieldsProps {
  draft: ReturnType<typeof selectOnboardingView>['draft']
  onAgentChange: (agent: CodingAgentId, selected: boolean) => void
  onIntegrationChange: (integration: IssueIntegrationId) => void
  onProjectNameChange: (event: ChangeEvent<HTMLInputElement>) => void
  step: OnboardingStep
}

function StepFields({
  draft,
  onAgentChange,
  onIntegrationChange,
  onProjectNameChange,
  step
}: StepFieldsProps) {
  switch (step) {
    case 'welcome':
      return (
        <div className={styles.introduction}>
          <p>
            Explore the same Harbor workflow through three visual directions.
          </p>
          <p>
            Everything in this experience is simulated and resets when the app
            reloads.
          </p>
        </div>
      )
    case 'installed-agents':
      return (
        <fieldset className={styles.fieldset}>
          <legend>Agents to include</legend>
          <p className={styles.hint}>
            Select any agents you want represented in this simulated workspace.
          </p>
          <div className={styles.optionList}>
            {CODING_AGENT_IDS.map((agentId) => {
              const agent = mockCatalog.agents.find((item) => item.id === agentId)

              return (
                <label className={styles.option} key={agentId}>
                  <input
                    checked={draft.selectedAgents.includes(agentId)}
                    onChange={(event) =>
                      onAgentChange(agentId, event.target.checked)
                    }
                    type="checkbox"
                  />
                  <span>
                    <strong>{agent?.label ?? agentId}</strong>
                    <small>{agent?.status ?? 'Available'}</small>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      )
    case 'issue-integrations':
      return (
        <fieldset className={styles.fieldset}>
          <legend>Issue source</legend>
          <p className={styles.hint}>
            Choose one source for the simulated issue queue.
          </p>
          <div className={styles.optionList}>
            {ISSUE_INTEGRATION_IDS.map((integrationId) => {
              const integration = mockCatalog.integrations.find(
                (item) => item.id === integrationId
              )

              return (
                <label className={styles.option} key={integrationId}>
                  <input
                    checked={draft.issueIntegration === integrationId}
                    name="issue-integration"
                    onChange={() => onIntegrationChange(integrationId)}
                    type="radio"
                    value={integrationId}
                  />
                  <span>
                    <strong>{integration?.label ?? integrationId}</strong>
                    <small>{integration?.status ?? 'Not configured'}</small>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      )
    case 'first-project':
      return (
        <TextField
          autoComplete="off"
          hint="This name is used only in the simulated Harbor workspace."
          label="Project name"
          onChange={onProjectNameChange}
          value={draft.projectName}
        />
      )
  }
}

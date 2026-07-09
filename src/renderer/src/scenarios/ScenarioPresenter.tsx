import type { ReactNode } from 'react'
import type { ScenarioSlice, SharedAction } from '../app/mock-catalog'
import {
  Button,
  EmptyStatePanel,
  ErrorStatePanel,
  Skeleton,
  StatusMessage
} from '../ui'
import styles from './scenarios.module.css'

export interface ScenarioPresenterProps<T> {
  loadingActions?: readonly SharedAction[]
  onAction: (action: SharedAction) => void
  renderReady: (data: T) => ReactNode
  safeActions?: ReactNode
  slice: ScenarioSlice<T>
}

export function ScenarioPresenter<T>({
  loadingActions = [],
  onAction,
  renderReady,
  safeActions,
  slice
}: ScenarioPresenterProps<T>) {
  let content: ReactNode

  switch (slice.status) {
    case 'ready':
      content = (
        <div className={styles.ready} data-scenario="ready">
          {renderReady(slice.data)}
        </div>
      )
      break
    case 'loading':
      content = (
        <div className={styles.loading} data-scenario="loading">
          <StatusMessage>{slice.label}</StatusMessage>
          <div aria-hidden="true" className={styles.skeletons}>
            <Skeleton />
            <Skeleton width="78%" />
            <Skeleton width="56%" />
          </div>
          {loadingActions.length === 0 ? null : (
            <div className={styles.loadingActions}>
              {loadingActions.map((action) => (
                <Button disabled key={action.id}>
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )
      break
    case 'empty':
      {
        const action = slice.action

        content = (
          <div data-scenario="empty">
            <EmptyStatePanel
              action={
                action === undefined ? undefined : (
                  <Button onClick={() => onAction(action)} variant="primary">
                    {action.label}
                  </Button>
                )
              }
              guidance={slice.guidance}
              title={slice.title}
            />
          </div>
        )
        break
      }
    case 'error':
      content = (
        <div data-scenario="error">
          <ErrorStatePanel
            action={
              <Button onClick={() => onAction(slice.recovery)} variant="primary">
                {slice.recovery.label}
              </Button>
            }
            cause={slice.cause}
            title={slice.title}
          />
        </div>
      )
      break
  }

  return (
    <div className={styles.presenter}>
      {content}
      {safeActions === undefined ? null : (
        <div className={styles.safeActions}>{safeActions}</div>
      )}
    </div>
  )
}

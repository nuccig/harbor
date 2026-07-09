import { Flask, SidebarCollapse, SidebarExpand } from 'iconoir-react'
import { forwardRef, type Ref } from 'react'
import type { ConceptId, ScenarioId } from '../app/index'
import styles from './design-lab.module.css'

const CONCEPT_SHORT_NAMES: Record<ConceptId, string> = {
  'command-deck': 'Deck',
  'night-harbor': 'Night',
  'signal-poster': 'Signal'
}

const SCENARIO_NAMES: Record<ScenarioId, string> = {
  default: 'Default',
  loading: 'Loading',
  empty: 'Empty',
  error: 'Error'
}

interface DesignLabRailProps {
  concept: ConceptId
  scenario: ScenarioId
  open: boolean
  panelId: string
  onToggle: () => void
}

function DesignLabRailComponent(
  { concept, scenario, open, panelId, onToggle }: DesignLabRailProps,
  ref: Ref<HTMLButtonElement>
) {
  const ToggleIcon = open ? SidebarCollapse : SidebarExpand
  const action = open ? 'Collapse' : 'Open'

  return (
    <header className={styles.rail}>
      <div className={styles.railIdentity}>
        <Flask aria-hidden="true" className={styles.labIcon} />
        <span className={styles.railTitle}>Lab</span>
        <span
          className={styles.railConcept}
          aria-label={`Current concept: ${CONCEPT_SHORT_NAMES[concept]}`}
        >
          {CONCEPT_SHORT_NAMES[concept]}
        </span>
        <span
          className={styles.railScenario}
          aria-label={`Current scenario: ${SCENARIO_NAMES[scenario]}`}
        >
          {SCENARIO_NAMES[scenario]}
        </span>
      </div>

      <button
        ref={ref}
        type="button"
        className={styles.toggle}
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={`${action} Design Lab`}
        onClick={onToggle}
      >
        <ToggleIcon aria-hidden="true" />
        <span className={styles.toggleLabel}>{action}</span>
      </button>
    </header>
  )
}

export const DesignLabRail = forwardRef(DesignLabRailComponent)

import { Star } from 'iconoir-react'
import { useEffect, useId, useRef } from 'react'
import {
  CONCEPT_IDS,
  RATING_METRICS,
  SCENARIO_IDS,
  type ConceptId,
  type RatingMetric,
  type RatingValue,
  type ScenarioId,
  useExperience
} from '../app/index'
import { AssessmentSlider } from './AssessmentSlider'
import { DesignLabRail } from './DesignLabRail'
import styles from './design-lab.module.css'

const CONCEPT_NAMES: Record<ConceptId, string> = {
  'command-deck': 'Command Deck',
  'night-harbor': 'Night Harbor',
  'signal-poster': 'Signal Poster'
}

const SCENARIO_NAMES: Record<ScenarioId, string> = {
  default: 'Default',
  loading: 'Loading',
  empty: 'Empty',
  error: 'Error'
}

const DEFAULT_RATING: RatingValue = 5

export function DesignLab() {
  const [state, dispatch] = useExperience()
  const panelId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const restoreTriggerFocusRef = useRef(false)

  useEffect(() => {
    if (state.designLabOpen) {
      headingRef.current?.focus()
      return
    }

    if (restoreTriggerFocusRef.current) {
      restoreTriggerFocusRef.current = false
      triggerRef.current?.focus()
    }
  }, [state.designLabOpen])

  function setOpen(open: boolean) {
    if (!open) {
      restoreTriggerFocusRef.current = true
    }
    dispatch({ type: 'setDesignLabOpen', open })
  }

  function selectConcept(concept: ConceptId) {
    dispatch({ type: 'selectConcept', concept })
  }

  function selectScenario(scenario: ScenarioId) {
    dispatch({ type: 'selectScenario', scenario })
  }

  function updateRating(metric: RatingMetric, value: number) {
    dispatch({
      type: 'updateAssessment',
      concept: state.concept,
      metric,
      value
    })
  }

  const activeAssessment = state.assessments[state.concept]
  const activeConceptName = CONCEPT_NAMES[state.concept]
  const favoriteName =
    state.favoriteConcept === null ? null : CONCEPT_NAMES[state.favoriteConcept]

  return (
    <aside
      className={styles.designLab}
      data-open={state.designLabOpen}
      aria-label="Design Lab"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && state.designLabOpen) {
          event.preventDefault()
          setOpen(false)
        }
      }}
    >
      <DesignLabRail
        ref={triggerRef}
        concept={state.concept}
        scenario={state.scenario}
        open={state.designLabOpen}
        panelId={panelId}
        onToggle={() => setOpen(!state.designLabOpen)}
      />

      <div
        id={panelId}
        className={styles.panel}
        hidden={!state.designLabOpen}
        role="region"
        aria-label="Design Lab controls"
      >
        <div className={styles.intro}>
          <span className={styles.eyebrow}>Comparison instrument</span>
          <h2 ref={headingRef} className={styles.heading} tabIndex={-1}>
            Tune the proposals
          </h2>
          <p className={styles.introCopy}>
            Change the visual lens and simulated state without changing your place in
            Harbor.
          </p>
        </div>

        <fieldset className={styles.controlGroup}>
          <legend className={styles.groupLegend}>Concept</legend>
          <div className={styles.segmented}>
            {CONCEPT_IDS.map((concept) => (
              <label key={concept} className={styles.segment}>
                <input
                  className={styles.nativeChoice}
                  type="radio"
                  name={`${panelId}-concept`}
                  value={concept}
                  checked={state.concept === concept}
                  onChange={() => selectConcept(concept)}
                />
                <span>{CONCEPT_NAMES[concept]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.controlGroup}>
          <legend className={styles.groupLegend}>Scenario</legend>
          <div className={styles.scenarioGrid}>
            {SCENARIO_IDS.map((scenario) => (
              <label key={scenario} className={styles.scenarioChoice}>
                <input
                  className={styles.nativeChoice}
                  type="radio"
                  name={`${panelId}-scenario`}
                  value={scenario}
                  checked={state.scenario === scenario}
                  onChange={() => selectScenario(scenario)}
                />
                <span>{SCENARIO_NAMES[scenario]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <section className={styles.assessment} aria-labelledby={`${panelId}-assessment`}>
          <div className={styles.assessmentHeading}>
            <div>
              <span className={styles.eyebrow}>Evaluation</span>
              <h3 id={`${panelId}-assessment`} className={styles.assessmentTitle}>
                {activeConceptName}
              </h3>
            </div>
            <span className={styles.scale}>0—10</span>
          </div>

          <div className={styles.sliders}>
            {RATING_METRICS.map((metric, index) => (
              <div key={metric} className={styles.metricRow}>
                <span className={styles.metricIndex} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <AssessmentSlider
                  metric={metric}
                  value={activeAssessment[metric] ?? DEFAULT_RATING}
                  onValueChange={(value) => updateRating(metric, value)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.favorite} aria-labelledby={`${panelId}-favorite`}>
          <div>
            <span className={styles.eyebrow}>Comparison note</span>
            <h3 id={`${panelId}-favorite`} className={styles.favoriteTitle}>
              Evaluation favorite
            </h3>
          </div>
          <button
            type="button"
            className={styles.favoriteButton}
            aria-pressed={state.favoriteConcept === state.concept}
            onClick={() =>
              dispatch({ type: 'selectFavorite', concept: state.concept })
            }
          >
            <Star aria-hidden="true" />
            <span>
              {state.favoriteConcept === state.concept
                ? `${activeConceptName} is marked`
                : `Mark ${activeConceptName}`}
            </span>
          </button>
          <p
            className={styles.favoriteStatus}
            role="status"
            aria-label="Favorite evaluation"
          >
            {favoriteName === null
              ? 'No evaluation favorite yet.'
              : `Preference: ${favoriteName}.`}
          </p>
          <p className={styles.disclaimer}>
            This note does not select a product direction and resets with the demo.
          </p>
        </section>
      </div>
    </aside>
  )
}

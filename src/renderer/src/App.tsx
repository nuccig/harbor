import { lazy, Suspense } from 'react'
import { MotionConfig } from 'motion/react'
import {
  ExperienceProvider,
  useExperience,
  useEffectiveReducedMotion
} from './app/index'
import { getConceptDefinition, type SurfaceId } from './concepts'
import { DesignLab } from './design-lab'
import { OnboardingFlow } from './onboarding'
import { Shell } from './shell'
import { ToastRegion } from './ui'

const NightAmbient = lazy(
  () => import('./concepts/night-harbor/NightAmbient')
)

function getSurface(
  phase: 'onboarding' | 'shell',
  destination: string
): SurfaceId {
  if (phase === 'onboarding') {
    return 'onboarding'
  }

  if (destination === 'overview' || destination === 'settings') {
    return destination
  }

  return 'workspace'
}

export function HarborExperience() {
  const [state, dispatch] = useExperience()
  const reduceMotion = useEffectiveReducedMotion()
  const definition = getConceptDefinition(state.concept)
  const Layout = definition.Layout
  const surface = getSurface(state.phase, state.shellDestination)
  const surfaceKey =
    state.phase === 'onboarding'
      ? `onboarding:${state.onboardingStep}:${state.scenario}`
      : `${state.shellDestination}:${state.settingsCategory}:${state.scenario}`
  const product =
    state.phase === 'onboarding' ? <OnboardingFlow /> : <Shell />
  const ambient =
    state.concept === 'night-harbor' && !reduceMotion ? (
      <Suspense
        fallback={
          <div aria-hidden="true" data-ambient-fallback="static" />
        }
      >
        <NightAmbient />
      </Suspense>
    ) : null

  return (
    <div
      data-concept={state.concept}
      data-scenario={state.scenario}
      data-testid="harbor-root"
      lang="en"
    >
      <Layout
        labOpen={state.designLabOpen}
        reduceMotion={reduceMotion}
        scenario={state.scenario}
        slots={{
          ambient,
          product: (
            <>
              {product}
              <ToastRegion
                onDismiss={() => dispatch({ type: 'dismissToast' })}
                toast={state.toast}
              />
            </>
          ),
          lab: <DesignLab />
        }}
        surface={surface}
        surfaceKey={surfaceKey}
      />
    </div>
  )
}

export function App() {
  return (
    <ExperienceProvider>
      <MotionConfig reducedMotion="user">
        <HarborExperience />
      </MotionConfig>
    </ExperienceProvider>
  )
}

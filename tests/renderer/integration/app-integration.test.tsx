import { useLayoutEffect } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HarborExperience, App } from '../../../src/renderer/src/App'
import {
  CONCEPT_IDS,
  ExperienceProvider,
  SCENARIO_IDS,
  useExperienceDispatch,
  type ConceptId,
  type ExperienceAction,
  type ScenarioId
} from '../../../src/renderer/src/app/index'
import { MotionConfig } from 'motion/react'

type MatrixSurface = 'onboarding' | 'overview' | 'settings'

const surfaces: readonly MatrixSurface[] = [
  'onboarding',
  'overview',
  'settings'
]

const expectedCopy: Record<
  MatrixSurface,
  Record<ScenarioId, RegExp>
> = {
  onboarding: {
    default: /Explore the same Harbor workflow/,
    loading: /Loading welcome/,
    empty: /No welcome data yet/,
    error: /Welcome could not be loaded/
  },
  overview: {
    default: /codex\/issue-29-configuracoes-onboarding-ui/,
    loading: /Loading current project/,
    empty: /No project yet/,
    error: /Current project could not be loaded/
  },
  settings: {
    default: /Changes stay in this demonstration/,
    loading: /Loading general settings/,
    empty: /No general settings/,
    error: /General settings could not be loaded/
  }
}

function SeedExperience({ actions }: { actions: readonly ExperienceAction[] }) {
  const dispatch = useExperienceDispatch()

  useLayoutEffect(() => {
    for (const action of actions) {
      dispatch(action)
    }
  }, [actions, dispatch])

  return null
}

function actionsFor(
  concept: ConceptId,
  scenario: ScenarioId,
  surface: MatrixSurface
): readonly ExperienceAction[] {
  const actions: ExperienceAction[] = [
    { type: 'selectConcept', concept },
    { type: 'selectScenario', scenario }
  ]

  if (surface !== 'onboarding') {
    actions.push({ type: 'completeOnboarding' })
    actions.push({
      type: 'goToDestination',
      destination: surface === 'settings' ? 'settings' : 'overview'
    })
  }

  return actions
}

function renderExperience(actions: readonly ExperienceAction[]) {
  return render(
    <ExperienceProvider>
      <SeedExperience actions={actions} />
      <MotionConfig reducedMotion="user">
        <HarborExperience />
      </MotionConfig>
    </ExperienceProvider>
  )
}

const matrix = CONCEPT_IDS.flatMap((concept) =>
  surfaces.flatMap((surface) =>
    SCENARIO_IDS.map((scenario) => ({ concept, scenario, surface }))
  )
)

describe('Harbor integrated experience', () => {
  it('opens the Welcome surface with the comparison lab available', () => {
    render(<App />)

    expect(screen.getByTestId('harbor-root')).toHaveAttribute(
      'data-concept',
      'command-deck'
    )
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeVisible()
    expect(
      screen.getByRole('complementary', { name: 'Design Lab' })
    ).toBeVisible()
  })

  it.each(matrix)(
    'mounts $concept / $surface / $scenario with content, signature, Lab, and a safe route',
    async ({ concept, scenario, surface }) => {
      renderExperience(actionsFor(concept, scenario, surface))

      const root = await screen.findByTestId('harbor-root')
      await waitFor(() => {
        expect(root).toHaveAttribute('data-concept', concept)
        expect(root).toHaveAttribute('data-scenario', scenario)
      })

      expect(root).toHaveAttribute('lang', 'en')
      expect(
        root.querySelector(`[data-concept-signature="${concept}"]`)
      ).toBeInTheDocument()
      expect(
        screen.getByRole('complementary', { name: 'Design Lab' })
      ).toBeVisible()
      await waitFor(() => {
        expect(screen.getByText(expectedCopy[surface][scenario])).toBeVisible()
      })

      if (surface === 'onboarding') {
        expect(screen.getByRole('heading', { name: 'Welcome' })).toBeVisible()
        if (scenario === 'loading') {
          expect(
            screen.getByRole('button', { name: 'Continue' })
          ).toBeDisabled()
        }
      } else {
        expect(
          screen.getByRole('navigation', { name: 'Primary navigation' })
        ).toBeVisible()
        if (surface === 'settings') {
          expect(
            screen.getByRole('navigation', { name: 'Settings categories' })
          ).toBeVisible()
        }
      }

      if (scenario === 'error') {
        expect(screen.getAllByRole('button', { name: 'Try again' }).length).toBeGreaterThan(0)
      }
    }
  )
})

describe('scenario recovery and loading safety', () => {
  it.each(surfaces)(
    'recovers the Error branch on %s without changing concept or navigation',
    async (surface) => {
      const user = userEvent.setup()
      renderExperience(actionsFor('signal-poster', 'error', surface))

      await screen.findByText(expectedCopy[surface].error)
      await user.click(screen.getAllByRole('button', { name: 'Try again' })[0])

      const root = screen.getByTestId('harbor-root')
      expect(root).toHaveAttribute('data-concept', 'signal-poster')
      expect(root).toHaveAttribute('data-scenario', 'default')
      expect(await screen.findByText(expectedCopy[surface].default)).toBeVisible()

      if (surface !== 'onboarding') {
        expect(
          screen.getByRole('navigation', { name: 'Primary navigation' })
        ).toBeVisible()
      }
    }
  )

  it.each(surfaces)(
    'keeps the Lab and safe navigation operable while %s is Loading',
    async (surface) => {
      renderExperience(actionsFor('command-deck', 'loading', surface))

      await screen.findByText(expectedCopy[surface].loading)
      expect(screen.getByRole('button', { name: 'Open Design Lab' })).toBeEnabled()
      expect(screen.getAllByRole('button', { name: /Continue|Add project|Save General settings/ })[0]).toBeDisabled()

      if (surface !== 'onboarding') {
        expect(
          screen.getByRole('button', { name: 'Overview' })
        ).toBeEnabled()
      }
    }
  )
})

describe('concept parity and session continuity', () => {
  it('exposes identical shared slots, controls, and results in Overview', async () => {
    const snapshots: Array<{
      buttons: string[]
      slots: string[]
      text: string
    }> = []

    for (const concept of CONCEPT_IDS) {
      const view = renderExperience(actionsFor(concept, 'default', 'overview'))
      const product = await waitFor(() => {
        const node = view.container.querySelector<HTMLElement>(
          '[data-concept-slot="product"]'
        )
        expect(node).not.toBeNull()
        expect(node?.querySelector('[data-surface="overview"]')).not.toBeNull()
        return node as HTMLElement
      })

      snapshots.push({
        buttons: within(product)
          .getAllByRole('button')
          .map((button) => button.textContent?.trim() ?? ''),
        slots: Array.from(
          product.querySelectorAll<HTMLElement>('[data-surface-slot]')
        ).map((slot) => slot.dataset.surfaceSlot ?? ''),
        text: product.textContent?.replace(/\s+/g, ' ').trim() ?? ''
      })
      view.unmount()
    }

    expect(snapshots[1]).toEqual(snapshots[0])
    expect(snapshots[2]).toEqual(snapshots[0])
    expect(snapshots[0].slots).toEqual([
      'primary',
      'metrics',
      'queue',
      'utility',
      'activity'
    ])
  })

  it('switches concept and scenario in the Lab without losing onboarding context', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(
      screen.getByRole('heading', { name: 'Installed agents' })
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Open Design Lab' }))
    await user.click(screen.getByRole('radio', { name: 'Night Harbor' }))
    await user.click(screen.getByRole('radio', { name: 'Empty' }))

    const root = screen.getByTestId('harbor-root')
    expect(root).toHaveAttribute('data-concept', 'night-harbor')
    expect(root).toHaveAttribute('data-scenario', 'empty')
    expect(
      await screen.findByRole('heading', { name: 'Installed agents' })
    ).toBeVisible()
    expect(screen.getByText('No installed agents data yet')).toBeVisible()
  })

  it('resets all local experiment state after remount', async () => {
    const user = userEvent.setup()
    const first = render(<App />)

    await user.click(screen.getByRole('button', { name: 'Open Design Lab' }))
    await user.click(screen.getByRole('radio', { name: 'Signal Poster' }))
    await user.click(screen.getByRole('radio', { name: 'Error' }))
    expect(screen.getByTestId('harbor-root')).toHaveAttribute(
      'data-concept',
      'signal-poster'
    )

    first.unmount()
    render(<App />)

    expect(screen.getByTestId('harbor-root')).toHaveAttribute(
      'data-concept',
      'command-deck'
    )
    expect(screen.getByTestId('harbor-root')).toHaveAttribute(
      'data-scenario',
      'default'
    )
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeVisible()
  })

  it('mounts ambient only for active Night Harbor with normal motion', async () => {
    const normal = renderExperience(
      actionsFor('night-harbor', 'default', 'onboarding')
    )

    expect(await screen.findByTestId('night-ambient')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
    normal.unmount()

    renderExperience([
      ...actionsFor('night-harbor', 'default', 'onboarding'),
      {
        type: 'updateSetting',
        field: 'reduceMotion',
        value: true
      }
    ])

    await waitFor(() => {
      expect(screen.getByTestId('harbor-root')).toHaveAttribute(
        'data-concept',
        'night-harbor'
      )
    })
    expect(screen.queryByTestId('night-ambient')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeVisible()
  })

  it('keeps the Design Lab as separate complementary chrome with visible state text', () => {
    render(<App />)

    const lab = screen.getByRole('complementary', { name: 'Design Lab' })
    const product = screen
      .getByTestId('harbor-root')
      .querySelector('[data-concept-slot="product"]')

    expect(lab).not.toBe(product)
    expect(within(lab).getByText('Lab')).toBeVisible()
    expect(within(lab).getByText('Deck')).toBeVisible()
    expect(
      within(lab).getByLabelText('Current scenario: Default')
    ).toBeVisible()
    expect(
      screen.getByTestId('harbor-root').querySelectorAll('[data-concept-slot]')
    ).toHaveLength(4)
  })
})

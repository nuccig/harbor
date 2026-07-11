import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  createInitialExperienceState,
  experienceReducer
} from '../../../src/renderer/src/app/experience-model'
import { selectSessionViews, sessionActionLabels } from '../../../src/renderer/src/app/selectors'
import { SessionCard, type SessionCardProps } from '../../../src/renderer/src/ui'

// Fixtures are derived from Task 001's selector/reducer, never hand-rolled — this
// exercises the same view-model shape Shell.tsx's real call sites will pass in.
const initialState = createInitialExperienceState()
const seedViews = selectSessionViews(initialState)

const runningView = seedViews.find((view) => view.status === 'Running')
const readyView = seedViews.find((view) => view.status === 'Ready')
const completeView = seedViews.find((view) => view.status === 'Complete')

if (!runningView || !readyView || !completeView) {
  throw new Error('fixture is missing an expected seed status — check mock-catalog.ts sessions')
}

const pausedState = experienceReducer(initialState, {
  type: 'toggleSessionPaused',
  sessionId: runningView.id
})
const pausedView = selectSessionViews(pausedState).find((view) => view.id === runningView.id)

if (!pausedView) {
  throw new Error('expected the toggled session to still be present after pausing')
}

function propsFromView(
  view: (typeof seedViews)[number],
  overrides: Partial<SessionCardProps> = {}
): SessionCardProps {
  return {
    agent: view.agent,
    task: view.task,
    statusLabel: view.status,
    statusTone: view.statusTone,
    paused: view.paused,
    canTogglePause: view.canTogglePause,
    togglePauseLabel: view.togglePauseLabel,
    logLabel: view.logLabel,
    logLines: view.logLines,
    onTogglePause: vi.fn(),
    reduceMotion: false,
    ...overrides
  }
}

describe('SessionCard', () => {
  it.each([
    ['Running', runningView],
    ['Ready', readyView],
    ['Complete', completeView],
    ['Paused', pausedView]
  ])(
    'renders %s with a button count derived from canTogglePause (AC-001/002/003)',
    (_label, view) => {
      const { container } = render(<SessionCard {...propsFromView(view)} />)
      expect(container.querySelectorAll('button').length).toBe(view.canTogglePause ? 2 : 1)
    }
  )

  it('exposes the resolved pause and log accessible names for a Running session (AC-004)', () => {
    render(<SessionCard {...propsFromView(runningView)} />)
    expect(
      screen.getByRole('button', { name: sessionActionLabels(runningView).pause })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: sessionActionLabels(runningView).log })
    ).toBeInTheDocument()
  })

  it('exposes the resolved resume and log accessible names for a Paused session (AC-004)', () => {
    render(<SessionCard {...propsFromView(pausedView)} />)
    expect(
      screen.getByRole('button', { name: sessionActionLabels(pausedView).resume })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: sessionActionLabels(pausedView).log })
    ).toBeInTheDocument()
  })

  it.each([
    ['Ready', readyView],
    ['Complete', completeView]
  ])('exposes only the log accessible name for %s (no toggle button rendered)', (_label, view) => {
    render(<SessionCard {...propsFromView(view)} />)
    expect(
      screen.getByRole('button', { name: sessionActionLabels(view).log })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: sessionActionLabels(view).pause })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: sessionActionLabels(view).resume })
    ).not.toBeInTheDocument()
  })

  it('calls onTogglePause exactly once, bound directly with no session id threaded through, when the pause button is clicked', async () => {
    const user = userEvent.setup()
    const onTogglePause = vi.fn()
    render(<SessionCard {...propsFromView(runningView, { onTogglePause })} />)

    await user.click(screen.getByRole('button', { name: sessionActionLabels(runningView).pause }))

    // onClick={onTogglePause} binds the prop directly (plan.md verbatim) — React invokes it
    // with the native SyntheticEvent, not a hand-rolled sessionId; SessionCard has no `id`
    // prop in scope to leak in the first place. What matters is: called once, and the first
    // argument (if any) is never a string — a wrapper like `onClick={() => onTogglePause(id)}`
    // would fail this.
    expect(onTogglePause).toHaveBeenCalledTimes(1)
    expect(typeof onTogglePause.mock.calls[0]?.[0]).not.toBe('string')
  })

  it('calls onTogglePause exactly once, bound directly with no session id threaded through, when the resume button is clicked', async () => {
    const user = userEvent.setup()
    const onTogglePause = vi.fn()
    render(<SessionCard {...propsFromView(pausedView, { onTogglePause })} />)

    await user.click(screen.getByRole('button', { name: sessionActionLabels(pausedView).resume }))

    expect(onTogglePause).toHaveBeenCalledTimes(1)
    expect(typeof onTogglePause.mock.calls[0]?.[0]).not.toBe('string')
  })

  it('opens the log panel with the exact fixture lines and wires aria-expanded/aria-controls (AC-007/009)', async () => {
    const user = userEvent.setup()
    render(<SessionCard {...propsFromView(runningView)} />)
    const logButton = screen.getByRole('button', { name: sessionActionLabels(runningView).log })
    expect(logButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(logButton)

    expect(logButton).toHaveAttribute('aria-expanded', 'true')
    const panel = screen.getByRole('list')
    expect(panel.id).toBe(logButton.getAttribute('aria-controls'))

    const items = within(panel).getAllByRole('listitem')
    expect(items.length).toBe(runningView.logLines.length)
    items.forEach((item, index) => {
      const line = runningView.logLines[index]
      expect(item.textContent).toBe(`${line.time}${line.text}`)
    })
  })

  it('closes the log panel on a second click and keeps focus on the log button (AC-008)', async () => {
    const user = userEvent.setup()
    render(<SessionCard {...propsFromView(runningView)} />)
    const logButton = screen.getByRole('button', { name: sessionActionLabels(runningView).log })

    await user.click(logButton)
    expect(screen.getByRole('list')).toBeInTheDocument()

    await user.click(logButton)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(logButton)
  })

  it('includes the sessionLogAnimated class substring when reduceMotion is false', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <SessionCard {...propsFromView(runningView, { reduceMotion: false })} />
    )
    await user.click(
      within(container).getByRole('button', { name: sessionActionLabels(runningView).log })
    )
    const panel = within(container).getByRole('list')
    expect(panel.className).toContain('sessionLogAnimated')
  })

  it('omits the sessionLogAnimated class substring when reduceMotion is true', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <SessionCard {...propsFromView(runningView, { reduceMotion: true })} />
    )
    await user.click(
      within(container).getByRole('button', { name: sessionActionLabels(runningView).log })
    )
    const panel = within(container).getByRole('list')
    expect(panel.className).not.toContain('sessionLogAnimated')
  })

  it('keeps log disclosure independent per card instance (AC-018)', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <>
        <SessionCard {...propsFromView(readyView)} />
        <SessionCard {...propsFromView(completeView)} />
      </>
    )
    const readyLogButton = within(container).getByRole('button', {
      name: sessionActionLabels(readyView).log
    })
    const completeLogButton = within(container).getByRole('button', {
      name: sessionActionLabels(completeView).log
    })

    await user.click(readyLogButton)

    expect(readyLogButton).toHaveAttribute('aria-expanded', 'true')
    expect(completeLogButton).toHaveAttribute('aria-expanded', 'false')
    expect(within(container).getAllByRole('list').length).toBe(1)
  })
})

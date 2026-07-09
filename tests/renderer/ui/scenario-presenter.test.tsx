import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type {
  ScenarioSlice,
  SharedAction
} from '../../../src/renderer/src/app/mock-catalog'
import { ScenarioPresenter } from '../../../src/renderer/src/scenarios'

const readySlice: ScenarioSlice<{ name: string }> = {
  status: 'ready',
  data: { name: 'Harbor' }
}

const loadingSlice: ScenarioSlice<{ name: string }> = {
  status: 'loading',
  label: 'Loading current project…'
}

const emptySlice: ScenarioSlice<{ name: string }> = {
  status: 'empty',
  title: 'No project yet',
  guidance: 'Add a project when you are ready.',
  action: { id: 'add-project', label: 'Add project' }
}

const errorSlice: ScenarioSlice<{ name: string }> = {
  status: 'error',
  title: 'Current project could not be loaded',
  cause: 'The simulated project source is unavailable.',
  recovery: { id: 'recover-scenario', label: 'Try again' }
}

function renderPresenter(
  slice: ScenarioSlice<{ name: string }>,
  onAction = vi.fn<(action: SharedAction) => void>()
) {
  render(
    <ScenarioPresenter
      loadingActions={[{ id: 'add-project', label: 'Add project' }]}
      slice={slice}
      onAction={onAction}
      renderReady={(data) => <p>Current project: {data.name}</p>}
      safeActions={<button type="button">Open Design Lab</button>}
    />
  )

  return onAction
}

describe('ScenarioPresenter branches', () => {
  it('renders ready data and its safe exit without state announcements', () => {
    renderPresenter(readySlice)

    expect(screen.getByText('Current project: Harbor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open Design Lab' })).toBeEnabled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('names loading content and keeps safe exits available', () => {
    renderPresenter(loadingSlice)

    expect(screen.getByRole('status')).toHaveTextContent('Loading current project…')
    expect(screen.getByRole('button', { name: 'Add project' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Open Design Lab' })).toBeEnabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText('No project yet')).not.toBeInTheDocument()
  })

  it('explains an empty state and invokes its next action', async () => {
    const user = userEvent.setup()
    const onAction = renderPresenter(emptySlice)

    expect(screen.getByRole('heading', { name: 'No project yet' })).toBeInTheDocument()
    expect(screen.getByText('Add a project when you are ready.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add project' }))

    expect(onAction).toHaveBeenCalledWith({
      id: 'add-project',
      label: 'Add project'
    })
  })

  it('announces the error cause and invokes recovery while retaining a safe exit', async () => {
    const user = userEvent.setup()
    const onAction = renderPresenter(errorSlice)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Current project could not be loaded')
    expect(alert).toHaveTextContent('The simulated project source is unavailable.')
    expect(screen.getByRole('button', { name: 'Open Design Lab' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onAction).toHaveBeenCalledWith({
      id: 'recover-scenario',
      label: 'Try again'
    })
  })
})

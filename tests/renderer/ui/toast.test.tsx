import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ToastMessage } from '../../../src/renderer/src/app/experience-model'
import { Button, ToastRegion } from '../../../src/renderer/src/ui'

function SuccessHarness() {
  const [toast, setToast] = useState<ToastMessage | null>(null)

  return (
    <>
      <Button
        onClick={() => {
          setToast({
            title: 'Changes saved',
            message: 'General settings were saved for this session.',
            tone: 'success'
          })
        }}
      >
        Save changes
      </Button>
      <ToastRegion toast={toast} onDismiss={() => setToast(null)} />
    </>
  )
}

describe('ToastRegion', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('announces matching success copy, preserves focus, and dismisses after four seconds', async () => {
    vi.useFakeTimers()

    render(<SuccessHarness />)

    const trigger = screen.getByRole('button', { name: 'Save changes' })
    trigger.focus()
    fireEvent.click(trigger)

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Changes saved')
    expect(status).toHaveTextContent('General settings were saved for this session.')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(trigger).toHaveFocus()

    act(() => {
      vi.advanceTimersByTime(3_999)
    })
    expect(screen.getByRole('status')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})

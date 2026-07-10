import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusChip } from '../../../src/renderer/src/ui'

describe('StatusChip', () => {
  it('renders label as primary communication', () => {
    render(<StatusChip tone="success" label="Running" />)
    expect(screen.getByText('Running')).toBeInTheDocument()
  })

  it('applies tone class for styling', () => {
    const { container } = render(<StatusChip tone="warning" label="Pending" />)
    expect(container.querySelector('[class*="statusChip_warning"]')).toBeInTheDocument()
  })

  it('renders a default icon for the tone (success → CheckCircle)', () => {
    const { container } = render(<StatusChip tone="success" label="Ready" />)
    // Phosphor icon é SVG; verificar presença
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders default icon danger → Warning', () => {
    const { container } = render(<StatusChip tone="danger" label="Critical" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders default icon neutral → Minus', () => {
    const { container } = render(<StatusChip tone="neutral" label="Terminal" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('supports custom icon override', () => {
    const CustomIcon = () => <svg data-testid="custom-icon" />
    render(<StatusChip tone="success" label="Approved" icon={CustomIcon} />)
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('hides decorative elements (dot and icon) from screen readers', () => {
    const { container } = render(<StatusChip tone="success" label="Running" />)
    const hidden = container.querySelectorAll('[aria-hidden="true"]')
    expect(hidden.length).toBeGreaterThanOrEqual(2)  // dot + icon
  })

  it('maintains color-not-only principle (dot + icon + label)', () => {
    const { container } = render(<StatusChip tone="danger" label="Critical" />)
    expect(container.querySelector('[class*="statusDot"]')).toBeInTheDocument()  // dot
    expect(container.querySelector('svg')).toBeInTheDocument()  // icon
    expect(screen.getByText('Critical')).toBeInTheDocument()  // label
  })

  it('renders all tone variants without crashing', () => {
    const tones = ['success', 'warning', 'danger', 'neutral'] as const
    tones.forEach((tone) => {
      const { unmount } = render(
        <StatusChip tone={tone} label={tone.charAt(0).toUpperCase() + tone.slice(1)} />
      )
      unmount()
    })
  })
})

import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockCatalog } from '../../../src/renderer/src/app/mock-catalog'
import { MetricTile } from '../../../src/renderer/src/ui'

// Recharts stamps an auto-incrementing internal id (clip-path id, React useId-based
// group id) on every independent render — unrelated to props or reduced-motion state.
// Strip those before comparing two separately-rendered HTML snapshots, otherwise the
// equality check below would spuriously fail for a reason that has nothing to do with
// the behavior under test (empirically confirmed: two renders of the identical props
// produce different `recharts<N>-clip` / `:r<N>:` ids).
function normalizeVolatileIds(html: string): string {
  return html.replace(/recharts\d+-clip/g, 'recharts-clip').replace(/:r[0-9a-z]+:/g, ':r:')
}

// Recharts' own internal animation layer (mounted regardless of `isAnimationActive`,
// though it no-ops the actual animation) reads system motion preference via
// `window.matchMedia(...).addEventListener`, so the mock must be a full MediaQueryList
// stub — a bare `{ matches }` object (sufficient for this app's own
// `getSystemPrefersReducedMotion`, see use-reduced-motion.test.ts) throws inside
// Recharts on mount.
function mockMatchMedia(matches: boolean) {
  return vi.fn().mockReturnValue({
    matches,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })
}

describe('MetricTile', () => {
  const activeAgentsSeries = mockCatalog.kpis.series['active-agents']

  it('renders the label before the numeral in DOM order (AC-003)', () => {
    const { container } = render(
      <MetricTile label="Active agents" value="12" series={activeAgentsSeries} />
    )
    const text = container.textContent ?? ''
    expect(text.indexOf('Active agents')).toBeGreaterThanOrEqual(0)
    expect(text.indexOf('12')).toBeGreaterThan(text.indexOf('Active agents'))
  })

  it('numeral carries a metricValue-substring class and displays the value prop unchanged (AC-004)', () => {
    const { container } = render(
      <MetricTile label="Issue queue" value="03" series={activeAgentsSeries} />
    )
    const valueEl = container.querySelector('[class*="metricValue"]')
    expect(valueEl).toBeInTheDocument()
    expect(valueEl?.textContent).toBe('03')
  })

  it('bar count equals the fixture series length for a real 10-point series (AC-005)', () => {
    const { container } = render(
      <MetricTile label="Active agents" value="12" series={activeAgentsSeries} />
    )
    const barShapes = Array.from(
      container.querySelectorAll('.recharts-rectangle, [class*="metricSparkBar"]')
    ).filter((el) => el.tagName.toLowerCase() === 'path')
    expect(barShapes.length).toBe(activeAgentsSeries.length)
  })

  it.each(Object.entries(mockCatalog.kpis.series))(
    'the %s fixture series has between 8 and 12 points (AC-005, whole fixture)',
    (_key, values) => {
      expect(values.length).toBeGreaterThanOrEqual(8)
      expect(values.length).toBeLessThanOrEqual(12)
    }
  )

  it('sparkline wrapper is aria-hidden and the svg has no application role or tabindex (AC-006)', () => {
    const { container } = render(
      <MetricTile label="Active agents" value="12" series={activeAgentsSeries} />
    )
    const wrapper = container.querySelector('[aria-hidden="true"]')
    expect(wrapper).toBeInTheDocument()

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg?.hasAttribute('role')).toBe(false)
    expect(svg?.hasAttribute('tabindex')).toBe(false)
  })

  it('renders no <animate> element and no transitioning bar style (AC-016 static/inert proxy)', () => {
    const { container } = render(
      <MetricTile label="Active agents" value="12" series={activeAgentsSeries} />
    )
    expect(container.querySelectorAll('animate').length).toBe(0)

    const bars = Array.from(container.querySelectorAll('.recharts-rectangle'))
    expect(bars.length).toBeGreaterThan(0)
    bars.forEach((bar) => {
      const style = bar.getAttribute('style')
      expect(style === null || !style.includes('transition')).toBe(true)
    })
  })

  it('renders identical output whether prefers-reduced-motion is on or off (AC-015)', () => {
    const originalMatchMedia = window.matchMedia
    try {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: mockMatchMedia(true)
      })
      const reduced = render(
        <MetricTile label="Active agents" value="12" series={activeAgentsSeries} />
      )
      const reducedHtml = normalizeVolatileIds(reduced.container.innerHTML)
      reduced.unmount()

      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: mockMatchMedia(false)
      })
      const full = render(
        <MetricTile label="Active agents" value="12" series={activeAgentsSeries} />
      )
      const fullHtml = normalizeVolatileIds(full.container.innerHTML)
      full.unmount()

      expect(reducedHtml).toBe(fullHtml)
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: originalMatchMedia
      })
    }
  })
})

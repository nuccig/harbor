import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSystemPrefersReducedMotion } from '../../../src/renderer/src/app/use-reduced-motion'

const originalMatchMedia = window.matchMedia

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: originalMatchMedia
  })
})

describe('reduced motion system fallback', () => {
  it('is safe when matchMedia is unavailable', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: undefined
    })

    expect(getSystemPrefersReducedMotion()).toBe(false)
  })

  it.each([true, false])('reads the system preference when it is %s', (matches) => {
    const matchMedia = vi.fn().mockReturnValue({ matches })
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: matchMedia
    })

    expect(getSystemPrefersReducedMotion()).toBe(matches)
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })
})

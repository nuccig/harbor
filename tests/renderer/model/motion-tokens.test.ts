import { describe, expect, it } from 'vitest'
import { motionTokens } from '../../../src/renderer/src/app/motion-tokens'

describe('motion tokens', () => {
  it('keeps exit duration at 0.65 x enter duration (design.md §5)', () => {
    expect(motionTokens.durationExit).toBeCloseTo(0.65 * motionTokens.duration, 5)
  })

  it('keeps exit strictly shorter than enter', () => {
    expect(motionTokens.durationExit).toBeLessThan(motionTokens.duration)
  })

  it('exposes a four-point cubic-bezier easing', () => {
    expect(motionTokens.ease).toHaveLength(4)
    expect(motionTokens.ease).toEqual([0.22, 1, 0.36, 1])
  })
})

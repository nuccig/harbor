/**
 * Motion tokens for Night Harbor — motion/react compatible format.
 * Values are in seconds (motion/react standard), not CSS milliseconds.
 *
 * Base duration: 280ms (0.28s)
 * Exit duration: 182ms (0.182s) = 0.65 × base
 * Easing: cubic-bezier(0.22, 1, 0.36, 1)
 *
 * Source: design.md §5, P1 spec
 */

export const motionTokens = {
  /** Enter animation duration in seconds (280ms) */
  duration: 0.28,

  /** Exit animation duration in seconds (182ms = 0.65 × 0.28) */
  durationExit: 0.182,

  /** Standard easing curve: cubic-bezier(0.22, 1, 0.36, 1) */
  ease: [0.22, 1, 0.36, 1] as const,
} as const

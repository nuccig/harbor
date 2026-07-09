import { useReducedMotion as useMotionReducedMotion } from 'motion/react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export function getSystemPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

export function useReducedMotionPreference(): boolean {
  const motionPreference = useMotionReducedMotion()

  return Boolean(motionPreference || getSystemPrefersReducedMotion())
}

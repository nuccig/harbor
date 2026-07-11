import { useReducedMotion as useMotionReducedMotion } from 'motion/react'
import { useExperienceState } from './ExperienceProvider'

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

export function useEffectiveReducedMotion(): boolean {
  const systemOrMotionPreference = useReducedMotionPreference()
  const { settingsDraft } = useExperienceState()
  return systemOrMotionPreference || settingsDraft.reduceMotion
}

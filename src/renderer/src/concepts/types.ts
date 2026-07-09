import type { ReactNode } from 'react'
import type { ConceptId, ScenarioId } from '../app/index'

export type SurfaceId = 'onboarding' | 'overview' | 'settings' | 'workspace'

export interface ConceptSlots {
  ambient?: ReactNode
  product: ReactNode
  lab: ReactNode
}

export interface ConceptLayoutProps {
  labOpen: boolean
  reduceMotion: boolean
  scenario: ScenarioId
  slots: ConceptSlots
  surface: SurfaceId
  surfaceKey: string
}

export type ConceptLayout = (props: ConceptLayoutProps) => ReactNode

export interface ConceptDefinition {
  id: ConceptId
  label: string
  Layout: ConceptLayout
}

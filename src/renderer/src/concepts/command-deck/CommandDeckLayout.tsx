import { Terminal } from 'iconoir-react'
import { ConceptScaffold } from '../ConceptScaffold'
import type { ConceptLayoutProps } from '../types'

export function CommandDeckLayout(props: ConceptLayoutProps) {
  return (
    <ConceptScaffold
      {...props}
      concept="command-deck"
      icon={<Terminal />}
      signature="Operational telemetry / live simulation"
      transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
      travel={6}
    />
  )
}

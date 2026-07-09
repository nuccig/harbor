import { Lightning } from '@phosphor-icons/react'
import { ConceptScaffold } from '../ConceptScaffold'
import type { ConceptLayoutProps } from '../types'

export function SignalPosterLayout(props: ConceptLayoutProps) {
  return (
    <ConceptScaffold
      {...props}
      concept="signal-poster"
      icon={<Lightning weight="bold" />}
      signature="Signal board / session 029"
      transition={{ duration: 0.11, ease: 'easeOut' }}
      travel={10}
    />
  )
}

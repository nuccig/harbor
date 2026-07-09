import { Anchor } from '@phosphor-icons/react'
import { ConceptScaffold } from '../ConceptScaffold'
import type { ConceptLayoutProps } from '../types'

export function NightHarborLayout(props: ConceptLayoutProps) {
  return (
    <ConceptScaffold
      {...props}
      concept="night-harbor"
      icon={<Anchor weight="regular" />}
      signature="Night watch / simulated harbor field"
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      travel={18}
    />
  )
}

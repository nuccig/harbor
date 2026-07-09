import { Anchor } from '@phosphor-icons/react'
import { motionTokens } from '../../app/motion-tokens'
import { ConceptScaffold } from '../ConceptScaffold'
import type { ConceptLayoutProps } from '../types'

export function NightHarborLayout(props: ConceptLayoutProps) {
  return (
    <ConceptScaffold
      {...props}
      concept="night-harbor"
      icon={<Anchor weight="regular" />}
      signature="Night watch / simulated harbor field"
      transition={{ duration: motionTokens.duration, ease: motionTokens.ease }}
      travel={18}
    />
  )
}

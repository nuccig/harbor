import type { ConceptId } from '../app/index'
import { CommandDeckLayout } from './command-deck/CommandDeckLayout'
import { NightHarborLayout } from './night-harbor/NightHarborLayout'
import { SignalPosterLayout } from './signal-poster/SignalPosterLayout'
import type { ConceptDefinition } from './types'

export const conceptRegistry: Readonly<Record<ConceptId, ConceptDefinition>> = {
  'command-deck': {
    id: 'command-deck',
    label: 'Command Deck',
    Layout: CommandDeckLayout
  },
  'night-harbor': {
    id: 'night-harbor',
    label: 'Night Harbor',
    Layout: NightHarborLayout
  },
  'signal-poster': {
    id: 'signal-poster',
    label: 'Signal Poster',
    Layout: SignalPosterLayout
  }
}

export function getConceptDefinition(concept: ConceptId): ConceptDefinition {
  return conceptRegistry[concept]
}

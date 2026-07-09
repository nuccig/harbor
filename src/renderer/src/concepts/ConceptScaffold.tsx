import { AnimatePresence, motion, type Transition } from 'motion/react'
import type { ReactNode } from 'react'
import type { ConceptId } from '../app/index'
import type { ConceptLayoutProps } from './types'
import styles from './concepts.module.css'

interface ConceptScaffoldProps extends ConceptLayoutProps {
  concept: ConceptId
  icon: ReactNode
  signature: string
  transition: Transition
  travel: number
}

export function ConceptScaffold({
  concept,
  icon,
  labOpen,
  reduceMotion,
  scenario,
  signature,
  slots,
  surface,
  surfaceKey,
  transition,
  travel
}: ConceptScaffoldProps) {
  const offset = reduceMotion ? 0 : travel
  const activeTransition = reduceMotion ? { duration: 0.08 } : transition

  return (
    <div
      className={styles.concept}
      data-concept={concept}
      data-lab-open={labOpen}
      data-scenario={scenario}
      data-surface-current={surface}
    >
      <div className={styles.ambientSlot} data-concept-slot="ambient">
        {slots.ambient}
      </div>

      <div className={styles.productFrame} data-concept-slot="product-frame">
        <header
          aria-hidden="true"
          className={styles.signature}
          data-concept-signature={concept}
        >
          <span className={styles.signatureIcon}>{icon}</span>
          <span>{signature}</span>
          <span className={styles.signatureRule} />
        </header>

        <AnimatePresence initial={false} mode="wait">
          <motion.main
            animate={{ opacity: 1, x: 0, y: 0 }}
            className={styles.product}
            data-concept-slot="product"
            exit={{ opacity: 0, x: -offset, y: concept === 'signal-poster' ? 0 : -offset }}
            initial={{
              opacity: 0,
              x: offset,
              y: concept === 'signal-poster' ? 0 : offset
            }}
            key={surfaceKey}
            transition={activeTransition}
          >
            {slots.product}
          </motion.main>
        </AnimatePresence>
      </div>

      <div className={styles.labSlot} data-concept-slot="lab">
        {slots.lab}
      </div>
    </div>
  )
}

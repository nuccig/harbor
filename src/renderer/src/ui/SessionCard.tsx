import { Pause, Play, TerminalWindow } from '@phosphor-icons/react'
import { useId, useState } from 'react'
import { IconButton } from './Button'
import styles from './primitives.module.css'
import { SemanticIcon } from './SemanticIcon'
import { StatusChip } from './StatusChip'

// tipo próprio de ui/ — estruturalmente idêntico ao SessionLogLine do mock-catalog;
// nenhum import cruzado necessário (TS structural typing faz a ponte)
export interface SessionCardLogLine {
  time: string
  text: string
}

export interface SessionCardProps {
  /** Linha 1 do meta, ex.: "Codex" */
  agent: string
  /** Linha 2 do meta, ex.: "Settings shell" */
  task: string
  /** Rótulo do StatusChip já resolvido, ex.: "Running" | "Paused" */
  statusLabel: string
  /** Tone já mapeado pela camada de domínio (selectSessionViews) */
  statusTone: 'success' | 'warning' | 'danger' | 'neutral'
  /** true ⇒ chip com ícone Pause e toggle exibe Play (apresentação, não domínio) */
  paused: boolean
  /** presença do botão pause/resume — matriz status→ações resolvida FORA (AC-001..003) */
  canTogglePause: boolean
  /** aria-label já resolvido do toggle (pause OU resume conforme o estado) — AC-004 */
  togglePauseLabel: string
  /** aria-label já resolvido do botão de log — AC-004 */
  logLabel: string
  logLines: readonly SessionCardLogLine[]
  onTogglePause: () => void
  reduceMotion: boolean
}

export function SessionCard(props: SessionCardProps) {
  const {
    agent,
    task,
    statusLabel,
    statusTone,
    paused,
    canTogglePause,
    togglePauseLabel,
    logLabel,
    logLines,
    onTogglePause,
    reduceMotion
  } = props
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const logPanelClasses = reduceMotion
    ? styles.sessionLog
    : `${styles.sessionLog} ${styles.sessionLogAnimated}`

  return (
    <div className={styles.sessionCard}>
      <div className={styles.sessionCardRow}>
        <span className={styles.sessionMeta}>
          <strong>{agent}</strong>
          <span>{task}</span>
        </span>
        <StatusChip icon={paused ? Pause : undefined} label={statusLabel} tone={statusTone} />
        <span className={styles.sessionCardControls}>
          {canTogglePause && (
            <IconButton aria-label={togglePauseLabel} onClick={onTogglePause} variant="quiet">
              <SemanticIcon decorative>{paused ? <Play /> : <Pause />}</SemanticIcon>
            </IconButton>
          )}
          <IconButton
            aria-controls={panelId}
            aria-expanded={open}
            aria-label={logLabel}
            onClick={() => setOpen((value) => !value)}
            variant="quiet"
          >
            <SemanticIcon decorative>
              <TerminalWindow />
            </SemanticIcon>
          </IconButton>
        </span>
      </div>
      {open && (
        <ol className={logPanelClasses} id={panelId}>
          {logLines.map((line) => (
            <li key={line.time}>
              <span className={`${styles.sessionLogTime} ${styles.data}`}>{line.time}</span>
              <span className={styles.sessionLogText}>{line.text}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

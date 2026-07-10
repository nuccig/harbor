import { Bar, BarChart } from 'recharts'
import styles from './primitives.module.css'

export interface MetricTileProps {
  label: string
  value: string
  series: readonly number[]
}

export function MetricTile({ label, value, series }: MetricTileProps) {
  return (
    <div className={styles.metricTile}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={`${styles.metricValue} ${styles.data}`}>{value}</span>
      <div aria-hidden="true" className={styles.metricSpark}>
        <BarChart
          accessibilityLayer={false}
          data={series.map((v, i) => ({ i, v }))}
          height={16}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          width={48}
        >
          <Bar className={styles.metricSparkBar} dataKey="v" isAnimationActive={false} />
        </BarChart>
      </div>
    </div>
  )
}

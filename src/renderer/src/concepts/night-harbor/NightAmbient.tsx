import { LinearGradient, Shader } from 'shaders/react'
import styles from '../concepts.module.css'

export default function NightAmbient() {
  const supportsGpu =
    typeof window !== 'undefined' &&
    (typeof navigator !== 'undefined' && 'gpu' in navigator
      ? true
      : 'WebGL2RenderingContext' in window)

  return (
    <div
      aria-hidden="true"
      className={styles.nightAmbient}
      data-testid="night-ambient"
    >
      <div className={styles.ambientFallback} />
      {supportsGpu ? (
        <Shader
          className={styles.ambientCanvas}
          colorSpace="srgb"
          disableTelemetry
          toneMapping="neutral"
        >
          <LinearGradient
            angle={132}
            colorA="#07111f"
            colorB="#37256f"
            opacity={0.72}
          />
        </Shader>
      ) : null}
    </div>
  )
}

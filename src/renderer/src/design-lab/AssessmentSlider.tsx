import { Slider } from '@base-ui/react/slider'
import { useEffect, useRef } from 'react'
import type { RatingMetric, RatingValue } from '../app/index'
import styles from './design-lab.module.css'

const METRIC_CONTENT: Record<
  RatingMetric,
  { label: string; minLabel: string; maxLabel: string }
> = {
  clarity: {
    label: 'Clarity',
    minLabel: 'Unclear',
    maxLabel: 'Crystal clear'
  },
  personality: {
    label: 'Personality',
    minLabel: 'Subdued',
    maxLabel: 'Distinctive'
  },
  density: {
    label: 'Density',
    minLabel: 'Airy',
    maxLabel: 'Dense'
  },
  motion: {
    label: 'Motion',
    minLabel: 'Still',
    maxLabel: 'Kinetic'
  }
}

interface AssessmentSliderProps {
  metric: RatingMetric
  value: RatingValue
  onValueChange: (value: number) => void
}

export function AssessmentSlider({
  metric,
  value,
  onValueChange
}: AssessmentSliderProps) {
  const content = METRIC_CONTENT[metric]
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = inputRef.current
    if (input === null) {
      return
    }

    input.setAttribute('aria-valuemin', '0')
    input.setAttribute('aria-valuemax', '10')
    input.setAttribute('aria-valuenow', String(value))
    input.setAttribute('aria-valuetext', `${content.label}: ${value} of 10`)
  }, [content.label, value])

  return (
    <Slider.Root
      className={styles.sliderRoot}
      min={0}
      max={10}
      step={1}
      value={value}
      onValueChange={onValueChange}
    >
      <div className={styles.sliderHeading}>
        <Slider.Label className={styles.sliderLabel}>{content.label}</Slider.Label>
        <Slider.Value className={styles.sliderValue}>
          {(_formattedValues, values) => values[0]}
        </Slider.Value>
      </div>

      <Slider.Control className={styles.sliderControl}>
        <Slider.Track className={styles.sliderTrack}>
          <Slider.Indicator className={styles.sliderIndicator} />
          <Slider.Thumb
            className={styles.sliderThumb}
            inputRef={inputRef}
            getAriaValueText={(_formattedValue, currentValue) =>
              `${content.label}: ${currentValue} of 10`
            }
          />
        </Slider.Track>
      </Slider.Control>

      <div className={styles.sliderExtremes} aria-hidden="true">
        <span>{content.minLabel}</span>
        <span>{content.maxLabel}</span>
      </div>
    </Slider.Root>
  )
}

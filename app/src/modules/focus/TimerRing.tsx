import { motion } from 'framer-motion'

interface TimerRingProps {
  /** 0..1 — fraction of time elapsed. */
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  tickCount?: number
}

export function TimerRing({
  progress,
  size = 320,
  strokeWidth = 10,
  color = '#c45a28',
  trackColor = 'rgba(255,255,255,0.06)',
  tickCount = 60,
}: TimerRingProps) {
  const center = size / 2
  const outerR = (size - strokeWidth) / 2 - 16
  const trackR = outerR - 8
  const circumference = 2 * Math.PI * trackR
  const offset = circumference * (1 - progress)

  const gradientId = 'timer-ring-grad'
  const glowId = 'timer-ring-glow'

  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angle = (i / tickCount) * 360 - 90
    const rad = (angle * Math.PI) / 180
    const isMajor = i % 5 === 0
    const len = isMajor ? 6 : 3
    const inner = outerR - len
    const outer = outerR
    return {
      x1: center + inner * Math.cos(rad),
      y1: center + inner * Math.sin(rad),
      x2: center + outer * Math.cos(rad),
      y2: center + outer * Math.sin(rad),
      isMajor,
    }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#d4a03a" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={t.isMajor ? 1.5 : 0.8}
          strokeLinecap="round"
        />
      ))}

      {/* Track circle */}
      <circle
        cx={center}
        cy={center}
        r={trackR}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />

      {/* Progress arc */}
      <motion.circle
        cx={center}
        cy={center}
        r={trackR}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        filter={`url(#${glowId})`}
        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
      />

      {/* Glowing dot at current position */}
      {progress > 0 && (() => {
        const angle = progress * 360 - 90
        const rad = (angle * Math.PI) / 180
        const dotX = center + trackR * Math.cos(rad)
        const dotY = center + trackR * Math.sin(rad)
        return (
          <circle
            cx={dotX}
            cy={dotY}
            r={5}
            fill={color}
            filter={`url(#${glowId})`}
          />
        )
      })()}
    </svg>
  )
}

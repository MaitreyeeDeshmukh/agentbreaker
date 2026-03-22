'use client'
import { useState, useEffect, useCallback } from 'react'

interface Props {
  onComplete: () => void
}

export default function LoadingScreen({ onComplete }: Props) {
  const [pct, setPct] = useState(0)
  const [phase, setPhase] = useState<'loading' | 'red' | 'done'>('loading')

  const handleComplete = useCallback(() => {
    setPhase('red')
    setTimeout(() => {
      setPhase('done')
      onComplete()
    }, 600)
  }, [onComplete])

  useEffect(() => {
    let frame: number
    let start: number | null = null
    const duration = 2200

    const tick = (now: number) => {
      if (!start) start = now
      const elapsed = now - start
      const raw = Math.min(elapsed / duration, 1)
      const chunked = Math.floor(raw * 20) * 5
      setPct(chunked)
      if (chunked >= 100) { handleComplete(); return }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [handleComplete])

  if (phase === 'done') return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-between p-8 bg-background">
      {/* Red wipe overlay */}
      <div
        className="absolute inset-0 bg-primary"
        style={{
          animation: phase === 'red' ? 'red-wipe 0.4s ease-out forwards' : 'none',
          clipPath: phase === 'red' ? undefined : 'inset(0 0 0 100%)',
        }}
      />
      {/* Bottom-left copy */}
      <div className="relative z-10 max-w-[420px]">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground leading-relaxed font-mono">
          FYI: We don&apos;t do &apos;estimated loading times&apos;. We&apos;re too busy finding your agent&apos;s holes.
        </p>
      </div>
      {/* Percentage counter */}
      <div className="relative z-10">
        <span className="text-[120px] md:text-[180px] font-display font-black leading-none tabular-nums tracking-tight text-foreground">
          {pct}
        </span>
      </div>
    </div>
  )
}

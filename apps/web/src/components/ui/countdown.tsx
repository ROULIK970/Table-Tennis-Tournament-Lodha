"use client"

import { useEffect, useState } from "react"

interface Remaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

function remainingUntil(target: number): Remaining {
  const diff = Math.max(0, target - Date.now())
  const seconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    done: diff === 0,
  }
}

const UNITS: Array = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
]

/** Live countdown to an ISO date. Renders nothing meaningful until mounted to avoid hydration mismatch. */
export function Countdown({ target }: { target: string }) {
  const targetMs = new Date(target).getTime()
  const valid = !Number.isNaN(targetMs)

  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState<Remaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    done: false,
  })

  useEffect(() => {
    if (!valid) return
    setMounted(true)
    setTime(remainingUntil(targetMs))
    const id = setInterval(() => setTime(remainingUntil(targetMs)), 1000)
    return () => clearInterval(id)
  }, [targetMs, valid])

  if (!valid) return null

  if (mounted && time.done) {
    return (
      <p className="text-accent text-sm font-semibold tracking-widest uppercase">
        The tournament is underway
      </p>
    )
  }

  return (
    <div className="flex gap-3" aria-live="off">
      {UNITS.map((unit) => (
        <div
          key={unit.key}
          className="border-border bg-background flex min-w-16 flex-col items-center border px-3 py-2"
        >
          <span className="text-2xl font-bold tabular-nums sm:text-3xl">
            {mounted ? String(time[unit.key]).padStart(2, "0") : "--"}
          </span>
          <span className="text-muted text-[10px] tracking-widest uppercase">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  )
}

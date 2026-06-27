'use client'

import { useState, useEffect } from 'react'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'

type Tick = {
  label:   string
  days:    number
  hours:   number
  minutes: number
  seconds: number
}

function compute(now: Date): Tick | null {
  let nearest: Date | null = null
  let label = ''

  for (const f of CDM_FIXTURES) {
    // heure est en heure Paris (CEST = UTC+2)
    const t = new Date(`${f.date}T${f.heure}:00+02:00`)
    if (t > now && (!nearest || t < nearest)) {
      nearest = t
      label   = `${f.flagD} ${f.domicile} — ${f.exterieur} ${f.flagE}`
    }
  }

  if (!nearest) return null

  const total = Math.floor((nearest.getTime() - now.getTime()) / 1000)
  return {
    label,
    days:    Math.floor(total / 86400),
    hours:   Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

function Unit({
  value,
  label,
  accent,
  dim,
}: {
  value: number
  label: string
  accent?: boolean
  dim?: boolean
}) {
  return (
    <div className="text-center min-w-[3rem]">
      <p
        className={`text-4xl font-bold tabular-nums leading-none ${
          accent ? 'text-violet-400' : dim ? 'text-gray-500' : 'text-white'
        }`}
      >
        {String(value).padStart(2, '0')}
      </p>
      <p className="text-xs text-gray-500 mt-1.5">{label}</p>
    </div>
  )
}

export default function CdmCountdown() {
  const [tick, setTick] = useState<Tick | null>(null)

  useEffect(() => {
    const update = () => setTick(compute(new Date()))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  if (!tick) return null

  const { days, hours, minutes, seconds } = tick

  return (
    <div className="mb-8 bg-gradient-to-r from-violet-900/30 to-blue-900/30 border border-violet-500/20 rounded-2xl px-6 py-5">
      <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider mb-1">
        Prochain match
      </p>
      <p className="text-sm text-gray-400 mb-5">{tick.label}</p>
      <div className="flex items-end gap-5">
        {days > 0 && (
          <Unit value={days} label={days > 1 ? 'jours' : 'jour'} accent />
        )}
        <Unit value={hours}   label="h" />
        <Unit value={minutes} label="min" accent />
        <Unit value={seconds} label="sec" dim />
      </div>
    </div>
  )
}

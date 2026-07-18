// Brand mark for EudaPM. "Euda" from eudaimonia (eu = good, daimon = guiding
// spirit): a laurel sprig growing upward toward a radiant "daimon" dot.

export function EudaSprig ({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
    >
      {/* stem */}
      <path d="M9 20.5 C 9 14.5 11 9.5 15.6 5.8" />
      {/* alternating laurel leaves */}
      <path d="M9 16.2 C 7.2 16.2 5.8 15.3 5 13.7" />
      <path d="M9.9 12.4 C 11.8 12.5 13.3 11.8 14.2 10.3" />
      <path d="M11.4 8.9 C 9.7 8.7 8.5 7.8 8 6.3" />
      {/* daimon */}
      <circle cx="17.8" cy="4" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function EudaLogo ({ className = '' }: { className?: string }) {
  return (
    <span className={`brand-mark shrink-0 ${className}`.trim()} aria-hidden>
      <EudaSprig className="h-5 w-5" />
    </span>
  )
}

export function EudaWordmark ({ title = 'EudaPM' }: { title?: string }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <EudaLogo />
      <span className="font-display text-lg font-bold tracking-tight">
        <span className="text-gradient">{title}</span>
      </span>
    </span>
  )
}

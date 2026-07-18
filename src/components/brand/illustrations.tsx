// Decorative SVG illustrations for EudaPM. All strokes and fills use the
// theme CSS variables so artwork adapts to light/dark automatically.

export function HeroFlourish ({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 360"
      className={className}
      fill="none"
      role="img"
      aria-label="Illustration of a laurel sprig flourishing upward with orbiting task dots"
    >
      <defs>
        <linearGradient id="hero-stem" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
        <radialGradient id="hero-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="var(--accent-soft)" />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* ambient glow */}
      <circle cx="200" cy="130" r="130" fill="url(#hero-halo)" />

      {/* orbit rings */}
      <ellipse cx="185" cy="165" rx="150" ry="58" stroke="var(--border)" strokeWidth="1.5" transform="rotate(-18 185 165)" />
      <ellipse cx="185" cy="165" rx="110" ry="40" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3 7" transform="rotate(-18 185 165)" />

      {/* ascending laurel sprig */}
      <g stroke="url(#hero-stem)" strokeWidth="7" strokeLinecap="round">
        <path d="M132 318 C 132 232 162 158 234 100" />
        <path d="M132 268 C 104 268 82 254 70 230" />
        <path d="M144 216 C 174 218 198 208 212 186" />
        <path d="M166 166 C 140 162 122 148 114 126" />
        <path d="M196 128 C 224 130 246 122 260 102" />
      </g>

      {/* daimon — the guiding light */}
      <circle cx="266" cy="72" r="17" fill="var(--accent)" />
      <circle cx="266" cy="72" r="30" stroke="var(--accent)" strokeWidth="2" opacity="0.35" />
      <circle cx="266" cy="72" r="44" stroke="var(--accent)" strokeWidth="1.5" opacity="0.15" />

      {/* orbiting task dots */}
      <circle cx="52" cy="196" r="7" fill="var(--primary)" />
      <circle cx="318" cy="170" r="6" fill="var(--primary)" opacity="0.7" />
      <circle cx="292" cy="232" r="5" fill="var(--accent)" opacity="0.6" />
      <circle cx="96" cy="92" r="4" fill="var(--accent)" opacity="0.5" />

      {/* checkmark chip — tasks getting done */}
      <g transform="translate(276 216)">
        <rect x="0" y="0" width="44" height="44" rx="12" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
        <path d="M12 23 L 19 30 L 32 15" stroke="var(--success-fg)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

function SpotFrame ({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 96 96" className="h-20 w-20" fill="none" role="img" aria-label={label}>
      <circle cx="48" cy="48" r="44" fill="var(--accent-soft)" />
      {children}
    </svg>
  )
}

export function EmptyTasks () {
  return (
    <SpotFrame label="A sprout ready to grow">
      <g stroke="var(--primary)" strokeWidth="3" strokeLinecap="round">
        <path d="M48 72 C 48 56 50 46 58 38" />
        <path d="M48 60 C 40 60 34 56 31 49" />
        <path d="M52 48 C 60 49 66 46 69 39" />
      </g>
      <circle cx="63" cy="32" r="4" fill="var(--accent)" />
      <path d="M30 74 H 66" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
    </SpotFrame>
  )
}

export function EmptyProjects () {
  return (
    <SpotFrame label="A seed in soil about to sprout">
      <path d="M32 58 H 64 L 60 74 H 36 Z" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" />
      <g stroke="var(--accent)" strokeWidth="3" strokeLinecap="round">
        <path d="M48 58 C 48 48 50 42 56 37" />
        <path d="M48 50 C 42 50 38 47 36 42" />
      </g>
      <circle cx="60" cy="31" r="3.5" fill="var(--accent)" />
    </SpotFrame>
  )
}

export function EmptyLeaderboard () {
  return (
    <SpotFrame label="A podium with a laurel sprig">
      <g stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round">
        <path d="M40 72 V 46 H 56 V 72" />
        <path d="M24 72 V 58 H 40" />
        <path d="M56 60 H 72 V 72" />
        <path d="M22 72 H 74" strokeLinecap="round" />
      </g>
      <g stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
        <path d="M48 40 C 48 33 50 28 54 25" />
        <path d="M48 35 C 44 35 41 33 40 29" />
      </g>
      <circle cx="57" cy="22" r="3" fill="var(--accent)" />
    </SpotFrame>
  )
}

export function EmptyNotifications () {
  return (
    <SpotFrame label="A quiet notification bell">
      <path
        d="M48 26 C 39 26 34 33 34 42 V 54 L 29 62 H 67 L 62 54 V 42 C 62 33 57 26 48 26 Z"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M43 68 C 44 71 46 72 48 72 C 50 72 52 71 53 68" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="63" cy="28" r="4" fill="var(--accent)" />
    </SpotFrame>
  )
}

export function AuthSprig ({ className = 'h-12 w-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <g stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round">
        <path d="M19 42 C 19 30 23 20 32 13" />
        <path d="M19 33 C 14 33 10.5 30.5 9 26.5" />
        <path d="M21.5 25 C 26.5 25.5 30 23.5 32 19.5" />
        <path d="M24.5 17.5 C 20.5 17 18 15 17 11.5" />
      </g>
      <circle cx="36" cy="9" r="3.2" fill="var(--accent)" />
    </svg>
  )
}

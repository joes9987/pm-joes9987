export const landingHero = {
  eyebrow: 'Hult Cohort · Project 1',
  title: 'EudaPM',
  tagline: 'Plan work. Earn momentum.',
  subhead:
    'EudaPM is project management built for cohort teams — coordinate projects, assign tasks, and track deadlines across 30+ members working toward shared deliverables.',
  primaryCta: { label: 'Get started', href: '/signup' },
  secondaryCta: { label: 'Sign in', href: '/login' }
} as const

export const landingPurpose = {
  title: 'Built for cohort delivery',
  body:
    'When everyone is shipping in parallel, visibility and accountability matter. EudaPM gives your cohort a single place to plan work, stay aligned on deadlines, and see momentum build week over week — without the overhead of a generic enterprise tool.',
  stats: [
    { value: '30+', label: 'members' },
    { value: 'Live', label: 'sync' },
    { value: 'Points', label: '& progress' }
  ] as const
} as const

export type FeatureGroup = {
  category: string
  title: string
  items: readonly string[]
}

export const landingFeatures: readonly FeatureGroup[] = [
  {
    category: 'Work',
    title: 'Projects & tasks',
    items: [
      'Create and archive projects',
      'Assign tasks with status workflow',
      'Due dates with urgency badges',
      'Soft-delete and restore tasks'
    ]
  },
  {
    category: 'Collaborate',
    title: 'Stay aligned',
    items: [
      'Live TaskBoard sync across browsers',
      'In-app notifications',
      'Task comments and activity',
      'Global search and profile names'
    ]
  },
  {
    category: 'Momentum',
    title: 'See progress',
    items: [
      'Difficulty points (10 / 25 / 50)',
      'Progress page metrics',
      'Live cohort leaderboard',
      'Daily email deadline reminders'
    ]
  }
] as const

export type HowItWorksStep = {
  step: number
  title: string
  description: string
}

export const landingSteps: readonly HowItWorksStep[] = [
  {
    step: 1,
    title: 'Create an account',
    description: 'Open signup — built for cohort reviewers and team members.'
  },
  {
    step: 2,
    title: 'Set up a project',
    description: 'Add tasks, assign teammates, and set due dates.'
  },
  {
    step: 3,
    title: 'Track & earn momentum',
    description: 'Get notifications, comment on work, and earn points on completion.'
  }
] as const

export const landingFinalCta = {
  title: 'Ready to plan work and earn momentum?',
  primaryCta: { label: 'Get started', href: '/signup' },
  secondaryCta: { label: 'Sign in', href: '/login' }
} as const

export const landingFooter = 'EudaPM · joes9987 · Hult Cohort Summer 2026'

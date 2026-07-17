import { ui } from '@/lib/ui'

export default function Loading () {
  return (
    <main className={`${ui.meshBg} mx-auto max-w-6xl px-4 py-16`}>
      <p className={ui.pageSubtitle}>Loading…</p>
    </main>
  )
}

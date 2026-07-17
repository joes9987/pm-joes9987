import { ui } from '@/lib/ui'

export default function Loading () {
  return (
    <main className={`${ui.meshBg} px-4 py-16`}>
      <div className="mx-auto max-w-6xl">
        <p className={ui.pageSubtitle}>Loading…</p>
      </div>
    </main>
  )
}

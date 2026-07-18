import { AuthSprig } from '@/components/brand/illustrations'
import { ui } from '@/lib/ui'

export default function Loading () {
  return (
    <main className={`${ui.meshBg} px-4 py-16`}>
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <AuthSprig className="h-8 w-8 animate-pulse" />
        <p className={ui.pageSubtitle}>Loading…</p>
      </div>
    </main>
  )
}

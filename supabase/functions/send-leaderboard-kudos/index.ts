import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

type ProfileRow = {
  id: string
  email: string
  display_name: string
}

type PointEventRow = {
  user_id: string
  points: number
  awarded_at: string
}

type TopEarner = {
  profile: ProfileRow
  points: number
  rank: number
}

function jsonResponse (body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

function startOfUtcWeek (now: Date): Date {
  const day = now.getUTCDay()
  const daysFromMonday = (day + 6) % 7
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysFromMonday
  ))
}

function previousUtcWeek (now: Date): { weekStart: Date, weekEnd: Date } {
  const thisMonday = startOfUtcWeek(now)
  const weekEnd = thisMonday
  const weekStart = new Date(thisMonday)
  weekStart.setUTCDate(weekStart.getUTCDate() - 7)
  return { weekStart, weekEnd }
}

function formatUtcDate (date: Date): string {
  return date.toISOString().slice(0, 10)
}

function escapeHtml (value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function ordinal (rank: number): string {
  if (rank === 1) return '1st'
  if (rank === 2) return '2nd'
  if (rank === 3) return '3rd'
  return `${rank}th`
}

function buildKudosHtml (earner: TopEarner, podium: TopEarner[], weekLabel: string, appUrl: string): string {
  const podiumRows = podium.map((entry) => `
    <li style="margin:0 0 8px 0;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
      <strong style="color:#0f172a;">#${entry.rank} ${escapeHtml(entry.profile.display_name)}</strong>
      <span style="color:#64748b;font-size:13px;"> — ${entry.points} pts</span>
    </li>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background:#f7f5f2;font-family:Segoe UI,system-ui,sans-serif;color:#1c1917;">
        <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
          <div style="background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;padding:28px;box-shadow:0 8px 24px rgba(79,70,229,0.08);">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#0d9488;">Cohort PM</p>
            <h1 style="margin:0 0 8px;font-size:24px;line-height:1.2;color:#312e81;">You're ${ordinal(earner.rank)} this week!</h1>
            <p style="margin:0 0 16px;color:#57534e;">
              Hi ${escapeHtml(earner.profile.display_name)}, you earned <strong>${earner.points}</strong> points
              for week of ${escapeHtml(weekLabel)}. Nice work completing cohort tasks.
            </p>
            <h2 style="margin:20px 0 10px;font-size:16px;color:#4338ca;">Weekly podium</h2>
            <ul style="list-style:none;padding:0;margin:0;">${podiumRows}</ul>
            <a href="${escapeHtml(appUrl)}/dashboard" style="display:inline-block;margin-top:24px;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:10px;">
              View leaderboard
            </a>
          </div>
          <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#78716c;">Weekly kudos from Cohort PM · Hult Cohort Project 1</p>
        </div>
      </body>
    </html>
  `
}

async function sendBrevoEmail (options: {
  apiKey: string
  senderEmail: string
  senderName: string
  toEmail: string
  toName: string
  subject: string
  html: string
}): Promise<string | null> {
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': options.apiKey
    },
    body: JSON.stringify({
      sender: { email: options.senderEmail, name: options.senderName },
      to: [{ email: options.toEmail, name: options.toName }],
      subject: options.subject,
      htmlContent: options.html
    })
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(`Brevo error ${response.status}: ${JSON.stringify(payload)}`)
  }

  return typeof payload.messageId === 'string' ? payload.messageId : null
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const cronSecret = Deno.env.get('CRON_SECRET')
  const providedSecret = request.headers.get('x-cron-secret')

  if (!cronSecret || providedSecret !== cronSecret) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const brevoApiKey = Deno.env.get('BREVO_API_KEY')
  const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL')
  const senderName = Deno.env.get('BREVO_SENDER_NAME') ?? 'Cohort PM'
  const appUrl = Deno.env.get('APP_URL') ?? 'https://pm-joes9987.vercel.app'
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!brevoApiKey || !senderEmail || !supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing required environment variables' }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const now = new Date()
  const { weekStart, weekEnd } = previousUtcWeek(now)
  const weekStartDate = formatUtcDate(weekStart)
  const weekEndDate = formatUtcDate(weekEnd)
  const weekLabel = `${weekStartDate} – ${formatUtcDate(new Date(weekEnd.getTime() - 86400000))}`

  const { data: existingLog, error: logReadError } = await supabase
    .from('leaderboard_kudos_log')
    .select('week_start')
    .eq('week_start', weekStartDate)
    .maybeSingle()

  if (logReadError) {
    return jsonResponse({ error: logReadError.message }, 500)
  }

  if (existingLog) {
    return jsonResponse({
      weekStart: weekStartDate,
      skipped: true,
      reason: 'Already sent for this week'
    })
  }

  const { data: events, error: eventsError } = await supabase
    .from('point_events')
    .select('user_id, points, awarded_at')
    .gte('awarded_at', weekStart.toISOString())
    .lt('awarded_at', weekEnd.toISOString())

  if (eventsError) {
    return jsonResponse({ error: eventsError.message }, 500)
  }

  const totals = new Map<string, number>()
  for (const event of (events ?? []) as PointEventRow[]) {
    totals.set(event.user_id, (totals.get(event.user_id) ?? 0) + event.points)
  }

  const ranked = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  if (ranked.length === 0) {
    const { error: emptyLogError } = await supabase.from('leaderboard_kudos_log').insert({
      week_start: weekStartDate,
      top_user_ids: []
    })

    if (emptyLogError) {
      return jsonResponse({ error: emptyLogError.message }, 500)
    }

    return jsonResponse({
      weekStart: weekStartDate,
      weekEnd: weekEndDate,
      sent: 0,
      reason: 'No point events in previous week'
    })
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .in('id', ranked.map(([userId]) => userId))

  if (profilesError) {
    return jsonResponse({ error: profilesError.message }, 500)
  }

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile as ProfileRow]))

  const podium: TopEarner[] = []
  for (let i = 0; i < ranked.length; i += 1) {
    const [userId, points] = ranked[i]
    const profile = profileById.get(userId)
    if (!profile) continue
    podium.push({ profile, points, rank: i + 1 })
  }

  let sent = 0
  const failures: Array<{ userId: string, error: string }> = []

  for (const earner of podium) {
    try {
      await sendBrevoEmail({
        apiKey: brevoApiKey,
        senderEmail,
        senderName,
        toEmail: earner.profile.email,
        toName: earner.profile.display_name,
        subject: `Cohort PM: You're ${ordinal(earner.rank)} on the weekly leaderboard!`,
        html: buildKudosHtml(earner, podium, weekLabel, appUrl)
      })
      sent += 1
    } catch (error) {
      failures.push({
        userId: earner.profile.id,
        error: error instanceof Error ? error.message : 'Unknown send error'
      })
    }
  }

  if (failures.length === podium.length) {
    return jsonResponse({
      weekStart: weekStartDate,
      sent: 0,
      failures
    }, 500)
  }

  const { error: logError } = await supabase.from('leaderboard_kudos_log').insert({
    week_start: weekStartDate,
    top_user_ids: podium.map((entry) => entry.profile.id)
  })

  if (logError) {
    return jsonResponse({
      weekStart: weekStartDate,
      sent,
      failures,
      logError: logError.message
    }, 500)
  }

  return jsonResponse({
    weekStart: weekStartDate,
    weekEnd: weekEndDate,
    top: podium.map((entry) => ({
      userId: entry.profile.id,
      displayName: entry.profile.display_name,
      points: entry.points,
      rank: entry.rank
    })),
    sent,
    failures
  })
})

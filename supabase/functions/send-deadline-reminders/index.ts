import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

type TaskRow = {
  id: string
  title: string
  due_date: string
  status: string
  assignee_id: string
  projects: { name: string } | { name: string }[] | null
}

type ProfileRow = {
  id: string
  email: string
  display_name: string
}

type DigestTask = {
  id: string
  title: string
  projectName: string
  dueLabel: string
}

type UserDigest = {
  profile: ProfileRow
  overdue: DigestTask[]
  dueToday: DigestTask[]
  dueTomorrow: DigestTask[]
}

function jsonResponse (body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

function startOfUtcDay (date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function addUtcDays (date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

function formatDueLabel (dueDate: string): string {
  return new Date(dueDate).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC'
  }) + ' UTC'
}

function projectName (projects: TaskRow['projects']): string {
  if (!projects) return 'Unknown project'
  if (Array.isArray(projects)) return projects[0]?.name ?? 'Unknown project'
  return projects.name
}

function bucketTask (task: TaskRow, now: Date): 'overdue' | 'due_today' | 'due_tomorrow' | null {
  const due = new Date(task.due_date)
  const today = startOfUtcDay(now)
  const tomorrow = addUtcDays(today, 1)
  const dayAfter = addUtcDays(today, 2)

  if (due < today) return 'overdue'
  if (due >= today && due < tomorrow) return 'due_today'
  if (due >= tomorrow && due < dayAfter) return 'due_tomorrow'
  return null
}

function buildDigestHtml (digest: UserDigest, appUrl: string): string {
  const renderList = (title: string, color: string, tasks: DigestTask[]) => {
    if (tasks.length === 0) return ''
    const items = tasks.map((task) => `
      <li style="margin:0 0 10px 0;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
        <strong style="color:#0f172a;">${escapeHtml(task.title)}</strong><br/>
        <span style="color:#64748b;font-size:13px;">${escapeHtml(task.projectName)} · ${escapeHtml(task.dueLabel)}</span>
      </li>
    `).join('')

    return `
      <h2 style="margin:24px 0 10px;font-size:16px;color:${color};">${escapeHtml(title)}</h2>
      <ul style="list-style:none;padding:0;margin:0;">${items}</ul>
    `
  }

  const total = digest.overdue.length + digest.dueToday.length + digest.dueTomorrow.length

  return `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background:#f7f5f2;font-family:Segoe UI,system-ui,sans-serif;color:#1c1917;">
        <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
          <div style="background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;padding:28px;box-shadow:0 8px 24px rgba(79,70,229,0.08);">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#0d9488;">Cohort PM</p>
            <h1 style="margin:0 0 8px;font-size:24px;line-height:1.2;color:#312e81;">Your task digest</h1>
            <p style="margin:0 0 20px;color:#57534e;">Hi ${escapeHtml(digest.profile.display_name)}, you have <strong>${total}</strong> task${total === 1 ? '' : 's'} needing attention.</p>
            ${renderList('Overdue', '#b91c1c', digest.overdue)}
            ${renderList('Due today', '#b45309', digest.dueToday)}
            ${renderList('Due tomorrow', '#4338ca', digest.dueTomorrow)}
            <a href="${escapeHtml(appUrl)}/dashboard?filter=mine" style="display:inline-block;margin-top:24px;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:10px;">
              Open my dashboard
            </a>
          </div>
          <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#78716c;">Daily reminder from Cohort PM · Hult Cohort Project 1</p>
        </div>
      </body>
    </html>
  `
}

function escapeHtml (value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
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
  const digestDate = now.toISOString().slice(0, 10)

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, due_date, status, assignee_id, projects(name)')
    .not('due_date', 'is', null)
    .not('assignee_id', 'is', null)
    .neq('status', 'done')

  if (tasksError) {
    return jsonResponse({ error: tasksError.message }, 500)
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, display_name')

  if (profilesError) {
    return jsonResponse({ error: profilesError.message }, 500)
  }

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile as ProfileRow]))
  const digests = new Map<string, UserDigest>()

  for (const row of (tasks ?? []) as TaskRow[]) {
    const bucket = bucketTask(row, now)
    if (!bucket) continue

    const profile = profileById.get(row.assignee_id)
    if (!profile) continue

    if (!digests.has(profile.id)) {
      digests.set(profile.id, {
        profile,
        overdue: [],
        dueToday: [],
        dueTomorrow: []
      })
    }

    const digest = digests.get(profile.id)!
    const item: DigestTask = {
      id: row.id,
      title: row.title,
      projectName: projectName(row.projects),
      dueLabel: formatDueLabel(row.due_date)
    }

    if (bucket === 'overdue') digest.overdue.push(item)
    if (bucket === 'due_today') digest.dueToday.push(item)
    if (bucket === 'due_tomorrow') digest.dueTomorrow.push(item)
  }

  const { data: alreadySent, error: logReadError } = await supabase
    .from('email_sent_log')
    .select('user_id')
    .eq('digest_date', digestDate)

  if (logReadError) {
    return jsonResponse({ error: logReadError.message }, 500)
  }

  const sentToday = new Set((alreadySent ?? []).map((row) => row.user_id))

  let sent = 0
  let skipped = 0
  const failures: Array<{ userId: string; error: string }> = []

  for (const digest of digests.values()) {
    if (sentToday.has(digest.profile.id)) {
      skipped += 1
      continue
    }

    const total = digest.overdue.length + digest.dueToday.length + digest.dueTomorrow.length
    if (total === 0) continue

    const subjectParts: string[] = []
    if (digest.dueToday.length > 0) subjectParts.push(`${digest.dueToday.length} due today`)
    if (digest.overdue.length > 0) subjectParts.push(`${digest.overdue.length} overdue`)
    if (digest.dueTomorrow.length > 0) subjectParts.push(`${digest.dueTomorrow.length} due tomorrow`)

    const subject = `Cohort PM: ${subjectParts.join(', ')}`

    try {
      const messageId = await sendBrevoEmail({
        apiKey: brevoApiKey,
        senderEmail,
        senderName,
        toEmail: digest.profile.email,
        toName: digest.profile.display_name,
        subject,
        html: buildDigestHtml(digest, appUrl)
      })

      const { error: logError } = await supabase.from('email_sent_log').insert({
        user_id: digest.profile.id,
        digest_date: digestDate,
        brevo_message_id: messageId
      })

      if (logError) {
        failures.push({ userId: digest.profile.id, error: logError.message })
        continue
      }

      sent += 1
    } catch (error) {
      failures.push({
        userId: digest.profile.id,
        error: error instanceof Error ? error.message : 'Unknown send error'
      })
    }
  }

  return jsonResponse({
    digestDate,
    candidates: digests.size,
    sent,
    skipped,
    failures
  })
})

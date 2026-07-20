/**
 * Seed or refresh the shared reviewer demo account in Supabase.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 *
 * Usage: node scripts/seed-reviewer-demo.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const DEMO_EMAIL = 'eudapm-reviewer@example.com'
const DEMO_PASSWORD = 'EudaPM-Review-2026'
const DEMO_NAME = 'EudaPM Reviewer'

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function ensureUser () {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existing = list?.users?.find((user) => user.email === DEMO_EMAIL)

  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      user_metadata: { display_name: DEMO_NAME }
    })
    return existing.id
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: DEMO_NAME }
  })

  if (error) throw error
  return data.user.id
}

async function seedWorkspace (userId) {
  const { data: existingProjects } = await admin
    .from('projects')
    .select('id')
    .eq('owner_id', userId)
    .eq('name', 'Reviewer demo project')
    .limit(1)

  let projectId = existingProjects?.[0]?.id

  if (!projectId) {
    const { data: project, error } = await admin
      .from('projects')
      .insert({
        name: 'Reviewer demo project',
        description: 'Sample workspace for peer reviewers — explore tasks, search, and GitHub activity.',
        owner_id: userId,
        github_repo: 'joes9987/pm-joes9987'
      })
      .select('id')
      .single()

    if (error) throw error
    projectId = project.id
  }

  const { count } = await admin
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  if ((count ?? 0) === 0) {
    const dueSoon = new Date()
    dueSoon.setDate(dueSoon.getDate() + 2)

    const { error } = await admin.from('tasks').insert([
      {
        project_id: projectId,
        title: 'Try assigning this task',
        description: 'Edit status, add a comment, or mark done to earn points.',
        status: 'todo',
        difficulty: 'mid',
        assignee_id: userId,
        created_by: userId,
        due_date: dueSoon.toISOString()
      },
      {
        project_id: projectId,
        title: 'Explore global search',
        description: 'Find this task from the Search page after saving.',
        status: 'in_progress',
        difficulty: 'low',
        assignee_id: userId,
        created_by: userId
      }
    ])

    if (error) throw error
  }

  console.log(`Demo project ready: ${projectId}`)
}

const userId = await ensureUser()
await seedWorkspace(userId)
console.log(`Reviewer demo account ready: ${DEMO_EMAIL}`)

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // Verify caller is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, full_name, role, language } = await request.json()

  if (!email || !full_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const origin = request.headers.get('origin') ?? 'https://fairy-nails-app.vercel.app'

  // Invite user — Supabase sends the invitation email automatically
  const { data: { user: newUser }, error: authError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  })

  if (authError || !newUser) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 400 })
  }

  // Create profile
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: newUser.id,
    full_name,
    role: role ?? 'employee',
    language: language ?? 'de',
  })

  if (profileError) {
    // Rollback: delete the auth user
    await adminClient.auth.admin.deleteUser(newUser.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ id: newUser.id })
}

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

  // Fetch all auth users + join with profiles
  const adminClient = createAdminClient()
  const { data: { users }, error } = await adminClient.auth.admin.listUsers()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: profiles } = await adminClient
    .from('profiles')
    .select('*')

  const result = (profiles ?? []).map((p) => {
    const authUser = users.find((u) => u.id === p.id)
    return {
      id: p.id,
      full_name: p.full_name,
      role: p.role,
      language: p.language,
      is_active: p.is_active,
      email: authUser?.email ?? '',
    }
  })

  return NextResponse.json(result)
}

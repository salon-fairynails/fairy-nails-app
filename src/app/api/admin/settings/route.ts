import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function GET() {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('settings').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const settings = Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, r.value]))
  return NextResponse.json(settings)
}

export async function PATCH(request: Request) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { key, value } = await request.json()
  if (!key || value === undefined) return NextResponse.json({ error: 'key and value required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('settings')
    .upsert({ key, value }, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ key, value })
}

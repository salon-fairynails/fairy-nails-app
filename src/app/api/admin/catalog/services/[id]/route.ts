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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.category_id !== undefined) updates.category_id = Number(body.category_id)
  if (body.default_price !== undefined) updates.default_price = body.default_price != null ? Number(body.default_price) : null
  if (body.price_label !== undefined) updates.price_label = body.price_label?.trim() || null
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('services')
    .update(updates)
    .eq('id', id)
    .select('*, service_categories(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

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
  const { data, error } = await admin
    .from('services')
    .select('*, service_categories(id, name)')
    .order('is_active', { ascending: false })
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, category_id, default_price, price_label } = await request.json()
  if (!name?.trim() || !category_id) {
    return NextResponse.json({ error: 'Name and category required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('services')
    .insert({
      name: name.trim(),
      category_id: Number(category_id),
      default_price: default_price != null ? Number(default_price) : null,
      price_label: price_label?.trim() || null,
      is_active: true,
    })
    .select('*, service_categories(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

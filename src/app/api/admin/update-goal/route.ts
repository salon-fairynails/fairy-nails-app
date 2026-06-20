import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: Request) {
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

  const { employee_id, monthly_target, bonus_rate } = await req.json()
  if (!employee_id) return NextResponse.json({ error: 'employee_id required' }, { status: 400 })
  if (monthly_target != null && (isNaN(monthly_target) || monthly_target < 0)) {
    return NextResponse.json({ error: 'Invalid monthly_target' }, { status: 400 })
  }
  if (bonus_rate == null || isNaN(bonus_rate) || bonus_rate < 0 || bonus_rate > 100) {
    return NextResponse.json({ error: 'Invalid bonus_rate' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .update({
      monthly_target: monthly_target ?? null,
      bonus_rate,
    })
    .eq('id', employee_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

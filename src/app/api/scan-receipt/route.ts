import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Could not parse form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const prompt = 'Extrahiere aus diesem Kassenbeleg folgende Daten als JSON: { "date": "", "amount": "", "supplier": "", "description": "" }. Verwende das Format dd.MM.yyyy für das Datum und einen numerischen Wert ohne Währungssymbol für den Betrag. Antworte NUR mit dem JSON-Objekt, ohne zusätzlichen Text.'

  const client = new Anthropic({ apiKey })

  // Build content based on file type
  type ContentBlock =
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
    | { type: 'document'; source: { type: 'base64'; media_type: string; data: string } }
    | { type: 'text'; text: string }

  const content: ContentBlock[] = []

  if (file.type === 'application/pdf') {
    content.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: base64 },
    })
  } else {
    // Default to image — normalise unsupported types to jpeg
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const mediaType = supportedTypes.includes(file.type) ? file.type : 'image/jpeg'
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: base64 },
    })
  }

  content.push({ type: 'text', text: prompt })

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: content as Parameters<typeof client.messages.create>[0]['messages'][0]['content'] }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    if (!parsed) throw new Error('No JSON found')
    return NextResponse.json({ data: parsed })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 422 })
  }
}

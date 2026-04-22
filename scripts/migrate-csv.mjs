/**
 * Migration script: CSV Leistungserfassung → Supabase entries
 *
 * Ausführen: node scripts/migrate-csv.mjs
 * (Benötigt: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── ENV ──────────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = join(ROOT, '.env.local')
  const env = {}
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) env[key.trim()] = rest.join('=').trim()
  }
  return env
}

const env = loadEnv()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// ── SERVICE-NAME MAPPING ──────────────────────────────────────────────────────
// CSV-Kurzform → exakter DB-Service-Name
const SERVICE_MAP = {
  // Maniküre
  'auffullen':              'Auffüllen Gel',
  'auffulen':               'Auffüllen Gel',
  'auffulem':               'Auffüllen Gel',
  'auffullen gel':          'Auffüllen Gel',
  'auffulen gel':           'Auffüllen Gel',
  'auffullem gel':          'Auffüllen Gel',
  'auffulem gel':           'Auffüllen Gel',
  'auffullen acryl':        'Auffüllen Acryl',
  'auffulen acryl':         'Auffüllen Acryl',
  'gellack':                'Maniküre permanent mit Gellack',
  'gelack':                 'Maniküre permanent mit Gellack',
  'gellck':                 'Maniküre permanent mit Gellack',
  'gel lack':               'Maniküre permanent mit Gellack',
  'biab':                   'BIAB GEL',
  'spa biab':               'Spa Luxury Fairy Manicure with BIAB',
  'spa mani':               'Spa Luxury Fairy Manicure',
  'spa':                    'Spa Luxury Fairy Manicure',
  'neusset':                'Neumodellage Gel Set',
  'neueset':                'Neumodellage Gel Set',
  'neuset':                 'Neumodellage Gel Set',
  'neumodellage':           'Neumodellage Gel Set',
  'neueset gel':            'Neumodellage Gel Set',
  'ablosen':                'Ablösen Acryl/Gel/BIAB',
  'ablösen':                'Ablösen Acryl/Gel/BIAB',
  // Pediküre
  'pedi':                   'Deluxe Pediküre mit Gellack',
  'pedikure':               'Deluxe Pediküre mit Gellack',
  'ped':                    'Deluxe Pediküre mit Gellack',
  'pedikure gellack':       'Deluxe Pediküre mit Gellack',
  'fuss gellack':           'Fussnagel Gellack Lackieren',
  'fuss gel':               'Fussnagel Gellack Lackieren',
  'fussgellack':            'Fussnagel Gellack Lackieren',
  'spa pedi':               'Spa Signature Pediküre mit Gellack',
  'spa <pedi':              'Spa Signature Pediküre mit Gellack',
  // Face (Wimpern/Brauen)
  'wim':                    'Auffüllen Volume ab 2–3 Wochen',
  'wimpern':                'Auffüllen Volume ab 2–3 Wochen',
  'wimpern auffullen':      'Auffüllen Volume ab 2–3 Wochen',
  'w. lifting':             'Wimpernlifting & färben',
  'wimpernlifting':         'Wimpernlifting & färben',
  'brows':                  'Brow Lamination – Augenbrauenlifting',
  'brow':                   'Brow Lamination – Augenbrauenlifting',
  // Kombinierte Services → Hauptservice, Originalname in notes
  'wim + biab':             'Auffüllen Volume ab 2–3 Wochen',
  'wim + nail':             'Auffüllen Volume ab 2–3 Wochen',
  'auffullen + pedi':       'Deluxe Pediküre mit Gellack',
  'pedi+mani':              'Deluxe Pediküre mit Gellack',
  'spa pedi':               'Spa Signature Pediküre mit Gellack',
}

// ── CSV PARSER ────────────────────────────────────────────────────────────────
function parseTime(raw) {
  if (!raw) return null
  const match = raw.match(/(\d+)\.(\d+)/)
  if (!match) return null
  const h = match[1].padStart(2, '0')
  const m = match[2].padStart(2, '0')
  return `${h}:${m}`
}

function addOneHour(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const newH = (h + 1) % 24
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function parseAmount(raw) {
  if (!raw) return null
  const match = raw.replace(/[^\d.]/g, '')
  const num = parseFloat(match)
  return isNaN(num) ? null : num
}

function parsePayment(raw) {
  if (!raw) return null
  const s = raw.toLowerCase().trim()
  if (s === 'cash') return 'cash'
  if (s === 'twint') return 'twint'
  if (s.includes('credit') || s === 'card') return 'credit_card'
  return null
}

function parseDate(raw) {
  if (!raw) return null
  // Format: 3/1/26 oder 01.04.2026
  let match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
  if (match) {
    const [, m, d, y] = match
    return `20${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  match = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (match) {
    const [, d, m, y] = match
    return `${y}-${m}-${d}`
  }
  return null
}

function parseCsv(filePath) {
  const text = readFileSync(filePath, 'utf8')
  return text.split('\n').map(line => {
    // Simple CSV split (no quoted fields with commas)
    return line.split(',')
  })
}

// ── MAIN PARSER ───────────────────────────────────────────────────────────────
// Spalten: [0]=leer, [1]=date, [2]=Ty service, [3]=Ty time, [4]=Ty amount, [5]=Ty modus,
//          [6]=Khanh service, [7]=Khanh time, [8]=Khanh amount, [9]=Khanh modus,
//          [10]=Maria service, [11]=Maria time, [12]=Maria amount, [13]=Maria modus
function extractEntries(rows, employeeNames) {
  const entries = []
  let currentDate = null

  for (let i = 3; i < rows.length; i++) {
    const row = rows[i]
    const rawDate = row[1]?.trim()
    if (rawDate) {
      const parsed = parseDate(rawDate)
      if (parsed) currentDate = parsed
    }
    if (!currentDate) continue

    // Drei Mitarbeitende je Zeile
    const slots = [
      { name: employeeNames[0], service: row[2], time: row[3], amount: row[4], modus: row[5] },
      { name: employeeNames[1], service: row[6], time: row[7], amount: row[8], modus: row[9] },
      { name: employeeNames[2], service: row[10], time: row[11], amount: row[12], modus: row[13] },
    ]

    for (const slot of slots) {
      const service = slot.service?.trim()
      const timeFrom = parseTime(slot.time?.trim())
      const amount = parseAmount(slot.amount?.trim())
      const payment = parsePayment(slot.modus?.trim())

      if (!service || !timeFrom || amount === null || amount === 0) continue

      entries.push({
        employee_name: slot.name,
        service_raw: service,
        entry_date: currentDate,
        time_from: timeFrom,
        amount,
        payment_raw: payment,
      })
    }
  }

  return entries
}

// ── RUN ───────────────────────────────────────────────────────────────────────
async function main() {
  const DRY_RUN = process.argv.includes('--dry-run')
  console.log(DRY_RUN ? '🔍 DRY RUN – keine DB-Änderungen\n' : '🚀 LIVE RUN – Einträge werden in DB geschrieben\n')

  // Services aus DB laden
  const { data: services, error: sErr } = await supabase.from('services').select('id, name')
  if (sErr) throw new Error('Services laden: ' + sErr.message)
  const serviceByName = Object.fromEntries(services.map(s => [s.name.toLowerCase(), s.id]))

  // Mitarbeitende laden (Ty, Khanh, Maria)
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, full_name')
  if (pErr) throw new Error('Profiles laden: ' + pErr.message)
  console.log('Gefundene Mitarbeitende:', profiles.map(p => p.full_name).join(', '))

  function findEmployeeId(name) {
    const lower = name.toLowerCase()
    const p = profiles.find(p => p.full_name.toLowerCase().includes(lower))
    return p?.id ?? null
  }

  // CSV-Dateien einlesen
  const EMPLOYEE_NAMES = ['Ty', 'Khanh', 'Maria']
  const files = [
    join(ROOT, 'Fairynails_Leistungserfassung_v1 2/März 2026-Table 1.csv'),
    join(ROOT, 'Fairynails_Leistungserfassung_v1 2/April 2026-Table 1.csv'),
  ]

  let allEntries = []
  for (const f of files) {
    const rows = parseCsv(f)
    allEntries = allEntries.concat(extractEntries(rows, EMPLOYEE_NAMES))
  }

  console.log(`\nGeparste Roheinträge: ${allEntries.length}`)

  // Mapping + Validierung
  const toInsert = []
  const skipped = []
  const unmapped = new Set()

  for (const e of allEntries) {
    const normalizedService = e.service_raw.toLowerCase().trim()
    const mappedName = SERVICE_MAP[normalizedService]

    if (!mappedName) {
      unmapped.add(e.service_raw)
      skipped.push({ reason: 'Kein Service-Mapping', ...e })
      continue
    }

    const serviceId = serviceByName[mappedName.toLowerCase()]
    if (!serviceId) {
      skipped.push({ reason: `Service nicht in DB: "${mappedName}"`, ...e })
      continue
    }

    const employeeId = findEmployeeId(e.employee_name)
    if (!employeeId) {
      skipped.push({ reason: `Mitarbeiter nicht gefunden: "${e.employee_name}"`, ...e })
      continue
    }

    const payment = e.payment_raw ?? 'cash' // Default: cash

    const isCombi = e.service_raw.includes('+') || e.service_raw.includes(' ')
      && SERVICE_MAP[normalizedService] !== normalizedService
    const notes = (normalizedService !== mappedName.toLowerCase()) ? e.service_raw : null

    toInsert.push({
      employee_id: employeeId,
      service_id: serviceId,
      entry_date: e.entry_date,
      time_from: e.time_from,
      time_to: addOneHour(e.time_from),
      amount: e.amount,
      payment_method: payment,
      notes: notes,
    })
  }

  console.log(`Bereit zum Einfügen: ${toInsert.length}`)
  console.log(`Übersprungen: ${skipped.length}`)

  if (unmapped.size > 0) {
    console.log('\n⚠️  Ungemappte Service-Namen:')
    for (const name of [...unmapped].sort()) console.log('  -', name)
  }

  if (skipped.length > 0) {
    console.log('\nÜbersprungene Einträge (Zusammenfassung):')
    const grouped = {}
    for (const s of skipped) {
      grouped[s.reason] = (grouped[s.reason] ?? 0) + 1
    }
    for (const [reason, count] of Object.entries(grouped)) {
      console.log(`  ${count}x "${reason}"`)
    }
  }

  // Einträge mit unvollständigen/geschätzten Daten sammeln
  const flagged = []
  for (const e of toInsert) {
    const name = profiles.find(p => p.id === e.employee_id)?.full_name
    const svc = services.find(s => s.id === e.service_id)?.name
    const issues = []
    issues.push('time_to geschätzt (+1h)')
    if (e.payment_method === 'cash' && e.notes) issues.push('Zahlungsart: Standard cash (aus CSV)')
    if (e.notes) issues.push(`Original-Service: "${e.notes}"`)
    flagged.push({ name, date: e.entry_date, time: `${e.time_from}–${e.time_to}`, service: svc, amount: e.amount, payment: e.payment_method, issues })
  }

  // Flagged-Liste nach Datum sortiert ausgeben
  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('EINTRÄGE MIT FEHLENDEN / GESCHÄTZTEN ANGABEN')
  console.log('═══════════════════════════════════════════════════════════════')

  // Gruppieren nach Mitarbeiter
  for (const empName of ['Ty', 'Khanh', 'Maria']) {
    const empEntries = flagged.filter(e => e.name === empName)
    if (!empEntries.length) continue
    console.log(`\n▸ ${empName} (${empEntries.length} Einträge)`)
    console.log('─────────────────────────────────────────────────────────────')
    for (const e of empEntries) {
      const dateFormatted = e.date.split('-').reverse().join('.')
      const amountStr = `CHF ${e.amount.toFixed(2)}`
      console.log(`  ${dateFormatted}  ${e.time}  ${e.service.padEnd(40)} ${amountStr.padStart(10)}  [${e.payment}]`)
      for (const issue of e.issues) {
        if (issue.startsWith('Original-Service')) console.log(`    ⚠  ${issue}`)
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('KOMBINIERTE / MEHRDEUTIGE SERVICE-ZUORDNUNGEN (bitte prüfen)')
  console.log('═══════════════════════════════════════════════════════════════')
  const combined = flagged.filter(e => e.issues.some(i => i.startsWith('Original-Service')))
  for (const e of combined) {
    const dateFormatted = e.date.split('-').reverse().join('.')
    const orig = e.issues.find(i => i.startsWith('Original-Service'))?.replace('Original-Service: ', '')
    console.log(`  ${e.name.padEnd(6)} ${dateFormatted}  ${e.time}  ${orig?.padEnd(30)} → ${e.service}  CHF ${e.amount.toFixed(2)}`)
  }

  if (DRY_RUN) {
    console.log('\nDRY RUN abgeschlossen. Führe ohne --dry-run aus, um einzufügen.')
    return
  }

  // In Batches von 100 einfügen
  const BATCH = 100
  let inserted = 0
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH)
    const { error } = await supabase.from('entries').insert(batch)
    if (error) {
      console.error(`Fehler bei Batch ${i / BATCH + 1}:`, error.message)
      continue
    }
    inserted += batch.length
    process.stdout.write(`\r  ${inserted}/${toInsert.length} eingefügt...`)
  }
  console.log(`\n\n✅ ${inserted} Einträge erfolgreich importiert.`)
}

main().catch(err => {
  console.error('Fehler:', err)
  process.exit(1)
})

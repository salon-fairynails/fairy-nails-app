import type { AdminEntry, Filters, EmployeeWithEmail } from '@/types/database'
import { formatDate, formatAmount } from '@/lib/utils'

const ACCENT = { r: 139, g: 74, b: 107 }   // #8B4A6B
const TEXT   = { r: 61,  g: 43, b: 43  }   // #3D2B2B
const MUTED  = { r: 138, g: 106, b: 106 }  // #8A6A6A
const BG     = { r: 253, g: 246, b: 240 }  // #FDF6F0
const BORDER = { r: 229, g: 208, b: 197 }  // #E5D0C5

function paymentLabel(method: string): string {
  const map: Record<string, string> = { cash: 'Bar', twint: 'Twint', credit_card: 'Kreditkarte' }
  return map[method] ?? method
}

export function exportToPdf(
  entries: AdminEntry[],
  filters: Filters,
  employees: EmployeeWithEmail[],
): void {
  // Dynamic imports are resolved before this function is called via the caller's dynamic import
  // We use require here since this module is always loaded dynamically (no SSR)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { jsPDF } = require('jspdf')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const autoTable = require('jspdf-autotable').default ?? require('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15

  // ── Header background strip ──────────────────────────────────────────────
  doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b)
  doc.rect(0, 0, pageW, 28, 'F')

  // Brand name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('Fairy Nails', margin, 13)

  // Tagline
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(229, 208, 197)
  doc.text('Internes Mitarbeiterportal', margin, 20)

  // Export date (top right)
  const today = new Date()
  const exportDateStr = today.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.setFontSize(8)
  doc.setTextColor(229, 208, 197)
  doc.text(`Export: ${exportDateStr}`, pageW - margin, 13, { align: 'right' })

  // ── Filter summary ────────────────────────────────────────────────────────
  let y = 36
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b)
  doc.text('Auswertung', margin, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)

  // Period
  const fromStr = filters.date_from ? formatDate(filters.date_from) : '–'
  const toStr   = filters.date_to   ? formatDate(filters.date_to)   : '–'
  doc.text(`Zeitraum: ${fromStr} – ${toStr}`, margin, y)
  y += 5

  // Employee filter
  const empName = filters.employee_id
    ? (employees.find((e) => e.id === filters.employee_id)?.full_name ?? filters.employee_id)
    : 'Alle Mitarbeitenden'
  doc.text(`Mitarbeitende/r: ${empName}`, margin, y)
  y += 5

  // Payment filter
  if (filters.payment_method) {
    doc.text(`Zahlungsart: ${paymentLabel(filters.payment_method)}`, margin, y)
    y += 5
  }

  y += 2

  // ── Table ─────────────────────────────────────────────────────────────────
  const head = [['Datum', 'Mitarbeiter/in', 'Kategorie', 'Service', 'Betrag (CHF)', 'Zahlungsart']]
  const body = entries.map((e) => [
    formatDate(e.entry_date),
    e.profiles?.full_name ?? '–',
    e.services?.service_categories?.name ?? '–',
    e.services?.name ?? '–',
    formatAmount(e.amount),
    paymentLabel(e.payment_method),
  ])

  autoTable(doc, {
    startY: y,
    head,
    body,
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [TEXT.r, TEXT.g, TEXT.b],
      lineColor: [BORDER.r, BORDER.g, BORDER.b],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [ACCENT.r, ACCENT.g, ACCENT.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [BG.r, BG.g, BG.b],
    },
    columnStyles: {
      4: { halign: 'right' },
    },
  })

  // ── Footer / Totals ───────────────────────────────────────────────────────
  const finalY: number = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 10

  const totals = entries.reduce(
    (acc, e) => {
      acc.total += e.amount
      acc[e.payment_method] = (acc[e.payment_method] ?? 0) + e.amount
      return acc
    },
    { total: 0, cash: 0, twint: 0, credit_card: 0 } as Record<string, number>
  )

  const summaryY = finalY + 8
  const colRight = pageW - margin

  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b)
  doc.setLineWidth(0.3)
  doc.line(margin, summaryY - 3, colRight, summaryY - 3)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)

  const paymentMethods: [string, string][] = [
    ['cash', 'Bar'],
    ['twint', 'Twint'],
    ['credit_card', 'Kreditkarte'],
  ]

  let sumY = summaryY + 2
  for (const [key, label] of paymentMethods) {
    const val = totals[key] ?? 0
    if (val > 0) {
      doc.text(`${label}:`, margin + 60, sumY, { align: 'right' })
      doc.text(`CHF ${formatAmount(val)}`, colRight, sumY, { align: 'right' })
      sumY += 5
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b)
  doc.text('Total:', margin + 60, sumY + 1, { align: 'right' })
  doc.text(`CHF ${formatAmount(totals.total)}`, colRight, sumY + 1, { align: 'right' })

  // Entry count
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(`${entries.length} Einträge`, margin, sumY + 1)

  // ── Page numbers ──────────────────────────────────────────────────────────
  const pageCount: number = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text(`Seite ${i} / ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' })
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const filename = `fairy-nails_${filters.date_from ?? 'export'}_${filters.date_to ?? ''}.pdf`
  doc.save(filename)
}

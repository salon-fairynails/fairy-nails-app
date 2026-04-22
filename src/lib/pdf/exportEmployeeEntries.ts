import type { Entry, Expense } from '@/types/database'
import { formatDate, formatTime, formatAmount } from '@/lib/utils'

const ACCENT = { r: 139, g: 74, b: 107 }
const TEXT   = { r: 61,  g: 43, b: 43  }
const MUTED  = { r: 138, g: 106, b: 106 }
const BG     = { r: 253, g: 246, b: 240 }
const BORDER = { r: 229, g: 208, b: 197 }

function paymentLabel(method: string): string {
  const map: Record<string, string> = {
    cash: 'Bar', twint: 'Twint', credit_card: 'Kreditkarte', bank_transfer: 'Überweisung',
  }
  return map[method] ?? method
}

export function exportEmployeeEntriesToPdf(entries: Entry[], employeeName: string): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { jsPDF } = require('jspdf')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const autoTable = require('jspdf-autotable').default ?? require('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15

  doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('Fairy Nails', margin, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(229, 208, 197)
  doc.text('Meine Einnahmen', margin, 20)
  const exportDateStr = new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.setFontSize(8)
  doc.text(`Export: ${exportDateStr}`, pageW - margin, 13, { align: 'right' })

  let y = 36
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(`Mitarbeitende/r: ${employeeName}`, margin, y)
  y += 8

  const head = [['Datum', 'Zeit', 'Kategorie', 'Service', 'Betrag (CHF)', 'Zahlungsart']]
  const body = entries.map((e) => [
    formatDate(e.entry_date),
    `${formatTime(e.time_from)} – ${formatTime(e.time_to)}`,
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
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 3, textColor: [TEXT.r, TEXT.g, TEXT.b], lineColor: [BORDER.r, BORDER.g, BORDER.b], lineWidth: 0.2 },
    headStyles: { fillColor: [ACCENT.r, ACCENT.g, ACCENT.b], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [BG.r, BG.g, BG.b] },
    columnStyles: { 4: { halign: 'right' } },
  })

  const finalY: number = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 10
  const total = entries.reduce((s, e) => s + Number(e.amount), 0)
  const colRight = pageW - margin

  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b)
  doc.setLineWidth(0.3)
  doc.line(margin, finalY + 5, colRight, finalY + 5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b)
  doc.text('Total:', margin + 60, finalY + 11, { align: 'right' })
  doc.text(`CHF ${formatAmount(total)}`, colRight, finalY + 11, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(`${entries.length} Einträge`, margin, finalY + 11)

  const pageCount: number = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text(`Seite ${i} / ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' })
  }

  doc.save(`fairy-nails_einnahmen_${new Date().toISOString().split('T')[0]}.pdf`)
}

export function exportEmployeeExpensesToPdf(expenses: Expense[], employeeName: string): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { jsPDF } = require('jspdf')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const autoTable = require('jspdf-autotable').default ?? require('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15

  doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('Fairy Nails', margin, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(229, 208, 197)
  doc.text('Meine Ausgaben', margin, 20)
  const exportDateStr = new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.setFontSize(8)
  doc.text(`Export: ${exportDateStr}`, pageW - margin, 13, { align: 'right' })

  let y = 36
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(`Mitarbeitende/r: ${employeeName}`, margin, y)
  y += 8

  const head = [['Datum', 'Kategorie', 'Beschreibung', 'Lieferant', 'Betrag (CHF)', 'Zahlungsart']]
  const body = expenses.map((e) => [
    formatDate(e.expense_date),
    e.expense_categories?.name ?? '–',
    e.description,
    e.supplier ?? '–',
    formatAmount(e.amount),
    paymentLabel(e.payment_method),
  ])

  autoTable(doc, {
    startY: y,
    head,
    body,
    margin: { left: margin, right: margin },
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 3, textColor: [TEXT.r, TEXT.g, TEXT.b], lineColor: [BORDER.r, BORDER.g, BORDER.b], lineWidth: 0.2 },
    headStyles: { fillColor: [ACCENT.r, ACCENT.g, ACCENT.b], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [BG.r, BG.g, BG.b] },
    columnStyles: { 4: { halign: 'right' } },
  })

  const finalY: number = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 10
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const colRight = pageW - margin

  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b)
  doc.setLineWidth(0.3)
  doc.line(margin, finalY + 5, colRight, finalY + 5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b)
  doc.text('Total Ausgaben:', margin + 60, finalY + 11, { align: 'right' })
  doc.text(`CHF ${formatAmount(total)}`, colRight, finalY + 11, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(`${expenses.length} Einträge`, margin, finalY + 11)

  const pageCount: number = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text(`Seite ${i} / ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' })
  }

  doc.save(`fairy-nails_ausgaben_${new Date().toISOString().split('T')[0]}.pdf`)
}

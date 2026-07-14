import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

export function formatTime(timeStr: string): string {
  return timeStr.substring(0, 5)
}

export function formatDateTime(isoTimestamp: string): string {
  const d = new Date(isoTimestamp)
  const date = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${date} ${time}`
}

export function formatAmount(amount: number): string {
  const [int, dec] = amount.toFixed(2).split('.')
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, "'")}.${dec}`
}

export function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function startOfWeek(): string {
  const now = new Date()
  const day = now.getDay() || 7
  const mon = new Date(now)
  mon.setDate(now.getDate() - day + 1)
  return toIso(mon)
}

export function endOfWeek(): string {
  const now = new Date()
  const day = now.getDay() || 7
  const sun = new Date(now)
  sun.setDate(now.getDate() - day + 7)
  return toIso(sun)
}

export function startOfMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export function endOfMonth(): string {
  const now = new Date()
  return toIso(new Date(now.getFullYear(), now.getMonth() + 1, 0))
}

export function startOfYear(): string {
  return `${new Date().getFullYear()}-01-01`
}

export function endOfYear(): string {
  return `${new Date().getFullYear()}-12-31`
}

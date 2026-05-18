# 2026-05-18 — Provisionsabrechnung (Commission Rate)

## Ziel
Mitarbeitende erhalten einen prozentualen Anteil des kassierten Betrages. Der Admin möchte pro Mitarbeitenden und Zeitraum sehen, wie viel Provision anfällt und was ihm selbst verbleibt.

## Umgesetzte Änderungen

### Datenbank (Supabase)
- Neue Spalte `commission_rate NUMERIC(5,2) NOT NULL DEFAULT 50` in `profiles`
- Migration-SQL: `docs/migration_commission_rate.sql`

### Backend
- `src/app/api/admin/employees/route.ts` — gibt `commission_rate` im Response mit
- `src/app/api/admin/update-commission/route.ts` — neue PATCH-Route zum Speichern der Provision (Admin-only)

### Frontend
- `src/types/database.ts` — `EmployeeWithEmail` um `commission_rate: number` erweitert
- `src/components/admin/EmployeeList.tsx` — neue Spalte "Provision" mit Inline-Edit (Klick auf %-Wert öffnet Zahlenfeld)
- `src/components/admin/SummaryBar.tsx` — zeigt unterhalb der Gesamtsumme eine Provisionsabrechnung-Tabelle (Umsatz / Provision in CHF / Admin-Anteil) pro Mitarbeitenden; bei mehreren Mitarbeitenden zusätzlich eine Gesamtzeile
- `src/app/admin/dashboard/page.tsx` — übergibt `employees` an `SummaryBar`

### Übersetzungen (DE / EN / VI)
Neue Keys: `admin.employees.commission_rate`, `admin.employees.commission_saved`, `admin.summary.commission_breakdown`, `admin.summary.revenue`, `admin.summary.commission_col`, `admin.summary.admin_share`

## Verhalten
- Standard-Provision: 50%
- SummaryBar zeigt Abrechnung nur wenn Mitarbeitende mit Einträgen im aktuellen Filter vorhanden sind
- Admin-Spalte = Umsatz − Provision
- Provision speichern via PATCH `/api/admin/update-commission`

## Deployment
- Commit `c59fe23` auf `main` gepusht → Vercel Auto-Deploy
- DB-Migration manuell im Supabase SQL Editor ausgeführt

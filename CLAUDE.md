# CLAUDE.md — Fairy Nails App

## Projektübersicht

Eine interne Web-App für den Beauty- und Nagelsalon **Fairy Nails** in der Schweiz.
Mitarbeitende erfassen ihre erbrachten Leistungen. Admins sehen alle Daten, können filtern und exportieren.

**Produktionsurl:** wird auf Vercel gehostet, verknüpft mit der Wix-Landingpage via Link `/intern`
**Tech Stack:** Next.js 14 (App Router), Supabase (Auth + PostgreSQL + RLS), Tailwind CSS, next-i18next, jsPDF

---

## Design-System

### Farben (warme Töne, Beauty-Salon)
```css
--color-bg:           #FDF6F0   /* warmes Off-White */
--color-surface:      #FFF8F3   /* Kartenoberfläche */
--color-primary:      #C97D6E   /* gedämpftes Rosé-Terrakotta */
--color-primary-dark: #A85F52   /* Hover/Akzent */
--color-secondary:    #E8C4B0   /* helles Apricot */
--color-accent:       #8B4A6B   /* Pflaume für CTAs */
--color-text:         #3D2B2B   /* dunkles Warmbraun */
--color-text-muted:   #8A6A6A   /* gedämpft */
--color-border:       #E5D0C5   /* zarte Trennlinie */
--color-error:        #C0392B
--color-success:      #5D8A5E
```

### Typografie
- Display/Headings: `Cormorant Garamond` (Google Fonts, elegant, feminin)
- Body/UI: `DM Sans` (Google Fonts, lesbar, modern)

### Logo / Branding
- Name: **Fairy Nails** mit kleinem ✨ Emoji oder SVG-Stern
- Farbe: `--color-accent` (#8B4A6B)

---

## Authentifizierung

- Supabase Auth (Email + Passwort)
- Zwei Rollen: `admin` und `employee`
- Rolle wird in `profiles`-Tabelle gespeichert (nicht im JWT direkt)
- Nach Login: Weiterleitung basierend auf Rolle
  - Admin → `/admin/dashboard`
  - Mitarbeiter → `/employee/dashboard`
- Geschützte Routen via Next.js Middleware (`middleware.ts`)

---

## Mehrsprachigkeit

- Bibliothek: `next-i18next`
- Sprachen: `de` (Deutsch), `en` (Englisch), `vi` (Vietnamesisch)
- Standardsprache: `de`
- Sprachauswahl: pro User in `profiles.language` gespeichert, beim Login geladen
- Übersetzungsdateien: `/public/locales/de/common.json`, `/en/`, `/vi/`

---

## Datenbankschema (Supabase / PostgreSQL)

Vollständiges Schema: siehe `docs/schema.sql`

### Tabellen-Übersicht
- `profiles` — Userdaten (Rolle, Name, Sprache)
- `service_categories` — Maniküre / Pediküre / Face
- `services` — 47 Services mit Preis und Kategorie
- `entries` — Erfasste Leistungen der Mitarbeitenden
- `payment_methods` — Enum-Tabelle (Cash, Twint, Credit Card)

### Row Level Security (RLS)
- `entries`: Mitarbeitende sehen/bearbeiten **nur eigene** Einträge
- Admin sieht **alle** Einträge
- `profiles`: User sieht nur eigenes Profil; Admin sieht alle
- `services` / `service_categories`: Alle können lesen (read-only für Employees)

---

## Projektstruktur

Vollständige Struktur: siehe `docs/project-structure.md`

### Wichtigste Verzeichnisse
```
/app              → Next.js App Router Pages
/components       → Wiederverwendbare UI-Komponenten
/lib              → Supabase-Client, Helpers
/public/locales   → Übersetzungsdateien
/docs             → Schema, Struktur, diese Datei
```

---

## Seiten & Features

### `/` → Login
- Fairy Nails Branding
- Email + Passwort Login
- Sprachauswahl (DE / EN / VI)
- Weiterleitung nach Rolle

### `/employee/dashboard`
- Erfassungsformular (Datum, Zeit von-bis, Service-Dropdown, Betrag, Zahlungsart)
- Tabelle der eigenen Einträge (sortierbar, bearbeitbar)
- Inline-Edit: Klick auf Zeile öffnet Edit-Modal
- Sprachauswahl oben rechts
- Logout

### `/admin/dashboard`
- Übersichtstabelle ALLER Einträge
- Filter-Panel:
  - Nach Mitarbeiter (Dropdown)
  - Nach Zeitraum (Woche / Monat / Jahr / Individuell mit Datepicker)
  - Nach Zahlungsart (Cash / Twint / Credit Card)
  - Nach Service-Kategorie und/oder einzelnem Service
  - Filter kombinierbar
- Summen-Zeile: Gesamtbetrag der gefilterten Ansicht
- Export-Button → PDF mit aktuellem Filter und Tabellenlayout
- Mitarbeiterverwaltung: Hinzufügen / Deaktivieren

### `/admin/employees`
- Liste aller Mitarbeitenden (Name, Email, Status, Sprache)
- Neuen Mitarbeitenden anlegen (Modal: Name, Email, Passwort, Rolle)
- Mitarbeitenden deaktivieren (kein Löschen — nur `is_active = false`)

---

## Erfassungsformular — Feldlogik

| Feld | Typ | Details |
|------|-----|---------|
| Datum | Date picker | Default: heute |
| Zeit von | Time picker | HH:MM |
| Zeit bis | Time picker | HH:MM, muss nach "von" liegen |
| Kategorie | Dropdown (Stufe 1) | Maniküre / Pediküre / Face |
| Service | Dropdown (Stufe 2) | Gefiltert nach gewählter Kategorie |
| Betrag | Number input | Vorausgefüllt mit Standardpreis des Services, überschreibbar |
| Zahlungsart | Dropdown | Cash / Twint / Credit Card |

**Hinweis:** Betrag bei "Extra Verlängerung" hat Standardpreis 10 (Minimalwert), aber Feld ist offen.

---

## Services-Daten (hardcoded Seed)

Die 47 Services werden via `supabase seed` oder SQL-Insert einmalig eingespielt.
Seed-Datei: `docs/seed.sql`

Kategorien:
- `Maniküre` (24 Services)
- `Pediküre` (7 Services)
- `Face` (16 Services)

---

## PDF-Export

- Bibliothek: `jsPDF` + `jspdf-autotable`
- Inhalt: Gefilterter Zeitraum, Mitarbeitername(n), alle gefilterten Einträge als Tabelle
- Header: Fairy Nails Logo (Text), Datum des Exports, aktive Filter
- Footer: Gesamtsumme, Aufschlüsselung nach Zahlungsart
- Format: A4, Hochformat

---

## Umgebungsvariablen (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx   # nur server-side, nie im Client!
```

---

## Entwicklungsreihenfolge (empfohlen)

1. Supabase-Projekt anlegen, Schema + Seed ausführen, RLS aktivieren
2. Next.js Projekt initialisieren, Tailwind + Supabase-Client konfigurieren
3. Login-Seite + Auth-Middleware
4. Employee Dashboard: Erfassungsformular
5. Employee Dashboard: Eigene Einträge Tabelle + Edit
6. Admin Dashboard: Tabelle + Filter
7. Admin Dashboard: PDF-Export
8. Admin: Mitarbeiterverwaltung
9. Mehrsprachigkeit (i18n) integrieren
10. Responsiveness prüfen (Mobile, Tablet, Desktop)
11. Deployment auf Vercel + Supabase (EU-Region Frankfurt)

---

## Wichtige Konventionen

- **Keine hardcodierten Texte** im JSX — immer über `useTranslation()`
- **Kein direkter Supabase-Aufruf** im Client für Admin-Operationen — via `/api/`-Routes mit Service-Role-Key
- **Datumsformat:** immer `dd.MM.yyyy` (Schweizer Standard) in der UI, ISO 8601 in der DB
- **Beträge:** immer in CHF, 2 Dezimalstellen, Trennzeichen `.`
- **Komponenten:** PascalCase, eine Komponente pro Datei
- **Server Components** wo möglich, Client Components nur wenn nötig (`"use client"`)

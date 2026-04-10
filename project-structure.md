# Fairy Nails — Projektstruktur (Next.js 14, App Router)

## Initialisierung

```bash
npx create-next-app@latest fairy-nails \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd fairy-nails

# Abhängigkeiten installieren
npm install @supabase/supabase-js @supabase/ssr
npm install next-i18next react-i18next i18next
npm install jspdf jspdf-autotable
npm install date-fns
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-dropdown-menu
npm install lucide-react
npm install clsx tailwind-merge
```

---

## Verzeichnisstruktur

```
fairy-nails/
│
├── CLAUDE.md                          ← Master-Instruktionen für Claude Code
│
├── docs/
│   ├── schema.sql                     ← Supabase Datenbankschema + Seed
│   └── project-structure.md           ← Diese Datei
│
├── public/
│   ├── locales/
│   │   ├── de/
│   │   │   └── common.json            ← Deutsche Übersetzungen
│   │   ├── en/
│   │   │   └── common.json            ← Englische Übersetzungen
│   │   └── vi/
│   │       └── common.json            ← Vietnamesische Übersetzungen
│   └── favicon.ico
│
├── src/
│   │
│   ├── app/                           ← Next.js App Router
│   │   │
│   │   ├── layout.tsx                 ← Root Layout (Fonts, Providers)
│   │   ├── globals.css                ← CSS-Variablen, Tailwind
│   │   ├── page.tsx                   ← Redirect → /login
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx               ← Login-Seite (öffentlich)
│   │   │
│   │   ├── employee/
│   │   │   ├── layout.tsx             ← Employee-Layout (Auth-Guard, Navbar)
│   │   │   └── dashboard/
│   │   │       └── page.tsx           ← Erfassungsformular + eigene Einträge
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx             ← Admin-Layout (Auth-Guard, Navbar)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx           ← Admin-Übersicht, Filter, Export
│   │   │   └── employees/
│   │   │       └── page.tsx           ← Mitarbeiterverwaltung
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   └── callback/
│   │       │       └── route.ts       ← Supabase Auth Callback
│   │       └── admin/
│   │           ├── create-employee/
│   │           │   └── route.ts       ← POST: Neuen Employee anlegen
│   │           └── deactivate-employee/
│   │               └── route.ts       ← POST: Employee deaktivieren
│   │
│   ├── components/
│   │   │
│   │   ├── ui/                        ← Basis-Komponenten
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx              ← Zahlungsart-Badge (Cash/Twint/CC)
│   │   │   └── Spinner.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Navbar.tsx             ← Navigation (Logo, User-Info, Logout, Sprache)
│   │   │   └── LanguageSwitcher.tsx   ← DE / EN / VI Umschalter
│   │   │
│   │   ├── employee/
│   │   │   ├── EntryForm.tsx          ← Erfassungsformular
│   │   │   ├── EntryTable.tsx         ← Tabelle eigener Einträge
│   │   │   └── EditEntryModal.tsx     ← Edit-Modal für bestehende Einträge
│   │   │
│   │   └── admin/
│   │       ├── FilterPanel.tsx        ← Alle Filter kombiniert
│   │       ├── AdminEntryTable.tsx    ← Tabelle aller Einträge
│   │       ├── SummaryBar.tsx         ← Gesamtsumme + Aufschlüsselung
│   │       ├── ExportButton.tsx       ← PDF-Export auslösen
│   │       ├── EmployeeList.tsx       ← Mitarbeiterliste
│   │       └── AddEmployeeModal.tsx   ← Neuen MA anlegen
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              ← Browser-Client (anon key)
│   │   │   ├── server.ts              ← Server-Client (für Server Components)
│   │   │   └── admin.ts              ← Admin-Client (service role key, nur server)
│   │   ├── pdf/
│   │   │   └── exportEntries.ts       ← jsPDF Export-Logik
│   │   ├── i18n/
│   │   │   └── config.ts              ← next-i18next Konfiguration
│   │   └── utils.ts                   ← clsx/twMerge, Datumsformatierung, etc.
│   │
│   ├── hooks/
│   │   ├── useUser.ts                 ← Aktueller User + Rolle
│   │   ├── useEntries.ts              ← Einträge laden (Employee)
│   │   ├── useAdminEntries.ts         ← Einträge laden mit Filtern (Admin)
│   │   └── useServices.ts             ← Services nach Kategorie
│   │
│   ├── types/
│   │   └── database.ts                ← TypeScript-Typen (generiert via Supabase CLI)
│   │
│   └── middleware.ts                  ← Auth-Guard: schützt /employee/* und /admin/*
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── next-i18next.config.js
└── .env.local                         ← Supabase Keys (nicht committen!)
```

---

## Schlüsseldateien — Inhalte

### `middleware.ts`
```typescript
// Schützt alle Routen unter /employee und /admin
// Liest Session aus Supabase Cookie
// Leitet nicht-authentifizierte User zu /login weiter
// Leitet Employee, der /admin aufruft, zu /employee/dashboard weiter
```

### `src/lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `src/lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
// Für Server Components und Route Handlers
```

### `src/lib/supabase/admin.ts`
```typescript
import { createClient } from '@supabase/supabase-js'
// Verwendet SUPABASE_SERVICE_ROLE_KEY
// NUR in /api/-Routes verwenden, nie im Client!
```

### `next-i18next.config.js`
```javascript
module.exports = {
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en', 'vi'],
  },
}
```

---

## Umgebungsvariablen (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Wichtig:** `.env.local` zu `.gitignore` hinzufügen (standardmäßig von Next.js bereits erledigt).

---

## Deployment (Vercel)

1. GitHub-Repo erstellen, Code pushen
2. Vercel → New Project → GitHub-Repo auswählen
3. Environment Variables in Vercel eintragen (dieselben wie `.env.local`)
4. Deploy → automatisch bei jedem Push auf `main`

**Supabase:**
- Projekt in Region `eu-central-1` (Frankfurt) anlegen
- Schema via SQL Editor ausführen
- Auth → Email/Password aktivieren
- RLS ist per Schema bereits aktiviert

**Link auf Wix:**
- Einfacher Hyperlink auf `https://fairy-nails.vercel.app/login`
- Oder Custom Domain: `app.fairynails.ch` → Vercel DNS-Einstellungen

---

## Entwicklungsreihenfolge

### Phase 1 — Fundament
- [ ] Next.js + Supabase Setup
- [ ] Schema + Seed in Supabase ausführen
- [ ] Auth Middleware
- [ ] Login-Seite

### Phase 2 — Employee
- [ ] `EntryForm.tsx` — Erfassungsformular
- [ ] `EntryTable.tsx` — Eigene Einträge
- [ ] `EditEntryModal.tsx` — Bearbeiten

### Phase 3 — Admin
- [ ] `AdminEntryTable.tsx` — Alle Einträge
- [ ] `FilterPanel.tsx` — Alle Filter
- [ ] `SummaryBar.tsx` — Summen
- [ ] `ExportButton.tsx` + PDF-Logik

### Phase 4 — Mitarbeiterverwaltung
- [ ] `EmployeeList.tsx`
- [ ] `AddEmployeeModal.tsx`
- [ ] API Routes (`/api/admin/...`)

### Phase 5 — Mehrsprachigkeit
- [ ] Alle Texte in Übersetzungsdateien auslagern
- [ ] `LanguageSwitcher.tsx`
- [ ] Vietnamesische Übersetzung prüfen lassen

### Phase 6 — Polish
- [ ] Responsive Design (Mobile/Tablet/Desktop)
- [ ] Error Handling + Loading States
- [ ] Final Deployment + Tests
```

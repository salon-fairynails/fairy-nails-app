-- ============================================================
-- FAIRY NAILS — Supabase Schema
-- Ausführen im Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";


-- ============================================================
-- 2. ENUM: Zahlungsarten
-- ============================================================
create type payment_method_enum as enum ('cash', 'twint', 'credit_card');


-- ============================================================
-- 3. TABELLE: profiles
-- Erweitert Supabase Auth-User um Rolle, Name, Sprache
-- ============================================================
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  role          text not null check (role in ('admin', 'employee')),
  language      text not null default 'de' check (language in ('de', 'en', 'vi')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- RLS
alter table profiles enable row level security;

create policy "User kann eigenes Profil lesen"
  on profiles for select
  using (auth.uid() = id);

create policy "Admin kann alle Profile lesen"
  on profiles for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "User kann eigenes Profil updaten"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admin kann alle Profile updaten"
  on profiles for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ============================================================
-- 4. TABELLE: service_categories
-- ============================================================
create table service_categories (
  id    serial primary key,
  name  text not null unique   -- 'Maniküre', 'Pediküre', 'Face'
);

-- RLS: alle authentifizierten User dürfen lesen
alter table service_categories enable row level security;

create policy "Alle können Kategorien lesen"
  on service_categories for select
  using (auth.role() = 'authenticated');


-- ============================================================
-- 5. TABELLE: services
-- ============================================================
create table services (
  id              serial primary key,
  category_id     int not null references service_categories(id),
  name            text not null,
  default_price   numeric(10,2),   -- null wenn "ab x" (z.B. Extra Verlängerung)
  price_label     text,            -- z.B. "ab 10" für Freitext-Preise
  is_active       boolean not null default true
);

-- RLS
alter table services enable row level security;

create policy "Alle können Services lesen"
  on services for select
  using (auth.role() = 'authenticated');


-- ============================================================
-- 6. TABELLE: entries
-- Erfasste Leistungen der Mitarbeitenden
-- ============================================================
create table entries (
  id               uuid primary key default uuid_generate_v4(),
  employee_id      uuid not null references profiles(id),
  service_id       int not null references services(id),
  entry_date       date not null,
  time_from        time not null,
  time_to          time not null,
  amount           numeric(10,2) not null,
  payment_method   payment_method_enum not null,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint time_order check (time_to > time_from)
);

-- Index für häufige Abfragen
create index entries_employee_id_idx on entries(employee_id);
create index entries_entry_date_idx on entries(entry_date);
create index entries_payment_method_idx on entries(payment_method);

-- Auto-Update von updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger entries_updated_at
  before update on entries
  for each row execute procedure update_updated_at();

-- RLS
alter table entries enable row level security;

create policy "Employee sieht nur eigene Einträge"
  on entries for select
  using (auth.uid() = employee_id);

create policy "Employee kann eigene Einträge erstellen"
  on entries for insert
  with check (auth.uid() = employee_id);

create policy "Employee kann eigene Einträge bearbeiten"
  on entries for update
  using (auth.uid() = employee_id)
  with check (auth.uid() = employee_id);

create policy "Admin sieht alle Einträge"
  on entries for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admin kann alle Einträge bearbeiten"
  on entries for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admin kann Einträge löschen"
  on entries for delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ============================================================
-- 7. SEED: Kategorien
-- ============================================================
insert into service_categories (name) values
  ('Maniküre'),
  ('Pediküre'),
  ('Face');


-- ============================================================
-- 8. SEED: Services
-- ============================================================

-- Maniküre (category_id = 1)
insert into services (category_id, name, default_price, price_label) values
  (1, 'Neumodellage Gel Set',                        90.00, null),
  (1, 'Neumodellage GEL DUAL FORM',                  90.00, null),
  (1, 'Neumodellage Acryl Set',                      90.00, null),
  (1, 'Auffüllen Acryl',                             75.00, null),
  (1, 'Auffüllen Gel',                               75.00, null),
  (1, 'Auffüllen Dual Form',                         75.00, null),
  (1, 'Spa Luxury Fairy Manicure with BIAB',        120.00, null),
  (1, 'BIAB GEL',                                    85.00, null),
  (1, 'BIAB Gel Natur',                              75.00, null),
  (1, 'Spa Luxury Fairy Manicure',                   95.00, null),
  (1, 'Maniküre permanent mit Gellack',              60.00, null),
  (1, 'Maniküre Shine Fairy (Nagellack)',            60.00, null),
  (1, 'Basic Maniküre für den Mann',                 50.00, null),
  (1, 'Basic Maniküre',                              50.00, null),
  (1, 'Fremdmodellage Entfernen',                    70.00, null),
  (1, 'French weiss',                                10.00, null),
  (1, 'Chrome',                                      10.00, null),
  (1, 'Nail Art (pro Nagel)',                         3.00, null),
  (1, 'Extra Verlängerung',                          10.00, 'ab 10'),
  (1, 'Nagelreparatur',                              10.00, null),
  (1, 'Dekoration (Set)',                            30.00, null),
  (1, 'Ablösen Acryl/Gel/BIAB',                      40.00, null),
  (1, 'Ablösen Gellack',                             30.00, null),
  (1, 'Ablösen Gellack aus einem anderen Studio',    45.00, null);

-- Pediküre (category_id = 2)
insert into services (category_id, name, default_price, price_label) values
  (2, 'Deluxe Pediküre mit Gellack',                 80.00, null),
  (2, 'Spa Signature Pediküre mit Gellack',          95.00, null),
  (2, 'Fuss Gellack / Nagellack Entfernen',          50.00, null),
  (2, 'Fussnagel Gellack Lackieren',                 65.00, null),
  (2, 'Fuss Acryl/Gel Verlängerung',                 80.00, null),
  (2, 'Deluxe Pediküre mit Nagellack',               80.00, null),
  (2, 'Deluxe Pediküre ohne Lack',                   75.00, null);

-- Face (category_id = 3)
insert into services (category_id, name, default_price, price_label) values
  (3, 'Verlängerung Neu Natur 1:1',                 120.00, null),
  (3, 'Verlängerung Neu Volume',                    150.00, null),
  (3, 'Verlängerung Neu MegaVolume',                185.00, null),
  (3, 'Auffüllen Natur ab 2–3 Wochen',               70.00, null),
  (3, 'Auffüllen Volume ab 2–3 Wochen',              80.00, null),
  (3, 'Wimpern Ablösen',                             50.00, null),
  (3, 'Auffüllen MegaVolume 5D ab 2–3 Wochen',     120.00, null),
  (3, 'Auffüllen erste Mal bei FairyNails',         150.00, null),
  (3, 'Auffüllen Volume ab 4 Wochen',               100.00, null),
  (3, 'Permanent MakeUp Augenbrauen',               480.00, null),
  (3, 'Augenbrauen Zupfen',                          20.00, null),
  (3, 'Brow Lamination – Augenbrauenlifting',        80.00, null),
  (3, 'Brow Lamination Deluxe – färben & waxing',  125.00, null),
  (3, 'Wimpern & Augenbrauen färben',                90.00, null),
  (3, 'Wimpernlifting & färben',                     80.00, null),
  (3, 'Augenbrauen färben',                          70.00, null);


-- ============================================================
-- 9. HILFSFUNKTION: is_admin() — verhindert RLS-Rekursion
-- security definer = läuft als postgres, umgeht RLS beim Lesen von profiles
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;


-- ============================================================
-- 10. FUNKTION: Neuen Mitarbeitenden anlegen (Admin only)
-- Wird via /api/admin/create-employee aufgerufen (Service Role Key)
-- ============================================================
-- Diese Funktion wird server-side via Supabase Admin Client aufgerufen.
-- Ablauf:
-- 1. supabaseAdmin.auth.admin.createUser({ email, password })
-- 2. Insert in profiles (id = neue user.id, full_name, role='employee', language)
-- Kein direkter SQL-Aufruf nötig.


-- ============================================================
-- FERTIG
-- ============================================================
-- Schema-Version: 1.0
-- Erstellt für: Fairy Nails Salon, Bern/Schweiz
-- ============================================================

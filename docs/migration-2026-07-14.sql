-- ============================================================
-- MIGRATION 2026-07-14: Nachrichtenfunktion (Admin <-> Mitarbeitende)
-- Ausführen im Supabase SQL Editor
-- ============================================================

create table messages (
  id            uuid primary key default uuid_generate_v4(),
  sender_id     uuid not null references profiles(id) on delete cascade,
  recipient_id  uuid references profiles(id) on delete cascade,
  is_broadcast  boolean not null default false,
  content       text not null,
  read_at       timestamptz,
  created_at    timestamptz not null default now(),

  constraint broadcast_consistency check (not is_broadcast or recipient_id is null)
);

create index messages_recipient_id_idx on messages(recipient_id);
create index messages_sender_id_idx on messages(sender_id);
create index messages_created_at_idx on messages(created_at);

alter table messages enable row level security;

-- Sichtbar für: Absender, Empfänger, Admins (sehen alles), oder alle Mitarbeitenden bei Broadcasts
create policy "messages_select"
  on messages for select
  using (
    auth.uid() = sender_id
    or auth.uid() = recipient_id
    or is_admin()
    or (
      recipient_id is null
      and is_broadcast
      and exists (
        select 1 from profiles s
        where s.id = messages.sender_id and s.role = 'admin'
      )
    )
  );

-- Admin darf an jeden/broadcasten; Mitarbeiter darf nur ans Admin-Team (recipient_id null, kein Broadcast)
create policy "messages_insert"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and (
      is_admin()
      or (recipient_id is null and not is_broadcast)
    )
  );

-- Als gelesen markieren: Empfänger selbst oder ein Admin (Admin-Team-Postfach)
create policy "messages_update_read"
  on messages for update
  using (auth.uid() = recipient_id or is_admin())
  with check (auth.uid() = recipient_id or is_admin());

-- ============================================================
-- FERTIG
-- ============================================================

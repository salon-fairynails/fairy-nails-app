-- ============================================================
-- FAIRY NAILS — Migration 2026-06-24
-- Ausführen im Supabase SQL Editor
-- ============================================================

-- 1. Farbe (color) Spalte in profiles hinzufügen
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS color text;

-- 2. Zahlungsart "Gutschein" zum Enum hinzufügen
-- Hinweis: ADD VALUE kann nicht in einer Transaktion ausgeführt werden
ALTER TYPE payment_method_enum ADD VALUE IF NOT EXISTS 'voucher';

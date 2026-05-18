-- Migration: Add commission_rate to profiles
-- Run this in the Supabase SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 50;

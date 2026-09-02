-- Migración: Añadir campos extendidos business_model y risks_guarantees a public.projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS business_model TEXT,
ADD COLUMN IF NOT EXISTS risks_guarantees TEXT,
ADD COLUMN IF NOT EXISTS legal_documents JSONB DEFAULT '[]'::jsonb;

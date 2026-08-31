-- Migration: 20260831000001_project_extended_fields.sql
-- Description: Añadir campos dinámicos extendidos para la PDP de Proyectos (Descripción, Modelo de Negocio, Garantías, Imagen, Documentos)

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS business_model TEXT,
  ADD COLUMN IF NOT EXISTS risks_guarantees TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS legal_documents JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS timeline_steps JSONB DEFAULT '[]'::jsonb;

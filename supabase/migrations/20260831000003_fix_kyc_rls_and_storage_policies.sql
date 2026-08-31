-- Migration: 20260831000003_fix_kyc_rls_and_storage_policies.sql
-- Description: Fix RLS policies for kyc_documents table and storage.objects bucket kyc-private

-- 1. Actualizar RLS en public.kyc_documents con SELECT, INSERT (WITH CHECK), UPDATE explícitos
DROP POLICY IF EXISTS "Usuarios gestionan sus propios documentos KYC" ON public.kyc_documents;
DROP POLICY IF EXISTS "Usuarios leen sus propios documentos KYC" ON public.kyc_documents;
DROP POLICY IF EXISTS "Usuarios insertan sus propios documentos KYC" ON public.kyc_documents;
DROP POLICY IF EXISTS "Usuarios actualizan sus propios documentos KYC" ON public.kyc_documents;

CREATE POLICY "Usuarios leen sus propios documentos KYC" ON public.kyc_documents
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin() OR public.is_auditor());

CREATE POLICY "Usuarios insertan sus propios documentos KYC" ON public.kyc_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Usuarios actualizan sus propios documentos KYC" ON public.kyc_documents
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- 2. Asegurar que el bucket 'kyc-private' exista en storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-private', 'kyc-private', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Crear políticas RLS en storage.objects para el bucket 'kyc-private'
DROP POLICY IF EXISTS "Usuarios suben archivos a kyc-private" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios ven sus archivos en kyc-private" ON storage.objects;

CREATE POLICY "Usuarios suben archivos a kyc-private" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kyc-private' 
    AND (auth.role() = 'authenticated' OR public.is_admin())
  );

CREATE POLICY "Usuarios ven sus archivos en kyc-private" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-private' 
    AND (auth.role() = 'authenticated' OR public.is_admin())
  );

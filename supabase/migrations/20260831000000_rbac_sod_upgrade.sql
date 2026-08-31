-- Migration: 20260831000000_rbac_sod_upgrade.sql
-- Description: Production-grade RBAC, Separation of Duties (SoD), Withdrawal Approval Workflow, Account Freezing, Audit Logging & Strict RLS

-- 1. Crear ENUMS para Estados de Cuenta, Solicitudes de Retiro y Ciclo de Vida de Proyectos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE account_status AS ENUM ('active', 'suspended', 'frozen');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'withdrawal_status') THEN
    CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
  END IF;
END $$;

-- 2. Añadir columna status a la tabla profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS status account_status DEFAULT 'active';

-- 3. Crear tabla de Solicitudes de Retiro Fiat (withdrawal_requests)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'XAF',
  phone_number TEXT NOT NULL,
  payment_method TEXT DEFAULT 'Mobile Money',
  status withdrawal_status DEFAULT 'pending',
  reference_code TEXT UNIQUE NOT NULL,
  approved_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla de Logs de Auditoría (audit_logs - Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear tabla de Configuración Global de la Plataforma (platform_settings)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuraciones globales semilla
INSERT INTO public.platform_settings (key, value)
VALUES
  ('withdrawal_fee_percent', '{"value": 1.5}'::jsonb),
  ('min_withdrawal_amount', '{"value": 2000}'::jsonb),
  ('max_daily_withdrawal', '{"value": 5000000}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6. Funciones Helper para evaluación de Roles y Seguridad (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_auditor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'auditor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_investor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'investor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_active_account(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = target_user_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 7. POLÍTICAS ROW LEVEL SECURITY (RLS) ESTRICTAS

-- Habilitar RLS en nuevas tablas
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 7.1 Políticas para withdrawal_requests
DROP POLICY IF EXISTS "Inversores leen sus propios retiros" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Inversores activos crean solicitudes de retiro" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins y Auditores leen todas las solicitudes de retiro" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins aprueban o rechazan retiros" ON public.withdrawal_requests;

CREATE POLICY "Inversores leen sus propios retiros" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Inversores activos crean solicitudes de retiro" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND public.is_investor() 
    AND public.is_active_account(auth.uid())
  );

CREATE POLICY "Admins y Auditores leen todas las solicitudes de retiro" ON public.withdrawal_requests
  FOR SELECT USING (public.is_admin() OR public.is_auditor());

CREATE POLICY "Admins aprueban o rechazan retiros" ON public.withdrawal_requests
  FOR UPDATE USING (public.is_admin());

-- 7.2 Políticas para audit_logs (Strict Read-Only Auditor, Admin Writer)
DROP POLICY IF EXISTS "Admins insertan logs de auditoria" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins y Auditores ven logs de auditoria" ON public.audit_logs;

CREATE POLICY "Admins insertan logs de auditoria" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins y Auditores ven logs de auditoria" ON public.audit_logs
  FOR SELECT USING (public.is_admin() OR public.is_auditor());

-- 7.3 Políticas para platform_settings
DROP POLICY IF EXISTS "Todos leen la configuracion global" ON public.platform_settings;
DROP POLICY IF EXISTS "Solo admins modifican configuracion global" ON public.platform_settings;

CREATE POLICY "Todos leen la configuracion global" ON public.platform_settings
  FOR SELECT USING (true);

CREATE POLICY "Solo admins modifican configuracion global" ON public.platform_settings
  FOR ALL USING (public.is_admin());

-- 7.4 Actualizar políticas de transactions para Separación de Funciones (SoD)
DROP POLICY IF EXISTS "Inversores crean sus propios movimientos" ON public.transactions;
DROP POLICY IF EXISTS "Admins y Auditores leen todas las transacciones" ON public.transactions;

CREATE POLICY "Inversores crean sus propios movimientos" ON public.transactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND public.is_investor() 
    AND public.is_active_account(auth.uid())
  );

CREATE POLICY "Admins y Auditores leen todas las transacciones" ON public.transactions
  FOR SELECT USING (public.is_admin() OR public.is_auditor());

-- 7.5 Actualizar políticas de profiles para control de estado
DROP POLICY IF EXISTS "Auditores leen todos los perfiles" ON public.profiles;

CREATE POLICY "Auditores leen todos los perfiles" ON public.profiles
  FOR SELECT USING (public.is_auditor());

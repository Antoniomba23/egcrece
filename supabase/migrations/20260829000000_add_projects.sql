-- Tabla de Proyectos de Inversión
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL CHECK (target_amount > 0),
  raised_amount DECIMAL(15,2) DEFAULT 0.00 CHECK (raised_amount >= 0),
  expected_return DECIMAL(5,2) NOT NULL CHECK (expected_return > 0),
  duration_months INT NOT NULL CHECK (duration_months > 0),
  risk_level TEXT NOT NULL DEFAULT 'Moderado',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar proyectos semilla iniciales
INSERT INTO public.projects (title, category, location, target_amount, raised_amount, expected_return, duration_months, risk_level)
VALUES
  ('Expansión Agrícola Bioko Norte', 'Agroindustria', 'Malabo, Guinea Ecuatorial', 50000000.00, 32500000.00, 10.50, 18, 'Bajo'),
  ('Parque Solar Fotovoltaico Bata', 'Energía Renovable', 'Bata, Región Continental', 120000000.00, 84000000.00, 12.00, 24, 'Moderado'),
  ('Centro Logístico Puerto de Malabo', 'Infraestructura', 'Puerto de Malabo', 85000000.00, 41000000.00, 9.20, 12, 'Bajo')
ON CONFLICT DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Cualquiera ve proyectos activos" ON public.projects;
DROP POLICY IF EXISTS "Solo admins crean y editan proyectos" ON public.projects;

CREATE POLICY "Cualquiera ve proyectos activos" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "Solo admins crean y editan proyectos" ON public.projects
  FOR ALL USING (public.is_admin());

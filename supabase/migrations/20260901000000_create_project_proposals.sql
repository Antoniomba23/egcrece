-- Migration: Create project_proposals table for crowdfunding applications
CREATE TABLE IF NOT EXISTS public.project_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    promoter_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
    promoter_contribution NUMERIC DEFAULT 0,
    expected_return NUMERIC NOT NULL CHECK (expected_return >= 0),
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    description TEXT NOT NULL,
    business_model TEXT,
    risks_guarantees TEXT,
    dossier_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.project_proposals ENABLE ROW LEVEL SECURITY;

-- Policies for public.project_proposals
CREATE POLICY "Anyone can submit a project proposal"
ON public.project_proposals
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Promoters can view their own proposals"
ON public.project_proposals
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Admins can update project proposals"
ON public.project_proposals
FOR UPDATE
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

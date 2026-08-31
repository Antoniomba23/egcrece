-- Migration: Add kyc_attempts to profiles and triple photo columns to kyc_documents

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kyc_attempts INT DEFAULT 0;

ALTER TABLE public.kyc_documents
ADD COLUMN IF NOT EXISTS front_file_url TEXT,
ADD COLUMN IF NOT EXISTS back_file_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_file_url TEXT,
ADD COLUMN IF NOT EXISTS ai_score INT,
ADD COLUMN IF NOT EXISTS attempts_count INT DEFAULT 1;

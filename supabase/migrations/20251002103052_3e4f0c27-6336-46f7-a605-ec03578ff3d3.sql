-- Add missing columns to match code expectations

-- Add description column to classes table
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS description TEXT;

-- Add full_name and avatar_url to teachers table
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add full_name and avatar_url to students table  
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
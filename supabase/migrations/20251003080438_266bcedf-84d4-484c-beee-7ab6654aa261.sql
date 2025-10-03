-- Create the app_role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant SELECT permission on departments table for anonymous users
GRANT SELECT ON public.departments TO anon;
GRANT SELECT ON public.departments TO authenticated;

-- Grant SELECT permission on campuses table
GRANT SELECT ON public.campuses TO anon;
GRANT SELECT ON public.campuses TO authenticated;
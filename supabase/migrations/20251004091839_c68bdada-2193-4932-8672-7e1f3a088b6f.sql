-- Fix role type mismatch in users table
-- Change users.role from user_role to app_role to match the rest of the system

-- First, alter the column to use app_role type
ALTER TABLE public.users 
ALTER COLUMN role TYPE app_role 
USING role::text::app_role;
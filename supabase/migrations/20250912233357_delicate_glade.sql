/*
# Fix RLS infinite recursion between classes and class_enrollments

This migration resolves the infinite recursion error that occurs when fetching classes
due to circular dependencies in Row Level Security policies.

## Changes Made

1. **Drop problematic RLS policies**: Remove the existing policies that cause recursion
2. **Create security definer function**: Add a function to safely check teacher permissions
3. **Create new RLS policies**: Implement non-recursive policies using the security definer function

## Security Impact

- Maintains the same security model
- Prevents infinite recursion
- Uses SECURITY DEFINER function to bypass RLS when checking permissions
*/

-- Drop the existing problematic RLS policies
DROP POLICY IF EXISTS "Enrolled users can view classes" ON public.classes;
DROP POLICY IF EXISTS "Users can view enrollments for their classes" ON public.class_enrollments;

-- Create a SECURITY DEFINER function to check if user is teacher of a class
-- This function bypasses RLS to prevent recursion
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(class_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM classes 
    WHERE id = class_id AND teacher_id = user_id
  );
END;
$$;

-- Create a SECURITY DEFINER function to check if user is enrolled in a class
-- This function bypasses RLS to prevent recursion
CREATE OR REPLACE FUNCTION public.is_enrolled_in_class(class_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM class_enrollments 
    WHERE class_id = is_enrolled_in_class.class_id AND user_id = is_enrolled_in_class.user_id
  );
END;
$$;

-- Create new RLS policy for classes that doesn't cause recursion
CREATE POLICY "Users can view classes they are enrolled in or teach" ON public.classes
FOR SELECT USING (
  -- User is the teacher of this class
  teacher_id = auth.uid() OR
  -- User is enrolled in this class (using security definer function)
  public.is_enrolled_in_class(id, auth.uid())
);

-- Create new RLS policy for class_enrollments that doesn't cause recursion
CREATE POLICY "Users can view their own enrollments and teachers can view their class enrollments" ON public.class_enrollments
FOR SELECT USING (
  -- User can see their own enrollments
  user_id = auth.uid() OR
  -- Teachers can see enrollments for their classes (using security definer function)
  public.is_teacher_of_class(class_id, auth.uid())
);

-- Grant execute permissions on the functions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_teacher_of_class(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_enrolled_in_class(UUID, UUID) TO authenticated;
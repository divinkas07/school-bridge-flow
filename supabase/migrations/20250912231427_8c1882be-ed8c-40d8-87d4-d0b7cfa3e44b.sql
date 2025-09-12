-- Add new fields to classes table for complete class management
ALTER TABLE public.classes 
ADD COLUMN credits INTEGER DEFAULT 1,
ADD COLUMN duration_hours INTEGER DEFAULT 1,
ADD COLUMN max_students INTEGER DEFAULT 30,
ADD COLUMN semesters INTEGER[] DEFAULT ARRAY[1],
ADD COLUMN departments UUID[] DEFAULT NULL;

-- Update existing records to have valid default values
UPDATE public.classes 
SET 
  credits = 3,
  duration_hours = 3,
  max_students = 30,
  semesters = ARRAY[1,2],
  departments = ARRAY[department_id]
WHERE department_id IS NOT NULL;

-- Create policy to allow teachers to create classes
CREATE POLICY "Teachers can create classes" ON public.classes
FOR INSERT 
WITH CHECK (
  teacher_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

-- Create policy to allow teachers to update their own classes
CREATE POLICY "Teachers can update their own classes" ON public.classes
FOR UPDATE 
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());
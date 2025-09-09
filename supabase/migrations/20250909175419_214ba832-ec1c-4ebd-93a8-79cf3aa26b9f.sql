-- Add semester and graduation year fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN semester INTEGER,
ADD COLUMN graduation_year INTEGER;

-- Create a function to automatically assign students to classes based on their profile info
CREATE OR REPLACE FUNCTION public.auto_assign_student_to_class()
RETURNS TRIGGER AS $$
DECLARE
    class_record RECORD;
    class_name TEXT;
BEGIN
    -- Only process if this is a student with complete class info
    IF NEW.role = 'student' AND NEW.department_id IS NOT NULL AND NEW.semester IS NOT NULL AND NEW.graduation_year IS NOT NULL THEN
        
        -- Generate a class name based on the student's info
        class_name := 'S' || NEW.semester || ' - ' || NEW.graduation_year || ' - ' || (
            SELECT code FROM departments WHERE id = NEW.department_id
        );
        
        -- Check if a class already exists for this combination
        SELECT id INTO class_record
        FROM classes 
        WHERE name = class_name
        AND department_id = NEW.department_id;
        
        -- If no class exists, create one
        IF class_record IS NULL THEN
            INSERT INTO classes (name, code, department_id, description)
            VALUES (
                class_name,
                'AUTO-' || SUBSTRING(MD5(class_name), 1, 6),
                NEW.department_id,
                'Auto-generated class for semester ' || NEW.semester || ', graduating ' || NEW.graduation_year
            ) RETURNING id INTO class_record;
        END IF;
        
        -- Enroll the student in the class (avoid duplicates)
        INSERT INTO class_enrollments (user_id, class_id)
        VALUES (NEW.user_id, class_record.id)
        ON CONFLICT (user_id, class_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-assign students when profile is updated
CREATE TRIGGER auto_assign_student_class
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_student_to_class();

-- Add unique constraint to class_enrollments to prevent duplicates
ALTER TABLE public.class_enrollments 
ADD CONSTRAINT unique_user_class UNIQUE (user_id, class_id);
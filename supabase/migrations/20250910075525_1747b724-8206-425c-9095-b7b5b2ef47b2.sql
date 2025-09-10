-- Modifier la fonction pour générer les noms de classe selon le format "département + semestre"
CREATE OR REPLACE FUNCTION public.auto_assign_student_to_class()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    class_record RECORD;
    class_name TEXT;
    dept_code TEXT;
BEGIN
    -- Only process if this is a student with complete class info
    IF NEW.role = 'student' AND NEW.department_id IS NOT NULL AND NEW.semester IS NOT NULL AND NEW.graduation_year IS NOT NULL THEN
        
        -- Get department code
        SELECT code INTO dept_code FROM departments WHERE id = NEW.department_id;
        
        -- Generate a class name based on department + semester
        class_name := dept_code || ' - S' || NEW.semester;
        
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
                'Classe pour ' || dept_code || ' semestre ' || NEW.semester
            ) RETURNING id INTO class_record;
        END IF;
        
        -- Enroll the student in the class (avoid duplicates)
        INSERT INTO class_enrollments (user_id, class_id)
        VALUES (NEW.user_id, class_record.id)
        ON CONFLICT (user_id, class_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$function$
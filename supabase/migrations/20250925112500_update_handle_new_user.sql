-- Update handle_new_user function to properly insert student data into students table

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  dept_id UUID;
  sem INTEGER;
  grad_year INTEGER;
BEGIN
  -- Get role from metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  -- Insert into users table
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW());

  -- Insert into appropriate role table
  IF user_role = 'teacher' THEN
    INSERT INTO public.teachers (user_id, full_name, created_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NOW()
    );
  ELSE
    -- Extract student-specific data from metadata
    dept_id := (NEW.raw_user_meta_data->>'department_id')::UUID;
    sem := (NEW.raw_user_meta_data->>'semester')::INTEGER;
    grad_year := (NEW.raw_user_meta_data->>'graduation_year')::INTEGER;

    INSERT INTO public.students (user_id, full_name, department_id, semester, graduation_year, created_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      dept_id,
      sem,
      grad_year,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
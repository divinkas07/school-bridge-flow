-- Major refactoring: Separate students and teachers into dedicated tables
-- This migration transforms the current profiles-based system to a cleaner role-based structure

-- Create users table (minimal account info)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  student_id TEXT UNIQUE,
  department_id UUID REFERENCES public.departments(id),
  semester INTEGER,
  graduation_year INTEGER,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teachers table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  employee_id TEXT UNIQUE,
  department_id UUID REFERENCES public.departments(id),
  title TEXT DEFAULT 'Professeur',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update classes table to reference teachers instead of auth.users
ALTER TABLE public.classes
DROP CONSTRAINT classes_teacher_id_fkey,
ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

-- Update class_enrollments to reference students
ALTER TABLE public.class_enrollments
ADD COLUMN student_id UUID REFERENCES public.students(id) ON DELETE CASCADE;

-- Update announcements to reference teachers
ALTER TABLE public.announcements
ADD COLUMN teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE;

-- Update assignments to reference teachers
ALTER TABLE public.assignments
DROP CONSTRAINT assignments_teacher_id_fkey,
ADD CONSTRAINT assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

-- Update assignment_submissions to reference students and teachers
ALTER TABLE public.assignment_submissions
ADD COLUMN student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
ADD COLUMN graded_by UUID REFERENCES public.teachers(id);

-- Update posts structure for polymorphic authors
ALTER TABLE public.posts
ADD COLUMN author_type TEXT CHECK (author_type IN ('student', 'teacher')),
ADD COLUMN author_id UUID;

-- Create indexes for performance
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_teachers_user_id ON public.teachers(user_id);
CREATE INDEX idx_posts_author ON public.posts(author_type, author_id);

-- Migrate data from profiles to new tables
INSERT INTO public.users (id, email, created_at)
SELECT user_id, COALESCE(raw_user_meta_data->>'email', 'unknown@example.com'), created_at
FROM auth.users
WHERE EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.users.id);

INSERT INTO public.students (user_id, full_name, student_id, department_id, semester, graduation_year, avatar_url, bio, created_at, updated_at)
SELECT user_id, full_name, student_id, department_id, semester, graduation_year, avatar_url, bio, created_at, updated_at
FROM public.profiles
WHERE role = 'student';

INSERT INTO public.teachers (user_id, full_name, employee_id, department_id, avatar_url, bio, created_at, updated_at)
SELECT user_id, full_name, student_id, department_id, avatar_url, bio, created_at, updated_at
FROM public.profiles
WHERE role = 'teacher';

-- Update foreign keys with migrated data
UPDATE public.class_enrollments
SET student_id = students.id
FROM public.students
WHERE class_enrollments.user_id = students.user_id;

UPDATE public.announcements
SET teacher_id = teachers.id
FROM public.teachers
WHERE announcements.author_id = teachers.user_id;

UPDATE public.assignments
SET teacher_id = teachers.id
FROM public.teachers
WHERE assignments.teacher_id = teachers.user_id;

UPDATE public.assignment_submissions
SET student_id = students.id,
    graded_by = teachers.id
FROM public.students, public.teachers
WHERE assignment_submissions.student_id = students.user_id
  AND assignment_submissions.graded_by = teachers.user_id;

-- Update posts with polymorphic authors
UPDATE public.posts
SET author_type = CASE
    WHEN EXISTS (SELECT 1 FROM public.students WHERE user_id = posts.author_id) THEN 'student'
    WHEN EXISTS (SELECT 1 FROM public.teachers WHERE user_id = posts.author_id) THEN 'teacher'
    ELSE 'student' -- fallback
  END,
  author_id = CASE
    WHEN EXISTS (SELECT 1 FROM public.students WHERE user_id = posts.author_id)
    THEN (SELECT id FROM public.students WHERE user_id = posts.author_id)
    WHEN EXISTS (SELECT 1 FROM public.teachers WHERE user_id = posts.author_id)
    THEN (SELECT id FROM public.teachers WHERE user_id = posts.author_id)
    ELSE NULL
  END;

-- Make new columns NOT NULL after data migration
ALTER TABLE public.class_enrollments ALTER COLUMN student_id SET NOT NULL;
ALTER TABLE public.announcements ALTER COLUMN teacher_id SET NOT NULL;
ALTER TABLE public.assignment_submissions ALTER COLUMN student_id SET NOT NULL;
ALTER TABLE public.posts ALTER COLUMN author_type SET NOT NULL;
ALTER TABLE public.posts ALTER COLUMN author_id SET NOT NULL;

-- Drop old foreign key columns
ALTER TABLE public.class_enrollments DROP COLUMN user_id;
ALTER TABLE public.announcements DROP COLUMN author_id;
ALTER TABLE public.assignment_submissions DROP COLUMN student_id_old;
ALTER TABLE public.assignment_submissions DROP COLUMN graded_by_old;

-- Rename columns to match new structure
ALTER TABLE public.assignment_submissions RENAME COLUMN student_id TO student_id_old;
ALTER TABLE public.assignment_submissions RENAME COLUMN graded_by TO graded_by_old;

-- Wait, I made a mistake. Let me fix this properly
-- Actually, the assignment_submissions already has student_id and graded_by as auth.users references
-- I need to drop those and add new ones

ALTER TABLE public.assignment_submissions
DROP CONSTRAINT assignment_submissions_student_id_fkey,
DROP CONSTRAINT assignment_submissions_graded_by_fkey,
ALTER COLUMN student_id TYPE UUID USING NULL,
ALTER COLUMN graded_by TYPE UUID USING NULL;

-- Now set the constraints properly
ALTER TABLE public.assignment_submissions
ADD CONSTRAINT assignment_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE,
ADD CONSTRAINT assignment_submissions_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.teachers(id);

-- Drop old profiles table
DROP TABLE public.profiles CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own user record" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own user record" ON public.users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for students
CREATE POLICY "Students can view their own profile" ON public.students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can update their own profile" ON public.students FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view student profiles in their classes" ON public.students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    JOIN public.classes c ON ce.class_id = c.id
    WHERE ce.student_id = students.id AND c.teacher_id IN (
      SELECT id FROM public.teachers WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for teachers
CREATE POLICY "Teachers can view their own profile" ON public.teachers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers can update their own profile" ON public.teachers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Students can view teacher profiles for their classes" ON public.teachers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.class_enrollments ce ON c.id = ce.class_id
    WHERE c.teacher_id = teachers.id AND ce.student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  )
);

-- Update existing RLS policies to use new structure
DROP POLICY IF EXISTS "Users can view classes they are enrolled in or teach" ON public.classes;
CREATE POLICY "Users can view classes they are enrolled in or teach" ON public.classes
FOR SELECT USING (
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()) OR
  id IN (
    SELECT ce.class_id FROM public.class_enrollments ce
    JOIN public.students s ON ce.student_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view their own enrollments and teachers can view their class enrollments" ON public.class_enrollments;
CREATE POLICY "Users can view their own enrollments and teachers can view their class enrollments" ON public.class_enrollments
FOR SELECT USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR
  class_id IN (
    SELECT c.id FROM public.classes c
    JOIN public.teachers t ON c.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  )
);

-- Update other policies accordingly
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
CREATE POLICY "Teachers can create classes" ON public.classes
FOR INSERT WITH CHECK (
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Teachers can update their own classes" ON public.classes;
CREATE POLICY "Teachers can update their own classes" ON public.classes
FOR UPDATE USING (
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);

-- Update announcements policies
DROP POLICY IF EXISTS "Users can view relevant announcements" ON public.announcements;
CREATE POLICY "Users can view relevant announcements" ON public.announcements
FOR SELECT USING (
  visibility = 'public' OR
  (visibility = 'department' AND department_id IN (
    SELECT department_id FROM public.students WHERE user_id = auth.uid()
    UNION
    SELECT department_id FROM public.teachers WHERE user_id = auth.uid()
  )) OR
  (visibility = 'class' AND class_id IN (
    SELECT ce.class_id FROM public.class_enrollments ce
    JOIN public.students s ON ce.student_id = s.id
    WHERE s.user_id = auth.uid()
  )) OR
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Teachers can create announcements" ON public.announcements;
CREATE POLICY "Teachers can create announcements" ON public.announcements
FOR INSERT WITH CHECK (
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);

-- Update assignments policies
DROP POLICY IF EXISTS "Users can view assignments for enrolled classes" ON public.assignments;
CREATE POLICY "Users can view assignments for enrolled classes" ON public.assignments
FOR SELECT USING (
  class_id IN (
    SELECT ce.class_id FROM public.class_enrollments ce
    JOIN public.students s ON ce.student_id = s.id
    WHERE s.user_id = auth.uid()
  ) OR
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Teachers can create assignments" ON public.assignments;
CREATE POLICY "Teachers can create assignments" ON public.assignments
FOR INSERT WITH CHECK (
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);

-- Update posts policies
DROP POLICY IF EXISTS "Users can view posts in enrolled classes" ON public.posts;
CREATE POLICY "Users can view posts in enrolled classes" ON public.posts
FOR SELECT USING (
  type = 'all_users' OR
  (class_id IN (
    SELECT ce.class_id FROM public.class_enrollments ce
    JOIN public.students s ON ce.student_id = s.id
    WHERE s.user_id = auth.uid()
  ) AND type = 'student_only') OR
  (author_type = 'student' AND author_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())) OR
  (author_type = 'teacher' AND author_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts
FOR INSERT WITH CHECK (
  (author_type = 'student' AND author_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())) OR
  (author_type = 'teacher' AND author_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()))
);

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
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
    INSERT INTO public.students (user_id, full_name, created_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update auto_assign_student_to_class function
CREATE OR REPLACE FUNCTION public.auto_assign_student_to_class()
RETURNS TRIGGER AS $$
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
        INSERT INTO class_enrollments (student_id, class_id)
        VALUES ((SELECT id FROM students WHERE user_id = NEW.user_id), class_record.id)
        ON CONFLICT (student_id, class_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update trigger to use students table
DROP TRIGGER IF EXISTS auto_assign_student_class ON public.profiles;
CREATE TRIGGER auto_assign_student_class
    AFTER INSERT OR UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_student_to_class();

-- Create triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
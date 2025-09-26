-- Complete database schema for Academy application
-- This migration creates the entire database structure from scratch

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (minimal account info for all users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
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

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  description TEXT,
  credits INTEGER,
  max_students INTEGER,
  duration_hours INTEGER,
  semesters INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_enrollments table
CREATE TABLE public.class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id)
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  visibility TEXT CHECK (visibility IN ('public', 'department', 'class')) DEFAULT 'public',
  class_id UUID REFERENCES public.classes(id),
  department_id UUID REFERENCES public.departments(id),
  is_urgent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  total_points INTEGER DEFAULT 100,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignment_submissions table
CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  content TEXT,
  file_urls TEXT[],
  grade INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES public.teachers(id)
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_type TEXT CHECK (author_type IN ('student', 'teacher')) NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('all_users', 'student_only')) DEFAULT 'all_users',
  class_id UUID REFERENCES public.classes(id),
  image_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_rooms table
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  type TEXT NOT NULL CHECK (type IN ('direct', 'class', 'group')),
  class_id UUID REFERENCES public.classes(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_participants table
CREATE TABLE public.chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  class_id UUID REFERENCES public.classes(id),
  uploaded_by UUID REFERENCES auth.users(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_teachers_user_id ON public.teachers(user_id);
CREATE INDEX idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX idx_classes_department_id ON public.classes(department_id);
CREATE INDEX idx_class_enrollments_student_id ON public.class_enrollments(student_id);
CREATE INDEX idx_class_enrollments_class_id ON public.class_enrollments(class_id);
CREATE INDEX idx_announcements_teacher_id ON public.announcements(teacher_id);
CREATE INDEX idx_announcements_visibility ON public.announcements(visibility);
CREATE INDEX idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX idx_posts_author ON public.posts(author_type, author_id);
CREATE INDEX idx_posts_type ON public.posts(type);
CREATE INDEX idx_chat_rooms_class_id ON public.chat_rooms(class_id);
CREATE INDEX idx_chat_participants_room_id ON public.chat_participants(room_id);
CREATE INDEX idx_messages_room_id ON public.messages(room_id);
CREATE INDEX idx_documents_class_id ON public.documents(class_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create handle_new_user function
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

-- Create auto_assign_student_to_class function
CREATE OR REPLACE FUNCTION public.auto_assign_student_to_class()
RETURNS TRIGGER AS $$
DECLARE
    class_record RECORD;
    class_name TEXT;
    dept_code TEXT;
BEGIN
    -- Only process if this is a student with complete class info
    IF NEW.semester IS NOT NULL AND NEW.graduation_year IS NOT NULL AND NEW.department_id IS NOT NULL THEN

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
        VALUES (NEW.id, class_record.id)
        ON CONFLICT (student_id, class_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER auto_assign_student_class
    AFTER INSERT OR UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_student_to_class();

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view their own user record" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own user record" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Departments policies (public read, admin write)
CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT USING (true);

-- Students policies
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

-- Teachers policies
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

-- Classes policies
CREATE POLICY "Users can view classes they are enrolled in or teach" ON public.classes
FOR SELECT USING (
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()) OR
  id IN (
    SELECT ce.class_id FROM public.class_enrollments ce
    JOIN public.students s ON ce.student_id = s.id
    WHERE s.user_id = auth.uid()
  )
);
CREATE POLICY "Teachers can create classes" ON public.classes
FOR INSERT WITH CHECK (
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);
CREATE POLICY "Teachers can update their own classes" ON public.classes
FOR UPDATE USING (
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);

-- Class enrollments policies
CREATE POLICY "Users can view their own enrollments and teachers can view their class enrollments" ON public.class_enrollments
FOR SELECT USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR
  class_id IN (
    SELECT c.id FROM public.classes c
    JOIN public.teachers t ON c.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  )
);

-- Announcements policies
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
CREATE POLICY "Teachers can create announcements" ON public.announcements
FOR INSERT WITH CHECK (
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);
CREATE POLICY "Teachers can update their own announcements" ON public.announcements
FOR UPDATE USING (
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);

-- Assignments policies
CREATE POLICY "Users can view assignments for enrolled classes" ON public.assignments
FOR SELECT USING (
  class_id IN (
    SELECT ce.class_id FROM public.class_enrollments ce
    JOIN public.students s ON ce.student_id = s.id
    WHERE s.user_id = auth.uid()
  ) OR
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);
CREATE POLICY "Teachers can create assignments" ON public.assignments
FOR INSERT WITH CHECK (
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);
CREATE POLICY "Teachers can update their own assignments" ON public.assignments
FOR UPDATE USING (
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);

-- Assignment submissions policies
CREATE POLICY "Students can view and manage their own submissions" ON public.assignment_submissions
FOR ALL USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);
CREATE POLICY "Teachers can view submissions for their assignments" ON public.assignment_submissions
FOR SELECT USING (
  assignment_id IN (
    SELECT id FROM public.assignments WHERE teacher_id IN (
      SELECT id FROM public.teachers WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "Teachers can grade submissions for their assignments" ON public.assignment_submissions
FOR UPDATE USING (
  assignment_id IN (
    SELECT id FROM public.assignments WHERE teacher_id IN (
      SELECT id FROM public.teachers WHERE user_id = auth.uid()
    )
  )
);

-- Posts policies
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
CREATE POLICY "Users can create posts" ON public.posts
FOR INSERT WITH CHECK (
  (author_type = 'student' AND author_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())) OR
  (author_type = 'teacher' AND author_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()))
);

-- Chat rooms policies
CREATE POLICY "Users can view chat rooms they participate in" ON public.chat_rooms
FOR SELECT USING (
  created_by = auth.uid() OR
  id IN (SELECT room_id FROM public.chat_participants WHERE user_id = auth.uid())
);

-- Chat participants policies
CREATE POLICY "Users can view their own chat participations" ON public.chat_participants
FOR SELECT USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in rooms they participate in" ON public.messages
FOR SELECT USING (
  room_id IN (SELECT room_id FROM public.chat_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Users can send messages in rooms they participate in" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  room_id IN (SELECT room_id FROM public.chat_participants WHERE user_id = auth.uid())
);

-- Documents policies
CREATE POLICY "Users can view documents in their classes" ON public.documents
FOR SELECT USING (
  class_id IN (
    SELECT ce.class_id FROM public.class_enrollments ce
    JOIN public.students s ON ce.student_id = s.id
    WHERE s.user_id = auth.uid()
  ) OR
  class_id IN (SELECT id FROM public.classes WHERE teacher_id IN (
    SELECT id FROM public.teachers WHERE user_id = auth.uid()
  )) OR
  uploaded_by = auth.uid()
);
CREATE POLICY "Users can upload documents to their classes" ON public.documents
FOR INSERT WITH CHECK (
  uploaded_by = auth.uid() AND (
    class_id IN (
      SELECT ce.class_id FROM public.class_enrollments ce
      JOIN public.students s ON ce.student_id = s.id
      WHERE s.user_id = auth.uid()
    ) OR
    class_id IN (SELECT id FROM public.classes WHERE teacher_id IN (
      SELECT id FROM public.teachers WHERE user_id = auth.uid()
    ))
  )
);

-- Insert some sample departments
INSERT INTO public.departments (name, code, description) VALUES
('Computer Science', 'CS', 'Computer Science and Software Engineering'),
('Mathematics', 'MATH', 'Mathematics and Statistics'),
('Physics', 'PHYS', 'Physics and Physical Sciences'),
('Chemistry', 'CHEM', 'Chemistry and Chemical Sciences'),
('Biology', 'BIO', 'Biology and Life Sciences'),
('Engineering', 'ENG', 'General Engineering'),
('Business Administration', 'BA', 'Business and Management'),
('Literature', 'LIT', 'Literature and Humanities');
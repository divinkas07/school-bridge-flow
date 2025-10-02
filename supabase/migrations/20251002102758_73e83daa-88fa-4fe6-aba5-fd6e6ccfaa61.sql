-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view departments"
ON public.departments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage departments"
ON public.departments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view classes"
ON public.classes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Teachers can create classes"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update their classes"
ON public.classes
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- RLS Policies for announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (
  visibility = 'public' OR
  public.has_role(auth.uid(), 'teacher') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Teachers can create announcements"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update their announcements"
ON public.announcements
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- RLS Policies for assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view published assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (is_published = true OR public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can create assignments"
ON public.assignments
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update their assignments"
ON public.assignments
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- RLS Policies for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view posts in their classes"
ON public.posts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.class_enrollments
    WHERE class_id = posts.class_id
    AND student_id = auth.uid()
  ) OR
  public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Users can create posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own posts"
ON public.posts
FOR UPDATE
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- RLS Policies for class_enrollments
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their enrollments"
ON public.class_enrollments
FOR SELECT
TO authenticated
USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Students can enroll themselves"
ON public.class_enrollments
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

-- RLS Policies for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view documents in their classes"
ON public.documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.class_enrollments
    WHERE class_id = documents.class_id
    AND student_id = auth.uid()
  ) OR
  public.has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Teachers can upload documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

-- RLS Policies for assignment_submissions
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own submissions"
ON public.assignment_submissions
FOR SELECT
TO authenticated
USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Students can create submissions"
ON public.assignment_submissions
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own submissions"
ON public.assignment_submissions
FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- RLS Policies for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their chat rooms"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE room_id = messages.room_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages in their chat rooms"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE room_id = messages.room_id
    AND user_id = auth.uid()
  )
);
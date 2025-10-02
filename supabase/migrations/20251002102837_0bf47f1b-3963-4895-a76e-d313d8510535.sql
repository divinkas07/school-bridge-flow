-- Fix remaining RLS policies

-- RLS Policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own data"
ON public.students
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Teachers can view student data"
ON public.students
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Students can update their own data"
ON public.students
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- RLS Policies for teachers table  
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view teacher data"
ON public.teachers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Teachers can update their own data"
ON public.teachers
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- RLS Policies for campuses table
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view campuses"
ON public.campuses
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage campuses"
ON public.campuses
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for chat_rooms table
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat rooms they are part of"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE room_id = chat_rooms.id
    AND user_id = auth.uid()
  ) OR
  public.has_role(auth.uid(), 'teacher')
);

-- RLS Policies for chat_participants table
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own participation"
ON public.chat_participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'teacher'));
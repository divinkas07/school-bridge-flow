-- Add missing RLS policies for tables that were missing them

-- RLS Policies for assignment_submissions
CREATE POLICY "Students can view their own submissions" ON public.assignment_submissions FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers can view submissions for their assignments" ON public.assignment_submissions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.assignments a 
    WHERE a.id = assignment_id AND a.teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can create their own submissions" ON public.assignment_submissions FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can update their own submissions" ON public.assignment_submissions FOR UPDATE USING (student_id = auth.uid());
CREATE POLICY "Teachers can update submissions for grading" ON public.assignment_submissions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.assignments a 
    WHERE a.id = assignment_id AND a.teacher_id = auth.uid()
  )
);

-- RLS Policies for documents
CREATE POLICY "Users can view documents for enrolled classes" ON public.documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.class_enrollments 
    WHERE class_id = documents.class_id AND user_id = auth.uid()
  ) OR
  uploaded_by = auth.uid()
);
CREATE POLICY "Authenticated users can upload documents" ON public.documents FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- RLS Policies for chat_rooms
CREATE POLICY "Participants can view chat rooms" ON public.chat_rooms FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE room_id = id AND user_id = auth.uid()
  ) OR
  created_by = auth.uid()
);
CREATE POLICY "Authenticated users can create chat rooms" ON public.chat_rooms FOR INSERT WITH CHECK (created_by = auth.uid());

-- RLS Policies for chat_participants
CREATE POLICY "Users can view participants in their rooms" ON public.chat_participants FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.chat_participants cp2 
    WHERE cp2.room_id = room_id AND cp2.user_id = auth.uid()
  )
);
CREATE POLICY "Users can join chat rooms" ON public.chat_participants FOR INSERT WITH CHECK (user_id = auth.uid());

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
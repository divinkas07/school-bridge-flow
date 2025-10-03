import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

type UserRole = 'student' | 'teacher';

interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  student_id?: string;
  department_id?: string;
  semester?: number;
  graduation_year?: number;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

interface TeacherProfile {
  id: string;
  user_id: string;
  full_name: string;
  employee_id?: string;
  department_id?: string;
  title?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: UserRole;
  student_id?: string;
  department_id?: string;
  semester?: number;
  graduation_year?: number;
  employee_id?: string;
  title?: string;
  avatar_url?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole, studentInfo?: { departmentId: string; semester: number; graduationYear: number }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile from students or teachers table
          setTimeout(async () => {
            // First try to get student profile
            const { data: studentData } = await supabase
              .from('students')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (studentData) {
              setProfile({
                id: studentData.id,
                user_id: studentData.id,
                full_name: studentData.full_name || '',
                role: 'student' as UserRole,
                avatar_url: studentData.avatar_url,
                semester: undefined,
                graduation_year: undefined,
                student_id: undefined,
                department_id: undefined,
              });
              setLoading(false);
              return;
            }

            // If not a student, try teacher profile
            const { data: teacherData } = await supabase
              .from('teachers')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (teacherData) {
              setProfile({
                id: teacherData.id,
                user_id: teacherData.id,
                full_name: teacherData.full_name || '',
                role: 'teacher' as UserRole,
                avatar_url: teacherData.avatar_url,
                bio: teacherData.bio,
                title: teacherData.title,
              });
              setLoading(false);
              return;
            }

            // If neither, set profile to null
            setProfile(null);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // First try to get student profile
        supabase
          .from('students')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(async ({ data: studentData, error: studentError }) => {
            if (studentData && !studentError) {
              setProfile({
                id: studentData.id,
                user_id: studentData.id,
                full_name: studentData.full_name || '',
                role: 'student' as UserRole,
                avatar_url: studentData.avatar_url,
                semester: undefined,
                graduation_year: undefined,
                student_id: undefined,
                department_id: undefined,
              });
              setLoading(false);
              return;
            }

            // If not a student, try teacher profile
            const { data: teacherData, error: teacherError } = await supabase
              .from('teachers')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (teacherData && !teacherError) {
              setProfile({
                id: teacherData.id,
                user_id: teacherData.id,
                full_name: teacherData.full_name || '',
                role: 'teacher' as UserRole,
                avatar_url: teacherData.avatar_url,
                bio: teacherData.bio,
                title: teacherData.title,
              });
              setLoading(false);
              return;
            }

            // If neither, set profile to null
            setProfile(null);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: UserRole, studentInfo?: { departmentId: string; semester: number; graduationYear: number }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            role: role,
            ...(studentInfo && {
              department_id: studentInfo.departmentId,
              semester: studentInfo.semester,
              graduation_year: studentInfo.graduationYear,
            }),
          },
        },
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign up successful!",
          description: "Please check your email to confirm your account.",
        });
      }

      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }

      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    toast({
      title: "Signed out successfully",
    });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return { error: new Error('No user logged in') };

    const table = profile.role === 'student' ? 'students' : 'teachers';
    const { error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
      toast({
        title: "Profile updated successfully",
      });
    }

    return { error };
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
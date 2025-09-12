import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  FileText, 
  MessageSquare,
  ChevronRight,
  GraduationCap,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateClassModal } from '@/components/modals/CreateClassModal';

interface ClassInfo {
  id: string;
  name: string;
  code: string;
  description: string;
  teacher: {
    name: string;
    avatar?: string;
  };
  department: string;
  studentCount: number;
  nextClass?: string;
  unreadCount: number;
}

const Classes = () => {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!profile?.user_id) return;
      
      setLoading(true);
      try {
        let classesData = [];

        if (profile.role === 'student') {
          // Récupérer les classes où l'étudiant est inscrit
          const { data: enrollments, error } = await supabase
            .from('class_enrollments')
            .select(`
              classes (
                id,
                name,
                code,
                description,
                teacher_id,
                departments (
                  name,
                  code
                )
              )
            `)
            .eq('user_id', profile.user_id);

          if (error) throw error;

          classesData = enrollments?.map(enrollment => enrollment.classes).filter(Boolean) || [];
        } else {
          // Pour les enseignants, récupérer les classes qu'ils enseignent
          const { data, error } = await supabase
            .from('classes')
            .select(`
              id,
              name,
              code,
              description,
              teacher_id,
              departments (
                name,
                code
              )
            `)
            .eq('teacher_id', profile.user_id);

          if (error) throw error;
          classesData = data || [];
        }

        // Pour chaque classe, récupérer le nombre d'étudiants et les informations de l'enseignant
        const enrichedClasses = await Promise.all(
          classesData.map(async (classData: any) => {
            // Compter les étudiants
            const { count: studentCount } = await supabase
              .from('class_enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('class_id', classData.id);

            // Récupérer les informations de l'enseignant
            let teacherInfo = { name: 'Auto-assigné', avatar: undefined };
            if (classData.teacher_id) {
              const { data: teacherProfile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('user_id', classData.teacher_id)
                .maybeSingle();
              
              if (teacherProfile) {
                teacherInfo = {
                  name: teacherProfile.full_name,
                  avatar: teacherProfile.avatar_url
                };
              }
            }

            return {
              id: classData.id,
              name: classData.name,
              code: classData.code,
              description: classData.description || 'Aucune description',
              teacher: teacherInfo,
              department: classData.departments?.name || 'Non défini',
              studentCount: studentCount || 0,
              unreadCount: 0 // TODO: Implémenter le comptage des messages non lus
            };
          })
        );

        setClasses(enrichedClasses);
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [profile]);

  const handleRefreshClasses = () => {
    if (profile?.user_id) {
      const fetchClasses = async () => {
        setLoading(true);
        try {
          let classesData = [];

          if (profile.role === 'student') {
            const { data: enrollments, error } = await supabase
              .from('class_enrollments')
              .select(`
                classes (
                  id,
                  name,
                  code,
                  description,
                  teacher_id,
                  departments (
                    name,
                    code
                  )
                )
              `)
              .eq('user_id', profile.user_id);

            if (error) throw error;
            classesData = enrollments?.map(enrollment => enrollment.classes).filter(Boolean) || [];
          } else {
            const { data, error } = await supabase
              .from('classes')
              .select(`
                id,
                name,
                code,
                description,
                teacher_id,
                departments (
                  name,
                  code
                )
              `)
              .eq('teacher_id', profile.user_id);

            if (error) throw error;
            classesData = data || [];
          }

          const enrichedClasses = await Promise.all(
            classesData.map(async (classData: any) => {
              const { count: studentCount } = await supabase
                .from('class_enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', classData.id);

              let teacherInfo = { name: 'Auto-assigné', avatar: undefined };
              if (classData.teacher_id) {
                const { data: teacherProfile } = await supabase
                  .from('profiles')
                  .select('full_name, avatar_url')
                  .eq('user_id', classData.teacher_id)
                  .maybeSingle();
                
                if (teacherProfile) {
                  teacherInfo = {
                    name: teacherProfile.full_name,
                    avatar: teacherProfile.avatar_url
                  };
                }
              }

              return {
                id: classData.id,
                name: classData.name,
                code: classData.code,
                description: classData.description || 'Aucune description',
                teacher: teacherInfo,
                department: classData.departments?.name || 'Non défini',
                studentCount: studentCount || 0,
                unreadCount: 0
              };
            })
          );

          setClasses(enrichedClasses);
        } catch (error) {
          console.error('Error fetching classes:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchClasses();
    }
  };

  const ClassCard = ({ classInfo }: { classInfo: ClassInfo }) => (
    <Card className="cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {classInfo.code}
                </Badge>
                {classInfo.unreadCount > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {classInfo.unreadCount}
                  </Badge>
                )}
              </div>
              <h3 className="font-medium text-sm text-foreground line-clamp-1">
                {classInfo.name}
              </h3>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {classInfo.description}
        </p>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs">
            <GraduationCap className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{classInfo.teacher.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{classInfo.studentCount} students</span>
          </div>
          {classInfo.nextClass && (
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                Next: {new Date(classInfo.nextClass).toLocaleDateString()} at{' '}
                {new Date(classInfo.nextClass).toLocaleTimeString([], { 
                  hour: '2-digit', minute: '2-digit' 
                })}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <MessageSquare className="h-3 w-3 mr-1" />
            Chat
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <FileText className="h-3 w-3 mr-1" />
            Files
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent-green/10 px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-foreground">
              {profile?.role === 'teacher' ? 'Your Classes' : 'Enrolled Classes'}
            </h2>
            {profile?.role === 'teacher' && classes.length > 0 && (
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create Class
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {profile?.role === 'teacher' 
              ? 'Manage your teaching schedule and connect with students'
              : `You're enrolled in ${classes.length} classes this semester`
            }
          </p>
        </div>
      </div>

      {/* Classes List */}
      <div className="px-4 py-4">
        <div className="max-w-md mx-auto space-y-4">
          {classes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-muted-foreground text-sm">
                {profile?.role === 'teacher' 
                  ? "You haven't created any classes yet" 
                  : "You're not enrolled in any classes yet"
                }
              </div>
              {profile?.role === 'teacher' && (
                <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Class
                </Button>
              )}
            </div>
          ) : (
            classes.map((classInfo) => (
              <ClassCard key={classInfo.id} classInfo={classInfo} />
            ))
          )}
        </div>
      </div>

      <CreateClassModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleRefreshClasses}
      />
    </div>
  );
};

export default Classes;
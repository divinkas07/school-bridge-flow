import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'enrolled' | 'explore'>('enrolled');

  const fetchClasses = async (mode?: 'enrolled' | 'explore') => {
    if (!profile?.user_id) return;
    setLoading(true);

    try {
      let classesData: any[] = [];
      const currentMode = mode || activeTab;

      if (profile.role === 'student') {
        if (currentMode === 'enrolled') {
          // 🔹 Fetch classes where the student is enrolled
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
            .eq('student_id', profile.user_id);

          if (error) throw error;
          classesData = enrollments?.map((e) => e.classes).filter(Boolean) || [];
        } else if (currentMode === 'explore') {
          // 🔹 Fetch all available classes (not enrolled by this student)
          const { data: allClasses, error: allError } = await supabase
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
            `);

          if (allError) throw allError;

          // Get enrolled class IDs to exclude them
          const { data: enrollments } = await supabase
            .from('class_enrollments')
            .select('class_id')
            .eq('student_id', profile.user_id);

          const enrolledClassIds = enrollments?.map(e => e.class_id) || [];
          classesData = allClasses?.filter(cls => !enrolledClassIds.includes(cls.id)) || [];
        }
      } else if (profile.role === 'teacher') {
        // 🔹 Fetch teacher’s own classes
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

      // 🔹 Enrich with extra info
      const enrichedClasses = await Promise.all(
        classesData.map(async (classData: any) => {
          // Count enrolled students
          const { count: studentCount } = await supabase
            .from('class_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classData.id);

          // Fetch teacher info
          let teacherInfo = { name: 'Unknown teacher', avatar: undefined };
          if (classData.teacher_id) {
            const { data: teacherProfile } = await supabase
              .from('teachers')
              .select('full_name, avatar_url')
              .eq('id', classData.teacher_id)
              .maybeSingle();

            if (teacherProfile) {
              teacherInfo = {
                name: teacherProfile.full_name || 'Unknown teacher',
                avatar: teacherProfile.avatar_url,
              };
            }
          }

          return {
            id: classData.id,
            name: classData.name,
            code: classData.code,
            description: classData.description || 'No description',
            teacher: teacherInfo,
            department: classData.departments?.name || 'Not defined',
            studentCount: studentCount || 0,
            unreadCount: 0,
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

  useEffect(() => {
    fetchClasses();
  }, [profile]);

  useEffect(() => {
    if (profile?.role === 'student') {
      fetchClasses(activeTab);
    }
  }, [activeTab, profile]);

  const ClassCard = ({ classInfo }: { classInfo: ClassInfo }) => (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-muted/20"
      onClick={() => navigate(`/classes/${classInfo.id}`)}
    >
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

  const ExploreClassCard = ({ classInfo }: { classInfo: ClassInfo }) => {
    const [enrolling, setEnrolling] = useState(false);

    const handleEnroll = async (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent navigation to class details
      if (!profile?.user_id) return;

      setEnrolling(true);
      try {
        const { error } = await supabase
          .from('class_enrollments')
          .insert({
            student_id: profile.user_id,
            class_id: classInfo.id
          });

        if (error) throw error;

        // Refresh the explore tab to remove this class
        fetchClasses('explore');
        // Also refresh enrolled tab to show the new enrollment
        fetchClasses('enrolled');
      } catch (error) {
        console.error('Error enrolling in class:', error);
      } finally {
        setEnrolling(false);
      }
    };

    return (
      <Card className="transition-all duration-200 hover:shadow-md hover:bg-muted/20">
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
          </div>

          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={handleEnroll}
              disabled={enrolling}
            >
              {enrolling ? 'Enrolling...' : 'Enroll'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate(`/classes/${classInfo.id}`)}
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (profile?.role === 'teacher') {
    // Teacher view - no tabs, just their classes
    return (
      <div className="flex-1 bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent-green/10 px-4 py-6">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-foreground">
                Your Classes
              </h2>
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create Class
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage your teaching schedule and connect with students
            </p>
          </div>
        </div>

        {/* List */}
        <div className="px-4 py-4">
          <div className="max-w-md mx-auto space-y-4">
            {classes.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground text-sm">
                  You haven't created any classes yet
                </div>
                <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Class
                </Button>
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
          onSuccess={fetchClasses}
        />
      </div>
    );
  }

  // Student view - with tabs
  return (
    <div className="flex-1 bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent-green/10 px-4 py-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Classes
          </h2>
          <p className="text-sm text-muted-foreground">
            Explore available classes or manage your enrolled courses
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4">
        <div className="max-w-md mx-auto">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'enrolled' | 'explore')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="enrolled">Enrolled Classes</TabsTrigger>
              <TabsTrigger value="explore">Explore</TabsTrigger>
            </TabsList>

            <TabsContent value="enrolled" className="mt-4 space-y-4">
              {classes.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground text-sm">
                    You're not enrolled in any classes yet
                  </div>
                </div>
              ) : (
                classes.map((classInfo) => (
                  <ClassCard key={classInfo.id} classInfo={classInfo} />
                ))
              )}
            </TabsContent>

            <TabsContent value="explore" className="mt-4 space-y-4">
              {classes.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground text-sm">
                    No additional classes available to explore
                  </div>
                </div>
              ) : (
                classes.map((classInfo) => (
                  <ExploreClassCard key={classInfo.id} classInfo={classInfo} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Classes;

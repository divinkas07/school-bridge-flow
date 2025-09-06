import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  // Sample classes data
  const sampleClasses: ClassInfo[] = [
    {
      id: '1',
      name: 'Introduction to Computer Science',
      code: 'CS 101',
      description: 'Fundamentals of programming and computer science concepts',
      teacher: {
        name: 'Dr. Sarah Johnson',
      },
      department: 'Computer Science',
      studentCount: 45,
      nextClass: '2024-01-15T10:00:00',
      unreadCount: 3,
    },
    {
      id: '2',
      name: 'Data Structures and Algorithms',
      code: 'CS 201',
      description: 'Advanced programming concepts and algorithm design',
      teacher: {
        name: 'Prof. Michael Chen',
      },
      department: 'Computer Science',
      studentCount: 32,
      nextClass: '2024-01-15T14:00:00',
      unreadCount: 1,
    },
    {
      id: '3',
      name: 'Database Systems',
      code: 'CS 301',
      description: 'Design and implementation of database systems',
      teacher: {
        name: 'Dr. Emily Davis',
      },
      department: 'Computer Science',
      studentCount: 28,
      unreadCount: 0,
    },
  ];

  useEffect(() => {
    // In a real app, fetch from Supabase
    setClasses(sampleClasses);
    setLoading(false);
  }, []);

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
    <div className="flex-1 bg-background pb-20">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent-green/10 px-4 py-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {profile?.role === 'teacher' ? 'Your Classes' : 'Enrolled Classes'}
          </h2>
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
                <Button className="mt-4">
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
    </div>
  );
};

export default Classes;
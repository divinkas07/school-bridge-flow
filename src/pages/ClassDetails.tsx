import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BookOpen,
  Users,
  Clock,
  FileText,
  MessageSquare,
  Calendar,
  ArrowLeft,
  GraduationCap,
  Plus,
  Eye,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { CreateAssignmentModal } from '@/components/modals/CreateAssignmentModal';
import { CreatePostModal } from '@/components/modals/CreatePostModal';
import { CreateAnnouncementModal } from '@/components/modals/CreateAnnouncementModal';

interface ClassDetails {
  id: string;
  name: string;
  code: string;
  description: string;
  duration_hours: number;
  max_students: number;
  teacher: {
    name: string;
    avatar?: string;
  };
  department: string;
  studentCount: number;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_at: string;
  total_points: number;
  is_published: boolean;
  created_at: string;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  author: {
    name: string;
    avatar?: string;
  };
  type: string;
  image_urls?: string[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_urgent: boolean;
  author: {
    name: string;
  };
}

interface Discussion {
  id: string;
  name: string;
  type: string;
  lastMessage?: {
    content: string;
    created_at: string;
    sender: {
      name: string;
    };
  };
  messageCount: number;
}

const ClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);

  const fetchClassDetails = async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Fetch class info
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          code,
          description,
          duration_hours,
          max_students,
          teacher_id,
          departments (
            name
          )
        `)
        .eq('id', id)
        .single();

      if (classError) throw classError;

      // Fetch teacher info
      let teacherInfo = { name: 'Unknown teacher', avatar: undefined };
      if (classData.teacher_id) {
        const { data: teacherProfile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', classData.teacher_id)
          .maybeSingle();

        if (teacherProfile) {
          teacherInfo = {
            name: teacherProfile.full_name,
            avatar: teacherProfile.avatar_url,
          };
        }
      }

      // Count enrolled students
      const { count: studentCount } = await supabase
        .from('class_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', id);

      setClassDetails({
        id: classData.id,
        name: classData.name,
        code: classData.code,
        description: classData.description || 'No description',
        duration_hours: classData.duration_hours || 0,
        max_students: classData.max_students || 0,
        teacher: teacherInfo,
        department: classData.departments?.name || 'Not defined',
        studentCount: studentCount || 0,
      });

      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('class_id', id)
        .order('created_at', { ascending: false });

      setAssignments(assignmentsData || []);

      // Fetch posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          type,
          image_urls,
          author_id,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('class_id', id)
        .order('created_at', { ascending: false });

      const enrichedPosts = postsData?.map((post: any) => ({
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        type: post.type,
        image_urls: post.image_urls,
        author: {
          name: post.profiles?.full_name || 'Unknown',
          avatar: post.profiles?.avatar_url,
        },
      })) || [];

      setPosts(enrichedPosts);

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          created_at,
          is_urgent,
          author_id,
          profiles (
            full_name
          )
        `)
        .eq('class_id', id)
        .order('created_at', { ascending: false });

      const enrichedAnnouncements = announcementsData?.map((announcement: any) => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        created_at: announcement.created_at,
        is_urgent: announcement.is_urgent,
        author: {
          name: announcement.profiles?.full_name || 'Unknown',
        },
      })) || [];

      setAnnouncements(enrichedAnnouncements);

      // Fetch discussions (chat rooms)
      const { data: chatRooms } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          type,
          messages (
            content,
            created_at,
            sender_id,
            profiles (
              full_name
            )
          )
        `)
        .eq('class_id', id)
        .order('created_at', { ascending: false });

      const enrichedDiscussions = await Promise.all(
        (chatRooms || []).map(async (room: any) => {
          const { count: messageCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          const lastMessage = room.messages?.[0];
          return {
            id: room.id,
            name: room.name || 'General Discussion',
            type: room.type,
            messageCount: messageCount || 0,
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              sender: {
                name: lastMessage.profiles?.full_name || 'Unknown',
              },
            } : undefined,
          };
        })
      );

      setDiscussions(enrichedDiscussions);
    } catch (error) {
      console.error('Error fetching class details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClassDetails();

    // Set up real-time subscriptions for automatic data synchronization
    const assignmentsSubscription = supabase
      .channel('assignments_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'assignments',
        filter: `class_id=eq.${id}`
      }, () => {
        fetchClassDetails();
      })
      .subscribe();

    const postsSubscription = supabase
      .channel('posts_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `class_id=eq.${id}`
      }, () => {
        fetchClassDetails();
      })
      .subscribe();

    const announcementsSubscription = supabase
      .channel('announcements_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'announcements',
        filter: `class_id=eq.${id}`
      }, () => {
        fetchClassDetails();
      })
      .subscribe();

    const chatRoomsSubscription = supabase
      .channel('chat_rooms_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_rooms',
        filter: `class_id=eq.${id}`
      }, () => {
        fetchClassDetails();
      })
      .subscribe();

    const messagesSubscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        // Refresh discussions when messages change
        fetchClassDetails();
      })
      .subscribe();

    const enrollmentsSubscription = supabase
      .channel('enrollments_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'class_enrollments',
        filter: `class_id=eq.${id}`
      }, () => {
        fetchClassDetails();
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      assignmentsSubscription.unsubscribe();
      postsSubscription.unsubscribe();
      announcementsSubscription.unsubscribe();
      chatRoomsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      enrollmentsSubscription.unsubscribe();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!classDetails) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Class not found</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent-green/10 px-3 lg:px-4 py-4 lg:py-6">
        <div className="max-w-full lg:max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/classes')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Classes
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">Live Sync</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchClassDetails(true)}
                disabled={refreshing}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{refreshing ? 'Syncing...' : 'Sync Data'}</span>
                <span className="sm:hidden">Sync</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs">
                  {classDetails.code}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {classDetails.department}
                </Badge>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground mb-2">
                {classDetails.name}
              </h1>
              <p className="text-sm text-muted-foreground mb-4">
                {classDetails.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-xs lg:text-sm">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{classDetails.teacher.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {classDetails.studentCount} students
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {classDetails.duration_hours} hours
                  </span>
                </div>
              </div>
            </div>

            {profile?.role === 'teacher' && (
              <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                <Button size="sm" onClick={() => setShowCreateAssignment(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" />
                  Assignment
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCreatePost(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" />
                  Post
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCreateAnnouncement(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" />
                  Announcement
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 lg:px-4 py-4 lg:py-6">
        <div className="max-w-full lg:max-w-4xl mx-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1">
              <TabsTrigger value="overview" className="text-xs lg:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="assignments" className="text-xs lg:text-sm">
                <span className="hidden lg:inline">Assignments ({assignments.length})</span>
                <span className="lg:hidden">Assignments</span>
              </TabsTrigger>
              <TabsTrigger value="posts" className="text-xs lg:text-sm">
                <span className="hidden lg:inline">Posts ({posts.length})</span>
                <span className="lg:hidden">Posts</span>
              </TabsTrigger>
              <TabsTrigger value="announcements" className="text-xs lg:text-sm">
                <span className="hidden lg:inline">Announcements ({announcements.length})</span>
                <span className="lg:hidden">Announcements</span>
              </TabsTrigger>
              <TabsTrigger value="discussions" className="text-xs lg:text-sm">
                <span className="hidden lg:inline">Discussions ({discussions.length})</span>
                <span className="lg:hidden">Discussions</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 lg:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Students Enrolled</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{classDetails.studentCount}</div>
                    <p className="text-xs text-muted-foreground">
                      of {classDetails.max_students} max capacity
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{assignments.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {assignments.filter(a => a.is_published).length} published
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Discussions</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{discussions.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {discussions.reduce((sum, d) => sum + d.messageCount, 0)} total messages
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...posts.slice(0, 3), ...announcements.slice(0, 2)].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  ).slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(item as any).author?.avatar} />
                        <AvatarFallback>
                          {(item as any).author?.name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {(item as any).author?.name || 'Unknown'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                          {'title' in item && (
                            <Badge variant="outline" className="text-xs">
                              Announcement
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {'title' in item ? item.title : item.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              {assignments.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <div className="text-muted-foreground text-center">
                      <div className="font-medium mb-1">No assignments yet</div>
                      <div className="text-sm">Assignments will appear here when created</div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                assignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base lg:text-lg">{assignment.title}</CardTitle>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant={assignment.is_published ? "default" : "secondary"} className="text-xs">
                              {assignment.is_published ? "Published" : "Draft"}
                            </Badge>
                            <span className="text-xs lg:text-sm text-muted-foreground">
                              Due: {new Date(assignment.due_at).toLocaleDateString()}
                            </span>
                            <span className="text-xs lg:text-sm text-muted-foreground">
                              {assignment.total_points} points
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{assignment.description}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-4">
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <div className="text-muted-foreground text-center">
                      <div className="font-medium mb-1">No posts yet</div>
                      <div className="text-sm">Posts will appear here when created</div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={post.author.avatar} />
                          <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{post.author.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{post.content}</p>
                      {post.image_urls && post.image_urls.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {post.image_urls.map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Post image ${index + 1}`}
                              className="rounded-lg max-w-full h-auto"
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="announcements" className="space-y-4">
              {announcements.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <div className="text-muted-foreground text-center">
                      <div className="font-medium mb-1">No announcements yet</div>
                      <div className="text-sm">Announcements will appear here when created</div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                announcements.map((announcement) => (
                  <Card key={announcement.id} className={announcement.is_urgent ? "border-destructive" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                            {announcement.title}
                            {announcement.is_urgent && (
                              <AlertCircle className="h-4 w-4 lg:h-5 lg:w-5 text-destructive" />
                            )}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs lg:text-sm text-muted-foreground">
                              By {announcement.author.name}
                            </span>
                            <span className="text-xs lg:text-sm text-muted-foreground">
                              {new Date(announcement.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{announcement.content}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="discussions" className="space-y-4">
              {discussions.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <div className="text-muted-foreground text-center">
                      <div className="font-medium mb-1">No discussions yet</div>
                      <div className="text-sm">Discussion rooms will appear here when created</div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                discussions.map((discussion) => (
                  <Card key={discussion.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base lg:text-lg">{discussion.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">{discussion.messageCount} messages</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {discussion.lastMessage ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{discussion.lastMessage.sender.name}</span>
                            <span>•</span>
                            <span>{new Date(discussion.lastMessage.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm line-clamp-2">{discussion.lastMessage.content}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No messages yet</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      {profile?.role === 'teacher' && (
        <>
          <CreateAssignmentModal
            open={showCreateAssignment}
            onOpenChange={setShowCreateAssignment}
            classId={id!}
            onSuccess={() => fetchClassDetails(true)}
          />
          <CreatePostModal
            open={showCreatePost}
            onOpenChange={setShowCreatePost}
            classId={id!}
            onSuccess={() => fetchClassDetails(true)}
          />
          <CreateAnnouncementModal
            open={showCreateAnnouncement}
            onOpenChange={setShowCreateAnnouncement}
            classId={id!}
            onSuccess={() => fetchClassDetails(true)}
          />
        </>
      )}
    </div>
  );
};

export default ClassDetails;
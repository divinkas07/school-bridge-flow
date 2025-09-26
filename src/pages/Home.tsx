import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FeedCard, FeedItem } from '@/components/feed/FeedCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Home = () => {
  const { profile } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchFeedItems = async () => {
      setLoading(true);
      try {
        // Fetch relevant announcements based on user role and relationships
        const { data: announcements } = await supabase
          .from('announcements')
          .select(`
            *,
            teachers (
              full_name,
              avatar_url
            ),
            classes (
              name
            ),
            departments (
              name
            )
          `)
          .or('visibility.eq.public,visibility.eq.department,visibility.eq.class')
          .order('is_urgent', { ascending: false }) // Urgent first
          .order('created_at', { ascending: false });

        // Fetch public posts
        const { data: posts } = await supabase
          .from('posts')
          .select(`
            *,
            classes (
              name
            )
          `)
          .eq('type', 'all_users')
          .order('created_at', { ascending: false });

        // Fetch author details for posts
        const postAuthorIds = posts?.map(p => p.author_id) || [];
        const { data: postAuthors } = postAuthorIds.length > 0 ? await supabase
          .from('students')
          .select('id, full_name, avatar_url')
          .in('id', postAuthorIds) : { data: [] };

        const { data: postTeacherAuthors } = postAuthorIds.length > 0 ? await supabase
          .from('teachers')
          .select('id, full_name, avatar_url')
          .in('id', postAuthorIds) : { data: [] };

        // Combine author data
        const allPostAuthors = [...(postAuthors || []), ...(postTeacherAuthors || [])];

        // Fetch published assignments as public activities
        const { data: assignments } = await supabase
          .from('assignments')
          .select(`
            *,
            teachers (
              full_name,
              avatar_url
            ),
            classes (
              name
            )
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        // For now, show all announcements (they will be filtered by RLS policies)
        // TODO: Add client-side filtering based on user relationships
        const announcementItems: FeedItem[] = ((announcements as any) || []).map((ann: any) => {
          // Check if urgent announcement is still within 48 hours
          const isUrgentActive = ann.is_urgent && (
            new Date().getTime() - new Date(ann.created_at).getTime() < 48 * 60 * 60 * 1000
          );

          return {
            id: ann.id,
            type: 'announcement',
            title: ann.title,
            content: ann.content,
            author: {
              name: ann.teachers?.full_name || 'Unknown',
              avatar: ann.teachers?.avatar_url,
              role: 'teacher'
            },
            className: ann.classes?.name,
            department: ann.departments?.name,
            visibility: ann.visibility as 'public' | 'department' | 'class',
            isUrgent: isUrgentActive,
            createdAt: ann.created_at || ''
          };
        });

        const postItems: FeedItem[] = (posts || []).map(post => {
          const author = allPostAuthors.find(a => a.id === post.author_id);
          return {
            id: post.id,
            type: 'post',
            title: 'Post',
            content: post.content,
            author: {
              name: author?.full_name || 'Unknown',
              avatar: author?.avatar_url,
              role: post.author_type === 'teacher' ? 'teacher' : 'student'
            },
            className: post.classes?.name,
            createdAt: post.created_at || ''
          };
        });

        const assignmentItems: FeedItem[] = (assignments || []).map(ass => ({
          id: ass.id,
          type: 'assignment',
          title: ass.title,
          content: ass.description,
          author: {
            name: ass.teachers?.full_name || 'Unknown',
            avatar: ass.teachers?.avatar_url,
            role: 'teacher'
          },
          className: ass.classes?.name,
          dueDate: ass.due_date,
          createdAt: ass.created_at || ''
        }));

        // Combine and sort: urgent announcements first, then all announcements, then posts and assignments by date
        const allItems = [...announcementItems, ...postItems, ...assignmentItems]
          .sort((a, b) => {
            // Urgent announcements always first
            if (a.isUrgent && !b.isUrgent) return -1;
            if (!a.isUrgent && b.isUrgent) return 1;

            // Announcements before posts/assignments
            if (a.type === 'announcement' && b.type !== 'announcement') return -1;
            if (a.type !== 'announcement' && b.type === 'announcement') return 1;

            // Then sort by date (newest first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });

        setFeedItems(allItems);
      } catch (error) {
        console.error('Error fetching feed items:', error);
        setFeedItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedItems();
  }, []);

  const filterItems = (items: FeedItem[], filter: string) => {
    switch (filter) {
      case 'announcements':
        return items.filter(item => item.type === 'announcement');
      case 'assignments':
        return items.filter(item => item.type === 'assignment');
      case 'posts':
        return items.filter(item => item.type === 'post');
      default:
        return items;
    }
  };

  const filteredItems = filterItems(feedItems, activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent-green/10 px-4 py-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Welcome back, {profile?.full_name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-sm text-muted-foreground">
            {profile?.role === 'teacher' ? 'Manage your classes and connect with students' : 'Stay updated with your courses and assignments'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-4 bg-card border-b border-border">
        <div className="max-w-md mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="announcements" className="text-xs">News</TabsTrigger>
              <TabsTrigger value="assignments" className="text-xs">Tasks</TabsTrigger>
              <TabsTrigger value="posts" className="text-xs">Posts</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Feed */}
      <div className="px-4 py-4">
        <div className="max-w-md mx-auto space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-sm">
                No {activeTab === 'all' ? 'items' : activeTab} to show
              </div>
            </div>
          ) : (
            filteredItems.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                onClick={() => {
                  // TODO: Navigate to item detail
                  console.log('Clicked item:', item.id);
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
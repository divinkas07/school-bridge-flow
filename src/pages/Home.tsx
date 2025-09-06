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

  // Sample feed data for demo
  const sampleFeedItems: FeedItem[] = [
    {
      id: '1',
      type: 'announcement',
      title: 'Welcome to Computer Science 101!',
      content: 'Welcome everyone to CS101! Please make sure to complete the syllabus quiz by Friday. Looking forward to a great semester!',
      author: {
        name: 'Dr. Sarah Johnson',
        role: 'teacher',
        avatar: '/placeholder-avatar.jpg'
      },
      className: 'CS 101',
      visibility: 'class',
      isUrgent: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'assignment',
      title: 'Data Structures Assignment #1',
      content: 'Implement a binary search tree with insert, delete, and search operations. Submit your code along with test cases.',
      author: {
        name: 'Prof. Michael Chen',
        role: 'teacher',
      },
      className: 'CS 201',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'post',
      title: 'Study Group for Midterms',
      content: 'Hey everyone! I\'m organizing a study group for the upcoming midterm exams. We\'ll meet at the library every evening at 6 PM starting next week.',
      author: {
        name: 'Alex Rodriguez',
        role: 'student',
      },
      className: 'CS 101',
      visibility: 'class',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      type: 'document',
      title: 'Lecture Notes - Week 3',
      content: 'Updated lecture notes for this week covering algorithms and complexity analysis. Please review before the next class.',
      author: {
        name: 'Dr. Sarah Johnson',
        role: 'teacher',
      },
      className: 'CS 101',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '5',
      type: 'announcement',
      title: 'Campus Network Maintenance',
      content: 'The campus network will undergo scheduled maintenance this Saturday from 2-4 AM. Internet access may be limited during this time.',
      author: {
        name: 'IT Department',
        role: 'teacher',
      },
      department: 'Computer Science',
      visibility: 'department',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  useEffect(() => {
    // In a real app, we would fetch from Supabase
    // For now, using sample data
    setFeedItems(sampleFeedItems);
    setLoading(false);
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
    <div className="flex-1 bg-background pb-20">
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
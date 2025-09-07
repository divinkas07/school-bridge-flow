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
        // TODO: Fetch real data from Supabase
        setFeedItems([]);
      } catch (error) {
        console.error('Error fetching feed items:', error);
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
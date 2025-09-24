import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell,
  MessageSquare,
  FileText,
  BookOpen,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const getNotificationIcon = (type: import('@/hooks/useNotifications').NotificationItem['type']) => {
    switch (type) {
      case 'announcement':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'assignment':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'post':
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: import('@/hooks/useNotifications').NotificationItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const filteredNotifications = notifications.filter(notification =>
    activeTab === 'all' || !notification.isRead
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
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent-green/10 px-4 py-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Notifications
          </h2>
          <p className="text-sm text-muted-foreground">
            Stay updated with your classes and activities
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-4 bg-card border-b border-border">
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="flex-1"
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={activeTab === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('unread')}
              className="flex-1"
            >
              Unread ({notifications.filter(n => !n.isRead).length})
            </Button>
          </div>
          {notifications.filter(n => !n.isRead).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="w-full"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 py-4">
        <div className="max-w-md mx-auto space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-muted-foreground text-sm">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </div>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.isRead ? 'bg-muted/20' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm text-foreground line-clamp-1">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {notification.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {notification.className && (
                            <Badge variant="outline" className="text-xs">
                              {notification.className}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationItem {
  id: string;
  type: 'announcement' | 'assignment' | 'message' | 'post';
  title: string;
  content: string;
  className?: string;
  classId?: string;
  createdAt: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

interface NotificationsContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!profile?.user_id) return;
    setLoading(true);

    try {
      const notificationsList: NotificationItem[] = [];

      // Fetch urgent announcements
      const { data: announcements } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          created_at,
          is_urgent,
          class_id,
          classes(name)
        `)
        .or(`class_id.is.null,department_id.eq.${profile.department_id}`)
        .eq('is_urgent', true)
        .order('created_at', { ascending: false })
        .limit(20);

      announcements?.forEach(announcement => {
        notificationsList.push({
          id: `announcement-${announcement.id}`,
          type: 'announcement',
          title: announcement.title,
          content: announcement.content,
          className: announcement.classes?.name,
          classId: announcement.class_id,
          createdAt: announcement.created_at,
          isRead: false, // TODO: Implement persistent read status
          priority: 'high',
        });
      });

      // Fetch recent assignments (due soon)
      const { data: assignments } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          due_date,
          created_at,
          class_id,
          classes(name)
        `)
        .gte('due_date', new Date().toISOString())
        .lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()) // Next 7 days
        .order('due_date', { ascending: true })
        .limit(10);

      assignments?.forEach(assignment => {
        notificationsList.push({
          id: `assignment-${assignment.id}`,
          type: 'assignment',
          title: `Assignment Due: ${assignment.title}`,
          content: `Due in ${Math.ceil((new Date(assignment.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`,
          className: assignment.classes?.name,
          classId: assignment.class_id,
          createdAt: assignment.created_at,
          isRead: false,
          priority: 'medium',
        });
      });

      // Sort by created date (most recent first)
      notificationsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(notificationsList);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, [profile]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
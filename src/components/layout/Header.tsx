import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case '/':
      return 'Home';
    case '/classes':
      return 'Classes';
    case '/chat':
      return 'Messages';
    case '/documents':
      return 'Documents';
    case '/notifications':
      return 'Notifications';
    case '/profile':
      return 'Profile';
    default:
      return 'Academy';
  }
};

export const Header = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const title = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center p-0">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
          
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>

          <button  onClick={() => navigate("/profile")}>
            <Avatar className="h-8 w-8" >
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          </button> 
        </div>
      </div>
    </header>
  );
};
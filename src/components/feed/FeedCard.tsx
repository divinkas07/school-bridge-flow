import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Megaphone, 
  ClipboardList, 
  MessageSquare, 
  FileText, 
  Calendar,
  Users,
  Building
} from 'lucide-react';

export type FeedItemType = 'announcement' | 'assignment' | 'post' | 'document';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    role: 'student' | 'teacher';
  };
  className?: string;
  department?: string;
  visibility?: 'class' | 'department' | 'public';
  dueDate?: string;
  isUrgent?: boolean;
  createdAt: string;
}

interface FeedCardProps {
  item: FeedItem;
  onClick?: () => void;
}

const getTypeConfig = (type: FeedItemType) => {
  switch (type) {
    case 'announcement':
      return {
        icon: Megaphone,
        bgColor: 'bg-primary/10',
        borderColor: 'border-l-primary',
        iconColor: 'text-primary',
        badge: 'Announcement',
        badgeVariant: 'default' as const,
      };
    case 'assignment':
      return {
        icon: ClipboardList,
        bgColor: 'bg-accent-green/10',
        borderColor: 'border-l-accent-green',
        iconColor: 'text-accent-green',
        badge: 'Assignment',
        badgeVariant: 'secondary' as const,
      };
    case 'post':
      return {
        icon: MessageSquare,
        bgColor: 'bg-accent-grey/10',
        borderColor: 'border-l-accent-grey',
        iconColor: 'text-accent-grey',
        badge: 'Post',
        badgeVariant: 'outline' as const,
      };
    case 'document':
      return {
        icon: FileText,
        bgColor: 'bg-muted/50',
        borderColor: 'border-l-muted-foreground',
        iconColor: 'text-muted-foreground',
        badge: 'Document',
        badgeVariant: 'outline' as const,
      };
  }
};

const getVisibilityIcon = (visibility?: string) => {
  switch (visibility) {
    case 'class':
      return <Users className="h-3 w-3" />;
    case 'department':
      return <Building className="h-3 w-3" />;
    case 'public':
      return <Megaphone className="h-3 w-3" />;
    default:
      return null;
  }
};

export const FeedCard: React.FC<FeedCardProps> = ({ item, onClick }) => {
  const config = getTypeConfig(item.type);
  const Icon = config.icon;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md border-l-4",
        config.borderColor,
        onClick && "hover:bg-muted/20"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon className={cn("h-4 w-4", config.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={config.badgeVariant} className="text-xs">
                  {config.badge}
                </Badge>
                {item.isUrgent && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Urgent - expires in 48 hours" />
                )}
              </div>
              <h3 className="font-medium text-sm text-foreground line-clamp-2">
                {item.title}
              </h3>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
          {item.content}
        </p>

        {item.dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Calendar className="h-3 w-3" />
            <span>Due {formatDistanceToNow(new Date(item.dueDate), { addSuffix: true })}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={item.author.avatar} />
              <AvatarFallback className="text-xs bg-muted">
                {item.author.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">
                {item.author.name}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getVisibilityIcon(item.visibility)}
                <span>{item.className || item.department}</span>
              </div>
            </div>
          </div>
          
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
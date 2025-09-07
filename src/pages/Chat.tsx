import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Search, 
  Users, 
  User,
  Send,
  MoreVertical,
  ChevronLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'class';
  lastMessage: {
    content: string;
    sender: string;
    timestamp: string;
  };
  unreadCount: number;
  participants: {
    name: string;
    avatar?: string;
    isOnline: boolean;
  }[];
}

interface Message {
  id: string;
  content: string;
  sender: {
    name: string;
    avatar?: string;
  };
  timestamp: string;
  isOwn: boolean;
}

const Chat = () => {
  const { profile } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        // TODO: Fetch real data from Supabase
        setChatRooms([]);
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
      }
    };

    fetchChatRooms();
  }, []);

  const getChatIcon = (type: ChatRoom['type']) => {
    switch (type) {
      case 'class':
        return <Users className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      case 'direct':
        return <User className="h-4 w-4" />;
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRoom) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: { name: profile?.full_name || 'You' },
      timestamp: new Date().toISOString(),
      isOwn: true,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const ChatRoomList = () => (
    <div className="flex-1 bg-background">
      {/* Search */}
      <div className="px-4 py-4 bg-card border-b border-border">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="px-4 py-4">
        <div className="max-w-md mx-auto space-y-2">
          {chatRooms.map((room) => (
            <Card 
              key={room.id} 
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-muted/20"
              onClick={() => {
                setSelectedRoom(room);
                setMessages([]);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {getChatIcon(room.type)}
                    </div>
                    {room.type === 'direct' && room.participants[0]?.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm text-foreground truncate">
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(room.lastMessage.timestamp), { addSuffix: true })}
                        </span>
                        {room.unreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                            {room.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      <span className="font-medium">
                        {room.lastMessage.sender === 'You' ? 'You: ' : `${room.lastMessage.sender}: `}
                      </span>
                      {room.lastMessage.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const ChatView = () => (
    <div className="flex flex-col h-screen bg-background">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setSelectedRoom(null)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-primary/10 p-2 rounded-full">
            {getChatIcon(selectedRoom!.type)}
          </div>
          <div>
            <h2 className="font-medium text-sm">{selectedRoom!.name}</h2>
            <p className="text-xs text-muted-foreground">
              {selectedRoom!.participants.length} participant{selectedRoom!.participants.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.isOwn ? "justify-end" : "justify-start"
            )}
          >
            {!message.isOwn && (
              <Avatar className="h-8 w-8 mt-auto">
                <AvatarImage src={message.sender.avatar} />
                <AvatarFallback className="bg-muted text-xs">
                  {message.sender.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className={cn(
              "max-w-[70%] space-y-1",
              message.isOwn ? "items-end" : "items-start"
            )}>
              {!message.isOwn && (
                <p className="text-xs text-muted-foreground">{message.sender.name}</p>
              )}
              <div className={cn(
                "px-3 py-2 rounded-2xl text-sm",
                message.isOwn
                  ? "bg-primary text-primary-foreground ml-4"
                  : "bg-muted mr-4"
              )}>
                {message.content}
              </div>
              <p className="text-xs text-muted-foreground px-1">
                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="px-4 py-4 bg-card border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return selectedRoom ? <ChatView /> : <ChatRoomList />;
};

export default Chat;
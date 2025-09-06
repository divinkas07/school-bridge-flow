import React, { useState } from 'react';
import { Plus, MessageSquare, Megaphone, ClipboardList, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();

  const actions = [
    {
      name: 'New Post',
      icon: MessageSquare,
      color: 'bg-accent-grey hover:bg-accent-grey/90',
      onClick: () => {
        setIsOpen(false);
        // TODO: Open new post modal
      },
    },
    ...(profile?.role === 'teacher' ? [
      {
        name: 'Announcement',
        icon: Megaphone,
        color: 'bg-primary hover:bg-primary-hover',
        onClick: () => {
          setIsOpen(false);
          // TODO: Open new announcement modal
        },
      },
      {
        name: 'Assignment',
        icon: ClipboardList,
        color: 'bg-accent-green hover:bg-accent-green/90',
        onClick: () => {
          setIsOpen(false);
          // TODO: Open new assignment modal
        },
      },
    ] : []),
  ];

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Action buttons */}
      <div className={cn(
        "flex flex-col gap-2 mb-3 transition-all duration-300 transform",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      )}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={action.name}
              onClick={action.onClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-full text-white shadow-lg transition-all duration-200",
                action.color,
                "animate-in slide-in-from-bottom-1"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{action.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 bg-primary hover:bg-primary-hover text-primary-foreground rounded-full shadow-lg transition-all duration-300 flex items-center justify-center",
          "hover:scale-110 active:scale-95",
          isOpen && "rotate-45"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
};
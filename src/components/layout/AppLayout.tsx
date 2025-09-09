import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { FloatingActionButton } from '@/components/layout/FloatingActionButton';
import { CreateModalsProvider } from '@/hooks/useCreateModals';
import { CreatePostModal } from '@/components/modals/CreatePostModal';
import { CreateAnnouncementModal } from '@/components/modals/CreateAnnouncementModal';
import { CreateAssignmentModal } from '@/components/modals/CreateAssignmentModal';
import { useCreateModals } from '@/hooks/useCreateModals';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayoutContent: React.FC<AppLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const {
    postModalOpen,
    announcementModalOpen,
    assignmentModalOpen,
    setPostModalOpen,
    setAnnouncementModalOpen,
    setAssignmentModalOpen,
  } = useCreateModals();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 pb-20">
        {children}
      </main>
      <BottomNavigation />
      <FloatingActionButton />
      
      {/* Modals */}
      <CreatePostModal
        open={postModalOpen}
        onOpenChange={setPostModalOpen}
      />
      <CreateAnnouncementModal
        open={announcementModalOpen}
        onOpenChange={setAnnouncementModalOpen}
      />
      <CreateAssignmentModal
        open={assignmentModalOpen}
        onOpenChange={setAssignmentModalOpen}
      />
    </div>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <CreateModalsProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </CreateModalsProvider>
  );
};
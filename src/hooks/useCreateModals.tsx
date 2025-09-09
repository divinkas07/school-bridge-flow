import React, { createContext, useContext, useState } from 'react';

interface CreateModalsContextType {
  postModalOpen: boolean;
  announcementModalOpen: boolean;
  assignmentModalOpen: boolean;
  setPostModalOpen: (open: boolean) => void;
  setAnnouncementModalOpen: (open: boolean) => void;
  setAssignmentModalOpen: (open: boolean) => void;
}

const CreateModalsContext = createContext<CreateModalsContextType | undefined>(undefined);

export const CreateModalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);

  return (
    <CreateModalsContext.Provider
      value={{
        postModalOpen,
        announcementModalOpen,
        assignmentModalOpen,
        setPostModalOpen,
        setAnnouncementModalOpen,
        setAssignmentModalOpen,
      }}
    >
      {children}
    </CreateModalsContext.Provider>
  );
};

export const useCreateModals = () => {
  const context = useContext(CreateModalsContext);
  if (context === undefined) {
    throw new Error('useCreateModals must be used within a CreateModalsProvider');
  }
  return context;
};
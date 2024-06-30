import { create } from 'zustand';

export interface useCreateRequestStore {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useCreateRequest = create<useCreateRequestStore>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen: boolean) => {
    set(() => ({ isOpen }));
  },
}));

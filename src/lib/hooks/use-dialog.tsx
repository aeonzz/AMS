import { create } from 'zustand';

export interface UseDialogStore {
  createRequest: boolean;
  setCreateRequest: (createRequest: boolean) => void;
  commandDialog: boolean;
  setCommandDialog: (commandDialog: boolean) => void;
  profileUploadDialog: boolean;
  setProfileUploadDialog: (commandDialog: boolean) => void;
}

export const useDialog = create<UseDialogStore>((set) => ({
  createRequest: false,
  setCreateRequest: (createRequest: boolean) => {
    set(() => ({ createRequest }));
  },
  commandDialog: false,
  setCommandDialog: (commandDialog: boolean) => {
    set(() => ({ commandDialog }));
  },
  profileUploadDialog: false,
  setProfileUploadDialog: (profileUploadDialog: boolean) => {
    set(() => ({ profileUploadDialog }));
  },
}));

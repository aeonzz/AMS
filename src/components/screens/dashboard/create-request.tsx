'use client';

import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCreateRequest } from '@/hooks/use-create-request';
import { useDialog } from '@/hooks/use-dialog';

export default function CreateRequest() {
  const createRequest = useCreateRequest();
  const dialog = useDialog();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        createRequest.setIsOpen(true);
        dialog.setIsOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Dialog open={createRequest.isOpen} onOpenChange={createRequest.setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

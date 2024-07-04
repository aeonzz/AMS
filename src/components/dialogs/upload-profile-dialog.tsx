import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImageUp } from 'lucide-react';
import { Button } from '../ui/button';

export default function UploadProfileDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="expandIcon"
          Icon={ImageUp}
          iconPlacement="right"
          size="sm"
        >
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
          <DialogDescription>
            Upload files Drag and drop your files here or click to browse.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

import * as React from "react";
import { toast } from "sonner";
import type { UploadFilesOptions } from "uploadthing/types";

import type { UploadedFile } from "@/lib/types/file";
import { type OurFileRouter } from "@/app/api/uploadthing/core";

import { updateUser } from "../actions/users";
import { getErrorMessage } from "../handle-errror";
import { uploadFiles } from "../uploadthing";

interface UseUploadFileProps
  extends Pick<
    UploadFilesOptions<OurFileRouter, keyof OurFileRouter>,
    "headers" | "onUploadBegin" | "onUploadProgress" | "skipPolling"
  > {
  defaultUploadedFiles?: UploadedFile[];
}

export function useUploadFile(
  endpoint: keyof OurFileRouter,
  { defaultUploadedFiles = [], ...props }: UseUploadFileProps = {}
) {
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>(defaultUploadedFiles);
  const [progresses, setProgresses] = React.useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = React.useState(false);

  async function uploadThings(files: File[]) {
    setIsUploading(true);
    try {
      const res = await uploadFiles(endpoint, {
        ...props,
        files,
        onUploadProgress: ({ file, progress }) => {
          setProgresses((prev) => {
            return {
              ...prev,
              [file]: progress,
            };
          });
        },
      });
      await updateUser({ profileUrl: res[0].url, path: "/settings/account" });
      setUploadedFiles((prev) => (prev ? [...prev, ...res] : res));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProgresses({});
      setIsUploading(false);
    }
  }

  return {
    uploadedFiles,
    progresses,
    uploadFiles: uploadThings,
    isUploading,
  };
}
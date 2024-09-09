"use client";

import React from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  UserPlus,
  Check,
  AlertCircle,
  Loader2,
  ChevronsUpDown,
} from "lucide-react";
import type { RequestWithRelations, User } from "prisma/generated/zod";
import { RequestStatusType } from "@prisma/client";
import { useServerActionMutation } from "@/lib/hooks/server-action-hooks";
import { updateRequestStatus, assignPersonnel } from "@/lib/actions/job";
import {
  UpdateRequestStatusSchemaWithPath,
  AssignPersonnelSchemaWithPath,
} from "./schema";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { P } from "@/components/typography/text";
import { Separator } from "@/components/ui/separator";
import { formatFullName } from "@/lib/utils";

interface JobRequestReviewerActionsDialogProps {
  request: RequestWithRelations;
}

export default function JobRequestReviewerActionsDialog({
  request,
}: JobRequestReviewerActionsDialogProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPersonnelPopoverOpen, setIsPersonnelPopoverOpen] =
    React.useState(false);
  const [selectedPerson, setSelectedPerson] = React.useState<
    string | undefined | null
  >(request.jobRequest?.assignedTo);

  const {
    data: personnel,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<User[]>({
    queryFn: async () => {
      const res = await axios.get("/api/user/get-personnels");
      return res.data.data;
    },
    queryKey: ["get-personnels"],
  });

  const { mutateAsync: updateStatusMutate, isPending: isUpdateStatusPending } =
    useServerActionMutation(updateRequestStatus);

  const {
    mutateAsync: assignPersonnelMutate,
    isPending: isAssignPersonnelPending,
  } = useServerActionMutation(assignPersonnel);

  React.useEffect(() => {
    setSelectedPerson(request.jobRequest?.assignedTo);
  }, [request.jobRequest?.assignedTo]);

  const handleReview = (action: RequestStatusType) => {
    const data: UpdateRequestStatusSchemaWithPath = {
      path: pathname,
      requestId: request.id,
      status: action,
    };

    const actionText = action === "REVIEWED" ? "Approving" : "Rejecting";
    const successText = action === "REVIEWED" ? "approved" : "rejected";

    toast.promise(updateStatusMutate(data), {
      loading: `${actionText} job request...`,

      success: () => {
        queryClient.invalidateQueries({
          queryKey: [request.id],
        });
        setIsOpen(false);
        return `Job request ${successText} successfully.`;
      },
      error: (err) => {
        console.error(err);
        return `Failed to ${action.toLowerCase()} job request. Please try again.`;
      },
    });
  };

  const handleAssignPersonnel = async (id: string) => {
    if (id === selectedPerson) {
      toast.info("No changes made. The selected user is already assigned.");
      return;
    }

    setSelectedPerson(id);

    const data: AssignPersonnelSchemaWithPath = {
      path: pathname,
      requestId: request.jobRequest?.id || "",
      personnelId: id,
    };

    toast.promise(assignPersonnelMutate(data), {
      loading: "Assigning...",
      success: () => {
        queryClient.invalidateQueries({
          queryKey: [request.id],
        });
        setIsPersonnelPopoverOpen(false);
        return "Personnel assigned successfully.";
      },
      error: (err) => {
        console.log(err);
        return err.message;
      },
    });
  };

  const currentStatus = request.status;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="secondary">
          <UserPlus className="mr-2 h-4 w-4" />
          Manage Request
        </Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => {
          if (isUpdateStatusPending || isAssignPersonnelPending) {
            e.preventDefault();
          }
        }}
        className="sm:max-w-[425px]"
        isLoading={isUpdateStatusPending || isAssignPersonnelPending}
      >
        <DialogHeader>
          <DialogTitle>Manage Job Request</DialogTitle>
          <DialogDescription>
            Review and take action on this job request.
          </DialogDescription>
        </DialogHeader>
        <div className="scroll-bar flex max-h-[60vh] flex-col gap-3 overflow-y-auto px-4 py-1">
          <Popover
            open={isPersonnelPopoverOpen}
            onOpenChange={setIsPersonnelPopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                role="combobox"
                aria-expanded={isPersonnelPopoverOpen}
                className="w-full justify-between"
                disabled={
                  currentStatus !== "PENDING" ||
                  isUpdateStatusPending ||
                  isAssignPersonnelPending
                }
              >
                {selectedPerson
                  ? personnel?.find((p) => p.id === selectedPerson)?.lastName
                  : "Assign Personnel"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              onInteractOutside={(e) => {
                if (isAssignPersonnelPending) {
                  e.preventDefault();
                }
              }}
              className="w-[300px] p-0"
            >
              <Command>
                <CommandInput placeholder="Search personnel..." />
                <CommandList>
                  <CommandEmpty>No personnel found.</CommandEmpty>
                  {isLoading && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                  {isError && (
                    <div className="flex flex-col items-center justify-center space-y-2 p-4">
                      <AlertCircle className="h-6 w-6 text-red-500" />
                      <P className="text-sm text-red-500">
                        {error?.message || "An error occurred"}
                      </P>
                      <Button
                        onClick={() => refetch()}
                        variant="outline"
                        size="sm"
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                  {!isLoading && !isError && (
                    <CommandGroup>
                      {personnel?.map((item) => (
                        <CommandItem
                          key={item.id}
                          onSelect={() => handleAssignPersonnel(item.id)}
                          disabled={isAssignPersonnelPending}
                        >
                          <div className="flex w-full items-center">
                            <Avatar className="mr-2 h-8 w-8">
                              <AvatarImage
                                src={item.profileUrl ?? ""}
                                alt={formatFullName(item)}
                              />
                              <AvatarFallback>
                                {item.firstName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <P className="font-medium">
                                {formatFullName(item)}
                              </P>
                              <P className="text-sm text-muted-foreground">
                                {item.department}
                              </P>
                            </div>
                            {item.id === selectedPerson && (
                              <Check className="ml-auto h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {currentStatus === "PENDING" && (
            <div className="flex space-x-2">
              <Button
                onClick={() => handleReview("REVIEWED")}
                disabled={
                  !selectedPerson ||
                  isUpdateStatusPending ||
                  isAssignPersonnelPending
                }
                className="flex-1"
              >
                Approve
              </Button>
              <Button
                onClick={() => handleReview("REJECTED")}
                variant="destructive"
                disabled={isUpdateStatusPending || isAssignPersonnelPending}
                className="flex-1"
              >
                Reject
              </Button>
            </div>
          )}
        </div>
        <Separator className="my-2" />
        <DialogFooter>
          <div></div>
          <Button
            variant="secondary"
            disabled={isAssignPersonnelPending || isUpdateStatusPending}
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

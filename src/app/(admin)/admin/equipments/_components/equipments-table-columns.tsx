"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";

import {
  formatDate,
  getReturnableItemStatusIcon,
  textTransform,
} from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

import { P } from "@/components/typography/text";
import { type ReturnableItem } from "prisma/generated/zod";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useServerActionMutation } from "@/lib/hooks/server-action-hooks";
import { Button } from "@/components/ui/button";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { UpdateEquipmentSheet } from "./update-equipment-sheet";
import { DeleteEquipmentsDialog } from "./delete-equipments-dialog";
import { useDialogManager } from "@/lib/hooks/use-dialog-manager";
import { updateEquipment } from "@/lib/actions/equipment";
import ReturnableItemStatusSchema, {
  ReturnableItemStatusType,
} from "prisma/generated/zod/inputTypeSchemas/ReturnableItemStatusSchema";
import { type ReturnableItemType } from "@/lib/types/item";

export function getEquipmentsColumns(): ColumnDef<ReturnableItemType>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="px-3">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="translate-y-0.5"
          />
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 20,
    },
    {
      accessorKey: "imageUrl",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Image" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-start">
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative aspect-square h-20 cursor-pointer transition-colors hover:brightness-75">
                  <Image
                    src={row.original.imageUrl}
                    alt={`Image of ${row.original.name}`}
                    fill
                    className="rounded-md border object-cover"
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="aspect-square min-h-[80vh] max-w-2xl">
                <Image
                  src={row.original.imageUrl}
                  alt={`Image of ${row.original.name}`}
                  fill
                  className="rounded-md border object-cover"
                />
              </DialogContent>
            </Dialog>
          </div>
        );
      },
      enableSorting: false,
      size: 0,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex w-[25vw] space-x-2">
            <P className="truncate font-medium">{row.original.name}</P>
          </div>
        );
      },
    },
    {
      accessorKey: "inventory",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Inventory" />
      ),
      cell: ({ row }) => {
        const router = useRouter();
        return (
          <div className="flex items-center space-x-2">
            <P className="truncate font-medium">
              {row.original.inventoryCount}
            </P>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/admin/e/${row.original.id}`)}
            >
              View
            </Button>
          </div>
        );
      },
      size: 0,
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <P className="truncate font-medium">{row.original.description}</P>
          </div>
        );
      },
      size: 0,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      cell: ({ cell }) => formatDate(cell.getValue() as Date),
      size: 0,
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        const dialogManager = useDialogManager();
        const pathname = usePathname();
        const [showUpdateTaskSheet, setShowUpdateTaskSheet] =
          React.useState(false);
        const [showDeleteTaskDialog, setShowDeleteTaskDialog] =
          React.useState(false);

        const { isPending, mutateAsync } =
          useServerActionMutation(updateEquipment);

        React.useEffect(() => {
          if (showUpdateTaskSheet) {
            dialogManager.setActiveDialog("adminUpdateEquipmentSheet");
          } else {
            dialogManager.setActiveDialog(null);
          }
        }, [showUpdateTaskSheet]);

        return (
          <div className="grid place-items-center">
            <UpdateEquipmentSheet
              open={showUpdateTaskSheet}
              onOpenChange={setShowUpdateTaskSheet}
              equipment={row.original}
            />
            {/* <DeleteEquipmentsDialog
              open={showDeleteTaskDialog}
              onOpenChange={setShowDeleteTaskDialog}
              equipments={[row.original]}
              showTrigger={false}
              onSuccess={() => row.toggleSelected(false)}
            /> */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Open menu"
                  variant="ghost"
                  className="flex size-8 p-0 data-[state=open]:bg-muted"
                >
                  <DotsHorizontalIcon className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onSelect={() => setShowUpdateTaskSheet(true)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setShowDeleteTaskDialog(true)}
                  className="focus:bg-destructive focus:text-destructive-foreground"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      size: 40,
    },
  ];
}

"use client";

import { DownloadIcon } from "@radix-ui/react-icons";
import { type Table } from "@tanstack/react-table";

import { exportTableToCSV } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { type ReturnableItem } from "prisma/generated/zod";
import { DeleteEquipmentsDialog } from "./delete-equipments-dialog";
import { useDialogManager } from "@/lib/hooks/use-dialog-manager";
import { PlusIcon } from "lucide-react";

interface EquipmentsTableToolbarActionsProps {
  table: Table<ReturnableItem>;
}

export function EquipmentsTableToolbarActions({
  table,
}: EquipmentsTableToolbarActionsProps) {
  const dialogManager = useDialogManager();
  return (
    <div className="flex items-center gap-2">
      {table.getFilteredSelectedRowModel().rows.length > 0 ? (
        <DeleteEquipmentsDialog
          equipments={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
          onSuccess={() => table.toggleAllRowsSelected(false)}
        />
      ) : null}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => dialogManager.setActiveDialog("adminCreateEquipmentDialog")}
      >
        <PlusIcon className="mr-2 size-4" aria-hidden="true" />
        New equipment
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          exportTableToCSV(table, {
            filename: "tasks",
            excludeColumns: ["select", "actions"],
          })
        }
      >
        <DownloadIcon className="mr-2 size-4" aria-hidden="true" />
        Export
      </Button>
      {/**
       * Other actions can be added here.
       * For example, import, view, etc.
       */}
    </div>
  );
}
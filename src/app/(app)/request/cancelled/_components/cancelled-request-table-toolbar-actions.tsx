"use client";

import React from "react";
import { type Table } from "@tanstack/react-table";

import { Request } from "prisma/generated/zod";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import { useDialogManager } from "@/lib/hooks/use-dialog-manager";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/date-range-picker";

interface CancelledRequestTableToolbarActionsProps {
  table: Table<Request>;
}

export function CancelledRequestTableToolbarActions({
  table,
}: CancelledRequestTableToolbarActionsProps) {
  const dialogManager = useDialogManager();
  return (
    <div className="flex items-center gap-2">
      {/* {table.getFilteredSelectedRowModel().rows.length > 0 ? (
        <DeleteRequestDialog
          request={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
          onSuccess={() => table.toggleAllRowsSelected(false)}
        />
      ) : null} */}
      <React.Suspense fallback={<Skeleton className="h-7 w-52" />}>
        <DateRangePicker
          triggerVariant="secondary"
          triggerSize="sm"
          triggerClassName="ml-auto w-fit"
          align="end"
          placeholder="Created"
        />
      </React.Suspense>
      {/**
       * Other actions can be added here.
       * For example, import, view, etc.
       */}
    </div>
  );
}

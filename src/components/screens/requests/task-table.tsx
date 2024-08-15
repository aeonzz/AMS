"use client";
"use memo";

import * as React from "react";

import { DataTableAdvancedToolbar } from "@/components/data-table/advanced/data-table-advanced-toolbar";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";

// import { TasksTableFloatingBar } from "./tasks-table-floating-bar";
import { useDataTable } from "@/lib/hooks/use-data-table";
import { type DataTableFilterField } from "@/lib/types";
import { getColumns } from "./task-table-columns";
import { RequestsFilter } from "@/lib/types/request";
import {
  PriorityTypeSchema,
  Request,
  RequestStatusTypeSchema,
} from "prisma/generated/zod";
import { useTasksTable } from "@/components/providers/task-table-provider";
import { TasksTableToolbarActions } from "./task-table-toolbar-actions";
import { getRequests } from "@/lib/actions/requests";
import { getPriorityIcon, getStatusIcon } from "@/lib/utils";
import { TasksTableFloatingBar } from "./task-table-floating-bar";

interface TasksTableProps {
  tasksPromise: ReturnType<typeof getRequests>;
}

export function TasksTable({ tasksPromise }: TasksTableProps) {
  // Feature flags for showcasing some additional features. Feel free to remove them.
  const { featureFlags } = useTasksTable();

  const { data, pageCount } = React.use(tasksPromise);

  // Memoize the columns so they don't re-render on every render
  const columns = React.useMemo(() => getColumns(), []);

  /**
   * This component can render either a faceted filter or a search filter based on the `options` prop.
   *
   * @prop options - An array of objects, each representing a filter option. If provided, a faceted filter is rendered. If not, a search filter is rendered.
   *
   * Each `option` object has the following properties:
   * @prop {string} label - The label for the filter option.
   * @prop {string} value - The value for the filter option.
   * @prop {React.ReactNode} [icon] - An optional icon to display next to the label.
   * @prop {boolean} [withCount] - An optional boolean to display the count of the filter option.
   */
  const filterFields: DataTableFilterField<Request>[] = [
    {
      label: "Title",
      value: "title",
      placeholder: "Filter titles...",
    },
    {
      label: "Status",
      value: "status",
      options: RequestStatusTypeSchema.options.map((status) => ({
        label:
          status.charAt(0).toUpperCase() +
          status.slice(1).toLowerCase().replace(/_/g, " "),
        value: status,
        icon: getStatusIcon(status),
        withCount: true,
      })),
    },
    {
      label: "Priority",
      value: "priority",
      options: PriorityTypeSchema.options.map((priority) => ({
        label:
          priority.charAt(0).toUpperCase() +
          priority.slice(1).toLowerCase().replace(/_/g, " "),
        value: priority,
        icon: getPriorityIcon(priority),
        withCount: true,
      })),
    },
  ];

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    /* optional props */
    filterFields,
    enableAdvancedFilter: featureFlags.includes("advancedFilter"),
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    // For remembering the previous row selection on page change
    getRowId: (originalRow, index) => `${originalRow.id}-${index}`,
    /* */
  });

  return (
    <DataTable
      table={table}
      floatingBar={
        featureFlags.includes("floatingBar") ? (
          <TasksTableFloatingBar table={table} />
        ) : null
      }
    >
      {featureFlags.includes("advancedFilter") ? (
        <DataTableAdvancedToolbar table={table} filterFields={filterFields}>
          <TasksTableToolbarActions table={table} />
        </DataTableAdvancedToolbar>
      ) : (
        <DataTableToolbar table={table} filterFields={filterFields}>
          <TasksTableToolbarActions table={table} />
        </DataTableToolbar>
      )}
    </DataTable>
  );
}

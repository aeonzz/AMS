
"use client";
"use memo";

import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";

import { useDataTable } from "@/lib/hooks/use-data-table";
import { type DataTableFilterField } from "@/lib/types";
import { type ReturnableItem } from "prisma/generated/zod";
import { EquipmentsTableFloatingBar } from "./equipments-table-floating-bar";
import { EquipmentsTableToolbarActions } from "./equipments-table-toolbar-actions";
import { getEquipments } from "@/lib/actions/equipment";
import { getEquipmentsColumns } from "./equipments-table-columns";
import { type ColumnDef } from "@tanstack/react-table";
import { ModifiedDataTable } from "@/components/data-table/modified-data-table";

interface EquipmentsTableProps {
  equipmentsPromise: ReturnType<typeof getEquipments>;
}

export function EquipmentsTable({ equipmentsPromise }: EquipmentsTableProps) {
  const { data, pageCount } = React.use(equipmentsPromise);

  // Explicitly type the columns
  const columns = React.useMemo<ColumnDef<ReturnableItem>[]>(
    () => getEquipmentsColumns() as ColumnDef<ReturnableItem>[],
    []
  );

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
  const filterFields: DataTableFilterField<ReturnableItem>[] = [
    {
      label: "Name",
      value: "name",
      placeholder: "Filter names...",
    },
  ];

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    /* optional props */
    filterFields,
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
      // route="admin/e"
      floatingBar={<EquipmentsTableFloatingBar table={table} />}
    >
      <DataTableToolbar table={table} filterFields={filterFields}>
        <EquipmentsTableToolbarActions table={table} />
      </DataTableToolbar>
    </DataTable>
  );
}

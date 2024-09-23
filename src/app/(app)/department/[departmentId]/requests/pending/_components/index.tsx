import React from "react";

import { P } from "@/components/typography/text";
import { DateRangePicker } from "@/components/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { GetRequestsSchema } from "@/lib/schema";
import { getManageRequests } from "@/lib/actions/requests";
import { ManageRequestsTable } from "./manage-requests-table";

interface ManageRequestScreenProps {
  departmentId: string;
  search: GetRequestsSchema;
}

export default function ManageRequestScreen({
  departmentId,
  search,
}: ManageRequestScreenProps) {
  const requestPromise = getManageRequests({ ...search, departmentId });

  return (
    <div className="flex h-full w-full">
      <div className="flex-1">
        <div className="flex h-[50px] items-center justify-between border-b px-3">
          <P className="font-medium">Pending Requests</P>
          <React.Suspense fallback={<Skeleton className="h-7 w-52" />}>
            <DateRangePicker
              triggerVariant="secondary"
              triggerSize="sm"
              triggerClassName="ml-auto w-56 sm:w-60"
              align="end"
              placeholder="Created"
            />
          </React.Suspense>
        </div>
        <div className="grid min-h-[calc(100vh_-_100px)] place-items-center items-center py-3">
          <React.Suspense
            fallback={
              <DataTableSkeleton
                columnCount={4}
                searchableColumnCount={1}
                filterableColumnCount={2}
                cellWidths={["10rem", "30rem", "12rem", "12rem", "8rem"]}
                shrinkZero
              />
            }
          >
            <ManageRequestsTable requestPromise={requestPromise} />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}
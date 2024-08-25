import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ReservedDatesAndTimes } from "@/lib/schema/utils";
import { format } from "date-fns";
import React from "react";

interface ScheduledEventCardProps {
  data: ReservedDatesAndTimes;
}

export default function ScheduledEventCard({ data }: ScheduledEventCardProps) {
  return (
    <Card className="mb-2 bg-secondary">
      <CardHeader>
        <CardTitle className="truncate">{data.request.title}</CardTitle>
        <Badge variant="outline" className="w-fit">{data.request.department}</Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="space-y-1">
            <p className="text-xs">From:</p>
            <p className="text-sm">{format(data.startTime, "PPP")}</p>
          </span>
          <span className="space-y-1">
            <p className="text-xs">To:</p>
            <p className="text-sm">{format(data.endTime, "PPP")}</p>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

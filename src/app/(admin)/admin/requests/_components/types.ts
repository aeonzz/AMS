import type { Request } from "prisma/generated/zod";

export type RequestsTableType = Request & {
  departmentName: string;
};
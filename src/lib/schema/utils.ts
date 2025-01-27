import {
  DepartmentSchema,
  RequestStatusTypeSchema,
  UserSchema,
  VehicleSchema,
  VenueSchema,
} from "prisma/generated/zod";
import { z } from "zod";

export const reservedDateTimeSchema = z.object({
  venueName: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  request: z.object({
    status: RequestStatusTypeSchema,
    title: z.string(),
    department: DepartmentSchema,
    user: UserSchema,
    venueRequest: z.object({
      venue: VenueSchema,
    }),
  }),
});

export type ReservedDatesAndTimes = z.infer<typeof reservedDateTimeSchema>;

export const reservedTransportDateAndTime = z.object({
  dateAndTimeNeeded: z.date(),
  request: z.object({
    status: RequestStatusTypeSchema,
    title: z.string(),
    department: DepartmentSchema,
    user: UserSchema,
    transportRequest: z.object({
      vehicle: VehicleSchema,
      inProgress: z.boolean(),
    }),
  }),
});

export type ReservedTransportDateAndTime = z.infer<
  typeof reservedTransportDateAndTime
>;

export const reservedReturnableItemDateAndTime = z.object({
  dateAndTimeNeeded: z.date(),
  returnDateAndTime: z.date(),
  request: z.object({
    status: RequestStatusTypeSchema,
    title: z.string(),
    department: DepartmentSchema,
    user: UserSchema,
  }),
  item: z.object({
    name: z.string(),
  }),
});

export type ReservedReturnableItemDateAndTime = z.infer<
  typeof reservedReturnableItemDateAndTime
>;

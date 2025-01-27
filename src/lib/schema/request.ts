import { z } from "zod";
import {
  JobStatusSchema,
  PriorityTypeSchema,
  RequestStatusTypeSchema,
  RequestTypeSchema,
  VehicleStatusSchema,
  VenueStatusSchema,
} from "prisma/generated/zod";

export const requestSchemaBase = z.object({
  priority: PriorityTypeSchema,
  type: RequestTypeSchema,
  departmentId: z.string(),
});

export const jobRequestSchemaServer = z.object({
  notes: z
    .string()
    .min(10, { message: "Must be at least 10 characters long" })
    .max(600, { message: "Cannot be more than 600 characters long" }),
  images: z.array(z.string()).optional(),
  jobType: z.string(),
  dueDate: z.date(),
});

export const jobRequestSchemaWithPath = jobRequestSchemaServer.extend({
  path: z.string(),
});

export type JobRequestSchemaWithPath = z.infer<typeof jobRequestSchemaWithPath>;

export const extendedJobRequestSchema = requestSchemaBase.merge(
  jobRequestSchemaWithPath
);

export type ExtendedJobRequestSchema = z.infer<typeof extendedJobRequestSchema>;

export const venueRequestSchemaBase = z.object({
  venueId: z.string({
    required_error: "Please select a venue",
  }),
  purpose: z
    .string()
    .min(10, { message: "Must be at least 10 characters long" })
    .max(700, { message: "Cannot be more than 600 characters long" }),
  department: z.string({
    required_error: "Department is required",
  }),
  setupRequirements: z.array(z.string()).optional(),
  startTime: z
    .date({
      required_error: "Start time is required",
    })
    .min(new Date(), {
      message: "Start time must be in the future",
    })
    .refine(
      (date) => {
        const localDate = new Date(
          date.toLocaleString("en-US", { timeZone: "Asia/Manila" })
        );
        return localDate.getHours() !== 0 || localDate.getMinutes() !== 0;
      },
      {
        message: "Start time cannot be exactly midnight (00:00)",
      }
    ),
  endTime: z
    .date({
      required_error: "End time is required",
    })
    .min(new Date(), {
      message: "End time must be in the future",
    })
    .refine(
      (date) => {
        const localDate = new Date(
          date.toLocaleString("en-US", { timeZone: "Asia/Manila" })
        );
        return localDate.getHours() !== 0 || localDate.getMinutes() !== 0;
      },
      {
        message: "End time cannot be exactly midnight (00:00)",
      }
    ),
  notes: z
    .string()
    .max(700, { message: "Cannot be more than 600 characters long" })
    .optional(),
  inProgress: z.boolean().optional(),
  actualStart: z.date().optional(),
  approvedByHead: z.boolean().optional(),
  venueStatus: VenueStatusSchema.optional(),
});

export const venueRequestSchema = venueRequestSchemaBase.refine(
  (data) => data.startTime <= data.endTime,
  {
    message: "Start time must not be later than the end time",
    path: ["startTime"],
  }
);

export type VenueRequestSchema = z.infer<typeof venueRequestSchema>;

export const venueRequestSchemaWithPath = venueRequestSchemaBase.extend({
  path: z.string(),
});

export type VenueRequestSchemaWithPath = z.infer<
  typeof venueRequestSchemaWithPath
>;

export const extendedVenueRequestSchema = requestSchemaBase.merge(
  venueRequestSchemaWithPath
);

export type ExtendedVenueRequestSchema = z.infer<
  typeof extendedVenueRequestSchema
>;

export const updateVenueRequestSchema = venueRequestSchemaBase.partial();

export type UpdateVenueRequestSchema = z.infer<typeof updateVenueRequestSchema>;

export const updateVenueRequestSchemaWithPath = updateVenueRequestSchema.extend(
  {
    id: z.string(),
    path: z.string(),
  }
);

export type UpdateVenueRequestSchemaWithPath = z.infer<
  typeof updateVenueRequestSchemaWithPath
>;

export const transportRequestSchema = z.object({
  vehicleId: z.string({
    required_error: "Please select a vehicle",
  }),
  description: z
    .string()
    .min(1, "Description is required")
    .max(700, "Description cannot exceed 700 characters"),
  destination: z
    .string()
    .min(1, "Destination is required")
    .max(70, "Destination cannot exceed 70 characters"),
  department: z.string({
    required_error: "Department is required",
  }),
  passengersName: z
    .array(z.string().max(50, "Passenger name cannot exceed 50 characters"))
    .min(1, "At least one passenger name is required"),
  dateAndTimeNeeded: z.date({
    required_error: "Date time is required",
  }),
  inProgress: z.boolean().optional(),
  actualStart: z.date().optional(),
  odometerStart: z.number().optional(),
  odometerEnd: z.number().optional(),
  vehicleStatus: VehicleStatusSchema.optional(),
  isUrgent: z.boolean().default(false),
});

export type TransportRequestSchema = z.infer<typeof transportRequestSchema>;

export const transportRequestSchemaWithPath = transportRequestSchema.extend({
  path: z.string(),
});

export type TransportRequestSchemaWithPath = z.infer<
  typeof transportRequestSchemaWithPath
>;

export const extendedTransportRequestSchema = requestSchemaBase.merge(
  transportRequestSchemaWithPath
);

export type ExtendedTransportRequestSchema = z.infer<
  typeof extendedTransportRequestSchema
>;

export const updateTransportRequestSchema = transportRequestSchema.partial();

export type UpdateTransportRequestSchema = z.infer<
  typeof updateTransportRequestSchema
>;

export const updateTransportRequestSchemaWithPath =
  updateTransportRequestSchema.extend({
    id: z.string(),
    path: z.string(),
  });

export type UpdateTransportRequestSchemaWithPath = z.infer<
  typeof updateTransportRequestSchemaWithPath
>;

export const createJobRequestServer = z.object({
  description: z
    .string()
    .min(10, { message: "Must be at least 10 characters long" })
    .max(600, { message: "Cannot be more than 600 characters long" }),
  jobType: z.string({
    message: "Job type is required.",
  }),
  location: z
    .string()
    .min(1, { message: "Must be at least 1 characters long" })
    .max(100, { message: "Cannot be more than 100 characters long" }),
  departmentId: z.string({
    required_error: "Job section is required.",
  }),
  images: z.array(z.string()).optional(),
  status: JobStatusSchema.optional(),
  priority: PriorityTypeSchema.optional(),
});

export type CreateJobRequestSchemaServer = z.infer<
  typeof createJobRequestServer
>;

export const updateJobRequestSchemaServer = createJobRequestServer.partial();

export type UpdateJobRequestSchemaServer = z.infer<
  typeof updateJobRequestSchemaServer
>;

export const updateJobRequestSchemaServerWithPath =
  updateJobRequestSchemaServer.extend({
    id: z.string(),
    path: z.string(),
  });

export type UpdateJobRequestSchemaServerWithPath = z.infer<
  typeof updateJobRequestSchemaServerWithPath
>;

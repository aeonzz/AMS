"use server";

import { generateId } from "lucia";
import { authedProcedure, getErrorMessage } from "./utils";

import { db } from "@/lib/db/index";
import { revalidatePath } from "next/cache";
import { RequestTypeType } from "prisma/generated/zod/inputTypeSchemas/RequestTypeSchema";
import { createCohere } from "@ai-sdk/cohere";
import { generateText } from "ai";
import { z } from "zod";
import { GetRequestsSchema } from "../schema";
import { unstable_noStore as noStore } from "next/cache";
import { Request, RequestWithRelations } from "prisma/generated/zod";
import path from "path";
import { readFile } from "fs/promises";
import {
  extendedJobRequestSchema,
  extendedTransportRequestSchema,
  extendedUpdateJobRequestSchema,
  extendedVenueRequestSchema,
} from "../schema/request";

const cohere = createCohere({
  apiKey: process.env.COHERE_API_KEY,
});

export const createRequest = authedProcedure
  .createServerAction()
  .input(extendedJobRequestSchema)
  .handler(async ({ ctx, input }) => {
    const { user } = ctx;

    const { jobType, path, ...rest } = input;

    if (!jobType) {
      throw "Jobtype is undefined";
    }

    try {
      const departments = await db.department.findMany();

      const { text } = await generateText({
        model: cohere("command-r-plus"),
        system: `You are an expert at creating concise, informative titles for work requests. 
                 Your task is to generate clear, action-oriented titles that quickly convey 
                 the nature of the request. Always consider the job type, category, and specific 
                 name of the task when crafting the title. Aim for brevity and clarity. And make it unique for every request. Dont add quotes`,
        prompt: `Create a clear and concise title for a request based on these details:
                 Notes: 
                 ${input.type} request
                 ${input.notes}

                 
                 Guidelines:
                 1. Keep it under 50 characters
                 2. Include the job type, category, and name in the title
                 3. Capture the main purpose of the request
                 4. Use action-oriented language
                 5. Be specific to the request's context
                 6. Make it easy to understand at a glance
                 7. Use title case
                 
                 Example: 
                 If given:
                 Notes: Fix leaking faucet in the main office bathroom
                 Job Type: Maintenance
                 Category: Building
                 Name: Plumbing
                 
                 A good title might be:
                 "Urgent Plumbing Maintenance: Office Bathroom Faucet Repair"
                 
                 Now, create a title for the request using the provided details above.`,
      });

      const departmentNames = departments.map((d) => d.name).join(", ");
      const { text: assignedDepartment } = await generateText({
        model: cohere("command-r-plus"),
        system: `You are an AI assistant that assigns departments to job requests based on their description.`,
        prompt: `Given the following job request description, choose the most appropriate department from this list: ${departmentNames}. 
                 Job description: ${input.notes}
                 Job Type: ${jobType}
                 
                 Respond with only the name of the chosen department.`,
      });

      const matchedDepartment = departments.find(
        (d) => d.name.toLowerCase() === assignedDepartment.toLowerCase().trim()
      );

      if (!matchedDepartment) {
        throw "couldn't assign a valid department";
      }

      const requestId = `REQ-${generateId(15)}`;
      const jobRequestId = `JRQ-${generateId(15)}`;

      const request = await db.request.create({
        data: {
          id: requestId,
          userId: user.id,
          priority: rest.priority,
          type: rest.type,
          title: text,
          department: rest.department,
          jobRequest: {
            create: {
              id: jobRequestId,
              notes: rest.notes,
              dueDate: rest.dueDate,
              jobType: jobType,
              assignTo: matchedDepartment.name,
              files: {
                create: rest.images?.map((fileName) => ({
                  id: `JRQ-${generateId(15)}`,
                  url: fileName,
                })),
              },
            },
          },
        },
      });

      return revalidatePath(path);
    } catch (error) {
      getErrorMessage(error);
    }
  });

export const createVenueRequest = authedProcedure
  .createServerAction()
  .input(extendedVenueRequestSchema)
  .handler(async ({ ctx, input }) => {
    const { user } = ctx;

    const { path, ...rest } = input;

    try {
      const { text } = await generateText({
        model: cohere("command-r-plus"),
        system: `You are an expert at creating concise, informative titles for work requests. 
                 Your task is to generate clear, action-oriented titles that quickly convey 
                 the nature of the request. Always consider the job type, category, and specific 
                 name of the task when crafting the title. Aim for brevity and clarity. And make it unique for every request. Dont add quotes`,
        prompt: `Create a clear and concise title for a request based on these details:
                 Notes: 
                 ${input.type} request
                 ${input.notes}
                 ${rest.purpose.join(", ")}

                 
                 Guidelines:
                 1. Keep it under 50 characters
                 2. Include the job type, category, and name in the title
                 3. Capture the main purpose of the request
                 4. Use action-oriented language
                 5. Be specific to the request's context
                 6. Make it easy to understand at a glance
                 7. Use title case
                 
                 Example: 
                 If given:
                 Notes: Fix leaking faucet in the main office bathroom
                 Job Type: Maintenance
                 Category: Building
                 Name: Plumbing
                 
                 A good title might be:
                 "Urgent Plumbing Maintenance: Office Bathroom Faucet Repair"
                 
                 Now, create a title for the request using the provided details above.`,
      });

      const requestId = `REQ-${generateId(15)}`;
      const venuRequestId = `VRQ-${generateId(15)}`;

      await db.request.create({
        data: {
          id: requestId,
          userId: user.id,
          priority: rest.priority,
          type: rest.type,
          title: text,
          department: rest.department,
          venueRequest: {
            create: {
              id: venuRequestId,
              startTime: rest.startTime,
              endTime: rest.endTime,
              purpose: rest.purpose.includes("other")
                ? [
                    ...rest.purpose.filter((p) => p !== "other"),
                    rest.otherPurpose,
                  ].join(", ")
                : rest.purpose.join(", "),
              setupRequirements: rest.setupRequirements.includes("other")
                ? [
                    ...rest.setupRequirements.filter((s) => s !== "other"),
                    rest.otherSetupRequirement,
                  ].join(", ")
                : rest.setupRequirements.join(", "),
              notes: rest.notes,
              venueId: rest.venueId,
            },
          },
        },
      });

      return revalidatePath(path);
    } catch (error) {
      getErrorMessage(error);
    }
  });

export const createTransportRequest = authedProcedure
  .createServerAction()
  .input(extendedTransportRequestSchema)
  .handler(async ({ ctx, input }) => {
    const { user } = ctx;
    console.log(input);
    const { path, ...rest } = input;

    try {
      const { text } = await generateText({
        model: cohere("command-r-plus"),
        system: `You are an expert at creating concise, informative titles for work requests. 
                 Your task is to generate clear, action-oriented titles that quickly convey 
                 the nature of the request. Always consider the job type, category, and specific 
                 name of the task when crafting the title. Aim for brevity and clarity. And make it unique for every request. Dont add quotes`,
        prompt: `Create a clear and concise title for a request based on these details:
                 Notes: 
                 ${input.type} request
                 ${input.description}
                 ${input.destination}

                 
                 Guidelines:
                 1. Keep it under 50 characters
                 2. Include the job type, category, and name in the title
                 3. Capture the main purpose of the request
                 4. Use action-oriented language
                 5. Be specific to the request's context
                 6. Make it easy to understand at a glance
                 7. Use title case
                 
                 Example: 
                 If given:
                 Notes: Fix leaking faucet in the main office bathroom
                 Job Type: Maintenance
                 Category: Building
                 Name: Plumbing
                 
                 A good title might be:
                 "Urgent Plumbing Maintenance: Office Bathroom Faucet Repair"
                 
                 Now, create a title for the request using the provided details above.`,
      });

      const requestId = `REQ-${generateId(15)}`;
      const transportRequestId = `TRQ-${generateId(15)}`;

      await db.request.create({
        data: {
          id: requestId,
          userId: user.id,
          priority: rest.priority,
          type: rest.type,
          title: text,
          department: rest.department,
          transportRequest: {
            create: {
              id: transportRequestId,
              description: rest.description,
              destination: rest.destination,
              dateAndTimeNeeded: rest.dateAndTimeNeeded,
              vehicleId: input.vehicleId,
            },
          },
        },
      });

      return revalidatePath(path);
    } catch (error) {
      getErrorMessage(error);
    }
  });

export const getPendingReq = authedProcedure
  .createServerAction()
  .input(
    z.object({
      message: z.string().optional(),
    })
  )
  .handler(async ({ ctx }) => {
    const { user } = ctx;

    try {
      const result = await db.request.findMany({
        where: {
          userId: user.id,
          status: "PENDING",
        },
        include: {
          jobRequest: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return result;
    } catch (error) {
      getErrorMessage(error);
    }
  });

export const getUserReqcount = authedProcedure
  .createServerAction()
  .input(
    z.object({
      message: z.string().optional(),
    })
  )
  .handler(async ({ ctx }) => {
    const { user } = ctx;
    try {
      const result = await db.request.count({
        where: {
          userId: user.id,
        },
      });

      return result;
    } catch (error) {
      getErrorMessage(error);
    }
  });

export async function getRequests(input: GetRequestsSchema) {
  const { page, per_page, sort, title, status, type, priority, from, to } =
    input;

  try {
    const skip = (page - 1) * per_page;

    const [column, order] = (sort?.split(".") ?? ["createdAt", "desc"]) as [
      keyof Request | undefined,
      "asc" | "desc" | undefined,
    ];

    const where: any = {
      status: { not: "CANCELLED" },
    };

    if (title) {
      where.title = { contains: title, mode: "insensitive" };
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = { in: type.split(".") };
    }

    if (priority) {
      where.priority = priority;
    }

    if (from && to) {
      where.createdAt = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const [data, total] = await db.$transaction([
      db.request.findMany({
        where,
        take: per_page,
        skip,
        orderBy: {
          [column || "createdAt"]: order || "desc",
        },
      }),
      db.request.count({ where }),
    ]);
    const pageCount = Math.ceil(total / per_page);
    return { data, pageCount };
  } catch (err) {
    console.error(err);
    return { data: [], pageCount: 0 };
  }
}

export async function getCancelledRequests(input: GetRequestsSchema) {
  const { page, per_page, sort, title, status, type, priority, from, to } =
    input;

  try {
    const skip = (page - 1) * per_page;

    const [column, order] = (sort?.split(".") ?? ["createdAt", "desc"]) as [
      keyof Request | undefined,
      "asc" | "desc" | undefined,
    ];

    const where: any = {
      status: "CANCELLED",
    };

    if (title) {
      where.title = { contains: title, mode: "insensitive" };
    }

    if (priority) {
      where.priority = priority;
    }

    if (type) {
      where.type = type;
    }

    if (from && to) {
      where.createdAt = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const [data, total] = await db.$transaction([
      db.request.findMany({
        where,
        take: per_page,
        skip,
        orderBy: {
          [column || "createdAt"]: order || "desc",
        },
      }),
      db.request.count({ where }),
    ]);
    const pageCount = Math.ceil(total / per_page);
    return { data, pageCount };
  } catch (err) {
    console.error(err);
    return { data: [], pageCount: 0 };
  }
}

export const getRequestById = authedProcedure
  .createServerAction()
  .input(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const { id } = input;
    try {
      const data = await db.request.findFirst({
        where: {
          id: id,
        },
        include: {
          jobRequest: {
            include: {
              files: true,
            },
          },
          resourceRequest: true,
          venueRequest: true,
        },
      });

      if (!data) {
        throw "Request not found";
      }

      if (data.jobRequest?.files) {
        data.jobRequest.files = await Promise.all(
          data.jobRequest.files.map(async (file) => {
            const filePath = path.join(file.url);
            const fileBuffer = await readFile(filePath);
            const base64String = fileBuffer.toString("base64");
            return {
              ...file,
              url: `data:image/png;base64,${base64String}`,
            };
          })
        );
      }

      return data as RequestWithRelations;
    } catch (error) {
      getErrorMessage(error);
    }
  });

export const updateRequest = authedProcedure
  .createServerAction()
  .input(extendedUpdateJobRequestSchema)
  .handler(async ({ input }) => {
    const { path, id, ...rest } = input;
    try {
      const result = await db.request.update({
        where: {
          id: id,
        },
        data: {
          ...rest,
        },
      });

      return revalidatePath(path);
    } catch (error) {
      getErrorMessage(error);
    }
  });

"use server";

import { generateId } from "lucia";
import { authedProcedure, getErrorMessage } from "./utils";

import { db } from "@/lib/db/index";
import { type GetJobSectionSchema } from "../schema";
import { type SectionWithRelations } from "prisma/generated/zod";
import { revalidatePath } from "next/cache";
import { generateText } from "ai";
import { cohere } from "@ai-sdk/cohere";
import { extendedJobRequestSchemaServer } from "../db/schema/job";
import {
  assignUserSchemaWithPath,
  createJobSectionSchemaWithPath,
  deleteJobSectionsSchema,
  unassignUserWithPath,
  updateJobSectionSchemaWithPath,
} from "@/app/(admin)/admin/job-sections/_components/schema";
import {
  assignPersonnelSchemaWithPath,
  updateRequestStatusSchemaWithPath,
} from "@/app/(app)/(params)/request/[requestId]/_components/schema";

export async function getJobSections(input: GetJobSectionSchema) {
  const { page, per_page, sort, name, from, to } = input;

  try {
    const skip = (page - 1) * per_page;

    const [column, order] = (sort?.split(".") ?? ["createdAt", "desc"]) as [
      keyof SectionWithRelations | undefined,
      "asc" | "desc" | undefined,
    ];

    const where: any = {
      isArchived: false,
    };

    if (name) {
      where.name = { contains: name, mode: "insensitive" };
    }

    if (from && to) {
      where.createdAt = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const [data, total] = await db.$transaction([
      db.section.findMany({
        where,
        take: per_page,
        skip,
        orderBy: {
          [column || "createdAt"]: order || "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              middleName: true,
              lastName: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      db.section.count({ where }),
    ]);
    const pageCount = Math.ceil(total / per_page);

    return { data, pageCount };
  } catch (err) {
    console.error(err);
    return { data: [], pageCount: 0 };
  }
}

export const creatJobSection = authedProcedure
  .createServerAction()
  .input(createJobSectionSchemaWithPath)
  .handler(async ({ input, ctx }) => {
    const { path, ...rest } = input;
    try {
      const sectionId = generateId(15);
      await db.section.create({
        data: {
          id: sectionId,
          ...rest,
        },
      });

      return revalidatePath(path);
    } catch (error) {
      getErrorMessage(error);
    }
  });

export const updateJobSection = authedProcedure
  .createServerAction()
  .input(updateJobSectionSchemaWithPath)
  .handler(async ({ ctx, input }) => {
    const { path, id, ...rest } = input;
    try {
      await db.section.update({
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

export const deleteJobSections = authedProcedure
  .createServerAction()
  .input(deleteJobSectionsSchema)
  .handler(async ({ input }) => {
    const { path, ...rest } = input;

    try {
      await db.section.updateMany({
        where: {
          id: {
            in: rest.ids,
          },
        },
        data: {
          isArchived: true,
        },
      });

      return revalidatePath(path);
    } catch (error) {
      console.log(error);
      getErrorMessage(error);
    }
  });

export const createJobRequest = authedProcedure
  .createServerAction()
  .input(extendedJobRequestSchemaServer)
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
               ${input.description}
               ${input.jobType}

               
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

      const createRequest = await db.request.create({
        data: {
          id: `REQ-${generateId(15)}`,
          userId: user.id,
          priority: rest.priority,
          type: rest.type,
          title: text,
          departmentId: rest.departmentId,
          jobRequest: {
            create: {
              id: `JRQ-${generateId(15)}`,
              sectionId: rest.sectionId,
              description: rest.description,
              dueDate: rest.dueDate,
              jobType: rest.jobType,
              files: {
                create: rest.images?.map((fileName) => ({
                  id: `JRQ-${generateId(15)}`,
                  url: fileName,
                })),
              },
            },
          },
        },
        include: {
          jobRequest: true,
        },
      });

      if (!createRequest.jobRequest) {
        throw "Something went wrong, please try again later.";
      }

      const newValueJson = JSON.parse(JSON.stringify(createRequest.jobRequest));
      await db.jobRequestAuditLog.create({
        data: {
          id: generateId(15),
          jobRequestId: createRequest.jobRequest.id,
          changeType: "CREATED",
          newValue: newValueJson,
          changedById: user.id,
        },
      });

      return revalidatePath(path);
    } catch (error) {
      getErrorMessage(error);
    }
  });

export const assignPersonnel = authedProcedure
  .createServerAction()
  .input(assignPersonnelSchemaWithPath)
  .handler(async ({ input, ctx }) => {
    const { user } = ctx;
    const { path, requestId, ...rest } = input;

    try {
      const result = await db.$transaction(async (prisma) => {
        const currentJobRequest = await prisma.jobRequest.findUnique({
          where: {
            id: requestId,
          },
        });

        if (!currentJobRequest) {
          throw new Error("JobRequest not found");
        }

        const updatedJobRequest = await prisma.jobRequest.update({
          where: {
            id: requestId,
          },
          data: {
            assignedTo: rest.personnelId,
          },
        });

        const oldValueJson = JSON.parse(JSON.stringify(currentJobRequest));
        const newValueJson = JSON.parse(JSON.stringify(updatedJobRequest));

        await prisma.jobRequestAuditLog.create({
          data: {
            id: generateId(15),
            jobRequestId: updatedJobRequest.id,
            changeType: "ASSIGNMENT_CHANGE",
            oldValue: oldValueJson,
            newValue: newValueJson,
            changedById: user.id,
          },
        });

        return updatedJobRequest;
      });

      return revalidatePath(path);
    } catch (error) {
      console.log(error);
      getErrorMessage(error);
    }
  });

export const updateRequestStatus = authedProcedure
  .createServerAction()
  .input(updateRequestStatusSchemaWithPath)
  .handler(async ({ ctx, input }) => {
    const { user } = ctx;
    const { path, requestId, ...rest } = input;

    try {
      const result = await db.$transaction(async (prisma) => {
        const currentJobRequest = await prisma.jobRequest.findUnique({
          where: {
            requestId: requestId,
          },
        });

        if (!currentJobRequest) {
          throw "JobRequest or Request not found";
        }

        const updatedRequest = await prisma.request.update({
          where: { id: requestId },
          data: {
            ...rest,
            jobRequest: {
              update: {
                reviewedBy: user.id,
              },
            },
          },
          include: { jobRequest: true },
        });
        const oldValueJson = JSON.parse(JSON.stringify(currentJobRequest));
        const newValueJson = JSON.parse(
          JSON.stringify(updatedRequest.jobRequest)
        );
        await prisma.jobRequestAuditLog.create({
          data: {
            id: generateId(15),
            jobRequestId: currentJobRequest.id,
            changeType: "APPROVER_CHANGE",
            oldValue: oldValueJson,
            newValue: newValueJson,
            changedById: user.id,
          },
        });

        return updatedRequest;
      });

      return revalidatePath(path);
    } catch (error) {
      console.log(error);
      getErrorMessage(error);
    }
  });

export const assignSection = authedProcedure
  .createServerAction()
  .input(assignUserSchemaWithPath)
  .handler(async ({ input }) => {
    const { path, userId, ...rest } = input;
    try {
      const user = await db.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          sectionId: true,
        },
      });

      if (user && user.sectionId !== null) {
        throw "User already assigned to a section";
      }

      await db.user.update({
        where: {
          id: userId,
        },
        data: {
          ...rest,
        },
      });
      revalidatePath(path);
    } catch (error) {
      getErrorMessage(error);
    }
  });

export const unassignSection = authedProcedure
  .createServerAction()
  .input(unassignUserWithPath)
  .handler(async ({ input }) => {
    const { path, userId } = input;
    try {
      await db.user.update({
        where: {
          id: userId,
        },
        data: {
          sectionId: null,
        },
      });
      revalidatePath(path);
    } catch (error) {
      getErrorMessage(error);
    }
  });
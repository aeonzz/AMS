"use server";

import { generateText } from "ai";
import { authedProcedure, getErrorMessage } from "./utils";
import { db } from "@/lib/db/index";
import { cohere } from "@ai-sdk/cohere";
import { generateId } from "lucia";
import { revalidatePath } from "next/cache";
import { extendedReturnableResourceRequestSchema } from "../schema/resource/returnable-resource";
import {
  extendedSupplyResourceRequestSchema,
  extendedSupplyResourceRequestSchemaServer,
} from "../schema/resource/supply-resource";

export const createReturnableResourceRequest = authedProcedure
  .createServerAction()
  .input(extendedReturnableResourceRequestSchema)
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
      const resourceRequestId = `RRQ-${generateId(15)}`;

      const createRequest = await db.request.create({
        data: {
          id: requestId,
          userId: user.id,
          priority: rest.priority,
          type: rest.type,
          title: text,
          departmentId: rest.departmentId,
          returnableRequest: {
            create: {
              id: resourceRequestId,
              departmentId: rest.itemDepartmentId,
              dateAndTimeNeeded: rest.dateAndTimeNeeded,
              returnDateAndTime: rest.returnDateAndTime,
              purpose: rest.purpose.includes("other")
                ? [
                    ...rest.purpose.filter((p) => p !== "other"),
                    rest.otherPurpose,
                  ].join(", ")
                : rest.purpose.join(", "),
              itemId: rest.itemId,
            },
          },
        },
        include: {
          returnableRequest: true,
        },
      });

      if (!createRequest.returnableRequest) {
        throw "Something went wrong, please try again later.";
      }

      const newValueJson = JSON.parse(
        JSON.stringify(createRequest.returnableRequest)
      );

      await db.genericAuditLog.create({
        data: {
          id: generateId(15),
          entityId: createRequest.returnableRequest.id,
          entityType: "RETURNABLE_REQUEST",
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

export const createSupplyResourceRequest = authedProcedure
  .createServerAction()
  .input(extendedSupplyResourceRequestSchema)
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
                 ${rest.type} request
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
      const resourceRequestId = `RRQ-${generateId(15)}`;

      await db.request.create({
        data: {
          id: requestId,
          userId: user.id,
          priority: rest.priority,
          type: rest.type,
          title: text,
          departmentId: rest.departmentId,
          supplyRequest: {
            create: {
              id: resourceRequestId,
              dateAndTimeNeeded: rest.dateAndTimeNeeded,
              purpose: rest.purpose.includes("other")
                ? [
                    ...rest.purpose.filter((p) => p !== "other"),
                    rest.otherPurpose,
                  ].join(", ")
                : rest.purpose.join(", "),
              items: {
                create: rest.items.map((item) => ({
                  id: generateId(15),
                  quantity: item.quantity,
                  supplyItemId: item.supplyItemId,
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

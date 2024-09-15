"use client";

import React from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import { type UseMutateAsyncFunction } from "@tanstack/react-query";
import { type UseFormReturn } from "react-hook-form";
import { usePathname } from "next/navigation";
import { createUserRole } from "@/lib/actions/userRole";
import {
  type CreateUserRoleSchemaWithPath,
  type CreateUserRoleSchema,
} from "@/lib/schema/userRole";
import InputPopover, { Option } from "../../../../../components/input-popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn, formatFullName } from "@/lib/utils";
import type { RoleDepartmentData } from "./types";
import { Separator } from "@/components/ui/separator";

interface CreateUserRoleFormProps {
  mutateAsync: UseMutateAsyncFunction<
    any,
    Error,
    Parameters<typeof createUserRole>[0],
    unknown
  >;
  form: UseFormReturn<CreateUserRoleSchema>;
  isPending: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data: RoleDepartmentData;
  userId: string;
}

export default function CreateUserRoleForm({
  mutateAsync,
  isPending,
  form,
  setOpen,
  data,
  userId,
}: CreateUserRoleFormProps) {
  const pathname = usePathname();

  async function onSubmit(values: CreateUserRoleSchema) {
    const data: CreateUserRoleSchemaWithPath = {
      path: pathname,
      departmentId: values.departmentId,
      userId: userId,
      roleId: values.roleId,
    };
    toast.promise(mutateAsync(data), {
      loading: "Creating...",
      success: () => {
        setOpen(false);
        return "User role created successfuly";
      },
      error: (err) => {
        return err.message;
      },
    });
  }

  const { roles, departments } = data;

  return (
    <Form {...form}>
      <form autoComplete="off" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="scroll-bar flex max-h-[40vh] flex-col overflow-y-auto">
          <FormField
            control={form.control}
            name="roleId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Command className="max-h-[200px]">
                    <CommandInput placeholder={`Search role...`} />
                    <CommandList>
                      <CommandEmpty>No roles found.</CommandEmpty>
                      <CommandGroup>
                        {roles.map((role) => (
                          <CommandItem
                            key={role.id}
                            onSelect={() => {
                              form.setValue("roleId", role.id);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === role.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {role.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Separator className="mb-1" />
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem className="flex flex-col px-1">
                <InputPopover
                  title="Department"
                  options={departments}
                  selected={field.value}
                  onSelect={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Separator className="mt-1" />
        <DialogFooter className="p-1">
          <div className="flex w-full gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              type="submit"
              className="flex-1"
            >
              Create
            </Button>
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}

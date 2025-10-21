import { useTRPC } from "@/trpc/client";
import { AgentGetOne } from "../../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { agentInsertSchema } from "../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import GenerateAvatar  from "@/components/generate-avatar";

import {
    Form,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormField,
} from "@/components/ui/form";
import { toast } from "sonner";

interface AgentFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialValues?: AgentGetOne;
}

export const AgentForm = ({
    onSuccess,
    onCancel,
    initialValues,
}: AgentFormProps) => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const createAgent = useMutation(
        trpc.agents.create.mutationOptions({
            onSuccess: async () => {
                await queryClient.invalidateQueries(
                    trpc.agents.getMany.queryOptions({}),
                );
                toast.success("Agent created successfully");
                onSuccess?.();
            },
            onError: (error) => {
                toast.error(
                    `Failed to create agent: ${error.message}`,)
            },
        }),
    );

    const updateAgent = useMutation(
        trpc.agents.update.mutationOptions({
            onSuccess: async () => {
                await queryClient.invalidateQueries(
                    trpc.agents.getMany.queryOptions({}),
                );

                if (initialValues?.id) {
                    await queryClient.invalidateQueries(
                        trpc.agents.getOne.queryOptions({
                            id: initialValues.id,
                        }),
                    )
                }
                toast.success("Agent updated successfully");
                onSuccess?.();
            },
            onError: (error) => {
                toast.error(
                    `Failed to update agent: ${error.message}`,)
            },
        }),
    );

    const form = useForm<z.infer<typeof agentInsertSchema>>({
        resolver: zodResolver(agentInsertSchema),
        defaultValues: {
            name: initialValues?.name || "",
            instructions: initialValues?.instructions || "",
        },
    });

    const isEdit = !!initialValues?.id;
    const isPending = createAgent.isPending || updateAgent.isPending;

    const onSubmit = (values: z.infer<typeof agentInsertSchema>) => {
        if (isEdit) {
            updateAgent.mutate({
                ...values,
                id: initialValues?.id,
            });
        }
        else {
            createAgent.mutate(values);
        }
    }

    return (
        <Form {...form} >
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <GenerateAvatar
                    seed={form.watch("name")}
                    className="size-16 border"
                    variant="botttsNeutral"
                />
                <FormField
                    name="name"
                    control={form.control}
                    render={({ field }) => {
                        return (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g. Math Tutor"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>                            
                        )
                    }}
                />
                <FormField
                    name="instructions"
                    control={form.control}
                    render={({ field }) => {
                        return (
                            <FormItem>
                                <FormLabel>Instructions</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="You are a helpful Math Assistant that can answer any question and help with assignments"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>                            
                        )
                    }}
                />
                <div className="flex justify-between gap-x-2 ">
                    {onCancel && (
                        <Button
                        variant={"outline"}
                        disabled={isPending}
                        type="button"
                        onClick={()=> {
                            onCancel();
                        }}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="ml-2"
                    >
                        {isEdit ? "Update" : "Create"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
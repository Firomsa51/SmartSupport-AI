import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateChatbot, getListChatbotsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { toast } from "sonner";
import AppShell from "@/components/app-shell";
import { useState, useCallback, useMemo } from "react";

// Validation schema – trimmed and validated
const schema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(80, "Name must be 80 characters or less")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "Name cannot be empty"),
  description: z
    .string()
    .max(300, "Description must be 300 characters or less")
    .optional()
    .transform((val) => val?.trim()),
  welcomeMessage: z
    .string()
    .max(300, "Welcome message must be 300 characters or less")
    .default("Hi! How can I help you today?")
    .transform((val) => val?.trim()),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex code (e.g., #2563eb)")
    .default("#2563eb"),
});

type FormData = z.infer<typeof schema>;

export default function NewChatbot() {
  const [, setLocation] = useLocation();
  const createChatbot = useCreateChatbot();
  const queryClient = useQueryClient();
  const [formWasEdited, setFormWasEdited] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      welcomeMessage: "Hi! How can I help you today?",
      primaryColor: "#2563eb",
    },
    mode: "onChange",
  });

  // Mark form as edited when user types
  const handleFormChange = useCallback(() => {
    if (!formWasEdited && form.formState.isDirty) setFormWasEdited(true);
  }, [form.formState.isDirty, formWasEdited]);

  const onSubmit = useCallback(
    (data: FormData) => {
      createChatbot.mutate(
        {
          data: {
            name: data.name,
            description: data.description,
            welcomeMessage: data.welcomeMessage,
            primaryColor: data.primaryColor,
          },
        },
        {
          onSuccess: (bot) => {
            queryClient.invalidateQueries({ queryKey: getListChatbotsQueryKey() });
            toast.success("Chatbot created successfully!");
            setLocation(`/chatbots/${bot.id}`);
          },
          onError: (error: any) => {
            const errorMsg = error?.response?.data?.message || error?.message || "Failed to create chatbot";
            toast.error(`Error: ${errorMsg}`);
          },
        }
      );
    },
    [createChatbot, queryClient, setLocation]
  );

  const isSubmitting = createChatbot.isPending || form.formState.isSubmitting;
  const colorValue = form.watch("primaryColor");
  const nameValue = form.watch("name");
  const descValue = form.watch("description") || "";
  const welcomeValue = form.watch("welcomeMessage") || "";

  const handleCancel = useCallback(() => {
    if (formWasEdited && !confirm("You have unsaved changes. Are you sure you want to leave?")) {
      return;
    }
    setLocation("/dashboard");
  }, [formWasEdited, setLocation]);

  const isFormDisabled = isSubmitting;

  return (
    <AppShell>
      <div className="p-6 max-w-2xl mx-auto" role="main" aria-label="Create new chatbot form">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 mb-4 -ml-2 text-muted-foreground"
            onClick={handleCancel}
            aria-label="Go back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Create New Chatbot</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your AI assistant, then add a knowledge base.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              onChange={handleFormChange}
              aria-busy={isSubmitting}
            >
              <fieldset disabled={isFormDisabled} className="space-y-6">
                {/* Chatbot name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Chatbot name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Customer Support Bot"
                          data-testid="input-name"
                          aria-required="true"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Max 80 characters</FormDescription>
                      <div className="flex justify-between items-center">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground">
                          {(nameValue?.length || 0)} / 80
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What does this chatbot help with?"
                          className="resize-none h-20"
                          data-testid="input-description"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <div className="flex justify-between items-center">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground">
                          {descValue.length} / 300
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Welcome message */}
                <FormField
                  control={form.control}
                  name="welcomeMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Welcome message</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Hi! How can I help you today?"
                          data-testid="input-welcome"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>First message shown when the widget opens</FormDescription>
                      <div className="flex justify-between items-center">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground">
                          {welcomeValue.length} / 300
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Primary color */}
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand color</FormLabel>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg border border-border overflow-hidden flex-shrink-0">
                          <input
                            type="color"
                            className="w-full h-full cursor-pointer scale-125 border-none"
                            data-testid="input-color"
                            {...field}
                          />
                        </div>
                        <FormControl>
                          <Input
                            className="font-mono uppercase w-32"
                            data-testid="input-color-hex"
                            placeholder="#2563eb"
                            {...field}
                          />
                        </FormControl>
                        <div
                          className="w-9 h-9 rounded-full border border-border flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: colorValue }}
                          aria-label="Color preview"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !form.formState.isValid}
                    className="gap-2"
                    data-testid="button-create"
                    aria-label="Create chatbot"
                  >
                    <Bot className="w-4 h-4" />
                    {isSubmitting ? "Creating..." : "Create chatbot"}
                  </Button>
                  <Button variant="outline" type="button" onClick={handleCancel} disabled={isSubmitting}>
                    Cancel
                  </Button>
                </div>
              </fieldset>
            </form>
          </Form>
        </div>
      </div>
    </AppShell>
  );
}

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

// 1. Mirkaneessa (schema) fooyyessee – maqaa hawwii (trim) yeroo taasisu
const schema = z.object({
  name: z
    .string()
    .min(1, "Maqaan barbaachisa")
    .max(80, "Maqaan qube 80 caaluu hin danda'u")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "Maqaa duwwaa ta'uu hin danda'u"),
  description: z
    .string()
    .max(300, "Ibsaan qubee 300 ol ta'uu hin qabu")
    .optional()
    .transform((val) => val?.trim()),
  welcomeMessage: z
    .string()
    .max(300, "Ergaa simannoo qubee 300 ol hin ta'u")
    .default("Hi! How can I help you today?")
    .transform((val) => val?.trim()),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color code sirri ta'uu qaba (fkn #2563eb)")
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
    mode: "onChange", // Akka barreessaa jijjiirutti dogoggora agarsii
  });

  // Yeroo foormii jijjiiramu, 'edited' jedhee madaala
  const handleFormChange = useCallback(() => {
    if (!formWasEdited && form.formState.isDirty) setFormWasEdited(true);
  }, [form.formState.isDirty, formWasEdited]);

  // Ergamaa (onSubmit)
  const onSubmit = useCallback(
    (data: FormData) => {
      createChatbot.mutate(
        {
          // API keessan akka eeggatu: name, description, welcomeMessage, primaryColor
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
            toast.success("Chatbot milkaa'inaan uumame!");
            setLocation(`/chatbots/${bot.id}`);
          },
          onError: (error: any) => {
            const errorMsg = error?.response?.data?.message || error?.message || "Uumuun hin milkoofne";
            toast.error(`Dogoggorsa: ${errorMsg}`);
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

  // Yoo cancel tuqeefi foormi jijjirame, ittigaafata (confirm)
  const handleCancel = useCallback(() => {
    if (formWasEdited && !confirm("Jijjiiramni keessan hin turre. Irraa deemuu barbaadduu?")) {
      return;
    }
    setLocation("/dashboard");
  }, [formWasEdited, setLocation]);

  // Madaala gahee (disabled) yeroo ergaan deemuu
  const isFormDisabled = isSubmitting;

  return (
    <AppShell>
      <div className="p-6 max-w-2xl mx-auto" role="main" aria-label="Foormii chatbot haaraa uumuu">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 mb-4 -ml-2 text-muted-foreground"
            onClick={handleCancel}
            aria-label="Gara dashboard deebi'uu"
          >
            <ArrowLeft className="w-4 h-4" />
            Deebi'i gara dashboard
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Chatbot haaraa uumi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gargaaraa AI keessan qopheessaa, booda kuusaa beekumsaa (knowledge base) isaaf baafadhaa.
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
                {/* Maqaa chatbot */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Maqaa chatbot <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Fkn: Gargaaraa Maamiltootaa"
                          data-testid="input-name"
                          aria-required="true"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Qube 80 ol hin ta'uu qabu</FormDescription>
                      <div className="flex justify-between items-center">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground">
                          {(nameValue?.length || 0)} / 80
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Ibsa */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ibsa (filannoo)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Chatbot kun maal irratti gargaara?"
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

                {/* Ergaa simannoo (welcome message) */}
                <FormField
                  control={form.control}
                  name="welcomeMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ergaa simannoo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Hi! How can I help you today?"
                          data-testid="input-welcome"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>Ergaa yeroo widget banamu isa jalqabaa mul'ata</FormDescription>
                      <div className="flex justify-between items-center">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground">
                          {welcomeValue.length} / 300
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Halluu (primary color) */}
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Halluu beekamaa (brand color)</FormLabel>
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
                          aria-label="Mul'ata halluu"
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
                    aria-label="Chatbot uumi"
                  >
                    <Bot className="w-4 h-4" />
                    {isSubmitting ? "Uumamaa jira..." : "Chatbot uumi"}
                  </Button>
                  <Button variant="outline" type="button" onClick={handleCancel} disabled={isSubmitting}>
                     Diiga
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

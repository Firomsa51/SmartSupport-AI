import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateChatbot, getListChatbotsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { toast } from "sonner";
import AppShell from "@/components/app-shell";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  description: z.string().max(300).optional(),
  welcomeMessage: z.string().max(300).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").default("#2563eb"),
});

type FormData = z.infer<typeof schema>;

export default function NewChatbot() {
  const [, setLocation] = useLocation();
  const createChatbot = useCreateChatbot();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      welcomeMessage: "Hi! How can I help you today?",
      primaryColor: "#2563eb",
    },
  });

  const onSubmit = (data: FormData) => {
    createChatbot.mutate(
      { data: { name: data.name, description: data.description, welcomeMessage: data.welcomeMessage, primaryColor: data.primaryColor } },
      {
        onSuccess: (bot) => {
          queryClient.invalidateQueries({ queryKey: getListChatbotsQueryKey() });
          toast.success("Chatbot created");
          setLocation(`/chatbots/${bot.id}`);
        },
        onError: () => toast.error("Failed to create chatbot"),
      }
    );
  };

  const color = form.watch("primaryColor");

  return (
    <AppShell>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 mb-4 -ml-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Create chatbot</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up your AI assistant and then upload knowledge base documents.</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chatbot name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Acme Support Bot" data-testid="input-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What does this chatbot help with?"
                        className="resize-none h-20"
                        data-testid="input-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="welcomeMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Welcome message</FormLabel>
                    <FormControl>
                      <Input placeholder="Hi! How can I help you today?" data-testid="input-welcome" {...field} />
                    </FormControl>
                    <FormDescription>First message shown when the widget opens</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <Input className="font-mono uppercase w-32" data-testid="input-color-hex" {...field} />
                      </FormControl>
                      <div
                        className="w-9 h-9 rounded-full border border-border flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={createChatbot.isPending}
                  className="gap-2"
                  data-testid="button-create"
                >
                  <Bot className="w-4 h-4" />
                  {createChatbot.isPending ? "Creating..." : "Create chatbot"}
                </Button>
                <Link href="/dashboard">
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </AppShell>
  );
}

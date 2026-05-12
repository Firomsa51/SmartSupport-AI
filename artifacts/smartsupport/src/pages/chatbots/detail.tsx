import { useParams, Link } from "wouter";
import { useState } from "react";
import {
  useGetChatbot, getGetChatbotQueryKey,
  useListDocuments, getListDocumentsQueryKey,
  useAddDocument, useDeleteDocument,
  useListConversations, getListConversationsQueryKey,
  useGetChatbotAnalytics, getGetChatbotAnalyticsQueryKey,
  useUpdateChatbot,
  useScrapeUrl,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, FileText, MessageSquare, BarChart3, Settings2, Plus, Trash2,
  ExternalLink, Bot, Globe, AlignLeft, CheckCircle2, Clock, AlertCircle, Loader2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import AppShell from "@/components/app-shell";

const docSchema = z.object({
  title: z.string().min(1, "Title is required"),
  sourceType: z.enum(["text", "url"]),
  content: z.string().min(1, "Content is required"),
  sourceUrl: z.string().optional(),
});

type DocForm = z.infer<typeof docSchema>;

const docStatusIcon: Record<string, React.ReactNode> = {
  ready: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
  pending: <Clock className="w-3.5 h-3.5 text-yellow-400" />,
  processing: <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />,
  error: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
};

const docStatusColors: Record<string, string> = {
  ready: "bg-green-500/15 text-green-400 border-green-500/20",
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  processing: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  error: "bg-red-500/15 text-red-400 border-red-500/20",
};

export default function ChatbotDetail() {
  const { id } = useParams<{ id: string }>();
  const chatbotId = parseInt(id ?? "0");
  const queryClient = useQueryClient();
  const [showDocForm, setShowDocForm] = useState(false);

  const { data: bot, isLoading: botLoading } = useGetChatbot(chatbotId, {
    query: { enabled: !!chatbotId, queryKey: getGetChatbotQueryKey(chatbotId) },
  });
  const { data: docs, isLoading: docsLoading } = useListDocuments(chatbotId, {
    query: { enabled: !!chatbotId, queryKey: getListDocumentsQueryKey(chatbotId) },
  });
  const { data: conversations } = useListConversations(chatbotId, {
    query: { enabled: !!chatbotId, queryKey: getListConversationsQueryKey(chatbotId) },
  });
  const { data: analytics } = useGetChatbotAnalytics(chatbotId, {
    query: { enabled: !!chatbotId, queryKey: getGetChatbotAnalyticsQueryKey(chatbotId) },
  });

  const addDocument = useAddDocument();
  const deleteDocument = useDeleteDocument();
  const updateChatbot = useUpdateChatbot();
  const scrapeUrl = useScrapeUrl();
  const [scrapeInput, setScrapeInput] = useState("");

  const docForm = useForm<DocForm>({
    resolver: zodResolver(docSchema),
    defaultValues: { title: "", sourceType: "text", content: "", sourceUrl: "" },
  });

  const sourceType = docForm.watch("sourceType");

  const handleFetchUrl = () => {
    const url = scrapeInput.trim();
    if (!url) return;
    scrapeUrl.mutate(
      { id: chatbotId, data: { url } },
      {
        onSuccess: (result) => {
          docForm.setValue("title", result.title, { shouldValidate: true });
          docForm.setValue("content", result.content, { shouldValidate: true });
          docForm.setValue("sourceUrl", result.url, { shouldValidate: true });
          toast.success("Page fetched — review content below");
        },
        onError: (err: unknown) => {
          const msg =
            err instanceof Error
              ? err.message
              : "Could not fetch this URL. Try pasting the content manually.";
          toast.error(msg);
        },
      }
    );
  };

  const handleAddDoc = (data: DocForm) => {
    addDocument.mutate(
      { id: chatbotId, data: { title: data.title, sourceType: data.sourceType, content: data.content, sourceUrl: data.sourceUrl } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey(chatbotId) });
          queryClient.invalidateQueries({ queryKey: getGetChatbotQueryKey(chatbotId) });
          toast.success("Document added — embedding in progress");
          docForm.reset();
          setShowDocForm(false);
        },
        onError: () => toast.error("Failed to add document"),
      }
    );
  };

  const handleDeleteDoc = (docId: number) => {
    deleteDocument.mutate(
      { id: chatbotId, docId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey(chatbotId) });
          queryClient.invalidateQueries({ queryKey: getGetChatbotQueryKey(chatbotId) });
          toast.success("Document deleted");
        },
        onError: () => toast.error("Failed to delete document"),
      }
    );
  };

  const handleToggleStatus = () => {
    if (!bot) return;
    const newStatus = bot.status === "active" ? "inactive" : "active";
    updateChatbot.mutate(
      { id: chatbotId, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetChatbotQueryKey(chatbotId) });
          toast.success(`Chatbot ${newStatus === "active" ? "activated" : "deactivated"}`);
        },
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  if (botLoading) {
    return (
      <AppShell>
        <div className="p-6 max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (!bot) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Chatbot not found.</p>
          <Link href="/dashboard"><Button className="mt-4">Back to dashboard</Button></Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 mb-4 -ml-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${bot.primaryColor ?? "#2563eb"}20` }}
              >
                <Bot className="w-5 h-5" style={{ color: bot.primaryColor ?? "#2563eb" }} />
              </div>
              <div>
                <h1 className="text-xl font-bold">{bot.name}</h1>
                <p className="text-xs text-muted-foreground font-mono">{bot.uid}</p>
              </div>
              <Badge
                variant="outline"
                className={`capitalize text-xs ${bot.status === "active" ? "bg-green-500/15 text-green-400 border-green-500/20" : "bg-slate-500/15 text-slate-400 border-slate-500/20"}`}
              >
                {bot.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Link href={`/chatbots/${bot.id}/embed`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Get embed code
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                disabled={updateChatbot.isPending}
                data-testid="button-toggle-status"
              >
                {bot.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="knowledge">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="knowledge" className="gap-2 text-xs">
              <FileText className="w-3.5 h-3.5" />
              Knowledge Base ({docs?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="conversations" className="gap-2 text-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              Conversations ({conversations?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 text-xs">
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 text-xs">
              <Settings2 className="w-3.5 h-3.5" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Upload text content or URLs to train your chatbot.</p>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setShowDocForm(!showDocForm)}
                data-testid="button-add-document"
              >
                <Plus className="w-3.5 h-3.5" />
                Add document
              </Button>
            </div>

            {showDocForm && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-medium mb-4 text-sm">Add document</h3>
                <Form {...docForm}>
                  <form onSubmit={docForm.handleSubmit(handleAddDoc)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={docForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Refund Policy" data-testid="input-doc-title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={docForm.control}
                        name="sourceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Source type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-source-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="text">
                                  <span className="flex items-center gap-2"><AlignLeft className="w-3.5 h-3.5" />Plain text</span>
                                </SelectItem>
                                <SelectItem value="url">
                                  <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" />URL / webpage</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {sourceType === "url" && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-foreground">URL to scrape</p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://yoursite.com/docs/faq"
                            value={scrapeInput}
                            onChange={(e) => setScrapeInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleFetchUrl(); } }}
                            data-testid="input-source-url"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleFetchUrl}
                            disabled={!scrapeInput.trim() || scrapeUrl.isPending}
                            className="gap-1.5 whitespace-nowrap"
                            data-testid="button-fetch-url"
                          >
                            {scrapeUrl.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            {scrapeUrl.isPending ? "Fetching…" : "Fetch content"}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Click "Fetch content" to automatically extract text from the page. Works best with documentation and blog posts.
                        </p>
                      </div>
                    )}

                    <FormField
                      control={docForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-1">
                            <FormLabel className="text-xs">
                              {sourceType === "url" ? "Extracted content" : "Content"}
                            </FormLabel>
                            {field.value && (
                              <span className="text-xs text-muted-foreground">
                                {field.value.length.toLocaleString()} chars
                              </span>
                            )}
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder={
                                sourceType === "url"
                                  ? "Paste URL above and click Fetch, or paste content manually…"
                                  : "Paste your documentation, FAQs, policies, etc…"
                              }
                              className="resize-none h-36 font-mono text-xs"
                              data-testid="input-doc-content"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={addDocument.isPending} data-testid="button-submit-doc">
                        {addDocument.isPending ? "Adding..." : "Add & embed"}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowDocForm(false)}>Cancel</Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {docsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : docs?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-sm mb-1">No documents yet</h3>
                <p className="text-xs text-muted-foreground">Add your first document to train your chatbot.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {docs?.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3" data-testid={`row-doc-${doc.id}`}>
                    {docStatusIcon[doc.status] ?? <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{doc.sourceType} &middot; {doc.chunkCount} chunks</p>
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize ${docStatusColors[doc.status] ?? ""}`}>
                      {doc.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDoc(doc.id)}
                      data-testid={`button-delete-doc-${doc.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations" className="mt-4">
            {conversations?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-sm mb-1">No conversations yet</h3>
                <p className="text-xs text-muted-foreground">Conversations will appear here once users start chatting.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations?.map((conv) => (
                  <div key={conv.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3" data-testid={`row-conv-${conv.id}`}>
                    <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono truncate text-muted-foreground">{conv.sessionId}</p>
                      <p className="text-xs text-muted-foreground">{conv.messageCount} messages</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(conv.updatedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-4">
            {analytics ? (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Total Conversations", value: analytics.totalConversations },
                  { label: "Total Messages", value: analytics.totalMessages },
                  { label: "Avg Messages/Conv", value: analytics.avgMessagesPerConversation },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4">
            <SettingsPanel bot={bot} chatbotId={chatbotId} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function SettingsPanel({ bot, chatbotId }: { bot: any; chatbotId: number }) {
  const queryClient = useQueryClient();
  const updateChatbot = useUpdateChatbot();

  const schema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    welcomeMessage: z.string().optional(),
    systemPrompt: z.string().optional(),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: bot.name ?? "",
      description: bot.description ?? "",
      welcomeMessage: bot.welcomeMessage ?? "",
      systemPrompt: bot.systemPrompt ?? "",
      primaryColor: bot.primaryColor ?? "#2563eb",
    },
  });

  const onSubmit = (data: any) => {
    updateChatbot.mutate(
      { id: chatbotId, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetChatbotQueryKey(chatbotId) });
          toast.success("Settings saved");
        },
        onError: () => toast.error("Failed to save settings"),
      }
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 max-w-2xl">
      <h3 className="font-semibold mb-5">Chatbot settings</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl><Input data-testid="input-settings-name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea className="resize-none h-20" data-testid="input-settings-description" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="welcomeMessage" render={({ field }) => (
            <FormItem>
              <FormLabel>Welcome message</FormLabel>
              <FormControl><Input data-testid="input-settings-welcome" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="systemPrompt" render={({ field }) => (
            <FormItem>
              <FormLabel>System prompt</FormLabel>
              <FormControl><Textarea className="resize-none h-28 font-mono text-xs" placeholder="You are a helpful customer support assistant for Acme Inc..." data-testid="input-settings-prompt" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" disabled={updateChatbot.isPending} data-testid="button-save-settings">
            {updateChatbot.isPending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

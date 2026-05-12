import { Link } from "wouter";
import { useGetDashboardStats, useListChatbots, useDeleteChatbot, getListChatbotsQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, MessageSquare, FileText, TrendingUp, Plus, Trash2, ExternalLink, Settings, MoreHorizontal, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import AppShell from "@/components/app-shell";

const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-400 border-green-500/20",
  inactive: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  training: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: chatbots, isLoading: botsLoading } = useListChatbots();
  const deleteChatbot = useDeleteChatbot();
  const queryClient = useQueryClient();

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteChatbot.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChatbotsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast.success("Chatbot deleted");
      },
      onError: () => toast.error("Failed to delete chatbot"),
    });
  };

  const statCards = [
    { label: "Total Chatbots", value: stats?.totalChatbots ?? 0, icon: Bot, color: "text-blue-400" },
    { label: "Active Chatbots", value: stats?.activeChatbots ?? 0, icon: Activity, color: "text-green-400" },
    { label: "Conversations", value: stats?.totalConversations ?? 0, icon: MessageSquare, color: "text-violet-400" },
    { label: "Documents Indexed", value: stats?.totalDocuments ?? 0, icon: FileText, color: "text-amber-400" },
  ];

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your AI chatbots and monitor performance</p>
          </div>
          <Link href="/chatbots/new">
            <Button className="gap-2" data-testid="button-new-chatbot">
              <Plus className="w-4 h-4" />
              New Chatbot
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-border bg-card p-5">
              {statsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{card.label}</span>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <p className="text-3xl font-bold" data-testid={`stat-${card.label.toLowerCase().replace(/\s/g, "-")}`}>
                    {card.value.toLocaleString()}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Chatbots List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Your Chatbots</h2>
            <span className="text-sm text-muted-foreground">{chatbots?.length ?? 0} total</span>
          </div>

          {botsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : chatbots?.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
              <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No chatbots yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Create your first AI chatbot and start supporting customers instantly.</p>
              <Link href="/chatbots/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create your first chatbot
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {chatbots?.map((bot) => (
                <div
                  key={bot.id}
                  className="rounded-xl border border-border bg-card p-5 hover:border-border/80 transition-colors"
                  data-testid={`card-chatbot-${bot.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${bot.primaryColor ?? "#2563eb"}20` }}
                    >
                      <Bot className="w-5 h-5" style={{ color: bot.primaryColor ?? "#2563eb" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{bot.name}</h3>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${statusColors[bot.status] ?? ""}`}
                        >
                          {bot.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {bot.description ?? "No description"} &middot;{" "}
                        {bot.documentCount} docs &middot; {bot.conversationCount} conversations
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/chatbots/${bot.id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5" data-testid={`button-manage-${bot.id}`}>
                          <Settings className="w-3.5 h-3.5" />
                          Manage
                        </Button>
                      </Link>
                      <Link href={`/chatbots/${bot.id}/embed`}>
                        <Button variant="ghost" size="sm" className="gap-1.5" data-testid={`button-embed-${bot.id}`}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`button-more-${bot.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(bot.id, bot.name)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete chatbot
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

import { Link } from "wouter";
import { useMemo } from "react";
import {
  useGetDashboardStats,
  useListChatbots,
  useDeleteChatbot,
  getListChatbotsQueryKey,
  getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bot, MessageSquare, FileText, Plus, Trash2, ExternalLink,
  Settings, MoreHorizontal, Activity, AlertCircle, Zap, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import AppShell from "@/components/app-shell";

const getStatusColor = (status: string): string => {
  switch (status) {
    case "active": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
    case "inactive": return "bg-slate-500/15 text-slate-400 border-slate-500/20";
    case "training": return "bg-amber-500/15 text-amber-400 border-amber-500/20";
    default: return "bg-gray-500/15 text-gray-400 border-gray-500/20";
  }
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useGetDashboardStats({
    query: { enabled: true, queryKey: getGetDashboardStatsQueryKey() },
  });
  const { data: chatbots, isLoading: botsLoading, error: botsError } = useListChatbots({
    query: { enabled: true, queryKey: getListChatbotsQueryKey() },
  });
  const deleteChatbot = useDeleteChatbot();
  const queryClient = useQueryClient();

  const statCards = useMemo(() => [
    { label: "Total Chatbots", value: stats?.totalChatbots ?? 0, icon: Bot, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Active Bots", value: stats?.activeChatbots ?? 0, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Conversations", value: stats?.totalConversations ?? 0, icon: MessageSquare, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Documents", value: stats?.totalDocuments ?? 0, icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10" },
  ], [stats]);

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteChatbot.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChatbotsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast.success("Chatbot deleted");
      },
      onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete"),
    });
  };

  if (statsError || botsError) {
    return (
      <AppShell>
        <div className="p-6 max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{statsError?.message || botsError?.message || "Something went wrong."}</AlertDescription>
          </Alert>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your AI-powered support chatbots</p>
          </div>
          <Link href="/chatbots/new">
            <Button className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              New chatbot
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
              {statsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-14" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{card.label}</span>
                    <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                      <card.icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold tracking-tight">{card.value.toLocaleString()}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Chatbots */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg">Your chatbots</h2>
            <span className="text-sm text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{chatbots?.length ?? 0} total</span>
          </div>

          {botsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-11 h-11 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : chatbots?.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No chatbots yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                Create your first AI chatbot and connect it to your knowledge base.
              </p>
              <Link href="/chatbots/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Create your first chatbot
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {chatbots?.map((bot) => (
                <div key={bot.id}
                  className="rounded-2xl border border-border bg-card p-5 hover:shadow-md hover:border-border/60 transition-all group"
                  data-testid={`card-chatbot-${bot.id}`}>

                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
                        style={{ backgroundColor: bot.primaryColor ?? "#2563eb" }}>
                        {bot.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold truncate max-w-[140px]">{bot.name}</h3>
                        <Badge variant="outline" className={`text-xs capitalize mt-0.5 ${getStatusColor(bot.status)}`}>
                          {bot.status}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/chatbots/${bot.id}/embed`}>
                            <ExternalLink className="w-4 h-4 mr-2" /> Get embed code
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(bot.id, bot.name)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      {bot.documentCount} docs
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {bot.conversationCount} chats
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground truncate mb-4">
                    {bot.description ?? "No description added yet"}
                  </p>

                  {/* Action Button */}
                  <Link href={`/chatbots/${bot.id}`}>
                    <Button variant="outline" size="sm" className="w-full gap-2 group-hover:border-primary group-hover:text-primary transition-colors"
                      data-testid={`button-manage-${bot.id}`}>
                      <Settings className="w-3.5 h-3.5" />
                      Manage chatbot
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

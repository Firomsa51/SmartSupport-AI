import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, MessageSquare, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import AppShell from "@/components/app-shell";
import { useAuth } from "@clerk/clerk-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type FlaggedConversation = {
  id: number;
  sessionId: string;
  visitorId: string | null;
  last_unanswered_query: string | null;
  updatedAt: string;
  latestConfidence: number | null;
};

const API_URL = (import.meta.env.VITE_API_URL as string ?? "").replace(/\/+$/, "");

// ─── API Calls ────────────────────────────────────────────────────────────────
const QUERY_KEY = ["flagged-conversations"];

async function fetchFlaggedConversations(token: string | null): Promise<FlaggedConversation[]> {
  const res = await fetch(`${API_URL}/admin/reviews`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch reviews: ${res.status}`);
  return res.json();
}

async function resolveConversation(id: number, token: string | null): Promise<void> {
  const res = await fetch(`${API_URL}/admin/reviews/${id}/resolve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Failed to resolve: ${res.status}`);
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────
function ConfidenceBar({ score }: { score: number | null }) {
  if (score === null) return null;

  const color =
    score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-500";
  const textColor =
    score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          AI Confidence
        </span>
        <span className={`text-xs font-bold ${textColor}`}>{score}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function ReviewCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="rounded-xl border-l-4 border-red-500/30 bg-muted/40 px-4 py-3 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <Skeleton className="h-9 w-full rounded-xl" />
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ conv, token }: { conv: FlaggedConversation; token: string | null }) {
  const [resolving, setResolving] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => resolveConversation(conv.id, token),
    onMutate: () => setResolving(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Conversation marked as resolved");
    },
    onError: (err: any) => {
      setResolving(false);
      toast.error(err?.message || "Failed to resolve conversation");
    },
  });

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:border-red-500/30 hover:shadow-md transition-all duration-200 group">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="space-y-1.5">
          <Badge
            variant="outline"
            className="gap-1.5 bg-red-500/10 text-red-400 border-red-500/25 uppercase text-[10px] tracking-wider font-bold"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Urgent Review Required
          </Badge>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <MessageSquare className="w-3 h-3" />
              {conv.sessionId.slice(0, 14)}…
            </span>
            {conv.visitorId && (
              <>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                  <User className="w-3 h-3" />
                  {conv.visitorId.slice(0, 12)}…
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap pt-1 shrink-0">
          <Clock className="w-3 h-3" />
          {timeAgo(conv.updatedAt)}
        </div>
      </div>

      {/* ── Unanswered Query Callout ── */}
      <div className="bg-red-500/5 border-l-4 border-red-500 rounded-r-xl px-4 py-3 mb-1">
        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1.5">
          Unanswered Question
        </p>
        <p className="text-sm text-foreground leading-relaxed">
          {conv.last_unanswered_query ?? (
            <span className="italic text-muted-foreground">No query recorded</span>
          )}
        </p>
      </div>

      {/* ── Confidence Bar ── */}
      <ConfidenceBar score={conv.latestConfidence} />

      {/* ── Resolve Button ── */}
      <Button
        onClick={() => mutation.mutate()}
        disabled={resolving || mutation.isPending}
        className="w-full mt-4 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm shadow-emerald-900/20 active:scale-95 transition-all"
        size="sm"
      >
        <CheckCircle2 className="w-4 h-4" />
        {mutation.isPending ? "Resolving…" : "Mark as Resolved"}
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReviewsPage() {
  const { getToken } = useAuth();

  const { data: flagged, isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const token = await getToken();
      return fetchFlaggedConversations(token);
    },
    refetchInterval: 30_000,
  });

  const getTokenSync = async () => getToken();

  if (error) {
    return (
      <AppShell>
        <div className="p-6 max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {(error as any)?.message || "Failed to load review queue."}
            </AlertDescription>
          </Alert>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Human Review Queue
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Conversations where AI confidence was too low
              </p>
            </div>
          </div>
          {!isLoading && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                Flagged:{" "}
                <span className="font-bold text-red-400">{flagged?.length ?? 0}</span>
              </span>
              {flagged?.length === 0 && (
                <span className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">
                  ✓ All clear
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Cards Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <ReviewCardSkeleton key={i} />)}
          </div>
        ) : flagged?.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Queue is empty</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              No conversations are currently flagged for human review. Great job!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {flagged?.map((conv) => (
              <ReviewCard key={conv.id} conv={conv} token={null} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

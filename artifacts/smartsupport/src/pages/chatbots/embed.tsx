import { useParams, Link } from "wouter";
import { useState } from "react";
import { useGetChatbot, getGetChatbotQueryKey, useGetChatbotWidgetScript, getGetChatbotWidgetScriptQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Copy, Check, Code2, ExternalLink, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import AppShell from "@/components/app-shell";

export default function EmbedPage() {
  const { id } = useParams<{ id: string }>();
  const chatbotId = parseInt(id ?? "0");
  const [copied, setCopied] = useState(false);

  const { data: bot } = useGetChatbot(chatbotId, {
    query: { enabled: !!chatbotId, queryKey: getGetChatbotQueryKey(chatbotId) },
  });
  const { data: widgetData, isLoading } = useGetChatbotWidgetScript(chatbotId, {
    query: { enabled: !!chatbotId, queryKey: getGetChatbotWidgetScriptQueryKey(chatbotId) },
  });

  const handleCopy = async () => {
    if (!widgetData?.scriptTag) return;
    await navigator.clipboard.writeText(widgetData.scriptTag);
    setCopied(true);
    toast.success("Script copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <Link href={`/chatbots/${chatbotId}`}>
            <Button variant="ghost" size="sm" className="gap-2 mb-4 -ml-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to {bot?.name ?? "chatbot"}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Embed widget</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add this script to your website to display the chat widget.
          </p>
        </div>

        {/* Script tag */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Script tag</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 h-7 text-xs"
              onClick={handleCopy}
              disabled={!widgetData || isLoading}
              data-testid="button-copy-script"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="p-4">
            {isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <pre className="text-xs font-mono text-primary overflow-x-auto whitespace-pre-wrap break-all" data-testid="text-script-tag">
                {widgetData?.scriptTag}
              </pre>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm">Setup instructions</h2>
          <div className="space-y-4 text-sm">
            {[
              {
                step: "1",
                title: "Copy the script tag above",
                desc: "Click the copy button to copy the embed script to your clipboard.",
              },
              {
                step: "2",
                title: "Paste into your website HTML",
                desc: "Add the script to the <head> or just before the closing </body> tag on every page where you want the widget to appear.",
              },
              {
                step: "3",
                title: "That's it",
                desc: "The chat widget will automatically appear as a floating button in the bottom-right corner of your page.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget preview */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-sm mb-4">Widget preview</h2>
          <div className="relative bg-muted/20 rounded-lg h-48 border border-border/50 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">Your website content</p>
            </div>
            <div className="absolute bottom-4 right-4">
              <div
                className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
                style={{ backgroundColor: bot?.primaryColor ?? "#2563eb" }}
                data-testid="widget-preview-button"
              >
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            The floating button appears in the bottom-right corner. Clicking it opens the chat interface.
          </p>
        </div>

        {/* Test link */}
        <div className="flex items-center gap-3">
          <a
            href={`/widget/${widgetData?.chatbotUid ?? ""}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-test-widget"
          >
            <Button variant="outline" className="gap-2" disabled={!widgetData}>
              <ExternalLink className="w-4 h-4" />
              Test widget in new tab
            </Button>
          </a>
        </div>
      </div>
    </AppShell>
  );
}

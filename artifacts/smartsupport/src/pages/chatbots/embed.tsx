import { useParams, Link } from "wouter";
import { useState, useCallback, useMemo } from "react";
import {
  useGetChatbot,
  getGetChatbotQueryKey,
  useGetChatbotWidgetScript,
  getGetChatbotWidgetScriptQueryKey,
} from "@workspace/api-client-react";
import { ArrowLeft, Copy, Check, Code2, ExternalLink, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import AppShell from "@/components/app-shell";

export default function EmbedPage() {
  const { id } = useParams<{ id: string }>();
  const chatbotId = useMemo(() => {
    const parsed = parseInt(id ?? "0");
    return isNaN(parsed) ? 0 : parsed;
  }, [id]);
  const [copied, setCopied] = useState(false);

  // Fetch bot details (for name and primary color)
  const {
    data: bot,
    isLoading: botLoading,
    error: botError,
  } = useGetChatbot(chatbotId, {
    query: { enabled: chatbotId > 0, queryKey: getGetChatbotQueryKey(chatbotId) },
  });

  // Fetch widget script
  const {
    data: widgetData,
    isLoading: scriptLoading,
    error: scriptError,
  } = useGetChatbotWidgetScript(chatbotId, {
    query: { enabled: chatbotId > 0, queryKey: getGetChatbotWidgetScriptQueryKey(chatbotId) },
  });

  const isLoading = botLoading || scriptLoading;
  const hasError = botError || scriptError;

  // Copy handler with memoization
  const handleCopy = useCallback(async () => {
    if (!widgetData?.scriptTag) {
      toast.error("No script available to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(widgetData.scriptTag);
      setCopied(true);
      toast.success("Script tag copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy. Please copy manually.");
    }
  }, [widgetData]);

  // Instructions list (static, memoized) - English
  const instructions = useMemo(
    () => [
      {
        step: "1",
        title: "Copy the script tag",
        desc: "Click the 'Copy' button to copy the embed script tag.",
      },
      {
        step: "2",
        title: "Paste into your website HTML",
        desc: "Paste this script tag into <head> or just before the closing </body> tag on every page.",
      },
      {
        step: "3",
        title: "Done!",
        desc: "The chat widget will appear as a floating button at the bottom-right corner.",
      },
    ],
    []
  );

  // Error or invalid ID handling
  if (chatbotId === 0) {
    return (
      <AppShell>
        <div className="p-6 max-w-3xl mx-auto text-center">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Invalid chatbot ID.</AlertDescription>
          </Alert>
          <Link href="/dashboard">
            <Button className="mt-4">Back to dashboard</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  if (hasError) {
    return (
      <AppShell>
        <div className="p-6 max-w-3xl mx-auto text-center">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {botError?.message || scriptError?.message || "Something went wrong. Please try again."}
            </AlertDescription>
          </Alert>
          <Link href={`/chatbots/${chatbotId}`}>
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to chatbot
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <AppShell>
        <div className="p-6 max-w-3xl mx-auto space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </AppShell>
    );
  }

  // No widget data (should not happen if no error)
  if (!widgetData?.scriptTag) {
    return (
      <AppShell>
        <div className="p-6 max-w-3xl mx-auto text-center">
          <Alert>
            <AlertDescription>Script tag not found. Is your chatbot properly configured?</AlertDescription>
          </Alert>
          <Link href={`/chatbots/${chatbotId}`}>
            <Button className="mt-4">Back</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const primaryColor = bot?.primaryColor ?? "#2563eb";
  const chatbotName = bot?.name ?? "Chatbot";

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href={`/chatbots/${chatbotId}`}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 mb-4 -ml-2 text-muted-foreground"
              aria-label="Back to chatbot details"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {chatbotName}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Embed Widget</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add this script tag to your website to enable the chat widget.
          </p>
        </div>

        {/* Script tag card */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Script tag (embed code)</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 h-7 text-xs"
              onClick={handleCopy}
              aria-label="Copy script tag to clipboard"
              data-testid="button-copy-script"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="p-4">
            <pre
              className="text-xs font-mono text-primary overflow-x-auto whitespace-pre-wrap break-all"
              data-testid="text-script-tag"
              aria-label="Embed script tag"
            >
              {widgetData.scriptTag}
            </pre>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm">How to use</h2>
          <div className="space-y-4 text-sm">
            {instructions.map((item) => (
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
          <h2 className="font-semibold text-sm mb-4">Widget Preview</h2>
          <div className="relative bg-muted/20 rounded-lg h-48 border border-border/50 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">Your website content</p>
            </div>
            <div className="absolute bottom-4 right-4">
              <div
                className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
                style={{ backgroundColor: primaryColor }}
                data-testid="widget-preview-button"
                aria-label="Chat widget preview button"
              >
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            This button appears at bottom-right. Click to open chat interface.
          </p>
        </div>

        {/* Test link */}
        <div className="flex items-center gap-3">
          <a
            href={`/widget/${widgetData.chatbotUid ?? ""}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-test-widget"
            className="inline-block"
          >
            <Button variant="outline" className="gap-2" disabled={!widgetData.chatbotUid}>
              <ExternalLink className="w-4 h-4" />
              Test widget in new tab
            </Button>
          </a>
          <p className="text-xs text-muted-foreground">
            Preview how your visitors will see the widget.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

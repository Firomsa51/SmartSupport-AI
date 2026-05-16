import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams } from "wouter";
import { useWidgetChat } from "@workspace/api-client-react";
import { Send, Bot, User, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * Generates or retrieves a persistent session ID for the given chatbot UID.
 * Uses sessionStorage to remember the session across page reloads within the same tab.
 */
const getOrCreateSessionId = (uid: string): string => {
  if (!uid) return generateFallbackSessionId();
  try {
    const storageKey = `ss_session_${uid}`;
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const newId = generateSessionId();
    sessionStorage.setItem(storageKey, newId);
    return newId;
  } catch {
    // sessionStorage may be disabled (e.g., private mode) – fallback to in-memory ID
    return generateFallbackSessionId();
  }
};

const generateSessionId = (): string => {
  return `sess_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

const generateFallbackSessionId = (): string => {
  return `sess_fallback_${Date.now()}_${Math.random().toString(36)}`;
};

export default function WidgetPage() {
  const { uid } = useParams<{ uid: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [hasError, setHasError] = useState(false);

  // Memoize session ID to avoid re‑creation on re‑renders
  const sessionId = useMemo(() => getOrCreateSessionId(uid ?? "unknown"), [uid]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendMessage = useWidgetChat();

  const isSending = sendMessage.isPending;
  const hasWelcome = messages.length === 0;

  // Scroll to bottom whenever messages change or sending status changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Focus the input on mount for better UX
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !uid || isSending) return;

    setHasError(false);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);

    sendMessage.mutate(
      { chatbotUid: uid, data: { message: trimmed, sessionId } },
      {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.reply },
          ]);
          setHasError(false);
        },
        onError: (err) => {
          console.error("Chat error:", err);
          setHasError(true);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Sorry, I couldn't get a response. Please try again.",
            },
          ]);
        },
      }
    );
  }, [input, uid, isSending, sendMessage, sessionId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleRetry = useCallback(() => {
    if (hasError) {
      // Re‑send the last user message if there was a failure
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      if (lastUserMsg) {
        setInput(lastUserMsg.content);
        // Remove the failed assistant message (if any) and the last user message will be re‑added on send
        setMessages((prev) => prev.slice(0, -1));
        handleSend();
      }
    }
  }, [hasError, messages, handleSend]);

  // If chatbot UID is missing, show error state
  if (!uid) {
    return (
      <div className="flex flex-col h-screen bg-slate-950 text-slate-100 items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md bg-red-950/50 border-red-800">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>
            Invalid chatbot configuration. Missing unique identifier.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans"
      data-testid="widget-container"
      role="main"
      aria-label="AI Assistant chat widget"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-800 bg-slate-900">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center" aria-hidden="true">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">AI Assistant</p>
          <p className="text-xs text-slate-400">Powered by SmartSupport</p>
        </div>
        <div className="ml-auto w-2 h-2 rounded-full bg-green-500" aria-label="Online status" />
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-label="Chat messages">
        {hasWelcome && (
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div
              className="bg-slate-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm max-w-xs"
              data-testid="msg-welcome"
            >
              Hi! How can I help you today?
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            data-testid={`msg-${msg.role}-${idx}`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === "user" ? "bg-slate-600" : "bg-blue-600"
              }`}
              aria-hidden="true"
            >
              {msg.role === "user" ? (
                <User className="w-3 h-3 text-white" />
              ) : (
                <Bot className="w-3 h-3 text-white" />
              )}
            </div>
            <div
              className={`rounded-2xl px-3.5 py-2.5 text-sm max-w-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : "bg-slate-800 text-slate-100 rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex gap-2.5 items-start" aria-label="Assistant is typing">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            </div>
          </div>
        )}

        {hasError && !isSending && (
          <div className="flex justify-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="text-xs text-red-400 hover:text-red-300 gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              Something went wrong – click to retry
            </Button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="px-3 pb-3 pt-2 border-t border-slate-800">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 text-sm h-9"
            data-testid="input-message"
            disabled={isSending}
            aria-label="Message input"
            maxLength={2000}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || isSending || !uid}
            className="h-9 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
            data-testid="button-send"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

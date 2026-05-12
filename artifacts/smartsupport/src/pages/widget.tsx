import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { useWidgetChat } from "@workspace/api-client-react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

function getOrCreateSessionId(uid: string): string {
  try {
    const key = `ss_session_${uid}`;
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return "sess_" + Math.random().toString(36).slice(2);
  }
}

export default function WidgetPage() {
  const { uid } = useParams<{ uid: string }>();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => getOrCreateSessionId(uid ?? "unknown"));
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendMessage = useWidgetChat();

  const hasWelcome = messages.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessage.isPending]);

  const handleSend = () => {
    if (!input.trim() || !uid || sendMessage.isPending) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    sendMessage.mutate(
      { chatbotUid: uid, data: { message: userMsg, sessionId } },
      {
        onSuccess: (data) => {
          setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        },
        onError: () => {
          setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't get a response. Please try again." }]);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans" data-testid="widget-container">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-800 bg-slate-900">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">AI Assistant</p>
          <p className="text-xs text-slate-400">Powered by SmartSupport</p>
        </div>
        <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {hasWelcome && (
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm max-w-xs">
              Hi! How can I help you today?
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.role === "user" ? "bg-slate-600" : "bg-blue-600"}`}>
              {msg.role === "user"
                ? <User className="w-3 h-3 text-white" />
                : <Bot className="w-3 h-3 text-white" />
              }
            </div>
            <div
              className={`rounded-2xl px-3.5 py-2.5 text-sm max-w-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : "bg-slate-800 text-slate-100 rounded-tl-sm"
              }`}
              data-testid={`msg-${msg.role}-${i}`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sendMessage.isPending && (
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-slate-800">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 text-sm h-9"
            data-testid="input-message"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending || !uid}
            className="h-9 px-3 bg-blue-600 hover:bg-blue-500"
            data-testid="button-send"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

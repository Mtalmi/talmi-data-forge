import { useState, useRef, useEffect } from 'react';
import { Send, Square, Trash2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { useAIChat } from '@/hooks/useAIChat';

interface AIChatPanelProps {
  chat: ReturnType<typeof useAIChat>;
  compact?: boolean;
}

const SUGGESTIONS = [
  "📊 Résumé financier du jour",
  "🚚 Statut des livraisons en cours",
  "⚠️ Anomalies détectées cette semaine",
  "📋 Stock critique à commander",
];

export function AIChatPanel({ chat, compact }: AIChatPanelProps) {
  const { messages, isLoading, sendMessage, stopGeneration, clearMessages } = chat;
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className={cn("font-semibold", compact ? "text-base" : "text-lg")}>
                🤖 TBOS AI Assistant
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Posez n'importe quelle question sur vos opérations
              </p>
            </div>
            <div className={cn("grid gap-2 w-full", compact ? "grid-cols-1" : "grid-cols-2")}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs p-3 rounded-xl border border-border/50 hover:bg-accent/50 hover:border-primary/30 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            )}
            <div className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-card border border-border/50 rounded-bl-md'
            )}>
              {msg.content}
              {isLoading && msg.role === 'assistant' && msg.id === messages[messages.length - 1]?.id && (
                <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-middle rounded-full" />
              )}
            </div>
            {msg.role === 'user' && (
              <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border/30 p-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              rows={1}
              className="w-full resize-none bg-accent/30 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/60 max-h-32"
              style={{ minHeight: '42px' }}
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-1.5">
            {messages.length > 0 && !isLoading && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-[42px] w-[42px] rounded-xl text-muted-foreground"
                onClick={clearMessages}
                title="Effacer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {isLoading ? (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-[42px] w-[42px] rounded-xl"
                onClick={stopGeneration}
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                className="h-[42px] w-[42px] rounded-xl"
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

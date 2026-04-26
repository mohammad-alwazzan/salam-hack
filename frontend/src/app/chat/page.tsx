'use client';

import { useAgentChat, ShowOptionsInput } from '@/src/hooks/use-agent-chat';
import { FinancialStrip } from '../agent/_components/FinancialStrip';
import { OptionsSelector } from '../agent/_components/OptionsSelector';
import { ToolResultRenderer } from '../agent/_components/ToolResultRenderer';
import { AnimatePresence, motion } from 'motion/react';
import { SendHorizontal, Loader, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import type { UIMessage } from 'ai';

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, idx }: { msg: UIMessage; idx: number }) {
  const isUser = msg.role === 'user';

  const textParts = msg.parts.filter((p) => p.type === 'text');
  const toolParts = msg.parts.filter((p) => p.type === 'tool-invocation');
  const textContent = textParts.map((p) => p.text).join('');

  if (!isUser && !textContent && toolParts.length === 0) return null;

  return (
    <motion.div
      key={`${msg.id}-${idx}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex flex-col gap-2',
        isUser ? 'items-end' : 'items-start',
      )}
    >
      {textContent && (
        <div
          className={cn(
            'max-w-[80%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm',
          )}
        >
          {textContent}
        </div>
      )}
      {!isUser &&
        toolParts.map(
          (part, i) =>
            'toolInvocation' in part && (
              <div key={i} className="w-full max-w-sm">
                <ToolResultRenderer toolInvocation={part.toolInvocation} />
              </div>
            ),
        )}
    </motion.div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start"
    >
      <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
          />
        ))}
      </div>
    </motion.div>
  );
}

const SUGGESTED_PROMPTS = [
  'How much have I spent this month?',
  'Pay my electricity bill',
  'Show my account balances',
];

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onPrompt }: { onPrompt: (text: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="flex flex-col items-center justify-center h-full gap-5 px-6 pb-8 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/15">
        <Sparkles className="size-7 text-primary" />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <h2 className="text-base font-semibold tracking-tight">
          How can I help?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ask me anything about your finances — bills, budget, transfers, or
          spending insights.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPrompt(prompt)}
            className="cursor-pointer rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 text-sm text-muted-foreground hover:bg-card hover:text-foreground hover:border-border transition-all duration-200 text-left"
          >
            {prompt}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Chat Page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const {
    messages,
    sendMessage,
    setCurrentTool,
    isLoading,
    status,
    currentTool,
    addToolOutput,
  } = useAgentChat();

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const lastAssistantMsg = messages
    .filter((m) => m.role === 'assistant')
    .at(-1);
  const lastAssistantHasText =
    lastAssistantMsg?.parts.some(
      (p) => p.type === 'text' && p.text.length > 0,
    ) ?? false;
  const isWaiting =
    status === 'submitted' || (status === 'streaming' && !lastAssistantHasText);

  const handleOptionSelect = (label: string, value: string) => {
    if (currentTool?.toolName === 'showOptions') {
      const toolCallId = currentTool.toolCallId;
      setCurrentTool(null);
      addToolOutput({
        toolCallId,
        tool: currentTool.toolName,
        output: {
          label,
          value,
        },
      });
    }
  };

  const showOptionsData =
    currentTool?.toolName === 'showOptions'
      ? (currentTool.input as ShowOptionsInput)
      : null;

  const handleSend = async (text?: string) => {
    const toSend = (text ?? input).trim();
    if (!toSend || isLoading) return;
    setInput('');
    await sendMessage({ text: toSend });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const isDisabled = !input.trim() || isLoading;

  return (
    <div className="flex flex-col h-svh w-full bg-background">
      {/* ── Ambient glow ──────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[360px] w-[700px] rounded-full bg-primary/[0.07] blur-3xl dark:bg-primary/[0.10]" />
      </div>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 items-center px-4 sm:px-6 gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-4" />
            Dashboard
          </Link>
          <div className="flex-1" />
          <span className="text-sm font-semibold tracking-tight">Mizan</span>
        </div>
      </header>

      {/* ── Financial Strip ───────────────────────────────────────────── */}
      <div className="shrink-0 pt-3">
        <FinancialStrip />
      </div>

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {messages.length === 0 && !isWaiting ? (
          <EmptyState onPrompt={(text) => handleSend(text)} />
        ) : (
          <div className="mx-auto max-w-xl px-4 py-4 flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={`${msg.id}-${idx}`}
                  msg={msg as UIMessage}
                  idx={idx}
                />
              ))}
            </AnimatePresence>
            <AnimatePresence>
              {isWaiting && <TypingIndicator />}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input Area ────────────────────────────────────────────────── */}
      <div className="shrink-0 relative px-4 pb-6 pt-2">
        <OptionsSelector data={showOptionsData} onSelect={handleOptionSelect} />

        <div className="mx-auto max-w-xl">
          <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm px-4 py-3 shadow-sm focus-within:border-border focus-within:shadow-md transition-all duration-200">
            <textarea
              autoFocus
              value={input}
              disabled={isLoading}
              placeholder="Ask about your finances..."
              onKeyDown={handleKeyDown}
              onChange={(e) => setInput(e.target.value)}
              className="field-sizing-content max-h-32 min-h-[1.5rem] flex-1 resize-none bg-transparent text-sm leading-relaxed focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground/60"
            />
            <Button
              size="icon"
              type="button"
              disabled={isDisabled}
              variant={isDisabled ? 'secondary' : 'default'}
              title="Send"
              onClick={() => void handleSend()}
              className="size-8 shrink-0 rounded-xl self-end disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader className="size-4 animate-spin" />
              ) : (
                <SendHorizontal className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

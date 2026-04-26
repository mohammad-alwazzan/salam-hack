'use client';

import { useAgentChat, ShowOptionsInput } from '@/hooks/use-agent-chat';
import { useBudget } from '@/hooks/use-budget';
import { useBankAccounts } from '@/hooks/use-bank-accounts';
import { OptionsSelector } from '@/components/agents-ui/options-selector';
import { SendHorizontal, Loader2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRef, useEffect, useState, useMemo } from 'react';
import type { UIMessage } from 'ai';

const EMPTY_PROMPTS = [
  'Show me my current financial summary',
  'What bills are due this week?',
  'Can I afford a 250 USD purchase?',
  'Show my highest spending categories this month',
];

function getTextFromMessage(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

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

  console.log(currentTool);
  const { budget } = useBudget();
  const { accounts } = useBankAccounts();

  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const uiMessages = messages as UIMessage[];
  const hasMessages = uiMessages.length > 0;

  const showOptionsData =
    currentTool?.toolName === 'showOptions' && status === 'ready'
      ? (currentTool.input as ShowOptionsInput)
      : null;

  const handleOptionSelect = async (label: string, value: string) => {
    if (currentTool?.toolName === 'showOptions') {
      const toolCallId = currentTool.toolCallId;
      await addToolOutput({
        tool: currentTool.toolName,
        toolCallId,
        output: {
          selectedLabel: label,
          selectedValue: value,
        },
      });
      setCurrentTool(null);
    }
  };

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

  const renderedMessages = useMemo(
    () =>
      uiMessages
        .map((message) => ({
          id: message.id,
          role: message.role,
          text: getTextFromMessage(message),
        }))
        .filter(
          (message) =>
            message.role !== 'system' && message.text.trim().length > 0,
        ),
    [uiMessages],
  );

  const budgetSummary = useMemo(() => {
    if (!budget) return null;
    const totalAllocated = budget.categories.reduce(
      (acc, cat) => acc + cat.allocated,
      0,
    );
    const totalSpent = budget.categories.reduce(
      (acc, cat) => acc + cat.spent,
      0,
    );
    const remaining = totalAllocated - totalSpent;
    const usedPct =
      totalAllocated > 0
        ? Math.min(100, (totalSpent / totalAllocated) * 100)
        : 0;
    const topCategories = [...budget.categories]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 3);
    const totalBalance = accounts.reduce(
      (acc, account) => acc + account.balance,
      0,
    );
    return {
      month: budget.month,
      totalAllocated,
      totalSpent,
      remaining,
      totalBalance,
      usedPct,
    };
  }, [budget, accounts]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [renderedMessages, isLoading]);

  return (
    <div className="flex h-svh w-full flex-col bg-background">
      <header className="sticky top-0 z-30 shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Dashboard
          </Link>
          <div className="flex-1" />
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold tracking-tight">
              Mizan Chat
            </span>
            <span className="text-[10px] leading-none text-muted-foreground">
              Text AI Assistant
            </span>
          </div>
        </div>
      </header>

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
      >
        <div className="mx-auto w-full max-w-2xl space-y-4">
          {budgetSummary && (
            <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {budgetSummary.month}
                  </p>
                  <p className="mt-1 text-base font-medium text-muted-foreground">
                    Budget Snapshot
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {Math.round(budgetSummary.usedPct)}% used
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-border/70 bg-background p-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Balance
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {budgetSummary.totalBalance.toLocaleString()} USD
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Expenses
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {budgetSummary.totalSpent.toLocaleString()} USD
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Total
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {budgetSummary.totalAllocated.toLocaleString()} USD
                  </p>
                </div>
              </div>
              <Progress value={budgetSummary.usedPct} className="mt-4 h-2" />
            </div>
          )}

          {!hasMessages && (
            <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
              <p className="text-lg font-semibold">
                How can I help with your finances?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tap a suggestion to start quickly, or type your message below.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2">
                {EMPTY_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSend(prompt)}
                    className="rounded-xl border border-border/70 bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {renderedMessages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm bg-muted text-foreground'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-sm text-muted-foreground">
                Thinking...
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="relative shrink-0 border-t border-border/40 bg-background px-4 py-4 sm:px-6">
        <OptionsSelector data={showOptionsData} onSelect={handleOptionSelect} />
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-2.5 shadow-sm">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              disabled={isLoading}
              placeholder="Type your message..."
              onKeyDown={handleKeyDown}
              onChange={(e) => setInput(e.target.value)}
              className="max-h-32 flex-1 resize-none overflow-hidden bg-transparent py-1 text-sm leading-5 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground/70"
            />
            <Button
              size="icon"
              type="button"
              disabled={isDisabled}
              variant={isDisabled ? 'secondary' : 'default'}
              title="Send"
              onClick={() => void handleSend()}
              className="size-9 shrink-0 rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
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

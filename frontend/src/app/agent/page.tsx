'use client';

import { AgentControlBar } from '@/src/components/agents-ui/agent-control-bar';
import { AgentSessionProvider } from '@/src/components/agents-ui/agent-session-provider';
import { useAgent, useSessionContext } from '@livekit/components-react';
import { useSession } from '@livekit/components-react';
import { TokenSource } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import { useAgentChat } from '@/src/hooks/use-agent-chat';
import { useMemo, useState, useRef, useEffect } from 'react';
import {
  SendHorizontal,
  Loader,
  MessageSquare,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useRoomContext } from '@livekit/components-react';
import {
  ApprovalSheet,
  type ApprovalData,
} from '@/src/components/agents-ui/approval-sheet';
import { UIMessage } from 'ai';
import React from 'react';
import { Button } from '@/src/components/ui/button';
import { ToolResultRenderer } from './_components/ToolResultRenderer';
import { OptionsSelector } from './_components/OptionsSelector';
import { ShowOptionsInput } from '@/src/hooks/use-agent-chat';
import { FinancialStrip } from './_components/FinancialStrip';

// ─── Orb Visualizer ──────────────────────────────────────────────────────────

type AgentStateKind =
  | 'connecting'
  | 'initializing'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'idle'
  | 'disconnected'
  | 'failed'
  | 'pre-connect-buffering'
  | undefined;

const STATE_LABEL: Record<string, string> = {
  connecting: 'Connecting...',
  initializing: 'Initializing...',
  listening: 'Listening',
  thinking: 'Thinking...',
  speaking: 'Speaking',
  idle: 'Ready',
  disconnected: 'Disconnected',
  failed: 'Connection failed',
  'pre-connect-buffering': 'Buffering...',
};

const STATE_COLOR: Record<string, string> = {
  connecting: '#6366f1',
  initializing: '#6366f1',
  listening: '#22c55e',
  thinking: '#f59e0b',
  speaking: '#3b82f6',
  idle: '#6b7280',
  disconnected: '#6b7280',
  failed: '#ef4444',
  'pre-connect-buffering': '#6366f1',
};

function Orb({ state }: { state: AgentStateKind }) {
  const color = STATE_COLOR[state ?? 'idle'] ?? '#6366f1';
  const isSpeaking = state === 'speaking';
  const isThinking =
    state === 'thinking' || state === 'initializing' || state === 'connecting';
  const isListening =
    state === 'listening' || state === 'pre-connect-buffering';

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 280, height: 280 }}
    >
      <AnimatePresence>
        {(isSpeaking || isListening) && (
          <>
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border"
                style={{ borderColor: color }}
                initial={{ width: 140, height: 140, opacity: 0 }}
                animate={{
                  width: [140, 140 + i * 60],
                  height: [140, 140 + i * 60],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: isSpeaking ? 1.2 : 2.0,
                  delay: i * (isSpeaking ? 0.25 : 0.5),
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isThinking && (
          <motion.div
            className="absolute rounded-full border-2 border-transparent"
            style={{
              width: 170,
              height: 170,
              borderTopColor: color,
              borderRightColor: `${color}40`,
            }}
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{
              rotate: { duration: 1.2, repeat: Infinity, ease: 'linear' },
              opacity: { duration: 0.3 },
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="relative z-10 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          width: 140,
          height: 140,
          background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}44 60%, ${color}11)`,
          boxShadow: `0 0 40px ${color}55, 0 0 80px ${color}22, inset 0 1px 0 ${color}88`,
        }}
        animate={
          isSpeaking
            ? { scale: [1, 1.06, 0.98, 1.04, 1] }
            : isListening
              ? { scale: [1, 1.03, 1] }
              : { scale: 1 }
        }
        transition={
          isSpeaking
            ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
            : isListening
              ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.4 }
        }
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent 60%, ${color}44 80%, transparent 100%)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        <div
          className="relative z-10 rounded-full"
          style={{
            width: 24,
            height: 24,
            background: color,
            boxShadow: `0 0 12px ${color}`,
          }}
        />
      </motion.div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ state }: { state: AgentStateKind }) {
  const label = STATE_LABEL[state ?? 'idle'] ?? 'Ready';
  const color = STATE_COLOR[state ?? 'idle'] ?? '#6b7280';

  return (
    <motion.div
      key={state}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-background/60 backdrop-blur-sm text-xs font-medium text-muted-foreground"
    >
      <motion.div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
        animate={
          state === 'speaking' || state === 'listening'
            ? { opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }
            : { opacity: 1 }
        }
        transition={{ duration: 1.2, repeat: Infinity }}
      />
      {label}
    </motion.div>
  );
}

// ─── Chat Transcript ──────────────────────────────────────────────────────────

interface ChatTranscriptProps {
  messages: UIMessage[];
  isLoading: boolean;
  isWaiting: boolean;
}

function ChatTranscript({
  messages,
  isLoading,
  isWaiting,
}: ChatTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isWaiting) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl mx-auto flex flex-col gap-3 px-4 py-2"
    >
      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const textContent = msg.parts
            .filter((p) => p.type === 'text')
            .map((p) => p.text)
            .join('');

          // Skip assistant messages that have no text yet (pure tool-invocation steps)
          if (!isUser && !textContent) return null;

          return (
            <motion.div
              key={`${msg.id}-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl ${
                  isUser
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                {textContent}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {isWaiting && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex justify-start"
        >
          <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.15,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
      <div ref={bottomRef} />
    </motion.div>
  );
}

// ─── Chat Input ───────────────────────────────────────────────────────────────

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

function ChatInput({ input, isLoading, onChange, onSubmit }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
  };

  const isDisabled = input.trim() === '' || isLoading;

  return (
    <div className={'mb-3 flex grow items-end gap-2 rounded-md pl-1 text-sm'}>
      <textarea
        autoFocus
        value={input}
        disabled={isLoading}
        placeholder="Type something..."
        onKeyDown={handleKeyDown}
        onChange={onChange}
        className="field-sizing-content max-h-16 min-h-8 flex-1 resize-none py-2 [scrollbar-width:thin] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
      <Button
        size="icon"
        type="button"
        disabled={isDisabled}
        variant={isDisabled ? 'secondary' : 'default'}
        title={'Send'}
        onClick={onSubmit}
        className="self-end disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader className="animate-spin" /> : <SendHorizontal />}
      </Button>
    </div>
  );
}

// ─── Pre-connect Landing ──────────────────────────────────────────────────────

function LandingScreen({ onConnect }: { onConnect: () => void }) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await onConnect();
    } catch {
      setConnecting(false);
    }
  };

  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center h-full gap-10 px-6"
    >
      <div className="flex flex-col items-center gap-6">
        <Orb state={connecting ? 'connecting' : 'idle'} />
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Mizan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your AI voice assistant — speak or type to begin
          </p>
        </div>
      </div>

      <motion.button
        onClick={handleConnect}
        disabled={connecting}
        whileHover={{ scale: connecting ? 1 : 1.04 }}
        whileTap={{ scale: connecting ? 1 : 0.97 }}
        className="flex items-center gap-3 px-8 py-4 rounded-full text-sm font-semibold bg-primary text-primary-foreground shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {connecting ? (
          <>
            <motion.span
              className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            Connecting...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zm6.364 8.136a.75.75 0 0 1 .75.75 7.364 7.364 0 0 1-14.728 0 .75.75 0 0 1 1.5 0 5.864 5.864 0 0 0 11.728 0 .75.75 0 0 1 .75-.75z" />
            </svg>
            Start Voice Session
          </>
        )}
      </motion.button>
    </motion.div>
  );
}

// ─── Active Session View ──────────────────────────────────────────────────────

function ActiveSessionView() {
  const session = useSessionContext();
  const { state: agentState } = useAgent();
  const room = useRoomContext();
  const [chatOpen, setChatOpen] = useState(false);
  const [input, setInput] = useState<string>('');
  const [pendingApproval, setPendingApproval] = useState<ApprovalData | null>(
    null,
  );
  const resolveApproval = useRef<((approved: boolean) => void) | null>(null);

  const {
    messages,
    sendMessage,
    setCurrentTool,
    isLoading,
    status,
    error,
    currentTool,
  } = useAgentChat();

  const handleOptionSelect = async (label: string, _: string) => {
    if (currentTool?.toolName === 'showOptions') {
      setCurrentTool(null);
      await sendMessage({
        text: label,
      });
    }
  };

  const showOptionsData =
    currentTool?.toolName === 'showOptions'
      ? (currentTool.input as ShowOptionsInput)
      : null;
  useEffect(() => {
    if (error) console.log(error);
  }, [error]);

  useEffect(() => {
    room.registerRpcMethod('show_approval', async (data) => {
      const payload = JSON.parse(data.payload) as ApprovalData;
      setPendingApproval(payload);
      return new Promise<string>((resolve) => {
        resolveApproval.current = (approved: boolean) => {
          resolve(JSON.stringify({ approved }));
        };
      });
    });
    return () => room.unregisterRpcMethod('show_approval');
  }, [room]);

  const handleAccept = () => {
    resolveApproval.current?.(true);
    resolveApproval.current = null;
    setPendingApproval(null);
  };

  const handleCancel = () => {
    resolveApproval.current?.(false);
    resolveApproval.current = null;
    setPendingApproval(null);
  };

  const lastAssistantMsg = messages
    .filter((m) => m.role === 'assistant')
    .at(-1);
  const lastAssistantHasText =
    lastAssistantMsg?.parts.some(
      (p) => p.type === 'text' && p.text.length > 0,
    ) ?? false;
  const isWaiting =
    status === 'submitted' || (status === 'streaming' && !lastAssistantHasText);

  const hasMessages = messages.length > 0;

  return (
    <motion.div
      key="session"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="relative flex flex-col h-full w-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Mizan</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Voice AI Assistant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge state={agentState as AgentStateKind} />
          <button
            type="button"
            onClick={() => setChatOpen((o) => !o)}
            className={`p-2 rounded-full border transition-colors ${
              chatOpen
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-foreground/20'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Financial Strip */}
      <FinancialStrip />

      {/* Orb */}
      <div
        className={`flex items-center justify-center shrink-0 transition-all duration-500 ${
          chatOpen || hasMessages ? 'py-4' : 'flex-1'
        }`}
      >
        <Orb state={agentState as AgentStateKind} />
      </div>

      {/* Transcript */}
      <AnimatePresence>
        {(chatOpen || hasMessages) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-1 overflow-y-auto min-h-0"
          >
            <ChatTranscript
              messages={messages}
              isLoading={isLoading}
              isWaiting={isWaiting}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      <AnimatePresence>
        {!hasMessages && !chatOpen && (
          <motion.p
            key="hint"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-center text-sm text-muted-foreground pb-4 shrink-0"
          >
            Start speaking or open chat to type
          </motion.p>
        )}
      </AnimatePresence>

      {/* Voice control bar */}
      <div className="shrink-0 px-4 pb-6 pt-2 relative">
        <OptionsSelector data={showOptionsData} onSelect={handleOptionSelect} />
        <AgentControlBar
          variant="livekit"
          controls={{
            microphone: true,
            leave: true,
            camera: false,
            screenShare: false,
          }}
          isConnected={session.isConnected}
          onDisconnect={session.end}
          className="mx-auto max-w-sm"
          renderChat={() => (
            <ChatInput
              input={input}
              isLoading={isLoading}
              onChange={(e) => setInput(e.target.value)}
              onSubmit={async () => {
                try {
                  console.log('Sending message');
                  const textToSend = input;
                  setInput('');
                  await sendMessage({
                    text: textToSend,
                  });
                } catch (e) {}
              }}
            />
          )}
        />
      </div>

      <ApprovalSheet
        approval={pendingApproval}
        onAccept={handleAccept}
        onCancel={handleCancel}
      />
    </motion.div>
  );
}

// ─── Session Router ───────────────────────────────────────────────────────────

function SessionView() {
  const session = useSessionContext();

  return (
    <div className="h-full">
      <AnimatePresence mode="wait">
        {session.isConnected ? (
          <ActiveSessionView key="active" />
        ) : (
          <LandingScreen key="landing" onConnect={session.start} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const tokenSource = useMemo(() => TokenSource.endpoint('/api/token'), []);
  const session = useSession(tokenSource, { agentName: 'Dakota-db7' });

  useEffect(() => {
    return () => {
      console.log('Ending Session');
      session.end().then(() => console.log('Session Ended'));
    };
  }, []);

  return (
    <AgentSessionProvider session={session}>
      <div className="flex flex-col h-svh w-full bg-background">
        {/* Nav bar */}
        <header className="sticky top-0 z-30 shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="flex h-14 items-center px-4 sm:px-6 gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="size-4" />
              Dashboard
            </Link>
            <div className="flex-1" />
            <span className="text-sm font-semibold tracking-tight">Mizan</span>
          </div>
        </header>
        <main className="flex-1 min-h-0 overflow-hidden">
          <SessionView />
        </main>
      </div>
    </AgentSessionProvider>
  );
}

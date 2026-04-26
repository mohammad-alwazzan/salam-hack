'use client';

import { AgentControlBar } from '@/components/agents-ui/agent-control-bar';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { useAgent, useSessionContext } from '@livekit/components-react';
import { useSession } from '@livekit/components-react';
import { TokenSource } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRoomContext } from '@livekit/components-react';
import {
  ApprovalSheet,
  type ApprovalData,
} from '@/components/agents-ui/approval-sheet';
import { OptionsSelector } from '@/components/agents-ui/options-selector';
import { FinancialStrip } from '@/components/agents-ui/financial-strip';
import { Orb, StatusBadge, type AgentStateKind } from '@/components/agents-ui/orb';
import { useVoiceToolState } from '@/hooks/use-voice-tool-state';
import { ToolCallBanner } from './_components/ToolCallBanner';

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
          <h1 className="text-2xl font-semibold tracking-tight">Mizan Voice</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your AI voice assistant — speak to begin your session
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
  const [pendingApproval, setPendingApproval] = useState<ApprovalData | null>(
    null,
  );
  const [pendingOptions, setPendingOptions] = useState<{
    title: string;
    options: Array<{ label: string; value: string }>;
    resolve: (result: { label: string; value: string }) => void;
  } | null>(null);
  const resolveApproval = useRef<((approved: boolean) => void) | null>(null);

  const { currentTool } = useVoiceToolState();

  const handleOptionSelect = (label: string, value: string) => {
    pendingOptions?.resolve({ label, value });
    setPendingOptions(null);
  };

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
    room.registerRpcMethod('show_options', async (data) => {
      const payload = JSON.parse(data.payload) as {
        title: string;
        options: Array<{ label: string; value: string }>;
      };

      return new Promise<string>((resolve) => {
        setPendingOptions({
          title: payload.title,
          options: payload.options,
          resolve: (result) => resolve(JSON.stringify(result)),
        });
      });
    });

    return () => {
      room.unregisterRpcMethod('show_approval');
      room.unregisterRpcMethod('show_options');
    };
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
          <h1 className="text-lg font-semibold tracking-tight">Mizan Voice</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Voice AI Assistant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge state={agentState as AgentStateKind} />
        </div>
      </div>

      {/* Financial Strip */}
      <FinancialStrip />

      {/* Orb */}
      <div className="flex-1 flex items-center justify-center">
        <Orb state={agentState as AgentStateKind} />
      </div>

      {/* Voice control bar */}
      <div className="shrink-0 px-4 pb-8 pt-2 relative">
        <ToolCallBanner currentTool={currentTool} />
        <OptionsSelector
          data={pendingOptions ? { title: pendingOptions.title, options: pendingOptions.options } : null}
          onSelect={handleOptionSelect}
        />
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

export default function VoicePage() {
  const tokenSource = useMemo(() => TokenSource.endpoint('/api/token'), []);
  const session = useSession(tokenSource, {
    agentName: process.env.NEXT_PUBLIC_LIVEKIT_AGENT_NAME ?? 'mizan-agent',
  });

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

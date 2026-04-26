'use client';

import { AnimatePresence, motion } from 'motion/react';

export type AgentStateKind =
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

export const STATE_LABEL: Record<string, string> = {
  connecting: 'Connecting...',
  initializing: 'Initializing...',
  listening: 'Listening',
  thinking: 'Thinking...',
  speaking: 'Responding',
  idle: 'Ready',
  disconnected: 'Disconnected',
  failed: 'Connection failed',
  'pre-connect-buffering': 'Buffering...',
};

interface OrbProps {
  state: AgentStateKind;
  size?: number;
}

export function Orb({ state, size = 280 }: OrbProps) {
  const color = STATE_COLOR[state ?? 'idle'] ?? '#6b7280';
  const isSpeaking = state === 'speaking';
  const isThinking =
    state === 'thinking' || state === 'initializing' || state === 'connecting';
  const isListening =
    state === 'listening' || state === 'pre-connect-buffering';

  const coreSize = size * 0.5;
  const dotSize = size * 0.086;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <AnimatePresence>
        {(isSpeaking || isListening) && (
          <>
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border"
                style={{ borderColor: color }}
                initial={{ width: coreSize, height: coreSize, opacity: 0 }}
                animate={{
                  width: [coreSize, coreSize + i * (size * 0.214)],
                  height: [coreSize, coreSize + i * (size * 0.214)],
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
              width: coreSize * 1.21,
              height: coreSize * 1.21,
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
          width: coreSize,
          height: coreSize,
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
            width: dotSize,
            height: dotSize,
            background: color,
            boxShadow: `0 0 12px ${color}`,
          }}
        />
      </motion.div>
    </div>
  );
}

interface StatusBadgeProps {
  state: AgentStateKind;
}

export function StatusBadge({ state }: StatusBadgeProps) {
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

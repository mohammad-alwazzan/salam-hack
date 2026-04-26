'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ShowOptionsInput } from '@/hooks/use-agent-chat';

interface OptionsSelectorProps {
  data: ShowOptionsInput | null;
  onSelect: (label: string, value: string) => void;
}

export function OptionsSelector({ data, onSelect }: OptionsSelectorProps) {
  if (!data) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="options-selector"
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="absolute bottom-full left-0 right-0 z-20 mb-4 px-4"
      >
        <div className="mx-auto max-w-sm rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {data.title}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {data.options.map((option, i) => (
              <Button
                key={option.value ?? i}
                variant="outline"
                size="sm"
                className="rounded-full bg-background/50 hover:bg-primary hover:text-primary-foreground"
                onClick={() => onSelect(option.label, option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { useDataChannel } from "@livekit/components-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getBankAccountsQueryKey,
  getBillsQueryKey,
  getBudgetQueryKey,
  getTransactionsQueryKey,
} from "@/gen/api/@tanstack/react-query.gen";

const MUTATION_TOOLS = new Set(["pay_bill", "execute_transfer"]);

export type VoiceToolCall = {
  toolName: string;
  input: Record<string, unknown>;
};

export function useVoiceToolState() {
  const [currentTool, setCurrentTool] = useState<VoiceToolCall | null>(null);
  const queryClient = useQueryClient();

  useDataChannel((msg) => {
    try {
      const event = JSON.parse(new TextDecoder().decode(msg.payload));
      if (event.event === "tool_start") {
        setCurrentTool({ toolName: event.tool, input: event.input ?? {} });
      } else if (event.event === "tool_end") {
        if (MUTATION_TOOLS.has(event.tool)) {
          queryClient.invalidateQueries({ queryKey: getBankAccountsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getBillsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getBudgetQueryKey() });
          queryClient.invalidateQueries({ queryKey: getTransactionsQueryKey() });
        }
        setCurrentTool(null);
      }
    } catch {
      // malformed message — ignore
    }
  });

  return { currentTool };
}

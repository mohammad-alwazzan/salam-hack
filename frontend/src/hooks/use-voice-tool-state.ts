"use client";

import { useRoomContext } from "@livekit/components-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getBankAccountsQueryKey,
  getBillsQueryKey,
  getBudgetQueryKey,
  getTransactionsQueryKey,
} from "@/gen/api/@tanstack/react-query.gen";

const MUTATION_TOOLS = new Set(["pay_bill", "execute_transfer", "log_transaction"]);

export type VoiceToolCall = {
  toolName: string;
  input: Record<string, unknown>;
};

export function useVoiceToolState() {
  const [currentTool, setCurrentTool] = useState<VoiceToolCall | null>(null);
  const queryClient = useQueryClient();
  const room = useRoomContext();

  useEffect(() => {
    room.registerRpcMethod("tool_event", async (data) => {
      try {
        const event = JSON.parse(data.payload);
        if (event.event === "tool_start") {
          console.log(`[Mizan Tool ▶] ${event.tool}`, event.input ?? {});
          setCurrentTool({ toolName: event.tool, input: event.input ?? {} });
        } else if (event.event === "tool_end") {
          console.log(`[Mizan Tool ✓] ${event.tool}`, event.result ?? {});
          if (MUTATION_TOOLS.has(event.tool)) {
            queryClient.invalidateQueries({ queryKey: getBankAccountsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getBillsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getBudgetQueryKey() });
            queryClient.invalidateQueries({ queryKey: getTransactionsQueryKey() });
          }
          setCurrentTool(null);
        }
      } catch {
        // malformed payload — ignore
      }
      return "{}";
    });

    return () => {
      room.unregisterRpcMethod("tool_event");
    };
  }, [room, queryClient]);

  return { currentTool };
}

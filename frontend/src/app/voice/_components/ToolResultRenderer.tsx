"use client";

import type { AgentToolCall } from "@/hooks/use-agent-chat";
import { Loader2, Settings2 } from "lucide-react";

function formatToolName(toolName: string) {
  return toolName.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
}

function summarizeInput(tool: AgentToolCall) {
  if (tool.toolName === "showOptions") {
    return `Waiting for selection: ${tool.input.title}`;
  }
  if (tool.toolName === "checkPurchaseImpact") {
    return `Amount: ${tool.input.amount.toLocaleString()} USD`;
  }
  if (tool.toolName === "logTransaction") {
    return `${tool.input.description} · ${tool.input.amount.toLocaleString()} USD`;
  }
  if (tool.toolName === "payBill") {
    return `Bill #${tool.input.billId} via account #${tool.input.bankAccountId}`;
  }
  if (tool.toolName === "executeTransfer") {
    return `${tool.input.amount.toLocaleString()} USD to ${tool.input.recipient}`;
  }
  return "Processing...";
}

export function ToolResultRenderer({ currentTool }: { currentTool: AgentToolCall | null }) {
  if (!currentTool) return null;

  return (
    <div className="mx-auto mb-3 w-full max-w-sm rounded-xl border border-border/70 bg-card/95 px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium text-foreground">
        <Settings2 className="size-3.5" />
        {formatToolName(currentTool.toolName)}
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        <span className="truncate">{summarizeInput(currentTool)}</span>
      </div>
    </div>
  );
}

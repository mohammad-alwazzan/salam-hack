"use client";

import { useBankAccounts } from "@/hooks/use-bank-accounts";
import { useBudget } from "@/hooks/use-budget";
import { motion } from "motion/react";
import { Wallet, TrendingDown, AlertCircle } from "lucide-react";

export function FinancialStrip() {
  const { accounts } = useBankAccounts();
  const { budget } = useBudget();

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const totalSpent = budget?.categories.reduce((acc: number, curr: any) => acc + curr.spent, 0) || 0;

  return (
    <div className="flex items-center gap-6 px-6 py-2 overflow-x-auto no-scrollbar border-b border-border/40 bg-muted/30">
      <div className="flex items-center gap-2 shrink-0">
        <Wallet className="size-3.5 text-muted-foreground" />
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Balance:</span>
        <span className="text-[11px] font-bold">{totalBalance.toLocaleString()} USD</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <TrendingDown className="size-3.5 text-muted-foreground" />
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Spent:</span>
        <span className="text-[11px] font-bold">{totalSpent.toLocaleString()} USD</span>
      </div>
      {/* Could add alerts here too */}
    </div>
  );
}

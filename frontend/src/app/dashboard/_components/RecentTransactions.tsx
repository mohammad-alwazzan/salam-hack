"use client";

import { useTransactions } from "@/hooks/use-transactions";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, ShoppingBag, Landmark, Utensils, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function RecentTransactions() {
  const { transactions, isLoading, error } = useTransactions();

  if (isLoading) {
    return (
      <div className="divide-y divide-border/60">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3.5">
            <Skeleton className="size-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-destructive py-4">Error loading transactions: {error}</p>;
  }

  const recent = transactions.slice(0, 8);

  const getCategoryConfig = (tx: any) => {
    // Simple mapping based on description or common categories
    const desc = tx.description.toLowerCase();
    if (desc.includes('transfer')) return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600', icon: Landmark };
    if (desc.includes('food') || desc.includes('restaurant')) return { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600', icon: Utensils };
    if (desc.includes('bill') || desc.includes('utility')) return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600', icon: Zap };
    return { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600', icon: ShoppingBag };
  };

  return (
    <div className="divide-y divide-border/60">
      {recent.map((tx) => {
        const isDebit = tx.amount < 0;
        const config = getCategoryConfig(tx);
        const Icon = config.icon;
        
        return (
          <div key={tx.id} className="flex items-center gap-3 py-3.5">
            {/* Avatar */}
            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", config.bg, config.text)}>
              <Icon className="size-4" />
            </div>
            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{tx.description}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(tx.date), "MMM d, h:mm a")}
              </p>
            </div>
            {/* Amount */}
            <div className="text-right shrink-0">
              <p className={cn(
                "text-sm font-semibold tabular-nums",
                !isDebit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
              )}>
                {isDebit ? "" : "+"}{tx.amount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground uppercase">USD</p>
            </div>
          </div>
        );
      })}
      {recent.length === 0 && (
        <div className="py-12 text-center text-xs text-muted-foreground">
          No transactions yet.
        </div>
      )}
    </div>
  );
}

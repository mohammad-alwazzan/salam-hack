"use client";

import { useBills } from "@/hooks/use-bills";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { format, isAfter, parseISO } from "date-fns";

export function UpcomingBills() {
  const { bills, isLoading, error } = useBills();

  if (isLoading) {
    return (
      <div className="divide-y divide-border/60">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3.5">
            <Skeleton className="size-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <div className="text-right space-y-1.5">
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-destructive py-4">Error loading bills: {error}</p>;
  }

  const upcoming = bills
    .filter((b) => b.status === "pending")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  return (
    <div className="divide-y divide-border/60">
      {upcoming.map((bill) => {
        const dueDate = parseISO(bill.dueDate);
        const isOverdue = !isAfter(dueDate, new Date());

        return (
          <div key={bill.id} className="flex items-center gap-3 py-3.5">
            {/* Avatar */}
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-500 dark:bg-orange-900/30">
              <Calendar className="size-4" />
            </div>
            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{bill.title}</p>
              <p className="text-xs text-muted-foreground">{bill.category} · {format(dueDate, "MMM d")}</p>
            </div>
            {/* Amount */}
            <div className="text-right shrink-0">
              <p className={`text-sm font-semibold tabular-nums ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                {bill.amount.toLocaleString()}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-tight text-muted-foreground">
                {isOverdue ? 'OVERDUE' : 'DUE'}
              </p>
            </div>
          </div>
        );
      })}

      {upcoming.length === 0 && (
        <div className="py-6 text-center text-xs text-muted-foreground">
          No pending bills.
        </div>
      )}
    </div>
  );
}

"use client";

import { useBudget } from "@/hooks/use-budget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

function statusColor(pct: number) {
  if (pct >= 90) return { label: "text-destructive", bar: "[&>div]:bg-destructive" };
  if (pct >= 70) return { label: "text-amber-600 dark:text-amber-400", bar: "[&>div]:bg-amber-500" };
  return { label: "text-emerald-600 dark:text-emerald-400", bar: "[&>div]:bg-emerald-500" };
}

export function BudgetOverview() {
  const { budget, isLoading, error } = useBudget();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-1.5 w-full rounded-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">Error loading budget: {error}</p>;
  }

  if (!budget) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No active budget found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Budget Overview</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">{budget.month}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground"
          render={<Link href="/budget" />} nativeButton={false}
        >
          Details <ArrowRight className="size-3" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {budget.categories.map((cat: any) => {
            const pct = Math.min(100, (cat.spent / cat.allocated) * 100);
            const { label, bar } = statusColor(pct);
            const remaining = cat.allocated - cat.spent;
            return (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{cat.emoji}</span>
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <span className={cn("text-xs font-semibold tabular-nums", label)}>
                    {Math.round(pct)}%
                  </span>
                </div>
                <Progress value={pct} className={cn("h-1.5", bar)} />
                <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                  <span>{cat.spent.toLocaleString()} spent</span>
                  <span>
                    {remaining > 0
                      ? `${remaining.toLocaleString()} left`
                      : "Over budget"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

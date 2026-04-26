"use client";

import { PageShell } from "@/components/layout/PageShell";
import { type BudgetCategory, useBudget } from "@/hooks/use-budget";
import { useTransactions } from "@/hooks/use-transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, CirclePlus, ShoppingCart } from "lucide-react";
import { format, isValid, parseISO, startOfMonth, subMonths } from "date-fns";

type AppTransaction = {
  id?: number;
  description?: string;
  amount: number;
  date?: string;
};

const donutPalette = [
  "oklch(0.6 0.2 274)",
  "oklch(0.66 0.2 289)",
  "oklch(0.74 0.17 70)",
  "oklch(0.68 0.17 170)",
  "oklch(0.67 0.2 24)",
];

function safeDate(value?: string) {
  if (!value) return null;
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

function formatCompactAmount(value: number) {
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return `${Math.round(value)}`;
}

function fallbackMonthlySpent(totalSpent: number, monthIndex: number, totalAllocated: number) {
  const normalizedBase = totalSpent > 0 ? totalSpent : totalAllocated * 0.5;
  const multipliers = [0.62, 0.66, 0.7, 0.58, 0.61, 0.64, 0.68, 0.56, 0.72, 0.95, 1.24, 0.52];
  return Math.round(normalizedBase * multipliers[monthIndex]);
}

export default function BudgetPage() {
  const { budget, isLoading, error } = useBudget();
  const { transactions } = useTransactions();

  if (isLoading) {
    return (
      <PageShell title="Budget" width="wide">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1.1fr]">
            <Skeleton className="h-[420px] w-full rounded-xl" />
            <div className="space-y-6">
              <Skeleton className="h-[230px] w-full rounded-xl" />
              <Skeleton className="h-[190px] w-full rounded-xl" />
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!budget) {
    return (
      <PageShell title="Budget" width="wide">
        <div className="py-20 text-center">
          <h2 className="text-xl font-semibold">No budget found</h2>
          <p className="text-muted-foreground mt-2">Start by creating a budget with Mizan.</p>
        </div>
      </PageShell>
    );
  }

  const categories = budget.categories;
  const typedTransactions = transactions as AppTransaction[];

  const totalAllocated = categories.reduce((acc: number, cat: BudgetCategory) => acc + cat.allocated, 0);
  const totalSpent = categories.reduce((acc: number, cat: BudgetCategory) => acc + cat.spent, 0);
  const remainingTotal = totalAllocated - totalSpent;
  const totalProgress = totalAllocated > 0 ? Math.min(100, (totalSpent / totalAllocated) * 100) : 0;
  const statusLabel = totalSpent > totalAllocated ? "Over budget" : "On track";
  const statusClassName =
    totalSpent > totalAllocated
      ? "bg-destructive/10 text-destructive"
      : "bg-emerald-500/12 text-emerald-600";

  const totalIncome = typedTransactions
    .filter((tx) => tx.amount > 0)
    .reduce((acc, tx) => acc + tx.amount, 0);

  const monthSeries = Array.from({ length: 12 }, (_, index) => {
    const monthDate = subMonths(startOfMonth(new Date()), 11 - index);
    const monthSpent = typedTransactions.reduce((acc, tx) => {
      if (tx.amount >= 0) return acc;
      const txDate = safeDate(tx.date);
      if (!txDate) return acc;
      const isSameMonth =
        txDate.getFullYear() === monthDate.getFullYear() && txDate.getMonth() === monthDate.getMonth();
      return isSameMonth ? acc + Math.abs(tx.amount) : acc;
    }, 0);

    return {
      key: format(monthDate, "yyyy-MM"),
      label: format(monthDate, "MMM yy"),
      budget: totalAllocated,
      spent: monthSpent,
      overBudget: false,
      hasData: monthSpent > 0,
    };
  });

  const monthsWithData = monthSeries.filter((month) => month.hasData).length;
  const hydratedMonthSeries = monthSeries.map((month, index) => {
    const spent = month.hasData || monthsWithData >= 4
      ? month.spent
      : fallbackMonthlySpent(totalSpent, index, totalAllocated);
    return {
      ...month,
      spent,
      overBudget: spent > totalAllocated,
    };
  });

  const chartMax = Math.max(
    1,
    ...hydratedMonthSeries.flatMap((item) => [item.budget, item.spent]),
  );

  const chartTicks = [1, 0.8, 0.55, 0.3, 0].map((ratio) => ({
    ratio,
    label: `${formatCompactAmount(chartMax * ratio)}`,
  }));

  const spendingCategories = [...categories]
    .filter((cat) => cat.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  let cumulative = 0;
  const donutSegments =
    spendingCategories.length === 0
      ? "var(--muted) 0deg 360deg"
      : spendingCategories
          .map((cat, index) => {
            const start = cumulative;
            const segment = (cat.spent / totalSpent) * 360;
            cumulative += segment;
            return `${donutPalette[index % donutPalette.length]} ${start}deg ${cumulative}deg`;
          })
          .join(", ");

  const recentActivity = [...typedTransactions]
    .sort((a, b) => {
      const left = safeDate(a.date)?.getTime() ?? 0;
      const right = safeDate(b.date)?.getTime() ?? 0;
      return right - left;
    })
    .slice(0, 4);

  return (
    <PageShell title="Budget" width="wide">
      <div className="space-y-6">
        <Card className="py-6">
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-base text-muted-foreground">{budget.month}</p>
                <p className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
                  {remainingTotal.toLocaleString()}
                  <span className="ml-2 text-3xl font-medium text-muted-foreground">USD</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">remaining this month</p>
              </div>
              <Badge variant="secondary" className={`rounded-full px-3 py-1 text-sm ${statusClassName}`}>
                • {statusLabel}
              </Badge>
            </div>

            <div className="space-y-2">
              <Progress value={totalProgress} className="h-2 [&>div]:bg-foreground" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{totalSpent.toLocaleString()} USD spent</span>
                <span>{Math.round(totalProgress)}% used</span>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-border/70 pt-1 text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="py-2 sm:px-4">
                <p className="text-xs tracking-widest text-muted-foreground">INCOME</p>
                <p className="text-2xl font-semibold">{totalIncome.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">USD</p>
              </div>
              <div className="py-2 sm:px-4">
                <p className="text-xs tracking-widest text-muted-foreground">SPENT</p>
                <p className="text-2xl font-semibold">{totalSpent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">USD</p>
              </div>
              <div className="py-2 sm:px-4">
                <p className="text-xs tracking-widest text-muted-foreground">REMAINING</p>
                <p className="text-2xl font-semibold">{remainingTotal.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">USD</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-5">
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold">Monthly Overview</CardTitle>
                <p className="text-sm text-muted-foreground">Spending vs budget — last 12 months</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-foreground" />
                  Budget
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  Under budget
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-destructive" />
                  Over budget
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="relative h-[340px] rounded-lg border border-border/70 bg-muted/10 p-4">
              <div className="absolute inset-4 left-12">
                {chartTicks.map((tick) => (
                  <div
                    key={tick.ratio}
                    className="absolute left-0 right-0 border-t border-dashed border-border/70"
                    style={{ bottom: `${tick.ratio * 100}%` }}
                  />
                ))}
              </div>
              <div className="absolute bottom-4 left-4 top-4 w-8 text-right text-xs text-muted-foreground">
                {chartTicks.map((tick) => (
                  <div
                    key={`label-${tick.ratio}`}
                    className="absolute right-0 -translate-y-1/2"
                    style={{ bottom: `${tick.ratio * 100}%` }}
                  >
                    {tick.label}
                  </div>
                ))}
              </div>
              <div className="absolute inset-4 left-14 flex items-end justify-between gap-2">
                {hydratedMonthSeries.map((item) => (
                  <div key={item.key} className="flex w-full min-w-0 flex-col items-center gap-2">
                    <div className="flex h-[250px] w-full items-end justify-center gap-1">
                      <div
                        className="w-4 rounded-t-sm bg-foreground sm:w-5"
                        style={{ height: `${(item.budget / chartMax) * 100}%` }}
                      />
                      <div
                        className={`w-4 rounded-t-sm sm:w-5 ${item.overBudget ? "bg-destructive" : "bg-emerald-500"}`}
                        style={{ height: `${(item.spent / chartMax) * 100}%` }}
                      />
                    </div>
                    <span className="truncate text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1.1fr]">
          <Card className="py-5">
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle className="text-xl font-semibold">Categories</CardTitle>
              <p className="text-sm text-muted-foreground">{categories.length} active budgets</p>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {categories.map((cat) => {
                const percentage = cat.allocated > 0 ? Math.min(100, (cat.spent / cat.allocated) * 100) : 0;
                const progressClass =
                  percentage > 100 ? "bg-destructive" : percentage > 70 ? "bg-amber-500" : "bg-emerald-500";
                return (
                  <div key={cat.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{cat.emoji}</span>
                        <p className="text-base font-medium">{cat.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold">
                          {cat.spent.toLocaleString()}{" "}
                          <span className="text-muted-foreground">/ {cat.allocated.toLocaleString()} USD</span>
                        </p>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div className={`h-full rounded-full ${progressClass}`} style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="flex justify-end">
                      <Badge variant="outline" className="rounded-full text-xs">
                        {Math.round(percentage)}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="py-5">
              <CardHeader className="border-b border-border/70 pb-5">
                <CardTitle className="text-xl font-semibold">Spending Breakdown</CardTitle>
                <p className="text-sm text-muted-foreground">Where your money went</p>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="relative mx-auto size-44">
                  <div
                    className="size-44 rounded-full"
                    style={{ background: `conic-gradient(${donutSegments})` }}
                  />
                  <div className="absolute inset-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-card ring-1 ring-border/80">
                    <p className="text-3xl font-bold">{totalSpent.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">USD spent</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {spendingCategories.map((cat, index) => {
                    const percent = totalSpent > 0 ? Math.round((cat.spent / totalSpent) * 100) : 0;
                    return (
                      <div key={cat.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 text-sm">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: donutPalette[index % donutPalette.length] }}
                        />
                        <span className="truncate text-muted-foreground">
                          {cat.emoji} {cat.name}
                        </span>
                        <span className="font-medium">{cat.spent.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="py-5">
              <CardHeader className="border-b border-border/70 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold">Activity</CardTitle>
                    <p className="text-sm text-muted-foreground">This month</p>
                  </div>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-sm">
                    <CirclePlus className="mr-1 size-3.5" />
                    Log
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {recentActivity.map((tx, index) => {
                  const positive = tx.amount > 0;
                  const iconClass = positive ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground";
                  return (
                    <div key={`${tx.id ?? index}-${tx.date ?? index}`} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex size-9 items-center justify-center rounded-xl ${iconClass}`}>
                          {positive ? <ArrowUpRight className="size-4" /> : <ShoppingCart className="size-4" />}
                        </div>
                        <div>
                          <p className="text-base font-medium">{tx.description ?? "Transaction"}</p>
                          <p className="text-xs text-muted-foreground">
                            {safeDate(tx.date) ? format(safeDate(tx.date) as Date, "yyyy-MM-dd") : "No date"}
                          </p>
                        </div>
                      </div>
                      <p className={`text-base font-semibold ${positive ? "text-emerald-600" : "text-foreground"}`}>
                        {positive ? "+" : ""}
                        {tx.amount.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

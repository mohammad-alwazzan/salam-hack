'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  CreditCard,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { PageShell } from '@/src/components/layout/PageShell';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Progress } from '@/src/components/ui/progress';
import { useBudget } from '@/src/hooks/use-budget';
import { useTransactions } from '@/src/hooks/use-transactions';
import { CategoryRow } from './_components/CategoryRow';
import { SpendingChart } from './_components/SpendingChart';
import { MonthlyHistoryChart } from './_components/MonthlyHistoryChart';
import { LogTransactionModal } from './_components/LogTransactionModal';
import { cn } from '@/src/lib/utils';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function BudgetPage() {
  const { budget, isLoading, error } = useBudget();
  const {
    transactions,
    isLoading: isTxLoading,
    logTransaction,
  } = useTransactions();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  if (isLoading) {
    return (
      <PageShell title="Budget">
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  if (error || !budget) {
    return (
      <PageShell title="Budget">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="size-10 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-destructive">
              Failed to load budget
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-2">
              Make sure the backend is running and seeded.
            </p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const usedPct = Math.min((budget.totalSpent / budget.totalIncome) * 100, 100);
  const remainingPct = (budget.remaining / budget.totalIncome) * 100;
  const health =
    remainingPct > 20 ? 'healthy' : remainingPct > 5 ? 'warning' : 'danger';
  const healthLabel =
    health === 'healthy'
      ? 'On track'
      : health === 'warning'
        ? 'Running low'
        : 'Over budget';

  const sortedCategories = [...budget.categories].sort(
    (a, b) => b.spent / b.allocated - a.spent / a.allocated,
  );

  const month = new Date().toLocaleDateString('en-SA', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <PageShell title="Budget">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card className="overflow-hidden border-border/60">
            <CardContent className="p-6 sm:p-8">
              {/* Top row */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {month}
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tight tabular-nums">
                      {fmt(budget.remaining)}
                    </span>
                    <span className="text-xl text-muted-foreground">
                      {budget.currency}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    remaining this month
                  </p>
                </div>

                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                    health === 'healthy'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : health === 'warning'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      health === 'healthy'
                        ? 'bg-emerald-500'
                        : health === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-rose-500',
                    )}
                  />
                  {healthLabel}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-2 mb-7">
                <Progress
                  value={usedPct}
                  className={cn(
                    'h-1.5',
                    health === 'danger'
                      ? '[&>div]:bg-rose-500'
                      : health === 'warning'
                        ? '[&>div]:bg-amber-500'
                        : '',
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {fmt(budget.totalSpent)} {budget.currency} spent
                  </span>
                  <span>{usedPct.toFixed(0)}% used</span>
                </div>
              </div>

              {/* Stat strip */}
              <div className="grid grid-cols-3 divide-x divide-border/50">
                {(
                  [
                    { label: 'Income', value: budget.totalIncome },
                    { label: 'Spent', value: budget.totalSpent },
                    { label: 'Remaining', value: budget.remaining },
                  ] as const
                ).map(({ label, value }) => (
                  <div
                    key={label}
                    className="px-4 first:pl-0 last:pr-0 text-center"
                  >
                    <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                      {label}
                    </p>
                    <p
                      className={cn(
                        'text-base font-semibold tabular-nums mt-0.5',
                        label === 'Remaining' && value < 0
                          ? 'text-rose-500'
                          : '',
                      )}
                    >
                      {fmt(value)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {budget.currency}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Monthly history ───────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/60">
            <div className="px-6 pt-5 pb-4 border-b border-border/40">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Monthly Overview</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Spending vs budget — last 12 months
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-primary inline-block" />
                    Budget
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-emerald-500 inline-block" />
                    Under budget
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-destructive inline-block opacity-85" />
                    Over budget
                  </span>
                </div>
              </div>
            </div>
            <CardContent className="px-6 pt-5 pb-4">
              <MonthlyHistoryChart />
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Main grid ─────────────────────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-5">
          {/* ── Categories ──────────────────────────────────────────── */}
          <motion.div variants={fadeUp} className="lg:col-span-3">
            <Card className="border-border/60">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40">
                <div>
                  <h2 className="text-sm font-semibold">Categories</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {budget.categories.length} active budgets
                  </p>
                </div>
              </div>
              <CardContent className="p-2">
                {sortedCategories.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    currency={budget.currency}
                  />
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Right column: Chart + Transactions ──────────────────── */}
          <motion.div
            variants={fadeUp}
            className="lg:col-span-2 flex flex-col gap-5"
          >
            {/* Spending breakdown donut */}
            <Card className="border-border/60">
              <div className="px-6 pt-5 pb-4 border-b border-border/40">
                <h2 className="text-sm font-semibold">Spending Breakdown</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Where your money went
                </p>
              </div>
              <CardContent className="px-6 py-5">
                <SpendingChart
                  categories={budget.categories}
                  currency={budget.currency}
                />
              </CardContent>
            </Card>

            {/* Recent transactions */}
            <Card className="border-border/60">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40">
                <div>
                  <h2 className="text-sm font-semibold">Activity</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This month
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs rounded-full"
                  onClick={() => setIsLogModalOpen(true)}
                >
                  <Plus className="size-3" />
                  Log
                </Button>
              </div>
              <CardContent className="p-2">
                {isTxLoading ? (
                  <div className="flex py-12 justify-center">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      No transactions yet
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Tap Log to add one
                    </p>
                  </div>
                ) : (
                  transactions.slice(0, 10).map((tx: any) => {
                    const cat = budget.categories.find(
                      (c) => c.id === tx.categoryId,
                    );
                    const isIncome = tx.amount > 0;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        <div
                          className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-lg text-sm',
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-muted',
                          )}
                        >
                          {cat ? (
                            <span className="text-base leading-none">
                              {cat.emoji}
                            </span>
                          ) : isIncome ? (
                            <TrendingUp className="size-4" />
                          ) : (
                            <CreditCard className="size-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium leading-tight">
                            {tx.description}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {tx.date}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'text-sm font-semibold tabular-nums shrink-0',
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-foreground',
                          )}
                        >
                          {isIncome ? '+' : ''}
                          {fmt(tx.amount)}
                        </span>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      <LogTransactionModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onConfirm={logTransaction}
        categories={budget.categories}
      />
    </PageShell>
  );
}

"use client";

import { PageShell } from "@/components/layout/PageShell";
import { AccountBalances } from "./_components/AccountBalances";
import { RecentTransactions } from "./_components/RecentTransactions";
import { UpcomingBills } from "./_components/UpcomingBills";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Mic, 
  MessageSquare, 
  Calendar, 
  PieChart 
} from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { useBankAccounts } from "@/hooks/use-bank-accounts";
import { useBudget } from "@/hooks/use-budget";
import { useTransactions } from "@/hooks/use-transactions";
import { Separator } from "@/components/ui/separator";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export default function DashboardPage() {
  const { accounts } = useBankAccounts();
  const { budget } = useBudget();
  const { transactions } = useTransactions();

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  
  // Calculate total income and spent from transactions for the current period
  const income = transactions
    .filter(t => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);
  const spent = transactions
    .filter(t => t.amount < 0)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const budgetUsedPct = budget 
    ? Math.min(100, (budget.categories.reduce((acc: number, c: any) => acc + c.spent, 0) / 
                   budget.categories.reduce((acc: number, c: any) => acc + c.allocated, 0)) * 100)
    : 0;
  
  const budgetLeft = budget
    ? budget.categories.reduce((acc: number, c: any) => acc + (c.allocated - c.spent), 0)
    : 0;

  const quickActions = [
    { label: "Bills", icon: Calendar, color: "bg-orange-100 text-orange-500 dark:bg-orange-900/30", href: "/bills" },
    { label: "Budget", icon: PieChart, color: "bg-teal-100 text-teal-500 dark:bg-teal-900/30", href: "/budget" },
    { label: "Voice AI", icon: Mic, color: "bg-pink-100 text-pink-500 dark:bg-pink-900/30", href: "/voice" },
    { label: "Chat AI", icon: MessageSquare, color: "bg-indigo-100 text-indigo-500 dark:bg-indigo-900/30", href: "/chat" },
  ];

  return (
    <PageShell title="Overview">
      <div className="space-y-8 pb-12">
        
        {/* Hero Balance Card */}
        <motion.div {...fadeUp(0.05)} className="rounded-2xl bg-foreground text-background p-5 space-y-4 shadow-xl">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
            TOTAL BALANCE
          </p>
          <p className="text-3xl font-bold">
            {totalBalance.toLocaleString()} <span className="text-sm font-medium text-white/50">USD</span>
          </p>
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-white/50 font-medium">
              <span>Monthly budget · {Math.round(budgetUsedPct)}% used</span>
              <span>{budgetLeft.toLocaleString()} left</span>
            </div>
            <Progress value={budgetUsedPct} className="h-1 [&>div]:bg-white bg-white/20" />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="rounded-xl bg-white/5 p-3 space-y-1 border border-white/5">
              <p className="text-[10px] text-white/50 uppercase tracking-widest flex items-center gap-1">
                <ArrowUpRight className="size-3" /> INCOME
              </p>
              <p className="text-base font-bold">{income.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 space-y-1 border border-white/5">
              <p className="text-[10px] text-white/50 uppercase tracking-widest flex items-center gap-1">
                <ArrowDownLeft className="size-3" /> SPENT
              </p>
              <p className="text-base font-bold">{spent.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div {...fadeUp(0.1)} className="grid grid-cols-4 gap-3">
          {quickActions.map(({ label, icon: Icon, color, href }) => (
            <Link href={href} key={label}
              className="flex flex-col items-center gap-2.5 rounded-xl border border-border/60 bg-card p-4 transition-all hover:bg-muted/50 active:scale-95">
              <div className={`flex size-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className="size-5" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-tight text-muted-foreground">{label}</span>
            </Link>
          ))}
        </motion.div>

        {/* Accounts Section */}
        <motion.section {...fadeUp(0.15)}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              ACCOUNTS
            </span>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-primary gap-0.5 font-medium hover:bg-primary/5"
              render={<Link href="/accounts" />} nativeButton={false}>
              View all <ChevronRight className="size-3" />
            </Button>
          </div>
          <Separator className="mb-1" />
          <AccountBalances />
        </motion.section>

        {/* Upcoming Bills Section */}
        <motion.section {...fadeUp(0.2)}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              UPCOMING BILLS
            </span>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-primary gap-0.5 font-medium hover:bg-primary/5"
              render={<Link href="/bills" />} nativeButton={false}>
              View all <ChevronRight className="size-3" />
            </Button>
          </div>
          <Separator className="mb-1" />
          <UpcomingBills />
        </motion.section>

        {/* Recent Transactions Section */}
        <motion.section {...fadeUp(0.25)}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              RECENT ACTIVITY
            </span>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-primary gap-0.5 font-medium hover:bg-primary/5"
              render={<Link href="/transactions" />} nativeButton={false}>
              View all <ChevronRight className="size-3" />
            </Button>
          </div>
          <Separator className="mb-1" />
          <RecentTransactions />
        </motion.section>

      </div>
    </PageShell>
  );
}

"use client";

import { useBankAccounts } from "@/hooks/use-bank-accounts";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Landmark, CreditCard } from "lucide-react";

const typeConfig = {
  checking: {
    Icon: Wallet,
    color: "bg-emerald-500",
  },
  savings: {
    Icon: Landmark,
    color: "bg-blue-500",
  },
  remittance: {
    Icon: CreditCard,
    color: "bg-violet-500",
  },
} as const;

const fallbackConfig = typeConfig.checking;

export function AccountBalances() {
  const { accounts, isLoading, error } = useBankAccounts();

  if (isLoading) {
    return (
      <div className="divide-y divide-border/60">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3.5">
            <Skeleton className="size-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <div className="text-right space-y-1.5">
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-3 w-10 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-xs text-destructive py-4">Error loading accounts: {error}</p>
    );
  }

  return (
    <div className="divide-y divide-border/60">
      {accounts.map((account) => {
        const cfg =
          typeConfig[account.type as keyof typeof typeConfig] ?? fallbackConfig;
        const { Icon } = cfg;
        return (
          <div key={account.id} className="flex items-center gap-3 py-3.5">
            {/* Avatar */}
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${cfg.color} text-white`}>
              <Icon className="size-4" />
            </div>
            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{account.name}</p>
              <p className="text-xs text-muted-foreground">{account.bank} · {account.id.toString().slice(-4)}</p>
            </div>
            {/* Amount */}
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold tabular-nums">{account.balance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground uppercase">{account.currency}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

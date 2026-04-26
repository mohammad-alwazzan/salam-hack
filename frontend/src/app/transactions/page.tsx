"use client";

import { PageShell } from "@/components/layout/PageShell";
import { useTransactions } from "@/hooks/use-transactions";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function TransactionsPage() {
  const { transactions, isLoading, error } = useTransactions();
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <PageShell title="Transactions">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-md" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </PageShell>
    );
  }

  const filtered = transactions.filter(tx => 
    tx.description.toLowerCase().includes(search.toLowerCase()) ||
    (tx.category && tx.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PageShell title="Transactions">
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search transactions..." 
            className="pl-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {filtered.map((tx) => (
            <Card key={tx.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className={`flex size-10 items-center justify-center rounded-full ${tx.amount < 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                    {tx.amount < 0 ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}
                  </div>
                  <div>
                    <div className="font-medium">{tx.description}</div>
                    <div className="text-xs text-muted-foreground">{format(parseISO(tx.date), 'MMMM d, yyyy • h:mm a')}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${tx.amount < 0 ? 'text-destructive' : 'text-success'}`}>
                    {tx.amount < 0 ? '' : '+'}{tx.amount.toLocaleString()} USD
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tx.source.toUpperCase()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              No transactions found.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

"use client";

import { PageShell } from "@/components/layout/PageShell";
import { useBills } from "@/hooks/use-bills";
import { useBankAccounts } from "@/hooks/use-bank-accounts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar, Plus, Wallet } from "lucide-react";
import { format, isAfter, parseISO } from "date-fns";
import { useState } from "react";
import { AddBillModal } from "./_components/AddBillModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BillsPage() {
  const { bills, isLoading, payBill } = useBills();
  const { accounts } = useBankAccounts();
  const [payingBill, setPayingBill] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const handlePay = async () => {
    if (!payingBill || !selectedAccount) return;
    setIsSubmitting(true);
    const result = await payBill(payingBill.id, parseInt(selectedAccount));
    setIsSubmitting(false);
    if (result.success) {
      setPayingBill(null);
      setSelectedAccount("");
    } else {
      alert(result.error);
    }
  };

  if (isLoading) {
    return (
      <PageShell title="Bills">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Bills">
      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              ALL BILLS
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {bills.filter((b) => b.status === "pending").length} pending
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-1.5 text-xs text-primary gap-0.5"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="size-3" /> Add Bill
              </Button>
            </div>
          </div>
          <Separator className="mb-1" />
          <div className="divide-y divide-border/60">
            {bills.map((bill) => {
              const isPending = bill.status === 'pending';
              const isOverdue = isPending && !isAfter(parseISO(bill.dueDate), new Date());
              
              const categoryMap: Record<string, { bg: string, text: string, icon: any }> = {
                'utilities': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600', icon: Calendar },
                'shopping': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600', icon: Wallet },
                'default': { bg: 'bg-primary/10', text: 'text-primary', icon: Calendar }
              };
              
              const cat = categoryMap[bill.category.toLowerCase()] || categoryMap.default;
              const Icon = cat.icon;

              return (
                <div key={bill.id} className="flex items-center gap-3 py-3.5">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${cat.bg} ${cat.text}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{bill.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {bill.category} · {format(parseISO(bill.dueDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold tabular-nums ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                      {bill.amount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{bill.currency}</span>
                    </p>
                    {isPending ? (
                      <button 
                        onClick={() => {
                          setPayingBill(bill);
                          if (accounts.length > 0) setSelectedAccount(accounts[0].id.toString());
                        }}
                        className="text-xs font-medium text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
                      >
                        Pay Now
                      </button>
                    ) : (
                      <p className="text-[10px] font-semibold uppercase tracking-tight text-emerald-600 dark:text-emerald-400">
                        PAID
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AddBillModal open={addOpen} onOpenChange={setAddOpen} />

      <Dialog open={!!payingBill} onOpenChange={(open) => !open && setPayingBill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Bill</DialogTitle>
            <DialogDescription>
              Confirm payment for <strong>{payingBill?.title}</strong> ({payingBill?.amount} {payingBill?.currency})
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Account</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a bank account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>
                      {acc.name} ({acc.balance.toLocaleString()} {acc.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayingBill(null)}>Cancel</Button>
            <Button onClick={handlePay} disabled={!selectedAccount || isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

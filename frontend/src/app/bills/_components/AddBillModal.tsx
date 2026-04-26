"use client";

import { useState } from "react";
import { useBills } from "@/hooks/use-bills";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Zap,
  Wifi,
  Phone,
  Home,
  Shield,
  Play,
  GraduationCap,
  Heart,
  Car,
  CreditCard,
  ShoppingBag,
  MoreHorizontal,
} from "lucide-react";

const CATEGORIES = [
  { label: "Utilities",      icon: Zap,            color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  { label: "Internet",       icon: Wifi,           color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  { label: "Phone",          icon: Phone,          color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" },
  { label: "Rent",           icon: Home,           color: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" },
  { label: "Insurance",      icon: Shield,         color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { label: "Subscriptions",  icon: Play,           color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" },
  { label: "Education",      icon: GraduationCap,  color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" },
  { label: "Healthcare",     icon: Heart,          color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  { label: "Transportation", icon: Car,            color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
  { label: "Credit Card",    icon: CreditCard,     color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  { label: "Shopping",       icon: ShoppingBag,    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
  { label: "Other",          icon: MoreHorizontal, color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
] as const;

type Category = typeof CATEGORIES[number]["label"];

interface FormState {
  title: string;
  amount: string;
  currency: string;
  dueDate: string;
  category: Category | "";
  description: string;
}

const EMPTY: FormState = {
  title: "",
  amount: "",
  currency: "USD",
  dueDate: "",
  category: "",
  description: "",
};

interface AddBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBillModal({ open, onOpenChange }: AddBillModalProps) {
  const { createBill } = useBills();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
  }

  async function handleSubmit() {
    if (!form.title.trim()) return setError("Bill name is required.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Enter a valid amount.");
    if (!form.dueDate) return setError("Due date is required.");
    if (!form.category) return setError("Select a category.");

    setIsSubmitting(true);
    const result = await createBill({
      title: form.title.trim(),
      amount: Number(form.amount),
      currency: form.currency,
      dueDate: new Date(form.dueDate).toISOString(),
      category: form.category,
      description: form.description.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.success) {
      setForm(EMPTY);
      onOpenChange(false);
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  }

  function handleClose() {
    setForm(EMPTY);
    setError(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Bill</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Bill Name
            </label>
            <Input
              placeholder="e.g. Electricity Bill"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          {/* Amount + Currency */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Amount
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                />
              </div>
              <select
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="USD">USD</option>
                <option value="JOD">JOD</option>
                <option value="SAR">SAR</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Due Date
            </label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </div>

          {/* Category grid */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(({ label, icon: Icon, color }) => {
                const selected = form.category === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => set("category", label)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all duration-150",
                      selected
                        ? "border-foreground/30 bg-muted ring-2 ring-foreground/20"
                        : "border-border/60 bg-card hover:bg-muted/60 hover:border-border"
                    )}
                  >
                    <div className={cn("flex size-8 items-center justify-center rounded-lg", color)}>
                      <Icon className="size-4" />
                    </div>
                    <span className="text-[10px] font-medium leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description (optional) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Notes{" "}
              <span className="normal-case tracking-normal font-normal">(optional)</span>
            </label>
            <Input
              placeholder="Any extra details…"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding…" : "Add Bill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

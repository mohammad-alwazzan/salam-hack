"use client";

import { motion } from "motion/react";
import { Receipt, Calendar, CreditCard, ChevronRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Bill = {
	id: number;
	title: string;
	description?: string | null;
	category: string;
	amount: number;
	currency?: string;
	dueDate: string;
	status: "pending" | "paid" | "overdue";
};

interface BillItemProps {
	bill: Bill;
	onPay: (bill: Bill) => void;
}

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-SA", {
		style: "decimal",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

function getStatusConfig(status: string) {
	switch (status) {
		case "paid":
			return {
				label: "Paid",
				icon: CheckCircle2,
				color: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
				badge: "secondary" as const,
			};
		case "overdue":
			return {
				label: "Overdue",
				icon: AlertCircle,
				color: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
				badge: "destructive" as const,
			};
		default:
			return {
				label: "Pending",
				icon: Clock,
				color: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
				badge: "outline" as const,
			};
	}
}

export function BillItem({ bill, onPay }: BillItemProps) {
	const statusConfig = getStatusConfig(bill.status);
	const StatusIcon = statusConfig.icon;

	return (
		<motion.div
			layout
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			className="group relative flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-md"
		>
			<div className={cn(
				"flex size-12 shrink-0 items-center justify-center rounded-xl",
				statusConfig.color
			)}>
				<Receipt className="size-6" />
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<h3 className="truncate text-base font-medium">{bill.title}</h3>
					<Badge variant={statusConfig.badge} className={cn("gap-1", statusConfig.color)}>
						<StatusIcon className="size-3" />
						{statusConfig.label}
					</Badge>
				</div>
				<div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
					<span className="flex items-center gap-1">
						<Calendar className="size-3" />
						Due {new Date(bill.dueDate).toLocaleDateString()}
					</span>
					{bill.description && (
						<span className="truncate">• {bill.description}</span>
					)}
				</div>
			</div>

			<div className="flex items-center gap-4">
				<div className="text-right">
					<p className="text-base font-semibold tabular-nums">
						{formatCurrency(bill.amount)}
					</p>
					<p className="text-[10px] text-muted-foreground uppercase">
						{bill.currency}
					</p>
				</div>
				
				{bill.status !== "paid" ? (
					<Button
						size="sm"
						onClick={() => onPay(bill)}
						className="cursor-pointer"
					>
						Pay Now
					</Button>
				) : (
					<div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
						<CheckCircle2 className="size-5" />
					</div>
				)}
			</div>
		</motion.div>
	);
}

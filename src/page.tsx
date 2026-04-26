"use client";

import { useState } from "react";
import { PageShell } from "@/src/components/layout/PageShell";
import { BillItem } from "./_components/BillItem";
import { PayBillModal } from "./_components/PayBillModal";
import { AddBillModal } from "./_components/AddBillModal";
import { useBills } from "@/src/hooks/use-bills";
import { Button } from "@/src/components/ui/button";
import { Plus, Receipt, Loader2, Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { PostBillsData } from "@/src/gen/api/types.gen";
import { cn } from "@/src/lib/utils";

type Bill = PostBillsData['body'] & { id: number };
type NewBill = PostBillsData['body'];

export default function BillsPage() {
	const { bills, isLoading, error, payBill, createBill, refresh } = useBills();
	const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");

	const filteredBills = bills.filter((bill) => {
		if (filter === "all") return true;
		return bill.status === filter;
	});

	const handlePayConfirm = async (bankAccountId: number) => {
		if (!selectedBill) return;
		const result = await payBill(selectedBill.id, bankAccountId);
		if (result.success) {
			setSelectedBill(null);
		} else {
			alert(result.error);
		}
	};

	const handleCreateConfirm = async (bill: NewBill) => {
		const result = await createBill(bill);
		if (!result.success) {
			alert(result.error);
		}
	};

	return (
		<PageShell title="Bills & Payments">
			<div className="space-y-6">
				{/* ── Actions & Filters ────────────────────────────────────── */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
						<Button
							variant={filter === "all" ? "default" : "outline"}
							size="sm"
							onClick={() => setFilter("all")}
							className="rounded-full h-8 px-4"
						>
							All
						</Button>
						<Button
							variant={filter === "pending" ? "default" : "outline"}
							size="sm"
							onClick={() => setFilter("pending")}
							className="rounded-full h-8 px-4"
						>
							Pending
						</Button>
						<Button
							variant={filter === "paid" ? "default" : "outline"}
							size="sm"
							onClick={() => setFilter("paid")}
							className="rounded-full h-8 px-4"
						>
							Paid
						</Button>
					</div>

					<Button 
						onClick={() => setIsAddModalOpen(true)}
						className="cursor-pointer gap-2 rounded-xl h-10 shadow-sm transition-all hover:shadow-md"
					>
						<Plus className="size-4" />
						Add New Bill
					</Button>
				</div>

				{/* ── Bill List ────────────────────────────────────────────── */}
				<div className="space-y-4">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-20 gap-3">
							<Loader2 className="size-8 animate-spin text-muted-foreground" />
							<p className="text-sm text-muted-foreground">Fetching your bills...</p>
						</div>
					) : error ? (
						<div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
							<p className="text-sm text-destructive">{error}</p>
							<Button variant="outline" size="sm" onClick={refresh}>
								Try Again
							</Button>
						</div>
					) : filteredBills.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 gap-4 text-center border-2 border-dashed border-border rounded-3xl">
							<div className="flex size-16 items-center justify-center rounded-full bg-muted">
								<Receipt className="size-8 text-muted-foreground" />
							</div>
							<div className="space-y-1">
								<p className="font-medium">No bills found</p>
								<p className="text-sm text-muted-foreground">
									{filter === "all" 
										? "You don't have any bills yet." 
										: `You don't have any ${filter} bills.`}
								</p>
							</div>
							<Button variant="outline" size="sm" onClick={() => setFilter("all")}>
								Clear Filters
							</Button>
						</div>
					) : (
						<motion.div 
							layout
							className="grid gap-3"
						>
							<AnimatePresence mode="popLayout">
								{filteredBills.map((bill) => (
									<BillItem 
										key={bill.id} 
										bill={bill} 
										onPay={(b) => setSelectedBill(b)} 
									/>
								))}
							</AnimatePresence>
						</motion.div>
					)}
				</div>
			</div>

			{/* ── Modals ─────────────────────────────────────────────────── */}
			<PayBillModal 
				bill={selectedBill}
				onClose={() => setSelectedBill(null)}
				onConfirm={handlePayConfirm}
			/>

			<AddBillModal 
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onConfirm={handleCreateConfirm}
			/>
		</PageShell>
	);
}

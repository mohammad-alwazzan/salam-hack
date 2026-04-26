import client from "@/src/api";
import type { Bill, NewBill } from "@worker/src/drizzle/schema/bills";

/**
 * Fetch all bills from the backend
 */
export async function fetchBills(): Promise<Bill[]> {
	const { data, error } = await client.api.bills.get();
	if (error) {
		console.error("Failed to fetch bills:", error);
		throw new Error(error.value?.message || "Failed to fetch bills");
	}
	return data || [];
}

/**
 * Create a new bill
 */
export async function createBill(bill: NewBill): Promise<Bill> {
	const { data, error } = await client.api.bills.post(bill);
	if (error) {
		console.error("Failed to create bill:", error);
		throw new Error(error.value?.message || "Failed to create bill");
	}
	return data;
}

/**
 * Pay a bill using a specific bank account
 */
export async function payBill(billId: number, bankAccountId: number): Promise<Bill> {
	const { data, error } = await client.api.bills({ id: String(billId) }).pay.post({
		bankAccountId,
	});
	
	if (error) {
		console.error("Failed to pay bill:", error);
		throw new Error((error.value as any)?.error || "Failed to pay bill");
	}
	
	return (data as any).bill;
}

import { billsRepository } from './bills.repository';
import { bankAccountsService } from '../bankAccounts/bankAccounts.service';
import { transactionsService } from '../transactions/transactions.service';
import { type NewBill } from '../../drizzle/schema/bills';

export const billsService = {
  async getAllBills() {
    return billsRepository.getAll();
  },

  async createBill(data: NewBill) {
    return billsRepository.create(data);
  },

  async payBill(id: number, bankAccountId: number) {
    const bill = await billsRepository.getById(id);
    if (!bill) throw new Error('Bill not found');
    if (bill.status === 'paid') throw new Error('Bill already paid');

    // 1. Check balance
    await bankAccountsService.checkBalance(bankAccountId, bill.amount);

    // 2. Mark bill as paid
    const updatedBill = await billsRepository.markPaid(id, bankAccountId);

    // 3. Log as transaction (this will update balance via transactionsService.createTransaction)
    await transactionsService.createTransaction({
      description: `Payment for bill: ${bill.title}`,
      amount: -bill.amount,
      bankAccountId,
      categoryId: bill.categoryId,
      source: 'manual',
      date: new Date().toISOString(),
    });

    return updatedBill;
  }
};

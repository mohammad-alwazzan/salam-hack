import { transactionsRepository } from './transactions.repository';
import { bankAccountsService } from '../bankAccounts/bankAccounts.service';
import { type NewTransaction } from '../../drizzle/schema/transactions';

export const transactionsService = {
  async getAllTransactions(filters?: { bankAccountId?: number; categoryId?: number }) {
    return transactionsRepository.getAll(filters);
  },

  async createTransaction(data: NewTransaction) {
    const transaction = await transactionsRepository.create(data);
    // Automatically deduct/add from bank account balance
    // Negative amount means expense, positive means income
    await bankAccountsService.add(data.bankAccountId, data.amount);
    return transaction;
  },

  async detectPatterns() {
    return transactionsRepository.getRecurringPatterns();
  }
};

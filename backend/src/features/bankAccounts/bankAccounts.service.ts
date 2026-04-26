import { bankAccountsRepository } from './bankAccounts.repository';
import { type NewBankAccount } from '../../drizzle/schema/bankAccounts';

export const bankAccountsService = {
  async getAllAccounts() {
    return bankAccountsRepository.getAll();
  },

  async getById(id: number) {
    const account = await bankAccountsRepository.getById(id);
    if (!account) throw new Error('Account not found');
    return account;
  },

  async create(data: NewBankAccount) {
    return bankAccountsRepository.create(data);
  },

  async deduct(id: number, amount: number) {
    const account = await this.getById(id);
    if (account.balance < amount) {
      throw new Error(`Insufficient balance in account ${account.name}`);
    }
    return bankAccountsRepository.updateBalance(id, -amount);
  },
  
  async add(id: number, amount: number) {
    return bankAccountsRepository.updateBalance(id, amount);
  }
};

import { transfersRepository } from './transfers.repository';
import { bankAccountsService } from '../bankAccounts/bankAccounts.service';
import { transactionsService } from '../transactions/transactions.service';
import { type NewTransfer } from '../../drizzle/schema/transfers';

export const transfersService = {
  async getAllTransfers() {
    return transfersRepository.getAll();
  },

  async execute(data: NewTransfer) {
    // 1. Deduct from source account
    await bankAccountsService.deduct(data.fromBankAccountId, data.amount);
    
    // 2. Create transfer record
    const transfer = await transfersRepository.create(data);
    
    // 3. Log as transaction (expense)
    await transactionsService.createTransaction({
      description: `Transfer to ${data.recipient}`,
      amount: -data.amount,
      bankAccountId: data.fromBankAccountId,
      source: 'manual',
      date: new Date().toISOString(),
    });
    
    return transfer;
  }
};

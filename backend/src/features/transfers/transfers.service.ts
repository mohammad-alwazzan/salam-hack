import { transfersRepository } from './transfers.repository';
import { bankAccountsService } from '../bankAccounts/bankAccounts.service';
import { transactionsService } from '../transactions/transactions.service';
import { type NewTransfer } from '../../drizzle/schema/transfers';

export const transfersService = {
  async getAllTransfers() {
    return transfersRepository.getAll();
  },

  async execute(data: NewTransfer) {
    // 1. Check balance on source account
    const account = await bankAccountsService.checkBalance(data.fromBankAccountId, data.amount);
    
    // 2. Create transfer record
    const transfer = await transfersRepository.create(data);
    
    // 3. Log as transaction (this will update balance via transactionsService.createTransaction)
    const transaction = await transactionsService.createTransaction({
      description: `Transfer to ${data.recipient}`,
      amount: -data.amount,
      bankAccountId: data.fromBankAccountId,
      source: 'manual',
      date: new Date().toISOString(),
    });
    
    // Get updated account balance
    const updatedAccount = await bankAccountsService.getById(data.fromBankAccountId);
    
    return {
      success: true,
      account: updatedAccount,
      transaction,
      transfer
    };
  }
};
